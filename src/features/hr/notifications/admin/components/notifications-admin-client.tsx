'use client';

import * as React from 'react';
import {
  Clock,
  Mail,
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
import { cn, formatDisplayDateTime } from '@/shared/utils';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  ConfirmationModal,
  EmptyState,
  FormField,
  HRSettingsFormDrawer,
  MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppPagination, DataTable, type ColumnDef } from '@/components/ui/data-table';
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

type EmpOption = {
  id: string;
  name: string;
  branchId?: string;
  branchNameAr?: string;
  departmentId?: string;
  departmentNameAr?: string;
};

function EmployeeMultiSelect({
  employees,
  branches,
  departments,
  selected,
  onChange,
}: {
  employees: EmpOption[];
  branches: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [branchFilter, setBranchFilter] = React.useState('');
  const [deptFilter, setDeptFilter] = React.useState('');

  React.useEffect(() => {
    if (!open) { setSearch(''); setBranchFilter(''); setDeptFilter(''); }
  }, [open]);

  const filtered = React.useMemo(() => {
    let list = employees;
    if (branchFilter) list = list.filter((e) => e.branchId === branchFilter);
    if (deptFilter) list = list.filter((e) => e.departmentId === deptFilter);
    if (search.trim()) list = list.filter((e) => e.name.includes(search.trim()));
    return list;
  }, [employees, branchFilter, deptFilter, search]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  };

  const allFiltered = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  const toggleAllFiltered = () => {
    const next = new Set(selected);
    if (allFiltered) filtered.forEach((e) => next.delete(e.id));
    else filtered.forEach((e) => next.add(e.id));
    onChange(next);
  };

  const allSelected = employees.length > 0 && employees.every((e) => selected.has(e.id));

  const triggerLabel = selected.size === 0 || allSelected
    ? 'جميع الموظفين'
    : selected.size === 1
      ? (employees.find((e) => e.id === [...selected][0])?.name ?? '1 موظف')
      : `${selected.size} موظفين محددون`;

  const branchOptions = [{ value: '', label: 'كل الفروع' }, ...branches];
  const deptOptions = [{ value: '', label: 'كل الأقسام' }, ...departments];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-ring',
            selected.size > 0 && !allSelected ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className={cn(selected.size > 0 && !allSelected && 'font-medium text-foreground')}>
            {triggerLabel}
          </span>
          <svg className="h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 shadow-elevated"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
        sideOffset={4}
        dir="rtl"
      >
        {/* ── single filter row: select-all + search + dept + branch ── */}
        <div className="flex items-center gap-2 border-b border-border p-2">
          <button
            type="button"
            onClick={toggleAllFiltered}
            title="تحديد الكل"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input transition-colors hover:bg-muted/40"
          >
            <span className={cn(
              'flex h-4 w-4 items-center justify-center rounded border transition-colors',
              allFiltered ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
            )}>
              {allFiltered && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          </button>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث…"
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-muted/30 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          <MinimalDropdown
            value={deptFilter}
            options={deptOptions}
            onChange={setDeptFilter}
            className="h-8 w-28 shrink-0 text-xs"
          />
          <MinimalDropdown
            value={branchFilter}
            options={branchOptions}
            onChange={setBranchFilter}
            className="h-8 w-28 shrink-0 text-xs"
          />
        </div>

        {/* ── employee list ── */}
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">لا نتائج</p>
          )}
          {filtered.map((emp) => {
            const isSelected = selected.has(emp.id);
            const meta = [emp.departmentNameAr, emp.branchNameAr].filter(Boolean).join(' - ');
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => toggle(emp.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted/40',
                  isSelected ? 'text-primary' : 'text-foreground/80',
                )}
              >
                <span className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                )}>
                  {isSelected && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <div className="min-w-0 flex-1 text-start">
                  <p className={cn('truncate text-sm', isSelected ? 'font-medium text-primary' : 'text-foreground')}>
                    {emp.name}
                  </p>
                  {meta ? (
                    <p className="truncate text-xs text-muted-foreground">{meta}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── footer ── */}
        {selected.size > 0 && !allSelected && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">{selected.size} موظف محدد</span>
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              مسح التحديد
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

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

  const allEmployeeOptions = React.useMemo<EmpOption[]>(
    () => m.employeeOptions.map((e) => ({
      id: e.value,
      name: e.label,
      branchId: e.branchId,
      branchNameAr: e.branchNameAr,
      departmentId: e.departmentId,
      departmentNameAr: e.departmentNameAr,
    })),
    [m.employeeOptions],
  );

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
      placeholder: 'التصنيف',
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
            <p className="line-clamp-1 text-xs text-muted-foreground">{n.bodyAr}</p>
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
            onRowClick={(n) => { void openDetail(n); }}
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
        <FormField label="المستلمون">
          <EmployeeMultiSelect
            employees={allEmployeeOptions}
            branches={m.branchOptions}
            departments={m.departmentOptions}
            selected={form.employeeIds}
            onChange={(employeeIds) => setForm((f) => ({ ...f, employeeIds }))}
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

// ─── Recipient state helpers ──────────────────────────────────────────────────

// ─── Recipient columns ────────────────────────────────────────────────────────

const RECIPIENT_COLUMNS: ColumnDef<NotificationRecipientDto>[] = [
  {
    key: 'employee',
    title: 'الموظف',
    render: (r) => (
      <div>
        <p className="font-medium leading-tight">{r.employeeNameAr || '—'}</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{r.employeeCode || '—'}</p>
      </div>
    ),
  },
  {
    key: 'email',
    title: 'البريد الإلكتروني',
    render: (r) =>
      r.userEmail ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0 opacity-60" />
          {r.userEmail}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    key: 'isRead',
    title: 'مقروء',
    render: (r) => r.isRead
      ? <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">نعم</span>
      : <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">لا</span>,
  },
  {
    key: 'deliveredAt',
    title: 'وقت التسليم',
    className: 'text-xs tabular-nums text-muted-foreground',
    render: (r) => formatDisplayDateTime(r.deliveredAt),
  },
  {
    key: 'readAt',
    title: 'وقت القراءة',
    className: 'text-xs tabular-nums text-muted-foreground',
    render: (r) => formatDisplayDateTime(r.readAt),
  },
  {
    key: 'acknowledgedAt',
    title: 'وقت القبول',
    className: 'text-xs tabular-nums text-muted-foreground',
    render: (r) => formatDisplayDateTime(r.acknowledgedAt),
  },
  {
    key: 'dismissedAt',
    title: 'وقت الرفض',
    className: 'text-xs tabular-nums text-muted-foreground',
    render: (r) => formatDisplayDateTime(r.dismissedAt),
  },
];

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

  const d = detail;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0" dir="rtl">

        {/* ── header ── */}
        <DialogHeader className="shrink-0 border-b border-border bg-background px-6 pt-5 pb-4">
          <DialogTitle className="text-base leading-snug">{record?.titleAr || '—'}</DialogTitle>
          {record?.bodyAr ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{record.bodyAr}</p>
          ) : null}
          {/* badges + sent date in one row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{record ? NOTIFICATION_CATEGORY_LABELS[record.category] : '—'}</Badge>
              <Badge variant="outline" className={record ? severityBadgeClass(record.severity) : ''}>
                {record ? NOTIFICATION_SEVERITY_LABELS[record.severity] : '—'}
              </Badge>
              {record?.requiresAcknowledgment ? (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[11px]">يتطلب إقراراً</Badge>
              ) : null}
              {record?.sourceKind ? (
                <Badge variant="outline" className="font-mono text-[11px]">{record.sourceKind}</Badge>
              ) : null}
            </div>
            {record?.createdAt ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {formatDisplayDateTime(record.createdAt)}
              </span>
            ) : null}
          </div>
        </DialogHeader>

        {/* ── scrollable body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">جارٍ التحميل…</div>
          ) : (
            <div className="px-6 py-5">

              {/* ── recipients section ── */}
              <div className="rounded-xl border border-border bg-muted/20">
                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                
                  {/* read / unread filter */}
                  <div className="flex items-center gap-1 border rounded-md p-0.5">
                    {(['all', 'read', 'unread'] as ReadFilter[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setReadFilter(f)}
                        className={cn(
                          'inline-flex h-6 items-center rounded-md px-2.5 text-[11px] font-medium transition-colors',
                          readFilter === f
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {f === 'all' ? 'الكل' : f === 'read' ? 'قرأ' : 'لم يقرأ'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-2">
                  <DataTable
                    variant="directory"
                    alwaysShowTable
                    loading={false}
                    columns={RECIPIENT_COLUMNS}
                    data={filteredRecipients}
                    keyExtractor={(r) => r.recipientId}
                    emptyText="لا يوجد مستلمون"
                  />
                </div>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

