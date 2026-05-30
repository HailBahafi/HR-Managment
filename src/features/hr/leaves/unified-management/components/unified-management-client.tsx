'use client';

import * as React from 'react';
import {
  Plus, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { format, addMonths, subMonths, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { intervalOverlapsYmdRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  canActOnLeave, getApprovalStage,
  LEAVE_TYPE_LABELS, STATUS_LABELS,
} from '@/features/hr/leaves/unified-management/lib/leaves-utils';
import type { EmployeeLeaveBalanceRow } from '@/features/hr/leaves/unified-management/types';
import { useEmployees } from '@/features/hr/organization/employees/hooks/useEmployees';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { UnifiedLeaveRecord, UnifiedLeaveType, LeaveStatus, UnifiedFilterState } from '@/features/hr/leaves/unified-management/types';
import { leaveRequestsApi, type LeaveRequestResponseDto } from '@/features/hr/leaves/lib/api/leave-requests';
import { leaveTypesApi, type LeaveTypeResponseDto } from '@/features/hr/leaves/lib/api/leave-types';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { cn, toWesternDigits } from '@/shared/utils';

// ─── Style config ─────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<UnifiedLeaveType, { color: string; dot: string }> = {
  annual:    { color: 'bg-primary/10 text-primary border-primary/30', dot: 'bg-primary' },
  sick:      { color: 'bg-warning/10 text-warning border-warning/30', dot: 'bg-warning' },
  unpaid:    { color: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
  maternity: { color: 'bg-accent/80 text-accent-foreground border-border', dot: 'bg-accent' },
  emergency: { color: 'bg-destructive/10 text-destructive border-destructive/30', dot: 'bg-destructive' },
};

const STATUS_STYLE: Record<LeaveStatus, { color: string; dot: string; label: string }> = {
  pending:   { color: 'bg-gold/10 text-gold border-gold/30', dot: 'bg-gold', label: 'قيد الانتظار' },
  approved:  { color: 'bg-success/10 text-success border-success/30', dot: 'bg-success', label: 'موافق عليه' },
  rejected:  { color: 'bg-destructive/10 text-destructive border-destructive/30', dot: 'bg-destructive', label: 'مرفوض' },
  cancelled: { color: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground', label: 'ملغاة' },
};

// ─── Default filter state ─────────────────────────────────────────────────────

// ─── Working days helper ──────────────────────────────────────────────────────

function wDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

const KNOWN_LEAVE_CODES = ['annual', 'sick', 'unpaid', 'maternity', 'emergency'];

function mapApiLeave(r: LeaveRequestResponseDto, leaveTypes: LeaveTypeResponseDto[]): UnifiedLeaveRecord {
  const lt = leaveTypes.find((t) => t.id === r.leaveTypeId);
  const derivedType = (lt?.code && KNOWN_LEAVE_CODES.includes(lt.code) ? lt.code : 'annual') as UnifiedLeaveType;
  return {
    id: r.id,
    employeeId: r.employeeId,
    leaveTypeId: r.leaveTypeId,
    leaveTypeName: lt?.nameAr ?? r.leaveTypeId,
    type: derivedType,
    status: (r.status as LeaveStatus) ?? 'pending',
    start: r.startDate ?? '',
    end: r.endDate ?? '',
    requestBranchId: '',
    workingDays: r.workingDays ?? 0,
    noteAr: r.noteAr ?? undefined,
    approvalChain: [],
  };
}

function leaveOverlapsYmdRange(leave: UnifiedLeaveRecord, from: string, to: string): boolean {
  return intervalOverlapsYmdRange(leave.start, leave.end, from, to);
}

const LEAVE_STATUS_TOOLBAR_ORDER: LeaveStatus[] = ['pending', 'approved', 'rejected', 'cancelled'];

const LEAVE_STATUS_LABELS_FOR_TOOLBAR: Record<string, string> = {
  pending: STATUS_STYLE.pending.label,
  approved: STATUS_STYLE.approved.label,
  rejected: STATUS_STYLE.rejected.label,
  cancelled: STATUS_STYLE.cancelled.label,
};

// ─── Main component ───────────────────────────────────────────────────────────

export function UnifiedManagementClient() {
  const { data: employeesResult } = useEmployees();
  const employeesList = React.useMemo(() => employeesResult?.items ?? [], [employeesResult]);

  const companyId = useAuthStore((s) => s.activeCompanyId);

  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  React.useEffect(() => {
    void (async () => {
      try {
        const scope = await resolveOrganizationScope();
        const res = await branchesApi.getAll(scope.companyId ? { companyId: scope.companyId, limit: 200 } : { limit: 200 });
        setBranches(res.items.filter((b) => b.isActive));
      } catch {
        // silently ignore — branch filter stays empty
      }
    })();
  }, []);

  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeResponseDto[]>([]);
  const [leaves, setLeaves] = React.useState<UnifiedLeaveRecord[]>([]);

  React.useEffect(() => {
    if (!companyId) return;
    void (async () => {
      try {
        const [ltRes, lrRes] = await Promise.all([
          leaveTypesApi.getAll({ companyId, limit: 200 }),
          leaveRequestsApi.getAll({ companyId, limit: 200 }),
        ]);
        const activeTypes = ltRes.items.filter((t) => t.isActive);
        setLeaveTypes(activeTypes);
        setLeaves(lrRes.items.map((r) => mapApiLeave(r, ltRes.items)));
      } catch {
        // silently ignore — stays empty
      }
    })();
  }, [companyId]);
  const [branchId, setBranchId] = React.useState('all');
  const [departmentId, setDepartmentId] = React.useState('all');
  const [leaveType, setLeaveType] = React.useState<string>('all');
  const [approvalStageFilter, setApprovalStageFilter] = React.useState<string>('all');

  const branchInlineOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الفروع' }, ...branches.map((b) => ({ value: b.id, label: b.nameAr }))],
    [branches],
  );
  const deptInlineOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الأقسام' }],
    [],
  );
  const typeInlineOptions = React.useMemo(
    () => [
      { value: 'all', label: 'اختر النوع' },
      { value: 'annual', label: 'سنوية' },
      { value: 'sick', label: 'مرضية' },
      { value: 'emergency', label: 'طارئة' },
      { value: 'unpaid', label: 'بدون راتب' },
      { value: 'maternity', label: 'أمومة' },
    ],
    [],
  );
  const stageInlineOptions = React.useMemo(
    () => [
      { value: 'all', label: 'الكل' },
      { value: 'fully_approved', label: 'مكتمل' },
      { value: 'awaiting_first', label: 'بانتظار الأول' },
      { value: 'awaiting_second', label: 'بانتظار الثاني' },
      { value: 'awaiting_third', label: 'بانتظار الثالث' },
    ],
    [],
  );

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [dateBounds, setDateBounds] = React.useState<{ from: string; to: string }>({ from: '', to: '' });

  const empPickerList = React.useMemo(() =>
    employeesList.map(e => ({ id: e.id, name: e.nameAr })),
    [employeesList],
  );

  const filters: UnifiedFilterState = {
    branchId: branchId || 'all',
    departmentId: departmentId || 'all',
    status: (statusFilter as UnifiedFilterState['status']) || 'all',
    type: (leaveType as UnifiedFilterState['type']) || 'all',
    approvalStage: (approvalStageFilter as UnifiedFilterState['approvalStage']) || 'all',
    employeeIds: [...selectedEmpIds],
  };

  const [view, setView] = React.useState<'table' | 'calendar'>('table');
  const [calMonth, setCalMonth] = React.useState(() => new Date());
  const [detailLeave, setDetailLeave] = React.useState<UnifiedLeaveRecord | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editLeave, setEditLeave] = React.useState<UnifiedLeaveRecord | null>(null);

  const statusCounts = React.useMemo(() => {
    const empPick = [...selectedEmpIds];
    const base = leaves.filter((l) => {
      if (empPick.length > 0 && !empPick.includes(l.employeeId)) return false;
      if (filters.type !== 'all' && l.type !== filters.type) return false;
      if (filters.approvalStage !== 'all') {
        const stage = getApprovalStage(l);
        if (stage !== filters.approvalStage && !(filters.approvalStage === 'fully_approved' && stage === 'fully_approved')) return false;
      }
      if (!leaveOverlapsYmdRange(l, dateBounds.from, dateBounds.to)) return false;
      return true;
    });
    return {
      all: base.length,
      pending: base.filter((l) => l.status === 'pending').length,
      approved: base.filter((l) => l.status === 'approved').length,
      rejected: base.filter((l) => l.status === 'rejected').length,
      cancelled: base.filter((l) => l.status === 'cancelled').length,
    };
  }, [leaves, filters.branchId, filters.departmentId, filters.type, filters.approvalStage, selectedEmpIds, dateBounds.from, dateBounds.to]);

  // Apply filters (شريط الأدوات: فترة + حالة + موظفون؛ اللوحة: فرع، قسم، نوع، مرحلة)
  const filtered = React.useMemo(() => {
    const empPick = [...selectedEmpIds];
    return leaves.filter((l) => {
      if (empPick.length > 0 && !empPick.includes(l.employeeId)) return false;
      if (filters.branchId !== 'all' && l.requestBranchId !== filters.branchId) return false;
      if (filters.status !== 'all' && l.status !== filters.status) return false;
      if (filters.type !== 'all' && l.type !== filters.type) return false;
      if (filters.approvalStage !== 'all') {
        const stage = getApprovalStage(l);
        if (stage !== filters.approvalStage && !(filters.approvalStage === 'fully_approved' && stage === 'fully_approved')) return false;
      }
      if (!leaveOverlapsYmdRange(l, dateBounds.from, dateBounds.to)) return false;
      return true;
    });
  }, [leaves, filters.branchId, filters.departmentId, filters.status, filters.type, filters.approvalStage, selectedEmpIds, dateBounds.from, dateBounds.to]);

  const updateLeave = (updated: UnifiedLeaveRecord) =>
    setLeaves((ls) => ls.map((l) => l.id === updated.id ? updated : l));

  const handleApprove = async (leave: UnifiedLeaveRecord) => {
    try {
      const updated = await leaveRequestsApi.update(leave.id, { status: 'approved' });
      const mapped = mapApiLeave(updated, leaveTypes);
      updateLeave(mapped);
      if (detailLeave?.id === leave.id) setDetailLeave(mapped);
    } catch { /* ignore */ }
  };

  const handleReject = async (leave: UnifiedLeaveRecord) => {
    try {
      const updated = await leaveRequestsApi.update(leave.id, { status: 'rejected' });
      const mapped = mapApiLeave(updated, leaveTypes);
      updateLeave(mapped);
      if (detailLeave?.id === leave.id) setDetailLeave(mapped);
    } catch { /* ignore */ }
  };

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const activeFilterCount =
    (branchId !== 'all' ? 1 : 0) + (departmentId !== 'all' ? 1 : 0) +
    (leaveType !== 'all' ? 1 : 0) + (approvalStageFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) + (selectedEmpIds.size > 0 ? 1 : 0) +
    (dateBounds.from !== '' ? 1 : 0);

  const onAddClick = React.useCallback(() => { setEditLeave(null); setAddOpen(true); }, []);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button
          variant="luxe"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs shadow-sm"
          onClick={onAddClick}
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة إجازة
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        inlineSelects={[
          { id: 'type', value: leaveType, onChange: setLeaveType, placeholder: 'نوع الإجازة', options: typeInlineOptions },
        ]}
        moreFilters={[
          { id: 'branch', value: branchId, onChange: setBranchId, placeholder: 'الفرع', options: branchInlineOptions },
          { id: 'dept', value: departmentId, onChange: setDepartmentId, placeholder: 'القسم', options: deptInlineOptions },
          { id: 'stage', value: approvalStageFilter, onChange: setApprovalStageFilter, placeholder: 'مرحلة الاعتماد', options: stageInlineOptions },
        ]}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOrder={LEAVE_STATUS_TOOLBAR_ORDER}
        statusLabels={LEAVE_STATUS_LABELS_FOR_TOOLBAR}
        statusCounts={statusCounts}
        onDateBoundsChange={setDateBounds}
        dataView={{
          value: view,
          onChange: (v) => setView(v as 'table' | 'calendar'),
          options: [
            { value: 'table', label: 'جدول', icon: 'list' },
            { value: 'calendar', label: 'تقويم', icon: 'calendar-days' },
          ],
        }}
      />
    ),
    [
      branchId, departmentId, leaveType, approvalStageFilter,
      statusFilter, selectedEmpKey,
      dateBounds.from, dateBounds.to,
      statusCounts.all, statusCounts.pending, statusCounts.approved, statusCounts.rejected, statusCounts.cancelled,
      view, empPickerList,
      branchInlineOptions, deptInlineOptions, typeInlineOptions, stageInlineOptions,
    ],
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Content */}
      {view === 'table'
        ? <LeaveTable leaves={filtered} employees={employeesList} branches={branches} onDetail={setDetailLeave} onApprove={handleApprove} onReject={handleReject} />
        : <LeaveCalendar leaves={filtered} employees={employeesList} month={calMonth} onMonthChange={setCalMonth} onDetail={setDetailLeave} />
      }

      {/* Detail dialog */}
      {detailLeave && (
        <LeaveDetailDialog
          leave={detailLeave}
          employees={employeesList}
          open={!!detailLeave}
          onClose={() => setDetailLeave(null)}
          onApprove={() => handleApprove(detailLeave)}
          onReject={() => handleReject(detailLeave)}
          onEdit={() => { setEditLeave(detailLeave); setAddOpen(true); setDetailLeave(null); }}
        />
      )}

      {/* Add/Edit dialog */}
      <AddLeaveDialog
        open={addOpen}
        editLeave={editLeave}
        employees={employeesList}
        branches={branches}
        leaveTypes={leaveTypes}
        companyId={companyId ?? ''}
        onClose={() => { setAddOpen(false); setEditLeave(null); }}
        onSave={async (l) => {
          if (editLeave) updateLeave(l);
          else setLeaves((ls) => [l, ...ls]);
          setAddOpen(false);
          setEditLeave(null);
        }}
      />
    </div>
  );
}

