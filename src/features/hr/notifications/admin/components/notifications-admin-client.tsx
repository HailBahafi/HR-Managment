'use client';

import * as React from 'react';
import {
  Plus,
  Search,
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
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import { useNotificationsAdminDirectoryModel } from '@/features/hr/notifications/admin/hooks/useNotificationsAdminDirectoryModel';
import {
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

export function NotificationsAdminClient() {
  const m = useNotificationsAdminDirectoryModel();
  const [q, setQ] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>('all');
  const [severityFilter, setSeverityFilter] = React.useState<SeverityFilter>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [form, setForm] = React.useState<SendForm>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [detail, setDetail] = React.useState<HRAdminNotificationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<HRAdminNotificationRecord | null>(null);

  const activeFilterCount =
    (categoryFilter !== 'all' ? 1 : 0)
    + (severityFilter !== 'all' ? 1 : 0)
    + (q.trim() ? 1 : 0);

  const inlineSelects = React.useMemo((): EntityFilterInlineSelect[] => [
    {
      id: 'category',
      value: categoryFilter,
      onChange: (v) => setCategoryFilter((v || 'all') as CategoryFilter),
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
      value: severityFilter,
      onChange: (v) => setSeverityFilter((v || 'all') as SeverityFilter),
      placeholder: 'الأولوية',
      className: 'w-[8rem]',
      options: SEVERITY_FILTER_ORDER.map((s) => ({
        value: s,
        label: s === 'all' ? 'كل الأولويات' : NOTIFICATION_SEVERITY_LABELS[s],
      })),
    },
  ], [categoryFilter, severityFilter]);

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        inlineSelects={inlineSelects}
        leadingFilters={(
          <div className="relative w-full min-w-[10rem] sm:w-[11rem] shrink-0">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث…"
              className="h-8 ps-8 text-xs"
            />
          </div>
        )}
        onDateBoundsChange={() => {}}
      />
    ),
    [inlineSelects, q],
  );

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
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
    [activeFilterCount],
  );

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return m.notifications.filter((n) => {
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
      if (severityFilter !== 'all' && n.severity !== severityFilter) return false;
      if (!query) return true;
      return (
        n.titleAr.toLowerCase().includes(query) ||
        n.bodyAr.toLowerCase().includes(query) ||
        n.audienceSummaryAr.toLowerCase().includes(query)
      );
    });
  }, [m.notifications, q, categoryFilter, severityFilter]);

  const columns = React.useMemo((): ColumnDef<HRAdminNotificationRecord>[] => [
    {
      key: 'title',
      title: 'العنوان',
      render: (n) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{n.titleAr}</span>
            <Badge variant="outline" className={severityBadgeClass(n.severity)}>
              {NOTIFICATION_SEVERITY_LABELS[n.severity]}
            </Badge>
            {n.sourceKind && n.sourceKind !== 'manual' ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                {n.sourceKind}
              </Badge>
            ) : null}
          </div>
          {n.bodyAr ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">{n.bodyAr}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'category',
      title: 'التصنيف',
      render: (n) => <Badge variant="secondary">{NOTIFICATION_CATEGORY_LABELS[n.category]}</Badge>,
    },
    {
      key: 'audience',
      title: 'الجمهور',
      className: 'text-sm text-muted-foreground',
      render: (n) => n.audienceSummaryAr,
    },
    {
      key: 'recipients',
      title: 'المستلمون',
      render: (n) => (
        <span className="tabular-nums text-sm">
          {n.readCount}/{n.recipientCount}
        </span>
      ),
    },
    {
      key: 'date',
      title: 'التاريخ',
      className: 'text-xs text-muted-foreground tabular-nums',
      render: (n) => <TableDateCell value={n.createdAt} mode="datetime" />,
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

  const submitSend = async () => {
    if (!m.companyId) {
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
      companyId: m.companyId,
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

  if (m.loading) {
    return (
      <>
        <SetPageTitle
          titleAr="إدارة الإشعارات"
          descriptionAr="إرسال إشعارات للموظفين ومتابعة التسليم والقراءة"
          iconName="Bell"
        />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      </>
    );
  }

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

      {filtered.length === 0 ? (
        <EmptyState
          title="لا توجد إشعارات"
          description={
            activeFilterCount > 0
              ? 'جرّب تغيير الفلاتر أو مسحها.'
              : 'أرسل أول إشعار للموظفين من زر «إرسال إشعار».'
          }
        />
      ) : (
        <DataTable
          variant="directory"
          alwaysShowTable
          columns={columns}
          data={filtered}
          keyExtractor={(n) => n.id}
          onRowClick={(n) => setDetail(n)}
        />
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
              {detail.bodyAr ? <p className="leading-relaxed text-muted-foreground">{detail.bodyAr}</p> : null}
              <div className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3">
                <Row label="التصنيف" value={NOTIFICATION_CATEGORY_LABELS[detail.category]} />
                <Row label="الأولوية" value={NOTIFICATION_SEVERITY_LABELS[detail.severity]} />
                <Row label="الجمهور" value={detail.audienceSummaryAr} />
                <Row label="المستلمون" value={`${detail.readCount} / ${detail.recipientCount}`} />
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
