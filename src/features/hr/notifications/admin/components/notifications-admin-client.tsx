'use client';

import * as React from 'react';
import {
  Bell,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import {
  ListFilterBar,
  type ListFilterInlineSelect,
} from '@/components/ui/list-filter-bar';
import { EMPTY_PERIOD_RANGE } from '@/features/hr/discipline/lib/discipline-date-filter';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { DirectoryPageGate } from '@/components/shared/directory-page-gate';
import { FILTER_PERMISSIONS } from '@/features/auth/permissions/filter-permissions';
import { cn, formatDisplayDateTime } from '@/shared/utils';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  ConfirmationModal,
  EmptyState,
  FormField,
  HRSettingsFormDrawer,
  MinimalDropdown,
} from '@/components/ui/shared-dialogs';
import { Dialog, DialogBody, DialogContent, DialogTitle, dialogShellBodyClass, dialogShellContentClass } from '@/components/ui/dialog';
import { DataTable, AppPagination, usePagination, type ColumnDef } from '@/components/ui/data-table';
import { PagedListViewport, PaginatedListShell } from '@/components/ui/paged-list';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import { useNotificationsAdminDirectoryModel } from '@/features/hr/notifications/admin/hooks/useNotificationsAdminDirectoryModel';
import {
  NOTIFICATION_AUDIENCE_LABELS,
  NOTIFICATION_CATEGORY_FILTER_ORDER,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_SEVERITY_LABELS,
  type HRAdminNotificationRecord,
} from '@/features/hr/notifications/admin/constants/notification-labels';
import {
  notificationsApi,
  type NotificationCategory,
  type NotificationDetailResponseDto,
  type NotificationRecipientDto,
  type NotificationSeverity,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';

type CategoryFilter = 'all' | NotificationCategory;
type SeverityFilter = 'all' | NotificationSeverity;

interface SendForm {
  titleAr: string;
  bodyAr: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  employeeIds: Set<string>;
  requiresAcknowledgment: boolean;
  actionUrl: string;
  actionLabelAr: string;
}

const EMPTY_FORM: SendForm = {
  titleAr: '',
  bodyAr: '',
  category: 'announcement',
  severity: 'info',
  employeeIds: new Set(),
  requiresAcknowledgment: false,
  actionUrl: '',
  actionLabelAr: 'عرض التفاصيل',
};

const SEVERITY_FILTER_ORDER: SeverityFilter[] = ['all', 'info', 'success', 'warning', 'error'];

function severityBadgeClass(severity: NotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'border-success/30 bg-success/10 text-success';
    case 'warning':
      return 'border-warning/30 bg-warning/10 text-warning';
    case 'error':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    default:
      return 'border-primary/25 bg-primary/5 text-primary';
  }
}


function AudienceEmployeesCell({ record }: { record: HRAdminNotificationRecord }) {
  const employees = record.audienceEmployees;
  if (employees.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">{record.audienceSummaryAr}</span>
    );
  }
  return (
    <div className="space-y-0.5 text-sm">
      {employees.slice(0, 3).map((e) => (
        <div key={e.employeeId}>
          <span>{e.nameAr ?? '—'}</span>
          {' '}
          <span className="font-mono text-xs text-muted-foreground">
            ({e.employeeCode ?? '—'})
          </span>
        </div>
      ))}
      {employees.length > 3 ? (
        <span className="text-xs text-muted-foreground">
          +
          {employees.length - 3}
          {' '}
          آخرون
        </span>
      ) : null}
    </div>
  );
}