// ─── Leave table ──────────────────────────────────────────────────────────────

function LeaveTable({ leaves, employees, branches, onDetail, onApprove, onReject }: {
  leaves: UnifiedLeaveRecord[];
  employees: { id: string; nameAr: string }[];
  branches: BranchResponseDto[];
  onDetail: (l: UnifiedLeaveRecord) => void;
  onApprove: (l: UnifiedLeaveRecord) => void;
  onReject: (l: UnifiedLeaveRecord) => void;
}) {
  const columns: ColumnDef<UnifiedLeaveRecord>[] = [
    {
      key: 'employee',
      title: 'الموظف',
      render: (l) => {
        const emp = employees.find((e) => e.id === l.employeeId);
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {emp?.nameAr.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="font-medium">{emp?.nameAr ?? l.employeeId}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      title: 'النوع',
      render: (l) => {
        const typeCfg = TYPE_STYLE[l.type];
        return (
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', typeCfg.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', typeCfg.dot)} />
            {LEAVE_TYPE_LABELS[l.type]}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (l) => {
        const statusCfg = STATUS_STYLE[l.status];
        return (
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', statusCfg.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
            {statusCfg.label}
          </span>
        );
      },
    },
    {
      key: 'start',
      title: 'من',
      render: (l) => <span className="font-mono text-xs" dir="ltr">{l.start}</span>,
    },
    {
      key: 'end',
      title: 'إلى',
      render: (l) => <span className="font-mono text-xs" dir="ltr">{l.end}</span>,
    },
    {
      key: 'days',
      title: 'أيام',
      render: (l) => <span className="font-mono text-xs number-ar">{l.workingDays}</span>,
    },
    {
      key: 'branch',
      title: 'الفرع',
      hideOnMobile: true,
      render: (l) => <span className="text-xs text-muted-foreground">{branches.find((b) => b.id === l.requestBranchId)?.nameAr ?? l.requestBranchId ?? '—'}</span>,
    },
    {
      key: 'actions',
      title: 'قرار',
      isActions: true,
      render: (l) => {
        const canAct = canActOnLeave(l);
        return canAct ? (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:bg-success/10 hover:text-success" onClick={(e) => { e.stopPropagation(); onApprove(l); }} aria-label="موافقة">
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onReject(l); }} aria-label="رفض">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">—</span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={leaves}
      keyExtractor={(l) => l.id}
      emptyText="لا توجد إجازات بهذه الفلاتر"
      onRowClick={onDetail}
      mobileCard={(l) => {
        const emp = employees.find((e) => e.id === l.employeeId);
        const typeCfg = TYPE_STYLE[l.type];
        const statusCfg = STATUS_STYLE[l.status];
        const canAct = canActOnLeave(l);
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {emp?.nameAr.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{emp?.nameAr ?? l.employeeId}</p>
                </div>
              </div>
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium shrink-0', statusCfg.color)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', typeCfg.color)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', typeCfg.dot)} />
                {LEAVE_TYPE_LABELS[l.type]}
              </span>
              <span className="text-xs text-muted-foreground font-mono" dir="ltr">{l.start} → {l.end}</span>
              <span className="text-xs text-muted-foreground">{l.workingDays} أيام</span>
            </div>
            {canAct && (
              <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs text-success border-success/40 hover:bg-success/10" onClick={(e) => { e.stopPropagation(); onApprove(l); }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onReject(l); }}>
                  <XCircle className="h-3.5 w-3.5" /> رفض
                </Button>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}

// ─── Calendar view ─────────────────────────────────────────────────────────────

function LeaveCalendar({ leaves, employees, month, onMonthChange, onDetail }: {
  leaves: UnifiedLeaveRecord[];
  employees: { id: string; nameAr: string }[];
  month: Date;
  onMonthChange: (d: Date) => void;
  onDetail: (l: UnifiedLeaveRecord) => void;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const firstDow = getDay(start); // 0=Sun

  const leavesInMonth = React.useMemo(() =>
    leaves.filter((l) => {
      const s = new Date(l.start + 'T12:00:00');
      const e = new Date(l.end + 'T12:00:00');
      return s <= end && e >= start;
    }),
    [leaves, start, end],
  );

  function leavesOnDay(d: Date): UnifiedLeaveRecord[] {
    const iso = format(d, 'yyyy-MM-dd');
    return leavesInMonth.filter((l) => l.start <= iso && l.end >= iso);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Month nav */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(subMonths(month, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="font-display font-semibold">{toWesternDigits(format(month, 'MMMM yyyy', { locale: arSA }))}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {['أحد','إثن','ثلا','أرب','خمس','جمع','سبت'].map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[80px] border-b border-l border-border/40 bg-muted/10" />
        ))}
        {days.map((d) => {
          const dayLeaves = leavesOnDay(d);
          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div key={d.toISOString()} className="min-h-[80px] border-b border-l border-border/40 p-1.5">
              <span className={cn('mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium', isToday && 'bg-primary text-primary-foreground')}>
                {format(d, 'd')}
              </span>
              {dayLeaves.slice(0, 2).map((l) => {
                const typeCfg = TYPE_STYLE[l.type];
                const emp = employees.find((e) => e.id === l.employeeId);
                return (
                  <button key={l.id} type="button" onClick={() => onDetail(l)}
                    className={cn('mb-0.5 flex w-full cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] text-right hover:opacity-80 transition-opacity', typeCfg.color)}
                  >
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', typeCfg.dot)} />
                    <span className="truncate">{emp?.nameAr}</span>
                  </button>
                );
              })}
              {dayLeaves.length > 2 && (
                <span className="px-1 text-[9px] text-muted-foreground">+{dayLeaves.length - 2} أكثر</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Leave detail dialog ───────────────────────────────────────────────────────

function LeaveDetailDialog({ leave, employees, open, onClose, onApprove, onReject, onEdit }: {
  leave: UnifiedLeaveRecord;
  employees: { id: string; nameAr: string }[];
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const emp = employees.find((e) => e.id === leave.employeeId);
  const typeCfg = TYPE_STYLE[leave.type];
  const statusCfg = STATUS_STYLE[leave.status];
  const canAct = canActOnLeave(leave);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">تفاصيل الإجازة</DialogTitle>
            <DialogDescription>{emp?.nameAr} · {LEAVE_TYPE_LABELS[leave.type]}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Employee & type/status */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {emp?.nameAr.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{emp?.nameAr}</p>
              </div>
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium', typeCfg.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', typeCfg.dot)} />
              {LEAVE_TYPE_LABELS[leave.type]}
            </span>
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium', statusCfg.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
              {statusCfg.label}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'من', value: leave.start },
              { label: 'إلى', value: leave.end },
              { label: 'الأيام', value: `${leave.workingDays} يوم` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold" dir="ltr">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Note */}
          {(leave.noteAr || leave.noteEn) && (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">ملاحظات</p>
              {leave.noteAr && <p className="mt-1 text-sm">{leave.noteAr}</p>}
              {leave.noteEn && <p className="text-xs text-muted-foreground" dir="ltr">{leave.noteEn}</p>}
            </div>
          )}

          <Separator />

          {/* Approval chain */}
          <div>
            <p className="mb-3 text-sm font-semibold">سلسلة الاعتماد</p>
            <div className="space-y-2">
              {leave.approvalChain.map((step, i) => {
                const icon = step.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-success" />
                  : step.status === 'rejected' ? <XCircle className="h-4 w-4 text-destructive" />
                  : step.status === 'pending' ? <Clock className="h-4 w-4 text-gold" />
                  : <div className="h-4 w-4 rounded-full border-2 border-border" />;
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      {icon}
                      {i < leave.approvalChain.length - 1 && <div className="mt-1 h-4 w-px bg-border" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{step.roleAr}</p>
                      {step.decidedAt && (
                        <p className="text-[10px] font-mono text-muted-foreground" dir="ltr">{step.decidedAt.slice(0, 10)}</p>
                      )}
                    </div>
                    <span className={cn('text-[10px] font-medium',
                      step.status === 'approved' ? 'text-success' :
                      step.status === 'rejected' ? 'text-destructive' :
                      step.status === 'pending' ? 'text-gold' : 'text-muted-foreground',
                    )}>
                      {step.status === 'approved' ? 'تمت الموافقة' : step.status === 'rejected' ? 'مرفوض' : step.status === 'pending' ? 'ينتظر القرار' : 'في الانتظار'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-wrap gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button variant="outline" onClick={onEdit}>تعديل</Button>
          {canAct && (
            <>
              <Button variant="destructive" onClick={() => { onReject(); onClose(); }}>رفض</Button>
              <Button variant="luxe" onClick={() => { onApprove(); onClose(); }}>موافقة</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add/Edit leave dialog ────────────────────────────────────────────────────

function AddLeaveDialog({ open, editLeave, employees, branches, leaveTypes, companyId, onClose, onSave }: {
  open: boolean;
  editLeave: UnifiedLeaveRecord | null;
  employees: { id: string; nameAr: string }[];
  branches: BranchResponseDto[];
  leaveTypes: LeaveTypeResponseDto[];
  companyId: string;
  onClose: () => void;
  onSave: (l: UnifiedLeaveRecord) => Promise<void>;
}) {
  const [empId, setEmpId] = React.useState('');
  const [branchId, setBranchId] = React.useState('');
  const [leaveTypeId, setLeaveTypeId] = React.useState('');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && editLeave) {
      setEmpId(editLeave.employeeId);
      setBranchId(editLeave.requestBranchId);
      setLeaveTypeId(editLeave.leaveTypeId);
      setStart(editLeave.start);
      setEnd(editLeave.end);
    } else if (open) {
      setEmpId(''); setBranchId(''); setLeaveTypeId(leaveTypes[0]?.id ?? ''); setStart(''); setEnd('');
    }
    setError(null);
  }, [open, editLeave, leaveTypes]);

  const submit = async () => {
    if (!empId || !leaveTypeId) { setError('اختر الموظف ونوع الإجازة'); return; }
    if (!start || !end || start > end) { setError('تحقق من التواريخ'); return; }
    try {
      if (editLeave) {
        await leaveRequestsApi.update(editLeave.id, {
          startDate: start, endDate: end, workingDays: wDays(start, end),
        });
        await onSave({ ...editLeave, start, end, workingDays: wDays(start, end) });
      } else {
        const created = await leaveRequestsApi.create({
          companyId,
          employeeId: empId,
          leaveTypeId,
          startDate: start,
          endDate: end,
          workingDays: wDays(start, end),
        });
        const lt = leaveTypes.find((t) => t.id === created.leaveTypeId);
        const derivedType = (lt?.code && KNOWN_LEAVE_CODES.includes(lt.code) ? lt.code : 'annual') as UnifiedLeaveType;
        await onSave({
          id: created.id,
          employeeId: created.employeeId,
          leaveTypeId: created.leaveTypeId,
          leaveTypeName: lt?.nameAr ?? '',
          type: derivedType,
          status: 'pending',
          start: created.startDate ?? start,
          end: created.endDate ?? end,
          requestBranchId: '',
          workingDays: created.workingDays ?? wDays(start, end),
          approvalChain: [],
        });
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const empOptions = employees.map((e) => ({ value: e.id, label: e.nameAr }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden border-border p-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editLeave ? 'تعديل الإجازة' : 'إضافة إجازة'}</DialogTitle>
            <DialogDescription>أدخل بيانات طلب الإجازة.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label>الموظف <span className="text-destructive">*</span></Label>
            <Select value={empId} onValueChange={setEmpId}>
              <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>
                {empOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>فرع الطلب</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
              <SelectContent>
                {branches.length === 0 ? (
                  <SelectItem value="__none__" disabled>لا توجد فروع</SelectItem>
                ) : (
                  branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>نوع الإجازة <span className="text-destructive">*</span></Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger><SelectValue placeholder="اختر نوع الإجازة" /></SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => <SelectItem key={lt.id} value={lt.id}>{lt.nameAr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>من <span className="text-destructive">*</span></Label>
              <SingleDatePicker value={start} onChange={setStart} placeholder="تاريخ البداية" />
            </div>
            <div className="space-y-2">
              <Label>إلى <span className="text-destructive">*</span></Label>
              <SingleDatePicker value={end} onChange={setEnd} placeholder="تاريخ النهاية" min={start} />
            </div>
          </div>

          {start && end && start <= end && (
            <p className="text-xs text-muted-foreground">
              عدد الأيام: <span className="font-bold text-foreground number-ar">{wDays(start, end)}</span> يوم
            </p>
          )}

          {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button variant="luxe" onClick={() => void submit()}>{editLeave ? 'حفظ التعديلات' : 'إضافة الإجازة'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
