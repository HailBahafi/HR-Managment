'use client';

import * as React from 'react';
import {
  Plus,
  SlidersHorizontal,
  Trash2,
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
  EntityFilterToolbar,
  type EntityFilterInlineSelect,
} from '@/components/ui/entity-filter-toolbar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  ConfirmationModal,
  EmptyState,
  FormField,
  HRSettingsFormDrawer,
  MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppPagination, DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import { useNotificationsAdminDirectoryModel } from '@/features/hr/notifications/admin/hooks/useNotificationsAdminDirectoryModel';
import {
  formatAudienceEmployeesLabel,
  NOTIFICATION_AUDIENCE_LABELS,
  NOTIFICATION_CATEGORY_FILTER_ORDER,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_SEVERITY_LABELS,
  type HRAdminNotificationRecord,
} from '@/features/hr/notifications/admin/constants/notification-labels';
import type {
  NotificationAudienceKind,
  NotificationCategory,
  NotificationSeverity,
  SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';

type CategoryFilter = 'all' | NotificationCategory;
type SeverityFilter = 'all' | NotificationSeverity;

interface SendForm {
  titleAr: string;
  bodyAr: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  audienceKind: NotificationAudienceKind;
  employeeIds: Set<string>;
  branchIds: Set<string>;
  departmentIds: Set<string>;
  requiresAcknowledgment: boolean;
  actionUrl: string;
  actionLabelAr: string;
}

const EMPTY_FORM: SendForm = {
  titleAr: '',
  bodyAr: '',
  category: 'announcement',
  severity: 'info',
  audienceKind: 'company',
  employeeIds: new Set(),
  branchIds: new Set(),
  departmentIds: new Set(),
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

function IdCheckboxList({
  options,
  selected,
  onSelectedChange,
}: {
  options: { id: string; label: string }[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
}) {
  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };
  return (
    <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/15 p-3">
      {options.map((o) => (
        <label key={o.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox
            checked={selected.has(o.id)}
            onCheckedChange={(v) => toggle(o.id, v === true)}
          />
          <span className="leading-snug">{o.label}</span>
        </label>
      ))}
    </div>
  );
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

function AdvancedSourceFilters({
  sourceKind,
  sourceTable,
  sourceId,
  onChange,
}: {
  sourceKind: string;
  sourceTable: string;
  sourceId: string;
  onChange: (patch: { sourceKind?: string; sourceTable?: string; sourceId?: string }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const activeCount =
    (sourceKind.trim() ? 1 : 0)
    + (sourceTable.trim() ? 1 : 0)
    + (sourceId.trim() ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          مصدر متقدم
          {activeCount > 0 ? (
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" dir="rtl" align="start">
        <p className="text-xs font-semibold text-muted-foreground">فلاتر المصدر</p>
        <FormField label="sourceKind">
          <Input
            value={sourceKind}
            onChange={(e) => onChange({ sourceKind: e.target.value })}
            placeholder="مثال: manual"
            className="h-8 text-xs"
            dir="ltr"
          />
        </FormField>
        <FormField label="sourceTable">
          <Input
            value={sourceTable}
            onChange={(e) => onChange({ sourceTable: e.target.value })}
            placeholder="جدول المصدر"
            className="h-8 text-xs"
            dir="ltr"
          />
        </FormField>
        <FormField label="sourceId">
          <Input
            value={sourceId}
            onChange={(e) => onChange({ sourceId: e.target.value })}
            placeholder="UUID"
            className="h-8 text-xs"
            dir="ltr"
          />
        </FormField>
        {activeCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={() => onChange({ sourceKind: '', sourceTable: '', sourceId: '' })}
          >
            مسح فلاتر المصدر
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function NotificationsAdminClient() {
  const m = useNotificationsAdminDirectoryModel();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [form, setForm] = React.useState<SendForm>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [detail, setDetail] = React.useState<HRAdminNotificationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<HRAdminNotificationRecord | null>(null);

  const inlineSelects = React.useMemo((): EntityFilterInlineSelect[] => [
    {
      id: 'company',
      value: m.filters.companyId,
      onChange: (v) => m.patchFilters({ companyId: v || 'all' }),
      placeholder: 'الشركة',
      className: 'w-[10rem]',
      options: [
        { value: 'all', label: 'كل الشركات' },
        ...m.companyOptions.map((c) => ({ value: c.value, label: c.label })),
      ],
    },
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
  ], [m.companyOptions, m.filters.category, m.filters.companyId, m.filters.severity, m.patchFilters]);

  const onDateBoundsChange = React.useCallback(
    (bounds: { from: string; to: string }) => m.setDateBounds(bounds),
    [m.setDateBounds],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection
        showStatusSection={false}
        showEmployeePicker={false}
        inlineSelects={inlineSelects}
        onDateBoundsChange={onDateBoundsChange}
        trailingActions={(
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
              <Checkbox
                checked={m.filters.excludeExpired}
                onCheckedChange={(v) => m.patchFilters({ excludeExpired: v === true })}
              />
              إخفاء المنتهية
            </label>
            <AdvancedSourceFilters
              sourceKind={m.filters.sourceKind}
              sourceTable={m.filters.sourceTable}
              sourceId={m.filters.sourceId}
              onChange={(patch) => m.patchFilters(patch)}
            />
          </div>
        )}
      />
    ),
    [
      inlineSelects,
      m.filters.excludeExpired,
      m.filters.sourceId,
      m.filters.sourceKind,
      m.filters.sourceTable,
      m.patchFilters,
      onDateBoundsChange,
    ],
  );

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={m.activeFilterCount} />
        <Button
          type="button"
          size="sm"
          variant="luxe"
          className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => {
            setForm({
              ...EMPTY_FORM,
              employeeIds: new Set(),
              branchIds: new Set(),
              departmentIds: new Set(),
            });
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
            <p className="line-clamp-1 text-xs text-muted-foreground">{n.bodyAr}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'categorySeverity',
      title: 'التصنيف / النبرة',
      render: (n) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{NOTIFICATION_CATEGORY_LABELS[n.category]}</Badge>
          <Badge variant="outline" className={severityBadgeClass(n.severity)}>
            {NOTIFICATION_SEVERITY_LABELS[n.severity]}
          </Badge>
        </div>
      ),
    },
    {
      key: 'audience',
      title: 'المستلمون',
      render: (n) => <AudienceEmployeesCell record={n} />,
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

  const resolveSendCompanyId = (): string | null => {
    if (m.filters.companyId !== 'all') return m.filters.companyId;
    return m.companyId;
  };

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
    if (form.audienceKind === 'employee' && form.employeeIds.size === 0) {
      setFormError('اختر موظفاً واحداً على الأقل');
      return;
    }
    if (form.audienceKind === 'branch' && form.branchIds.size === 0) {
      setFormError('اختر فرعاً واحداً على الأقل');
      return;
    }
    if (form.audienceKind === 'department' && form.departmentIds.size === 0) {
      setFormError('اختر قسماً واحداً على الأقل');
      return;
    }

    const dto: SendNotificationDto = {
      companyId: sendCompanyId,
      category: form.category,
      severity: form.severity,
      titleAr: form.titleAr.trim(),
      bodyAr: form.bodyAr.trim() || null,
      audienceKind: form.audienceKind,
      employeeIds: form.audienceKind === 'employee' ? [...form.employeeIds] : undefined,
      branchIds: form.audienceKind === 'branch' ? [...form.branchIds] : undefined,
      departmentIds: form.audienceKind === 'department' ? [...form.departmentIds] : undefined,
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
    <>
      <SetPageTitle
        titleAr="إدارة الإشعارات"
        descriptionAr="إرسال إشعارات للموظفين ومتابعة التسليم والقراءة"
        iconName="Bell"
      />

      {m.listError ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {m.listError}
        </div>
      ) : null}

      {m.activeFilterCount > 0 ? (
        <div className="mb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={m.clearFilters}
          >
            مسح الفلاتر
          </Button>
        </div>
      ) : null}

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
        <>
          <DataTable
            variant="directory"
            alwaysShowTable
            columns={columns}
            data={m.notifications}
            keyExtractor={(n) => n.id}
            loading={m.loading}
            onRowClick={(n) => setDetail(n)}
          />
          <AppPagination
            page={m.page}
            pageSize={m.limit}
            total={m.total}
            onPageChange={m.setPage}
            onPageSizeChange={m.setLimit}
          />
        </>
      )}

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
          <FormField label="الأولوية">
            <MinimalDropdown
              value={form.severity}
              options={(
                Object.entries(NOTIFICATION_SEVERITY_LABELS) as [NotificationSeverity, string][]
              ).map(([value, label]) => ({ value, label }))}
              onChange={(v) => setForm((f) => ({ ...f, severity: v as NotificationSeverity }))}
            />
          </FormField>
        </div>
        <FormField label="نطاق المستلمين">
          <MinimalDropdown
            value={form.audienceKind}
            options={(
              Object.entries(NOTIFICATION_AUDIENCE_LABELS) as [NotificationAudienceKind, string][]
            ).map(([value, label]) => ({ value, label }))}
            onChange={(v) =>
              setForm((f) => ({ ...f, audienceKind: v as NotificationAudienceKind }))
            }
          />
        </FormField>
        {form.audienceKind === 'employee' ? (
          <FormField label="الموظفون">
            <EmployeePicker
              employees={m.employeeOptions.map((e) => ({ id: e.value, name: e.label }))}
              selected={form.employeeIds}
              onChange={(employeeIds) => setForm((f) => ({ ...f, employeeIds }))}
            />
          </FormField>
        ) : null}
        {form.audienceKind === 'branch' ? (
          <FormField label="الفروع">
            <IdCheckboxList
              options={m.branchOptions.map((b) => ({ id: b.value, label: b.label }))}
              selected={form.branchIds}
              onSelectedChange={(branchIds) => setForm((f) => ({ ...f, branchIds }))}
            />
          </FormField>
        ) : null}
        {form.audienceKind === 'department' ? (
          <FormField label="الأقسام">
            <IdCheckboxList
              options={m.departmentOptions.map((d) => ({ id: d.value, label: d.label }))}
              selected={form.departmentIds}
              onSelectedChange={(departmentIds) => setForm((f) => ({ ...f, departmentIds }))}
            />
          </FormField>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={form.requiresAcknowledgment}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, requiresAcknowledgment: v === true }))
            }
          />
          يتطلب إقراراً من المستلم
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="رابط الإجراء (اختياري)">
            <Input
              value={form.actionUrl}
              onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value }))}
              placeholder="/hr/dashboard"
              dir="ltr"
            />
          </FormField>
          <FormField label="نص الزر">
            <Input
              value={form.actionLabelAr}
              onChange={(e) => setForm((f) => ({ ...f, actionLabelAr: e.target.value }))}
            />
          </FormField>
        </div>
      </HRSettingsFormDrawer>

      <Dialog open={detail != null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{detail?.titleAr}</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              {detail.bodyAr ? (
                <p className="leading-relaxed text-muted-foreground">{detail.bodyAr}</p>
              ) : null}
              <div className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3">
                <Row label="التصنيف" value={NOTIFICATION_CATEGORY_LABELS[detail.category]} />
                <Row label="النبرة" value={NOTIFICATION_SEVERITY_LABELS[detail.severity]} />
                <Row
                  label="المستلمون"
                  value={
                    detail.audienceEmployees.length > 0
                      ? formatAudienceEmployeesLabel(detail.audienceEmployees)
                      : detail.audienceSummaryAr
                  }
                />
                <Row
                  label="العدد / المقروء"
                  value={`${detail.recipientCount} / ${detail.readCount}`}
                />
                {detail.sourceKind ? <Row label="المصدر" value={detail.sourceKind} /> : null}
                {detail.triggeredByNameAr ? (
                  <Row label="المرسل" value={detail.triggeredByNameAr} />
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="حذف الإشعار"
        description="سيُحذف الإشعار وجميع صفوف المستلمين. لا يمكن التراجع."
        confirmLabel="حذف"
        variant="destructive"
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