export function NotificationsAdminClient() {
  const m = useNotificationsAdminDirectoryModel();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [form, setForm] = React.useState<SendForm>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [detailRecord, setDetailRecord] = React.useState<HRAdminNotificationRecord | null>(null);
  const [detailData, setDetailData] = React.useState<NotificationDetailResponseDto | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<HRAdminNotificationRecord | null>(null);

  const openDetail = React.useCallback(async (record: HRAdminNotificationRecord) => {
    setDetailRecord(record);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await notificationsApi.getById(record.id);
      setDetailData(res);
    } catch {
      // keep detailData null — dialog will show basic info only
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const allEmployeeOptions = React.useMemo(
    () => m.employeeOptions.map((e) => ({
      id: e.value,
      name: e.label,
      branchNameAr: e.branchNameAr,
      departmentNameAr: e.departmentNameAr,
    })),
    [m.employeeOptions],
  );

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => [
    {
      id: 'category',
      value: m.filters.category,
      onChange: (v) => m.patchFilters({ category: (v || 'all') as CategoryFilter }),
      placeholder: 'التصنيف',
      className: 'w-[9rem]',
      options: [
        { value: 'all', label: 'كل التصنيفات' },
        ...NOTIFICATION_CATEGORY_FILTER_ORDER.map((cat) => ({
          value: cat,
          label: NOTIFICATION_CATEGORY_LABELS[cat],
        })),
      ],
    },
    {
      id: 'severity',
      value: m.filters.severity,
      onChange: (v) => m.patchFilters({ severity: (v || 'all') as SeverityFilter }),
      placeholder: 'النبرة',
      className: 'w-[8rem]',
      options: SEVERITY_FILTER_ORDER.map((s) => ({
        value: s,
        label: s === 'all' ? 'كل النبرات' : NOTIFICATION_SEVERITY_LABELS[s],
      })),
    },
  ], [m.filters.category, m.filters.severity, m.patchFilters]);

  const onPeriodChange = React.useCallback(
    ({ from, to }: { from: string; to: string }) => m.setDateBounds({ from, to }),
    [m.setDateBounds],
  );
  const onPeriodFilterClear = React.useCallback(
    () => m.setDateBounds({ ...EMPTY_PERIOD_RANGE }),
    [m.setDateBounds],
  );

  const extraFilters = React.useMemo(
    () => (
      <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
        <Checkbox
          checked={m.filters.excludeExpired}
          onCheckedChange={(v) => m.patchFilters({ excludeExpired: v === true })}
        />
        إخفاء المنتهية
      </label>
    ),
    [m.filters.excludeExpired, m.patchFilters],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showStatusSection={false}
        showEmployeePicker={false}
        periodValue={m.dateBounds}
        onPeriodChange={onPeriodChange}
        defaultPeriod={EMPTY_PERIOD_RANGE}
        defaultDateFilterTab="all"
        onPeriodFilterClear={onPeriodFilterClear}
        inlineSelects={inlineSelects}
        beforeEmployeePicker={extraFilters}
      />
    ),
    [
      inlineSelects,
      m.dateBounds,
      onPeriodChange,
      onPeriodFilterClear,
      extraFilters,
    ],
  );

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={m.activeFilterCount} />
        <Button
          type="button"
          size="sm"
          variant="luxe"
          className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => {
            setForm({ ...EMPTY_FORM, employeeIds: new Set() });
            setFormError(null);
            setDrawerOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          إرسال إشعار
        </Button>
      </div>
    ),
    [m.activeFilterCount],
  );

  const columns = React.useMemo((): ColumnDef<HRAdminNotificationRecord>[] => [
    {
      key: 'title',
      title: 'العنوان',
      render: (n) => (
        <div className="space-y-1">
          <span className="font-medium">{n.titleAr}</span>
          {n.bodyAr ? (
            <p className="  text-xs text-muted-foreground max-w-[15rem]">{n.bodyAr}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'categorySeverity',
      title: 'التصنيف',
      render: (n) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{NOTIFICATION_CATEGORY_LABELS[n.category]}</Badge>
        </div>
      ),
    },
    {
      key: 'counts',
      title: 'العدد / المقروء',
      render: (n) => (
        <span className="tabular-nums text-sm">
          {n.recipientCount}
          {' '}
          /
          {' '}
          {n.readCount}
        </span>
      ),
    },
    {
      key: 'date',
      title: 'تاريخ الإرسال',
      className: 'text-xs text-muted-foreground tabular-nums',
      render: (n) => <TableDateCell value={n.createdAt} mode="datetime" />,
    },
    {
      key: 'source',
      title: 'المصدر',
      className: 'text-sm text-muted-foreground',
      render: (n) => n.sourceKind ?? '—',
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'w-24',
      render: (n) => (
        <TableRowActions
          menuItems={[
            {
              label: 'حذف',
              onClick: () => setDeleteTarget(n),
              icon: <Trash2 className="h-3.5 w-3.5" />,
              destructive: true,
            },
          ]}
        />
      ),
    },
  ], []);

  const resolveSendCompanyId = (): string | null => m.companyId;

  const submitSend = async () => {
    const sendCompanyId = resolveSendCompanyId();
    if (!sendCompanyId) {
      setFormError('تعذر تحديد الشركة');
      return;
    }
    if (!form.titleAr.trim()) {
      setFormError('العنوان مطلوب');
      return;
    }

    const allEmployeeIds = m.employeeOptions.map((e) => e.value);
    const isAllSelected =
      form.employeeIds.size === 0
      || (form.employeeIds.size === allEmployeeIds.length
        && allEmployeeIds.every((id) => form.employeeIds.has(id)));

    const dto: SendNotificationDto = {
      companyId: sendCompanyId,
      category: form.category,
      severity: form.severity,
      titleAr: form.titleAr.trim(),
      bodyAr: form.bodyAr.trim() || null,
      audienceKind: isAllSelected ? 'company' : 'employee',
      employeeIds: isAllSelected ? undefined : [...form.employeeIds],
      deliveryChannel: 'in_app',
      sourceKind: 'manual',
      requiresAcknowledgment: form.requiresAcknowledgment,
      actionUrl: form.actionUrl.trim() || undefined,
      actionLabelAr: form.actionLabelAr.trim() || undefined,
    };

    setSaving(true);
    setFormError(null);
    try {
      await m.sendNotification(dto);
      toast.success('تم إرسال الإشعار');
      setDrawerOpen(false);
    } catch (e) {
      setFormError(handleApiError(e).displayMessage);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await m.deleteNotification(deleteTarget.id);
      toast.success('تم حذف الإشعار');
      setDeleteTarget(null);
    } catch (e) {
      toast.error(handleApiError(e).displayMessage);
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SetPageTitle
        titleAr="إدارة الإشعارات"
        descriptionAr="إرسال إشعارات للموظفين ومتابعة التسليم والقراءة"
        iconName="Bell"
      />

      <DirectoryPageGate
        accessDenied={m.accessDenied}
        listError={m.listError}
        loading={m.loading && m.notifications.length === 0 && !m.accessDenied}
        forbiddenTitle="لا تملك صلاحية الوصول لإدارة الإشعارات"
        loadErrorTitle="تعذر تحميل الإشعارات"
      >
      {!m.loading && m.notifications.length === 0 ? (
        <EmptyState
          title="لا توجد إشعارات"
          description={
            m.activeFilterCount > 0
              ? 'جرّب تغيير الفلاتر أو مسحها.'
              : 'أرسل أول إشعار للموظفين من زر «إرسال إشعار».'
          }
        />
      ) : (
        <PagedListViewport>
          <PaginatedListShell
            pagination={{
              page: m.page,
              pageSize: m.limit,
              total: m.total,
              totalPages: Math.max(1, Math.ceil(m.total / m.limit)),
              setPage: m.setPage,
              setPageSize: m.setLimit,
            }}
          >
            <DataTable
              variant="directory"
              alwaysShowTable
              columns={columns}
              data={m.notifications}
              keyExtractor={(n) => n.id}
              loading={m.loading}
              onRowClick={(n) => { void openDetail(n); }}
            />
          </PaginatedListShell>
        </PagedListViewport>
      )}

      </DirectoryPageGate>

      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="إرسال إشعار جديد"
        description="يُوزَّع الإشعار على المستلمين حسب النطاق المحدد."
        onSave={submitSend}
        saveDisabled={saving}
        saveLabel="إرسال"
        error={formError}
      >
        <FormField label="العنوان *">
          <Input
            value={form.titleAr}
            onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
            placeholder="مثال: إعلان عام للموظفين"
          />
        </FormField>
        <FormField label="المحتوى">
          <textarea
            value={form.bodyAr}
            onChange={(e) => setForm((f) => ({ ...f, bodyAr: e.target.value }))}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="نص الإشعار..."
          />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="التصنيف">
            <MinimalDropdown
              value={form.category}
              options={NOTIFICATION_CATEGORY_FILTER_ORDER.map((c) => ({
                value: c,
                label: NOTIFICATION_CATEGORY_LABELS[c],
              }))}
              onChange={(v) => setForm((f) => ({ ...f, category: v as NotificationCategory }))}
            />
          </FormField>
          <FormField label="نوع الاشعار">
            <MinimalDropdown
              value={form.severity}
              options={(
                Object.entries(NOTIFICATION_SEVERITY_LABELS) as [NotificationSeverity, string][]
              ).map(([value, label]) => ({ value, label }))}
              onChange={(v) => setForm((f) => ({ ...f, severity: v as NotificationSeverity }))}
            />
          </FormField>
        </div>
        <FormField label={`الموظفون${form.employeeIds.size > 0 ? ` (${form.employeeIds.size})` : ''}`}>
          <EmployeePicker
            variant="form"
            employees={allEmployeeOptions}
            selected={form.employeeIds}
            onChange={(employeeIds) => setForm((f) => ({ ...f, employeeIds }))}
            requirePermission={FILTER_PERMISSIONS.employee}
          />
        </FormField>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={form.requiresAcknowledgment}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, requiresAcknowledgment: v === true }))
            }
          />
          يتطلب الموافقة من المستلم
        </label>
      </HRSettingsFormDrawer>

      <NotificationDetailDialog
        record={detailRecord}
        detail={detailData}
        loading={detailLoading}
        onClose={() => { setDetailRecord(null); setDetailData(null); }}
      />

      <ConfirmationModal
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="حذف الإشعار"
        description="سيُحذف الإشعار وجميع صفوف المستلمين. لا يمكن التراجع."
        confirmLabel="حذف"
        variant="destructive"
      />
    </div>
  );
}

