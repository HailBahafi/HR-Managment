'use client';

import * as React from 'react';
import { CheckCircle2, Plus, XCircle, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions, usePageHeaderActionsRegion } from '@/components/layouts/page-header-actions-context';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FormField, EmptyState } from '@/features/hr/requests/components/shared-ui';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import { useHRConfigurationStore } from '@/features/hr/requests/lib/configuration-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import {
  useAttendanceCorrectionRequestsStore,
  attendanceCorrectionStatusLabelAr,
} from '@/features/hr/requests/lib/attendance-correction-store';
import type { AttendanceCorrectionRequest } from '@/features/hr/requests/lib/attendance-correction-types';
import { ATTENDANCE_PREVIOUS_STATUS_PRESETS } from '@/features/hr/requests/lib/attendance-correction-types';
import { cn } from '@/shared/utils';

const STATUS_ORDER: readonly string[] = ['pending', 'approved', 'rejected'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الموافقة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

function timeCell(a: string, b: string, labelA: string, labelB: string) {
  return (
    <div className="text-xs leading-relaxed space-y-0.5">
      <p>
        <span className="text-muted-foreground">{labelA}:</span>{' '}
        <span className="font-mono tabular-nums" dir="ltr">{a || '—'}</span>
      </p>
      <p>
        <span className="text-muted-foreground">{labelB}:</span>{' '}
        <span className="font-mono tabular-nums" dir="ltr">{b || '—'}</span>
      </p>
    </div>
  );
}

function AttendanceCorrectionHeaderActions({
  activeFilterCount,
  onNew,
}: {
  activeFilterCount: number;
  onNew: () => void;
}) {
  const { filterPanelOpen, setFilterPanelOpen } = usePageHeaderActionsRegion();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setFilterPanelOpen((v) => !v)}
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
          filterPanelOpen
            ? 'border-primary/50 bg-primary/8 text-primary'
            : 'border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        فلترة
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ms-0.5 h-4 min-w-4 rounded-full px-1 py-0 text-[10px] leading-none">
            {activeFilterCount}
          </Badge>
        )}
      </button>
      <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0" onClick={onNew}>
        <Plus className="h-3.5 w-3.5" />
        طلب تصحيح حضور
      </Button>
    </div>
  );
}

function statusBadgeClass(s: AttendanceCorrectionRequest['status']) {
  if (s === 'pending') return 'bg-gold/15 text-gold border-gold/30';
  if (s === 'approved') return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
}

export function AttendanceCorrectionRequestsClient() {
  const departments = useHRConfigurationStore((s) => s.departments);
  const employees = useHREmployeeDirectoryStore((s) => s.employees);
  const activeEmployees = React.useMemo(() => employees.filter((e) => e.status === 'active'), [employees]);

  const items = useAttendanceCorrectionRequestsStore((s) => s.items);
  const submit = useAttendanceCorrectionRequestsStore((s) => s.submit);
  const approve = useAttendanceCorrectionRequestsStore((s) => s.approve);
  const reject = useAttendanceCorrectionRequestsStore((s) => s.reject);

  const [appliedDept, setAppliedDept] = React.useState('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formEmpId, setFormEmpId] = React.useState('');
  const [formApproverId, setFormApproverId] = React.useState('');
  const [formWorkDate, setFormWorkDate] = React.useState('');
  const [formPrevIn, setFormPrevIn] = React.useState('');
  const [formPrevOut, setFormPrevOut] = React.useState('');
  const [formCorrIn, setFormCorrIn] = React.useState('');
  const [formCorrOut, setFormCorrOut] = React.useState('');
  const [formPrevStatus, setFormPrevStatus] = React.useState('');
  const [formReason, setFormReason] = React.useState('');

  const deptOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الأقسام' }, ...departments.filter((d) => d.isActive).map((d) => ({ value: d.id, label: d.nameAr }))],
    [departments],
  );

  const empPickerList = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of items) m.set(r.employeeId, r.employeeNameAr);
    return [...m.entries()].map(([id, name]) => ({ id, name }));
  }, [items]);

  const baseFiltered = React.useMemo(() => {
    const picks = [...selectedEmpIds];
    return items.filter((r) => {
      if (appliedDept !== 'all' && r.departmentId !== appliedDept) return false;
      if (picks.length > 0 && !picks.includes(r.employeeId)) return false;
      if (!matchesDateRange(r.workDate, dateBounds.from, dateBounds.to)) return false;
      return true;
    });
  }, [items, appliedDept, selectedEmpIds, dateBounds.from, dateBounds.to]);

  const statusCounts = React.useMemo(
    () => ({
      all: baseFiltered.length,
      pending: baseFiltered.filter((r) => r.status === 'pending').length,
      approved: baseFiltered.filter((r) => r.status === 'approved').length,
      rejected: baseFiltered.filter((r) => r.status === 'rejected').length,
    }),
    [baseFiltered],
  );

  const filtered = React.useMemo(() => {
    if (statusFilter === 'all') return baseFiltered;
    return baseFiltered.filter((r) => r.status === statusFilter);
  }, [baseFiltered, statusFilter]);

  const sorted = React.useMemo(
    () => [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [filtered],
  );

  const resetForm = React.useCallback(() => {
    setFormEmpId('');
    setFormApproverId('');
    setFormWorkDate('');
    setFormPrevIn('');
    setFormPrevOut('');
    setFormCorrIn('');
    setFormCorrOut('');
    setFormPrevStatus('');
    setFormReason('');
  }, []);

  const openNew = React.useCallback(() => {
    resetForm();
    if (activeEmployees.length) {
      setFormEmpId(activeEmployees[0]!.id);
      const mgr = activeEmployees.find((e) => e.hierarchyRole === 'dept_head' || e.hierarchyRole === 'gm') ?? activeEmployees[0];
      setFormApproverId(mgr!.id);
    }
    setDialogOpen(true);
  }, [activeEmployees, resetForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = activeEmployees.find((x) => x.id === formEmpId);
    const appr = activeEmployees.find((x) => x.id === formApproverId);
    if (!emp || !appr) {
      toast.error('اختر الموظف والمعتمد.');
      return;
    }
    if (!formPrevStatus.trim()) {
      toast.error('حدد الحالة السابقة للسجل.');
      return;
    }
    const res = submit({
      employeeId: emp.id,
      employeeNameAr: emp.nameAr,
      departmentId: emp.departmentId,
      approverId: appr.id,
      approverNameAr: appr.nameAr,
      workDate: formWorkDate,
      previousCheckIn: formPrevIn,
      previousCheckOut: formPrevOut,
      correctedCheckIn: formCorrIn,
      correctedCheckOut: formCorrOut,
      previousStatusAr: formPrevStatus.trim(),
      reasonAr: formReason.trim(),
    });
    if (res.ok === false) {
      toast.error(res.error);
      return;
    }
    toast.success('تم تسجيل طلب التصحيح — قيد الموافقة.');
    resetForm();
    setDialogOpen(false);
  };

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (appliedDept !== 'all') count++;
    if (selectedEmpIds.size > 0) count++;
    if (dateBounds.from || dateBounds.to) count++;
    if (statusFilter !== 'all') count++;
    return count;
  }, [appliedDept, selectedEmpIds.size, dateBounds.from, dateBounds.to, statusFilter]);

  useSetPageTitle({ titleAr: 'تصحيح الحضور', descriptionAr: 'طلبات تصحيح أوقات الحضور والانصراف', iconName: 'CalendarClock' });

  usePageHeaderActions(
    () => <AttendanceCorrectionHeaderActions activeFilterCount={activeFilterCount} onNew={openNew} />,
    [activeFilterCount, openNew],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        inlineSelects={[
          {
            id: 'dept',
            value: appliedDept,
            onChange: setAppliedDept,
            placeholder: 'القسم',
            options: deptOptions,
          },
        ]}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOrder={STATUS_ORDER}
        statusLabels={STATUS_LABELS}
        statusCounts={statusCounts}
        onDateBoundsChange={setDateBounds}
      />
    ),
    [
      appliedDept,
      selectedEmpKey,
      statusFilter,
      dateBounds.from,
      dateBounds.to,
      statusCounts.all,
      statusCounts.pending,
      statusCounts.approved,
      statusCounts.rejected,
      deptOptions,
      empPickerList,
      openNew,
    ],
  );

  const columns: ColumnDef<AttendanceCorrectionRequest>[] = React.useMemo(
    () => [
      {
        key: 'emp',
        title: 'الموظف',
        render: (r) => {
          const d = departments.find((x) => x.id === r.departmentId);
          return (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {r.employeeNameAr.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{r.employeeNameAr}</p>
                <p className="text-[10px] text-muted-foreground">{d?.nameAr ?? r.departmentId}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'workDate',
        title: 'تاريخ اليوم',
        render: (r) => <span className="font-mono text-xs" dir="ltr">{r.workDate}</span>,
      },
      {
        key: 'approver',
        title: 'المعتمد (الموافقة)',
        hideOnMobile: true,
        render: (r) => (
          <div>
            <p className="text-sm font-medium">{r.approverNameAr}</p>
            <p className="text-[10px] font-mono text-muted-foreground" dir="ltr">{r.approverId}</p>
          </div>
        ),
      },
      {
        key: 'prevTimes',
        title: 'الحضور والانصراف (السابق)',
        render: (r) => timeCell(r.previousCheckIn, r.previousCheckOut, 'حضور', 'انصراف'),
      },
      {
        key: 'corrTimes',
        title: 'بعد التصحيح',
        render: (r) => timeCell(r.correctedCheckIn, r.correctedCheckOut, 'حضور', 'انصراف'),
      },
      {
        key: 'prevStatus',
        title: 'الحالة السابقة',
        render: (r) => <span className="text-xs text-foreground">{r.previousStatusAr}</span>,
      },
      {
        key: 'status',
        title: 'حالة الطلب',
        render: (r) => (
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', statusBadgeClass(r.status))}>
            <span className={cn('h-1.5 w-1.5 rounded-full', r.status === 'pending' ? 'bg-gold' : r.status === 'approved' ? 'bg-emerald-500' : 'bg-destructive')} />
            {attendanceCorrectionStatusLabelAr(r.status)}
          </span>
        ),
      },
      {
        key: 'reason',
        title: 'السبب / الملاحظات',
        hideOnMobile: true,
        render: (r) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">{r.reasonAr || '—'}</span>,
      },
      {
        key: 'actions',
        title: 'إجراء',
        isActions: true,
        render: (r) => {
          if (r.status !== 'pending') {
            return <span className="text-[10px] font-mono text-muted-foreground" dir="ltr">{r.decidedAt?.slice(0, 10) ?? '—'}</span>;
          }
          return (
            <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" title="موافقة" aria-label="موافقة" onClick={() => { approve(r.id); toast.success('تم اعتماد طلب التصحيح.'); }}>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" title="رفض" aria-label="رفض" onClick={() => { reject(r.id); toast.message('تم رفض الطلب.'); }}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [approve, departments, reject],
  );

  return (
    <div className="space-y-5">
      <p className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground sm:text-sm">
        يرفع الموظف طلب تصحيح لأوقات الحضور والانصراف مع <strong className="text-foreground">تحديد المعتمد</strong> و<strong className="text-foreground">الحالة السابقة</strong> في السجل،
        ومقارنة الأوقات السابقة بالأوقات المطلوبة بعد التصحيح.
      </p>

      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-foreground px-0.5">طلبات تصحيح الحضور</h2>
        {sorted.length === 0 ? (
          <EmptyState title="لا توجد طلبات ضمن الفلاتر" />
        ) : (
          <DataTable
            columns={columns}
            data={sorted}
            keyExtractor={(r) => r.id}
            emptyText="لا توجد طلبات"
            mobileCard={(r) => (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{r.employeeNameAr}</span>
                  <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px]', statusBadgeClass(r.status))}>
                    {attendanceCorrectionStatusLabelAr(r.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono" dir="ltr">{r.workDate}</p>
                <p className="text-xs"><span className="text-muted-foreground">المعتمد:</span> {r.approverNameAr}</p>
                {timeCell(r.previousCheckIn, r.previousCheckOut, 'سابق حضور', 'سابق انصراف')}
                {timeCell(r.correctedCheckIn, r.correctedCheckOut, 'مصحح حضور', 'مصحح انصراف')}
                <p className="text-xs"><span className="text-muted-foreground">الحالة السابقة:</span> {r.previousStatusAr}</p>
                {r.status === 'pending' ? (
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { approve(r.id); toast.success('تم اعتماد طلب التصحيح.'); }}>موافقة</Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs text-destructive" onClick={() => { reject(r.id); toast.message('تم رفض الطلب.'); }}>رفض</Button>
                  </div>
                ) : null}
              </div>
            )}
          />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>طلب تصحيح حضور</DialogTitle>
              <DialogDescription>
                أدخل من سيوافق على الطلب، وأوقات الحضور والانصراف كما في السجل ثم الأوقات المصححة، والحالة السابقة للسجل.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <FormField label="الموظف مقدّم الطلب">
                <Select value={formEmpId} onValueChange={setFormEmpId}>
                  <SelectTrigger><SelectValue placeholder="اختر الموظف…" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="المعتمد (من يوافق على الطلب)">
                <Select value={formApproverId} onValueChange={setFormApproverId}>
                  <SelectTrigger><SelectValue placeholder="اختر المعتمد…" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nameAr} — {e.jobTitleAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="تاريخ اليوم المعني">
                <Input type="date" value={formWorkDate} onChange={(e) => setFormWorkDate(e.target.value)} className="font-mono" dir="ltr" required />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت الحضور السابق (كما في السجل)</Label>
                  <Input type="time" value={formPrevIn} onChange={(e) => setFormPrevIn(e.target.value)} step={60} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت الانصراف السابق (كما في السجل)</Label>
                  <Input type="time" value={formPrevOut} onChange={(e) => setFormPrevOut(e.target.value)} step={60} dir="ltr" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت الحضور بعد التصحيح</Label>
                  <Input type="time" value={formCorrIn} onChange={(e) => setFormCorrIn(e.target.value)} step={60} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">وقت الانصراف بعد التصحيح</Label>
                  <Input type="time" value={formCorrOut} onChange={(e) => setFormCorrOut(e.target.value)} step={60} dir="ltr" />
                </div>
              </div>
              <FormField label="الحالة السابقة للسجل">
                <Select value={formPrevStatus} onValueChange={setFormPrevStatus}>
                  <SelectTrigger><SelectValue placeholder="اختر وصف الحالة…" /></SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_PREVIOUS_STATUS_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.labelAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="سبب الطلب (اختياري)">
                <Textarea value={formReason} onChange={(e) => setFormReason(e.target.value)} rows={3} placeholder="تفاصيل إضافية للمراجع…" />
              </FormField>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>إلغاء</Button>
              <Button type="submit" variant="luxe">تسجيل الطلب</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