function ReadStatusBadge({ isRead }: { isRead: boolean }) {
  if (isRead) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
        <CheckCircle2 className="h-3 w-3" />
        نعم
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <Circle className="h-3 w-3" />
      لا
    </span>
  );
}

function buildRecipientColumns(showAcknowledgment: boolean): ColumnDef<NotificationRecipientDto>[] {
  const headerClassName = 'bg-background shadow-none';

  const columns: ColumnDef<NotificationRecipientDto>[] = [
    {
      key: 'employee',
      title: 'الموظف',
      headerClassName,
      render: (r) => (
        <div className="min-w-[120px]">
          <p className="font-medium leading-tight">{r.employeeNameAr || r.userFullNameAr || '—'}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{r.employeeCode || '—'}</p>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'البريد الإلكتروني',
      hideOnMobile: true,
      headerClassName,
      render: (r) =>
        r.userEmail ? (
          <span className="inline-flex max-w-[220px] items-center gap-1 truncate text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{r.userEmail}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'isRead',
      title: 'مقروء',
      headerClassName,
      render: (r) => <ReadStatusBadge isRead={r.isRead} />,
    },
    {
      key: 'deliveredAt',
      title: 'وقت التسليم',
      hideOnMobile: true,
      headerClassName,
      className: 'whitespace-nowrap text-xs tabular-nums text-muted-foreground',
      render: (r) => formatDisplayDateTime(r.deliveredAt),
    },
    {
      key: 'readAt',
      title: 'وقت القراءة',
      hideOnMobile: true,
      headerClassName,
      className: 'whitespace-nowrap text-xs tabular-nums text-muted-foreground',
      render: (r) => formatDisplayDateTime(r.readAt),
    },
  ];

  if (showAcknowledgment) {
    columns.push(
      {
        key: 'acknowledgedAt',
        title: 'وقت القبول',
        hideOnMobile: true,
        headerClassName,
        className: 'whitespace-nowrap text-xs tabular-nums text-muted-foreground',
        render: (r) => formatDisplayDateTime(r.acknowledgedAt),
      },
      {
        key: 'dismissedAt',
        title: 'وقت الرفض',
        hideOnMobile: true,
        headerClassName,
        className: 'whitespace-nowrap text-xs tabular-nums text-muted-foreground',
        render: (r) => formatDisplayDateTime(r.dismissedAt),
      },
    );
  }

  return columns;
}

// ─── Detail dialog ────────────────────────────────────────────────────────────

type ReadFilter = 'all' | 'read' | 'unread';

function NotificationDetailDialog({
  record,
  detail,
  loading,
  onClose,
}: {
  record: HRAdminNotificationRecord | null;
  detail: NotificationDetailResponseDto | null;
  loading: boolean;
  onClose: () => void;
}) {
  const open = record != null;
  const [readFilter, setReadFilter] = React.useState<ReadFilter>('all');

  React.useEffect(() => { if (!open) setReadFilter('all'); }, [open]);

  const recipients = detail?.recipients ?? [];

  const filteredRecipients = React.useMemo(() => {
    if (readFilter === 'read') return recipients.filter((r) => r.isRead);
    if (readFilter === 'unread') return recipients.filter((r) => !r.isRead);
    return recipients;
  }, [recipients, readFilter]);

  const readCount = recipients.filter((r) => r.isRead).length;
  const unreadCount = recipients.length - readCount;
  const showAcknowledgment = record?.requiresAcknowledgment === true;

  const recipientColumns = React.useMemo(
    () => buildRecipientColumns(showAcknowledgment),
    [showAcknowledgment],
  );

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    slice: pagedRecipients,
    total: filteredTotal,
  } = usePagination(filteredRecipients, 10);

  React.useEffect(() => { setPage(1); }, [readFilter, setPage]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn(dialogShellContentClass, 'w-[min(96vw,80rem)] max-w-none overflow-hidden sm:rounded-2xl')} dir="rtl">
        <div className="relative shrink-0 border-b border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pb-5 pt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 pe-8">
              <DialogTitle className="text-lg font-bold leading-snug">
                {record?.titleAr || '—'}
              </DialogTitle>
              {record?.bodyAr ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{record.bodyAr}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">
                  {record ? NOTIFICATION_CATEGORY_LABELS[record.category] : '—'}
                </Badge>
                <Badge variant="outline" className={record ? severityBadgeClass(record.severity) : ''}>
                  {record ? NOTIFICATION_SEVERITY_LABELS[record.severity] : '—'}
                </Badge>
                {showAcknowledgment ? (
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] text-primary">
                    يتطلب إقراراً
                  </Badge>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {record?.createdAt ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {formatDisplayDateTime(record.createdAt)}
                  </span>
                ) : null}
                {record?.sourceKind ? (
                  <span className="font-mono text-[10px] text-muted-foreground/70" title={record.sourceKind}>
                    {record.sourceKind}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <DialogBody className={cn(dialogShellBodyClass, 'space-y-4')}>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              جارٍ التحميل…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground">المستلمون</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{recipients.length}</p>
                </div>
                <div className="rounded-xl border border-success/20 bg-success/5 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-medium text-success/80">مقروء</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-success">{readCount}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground">لم يُقرأ</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{unreadCount}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>المستلمون</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      ({filteredRecipients.length})
                    </span>
                  </div>

                  <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                    {(['all', 'read', 'unread'] as ReadFilter[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setReadFilter(f)}
                        className={cn(
                          'inline-flex h-7 items-center rounded-md px-3 text-[11px] font-medium transition-colors',
                          readFilter === f
                            ? 'bg-background text-foreground ring-1 ring-border/60'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {f === 'all' ? 'الكل' : f === 'read' ? 'مقروء' : 'لم يُقرأ'}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredRecipients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 py-12 text-center">
                    <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">لا يوجد مستلمون</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <DataTable
                      variant="directory"
                      alwaysShowTable
                      loading={false}
                      columns={recipientColumns}
                      data={pagedRecipients}
                      keyExtractor={(r) => r.recipientId}
                      emptyText="لا يوجد مستلمون"
                      className="rounded-none border-0 bg-transparent shadow-none"
                      tableClassName="w-full"
                    />
                    {filteredTotal > pageSize ? (
                      <AppPagination
                        page={page}
                        pageSize={pageSize}
                        total={filteredTotal}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[10, 20, 50]}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

