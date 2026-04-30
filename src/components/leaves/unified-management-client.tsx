'use client';

import * as React from 'react';
import {
  Plus, ChevronLeft, ChevronRight, CalendarDays, List,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { format, addMonths, subMonths, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  MOCK_UNIFIED_EMPLOYEES, MOCK_UNIFIED_LEAVES, MOCK_BALANCES, MOCK_BRANCHES, MOCK_DEPARTMENTS,
  applyStepDecision, canActOnLeave, getApprovalStage, defaultPendingApprovalChain,
  LEAVE_TYPE_LABELS, STATUS_LABELS,
} from '@/lib/leaves/unified-mock';
import type { UnifiedLeaveRecord, UnifiedLeaveType, LeaveStatus, UnifiedFilterState } from '@/lib/leaves/types';
import { cn } from '@/lib/utils';

// ─── Style config ─────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<UnifiedLeaveType, { color: string; dot: string }> = {
  annual:    { color: 'bg-primary/10 text-primary border-primary/30', dot: 'bg-primary' },
  sick:      { color: 'bg-amber-500/10 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' },
  unpaid:    { color: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
  maternity: { color: 'bg-pink-500/10 text-pink-700 border-pink-500/30', dot: 'bg-pink-500' },
  emergency: { color: 'bg-destructive/10 text-destructive border-destructive/30', dot: 'bg-destructive' },
};

const STATUS_STYLE: Record<LeaveStatus, { color: string; dot: string; label: string }> = {
  pending:   { color: 'bg-gold/10 text-gold border-gold/30', dot: 'bg-gold', label: 'قيد الانتظار' },
  approved:  { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30', dot: 'bg-emerald-500', label: 'موافق عليه' },
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

// ─── Main component ───────────────────────────────────────────────────────────

export function UnifiedManagementClient() {
  const [leaves, setLeaves] = React.useState<UnifiedLeaveRecord[]>(() =>
    MOCK_UNIFIED_LEAVES.map((l) => ({ ...l })),
  );
  const { values } = usePageFilters([
    { key: 'branch', label: 'الفرع', type: 'select', options: [{ value: 'all', label: 'جميع الفروع' }, ...MOCK_BRANCHES.map(b => ({ value: b.id, label: b.nameAr }))] },
    { key: 'dept', label: 'القسم', type: 'select', options: [{ value: 'all', label: 'جميع الأقسام' }, ...MOCK_DEPARTMENTS.map(d => ({ value: d.id, label: d.nameAr }))] },
    { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'all', label: 'جميع الحالات' }, { value: 'pending', label: 'قيد الانتظار' }, { value: 'approved', label: 'موافق عليه' }, { value: 'rejected', label: 'مرفوض' }, { value: 'cancelled', label: 'ملغاة' }] },
    { key: 'type', label: 'نوع الإجازة', type: 'select', options: [{ value: 'all', label: 'جميع الأنواع' }, { value: 'annual', label: 'سنوية' }, { value: 'sick', label: 'مرضية' }, { value: 'emergency', label: 'طارئة' }, { value: 'unpaid', label: 'بدون راتب' }, { value: 'maternity', label: 'أمومة' }] },
    { key: 'stage', label: 'مرحلة الاعتماد', type: 'select', options: [{ value: 'all', label: 'الكل' }, { value: 'fully_approved', label: 'مكتمل' }, { value: 'awaiting_first', label: 'بانتظار الأول' }, { value: 'awaiting_second', label: 'بانتظار الثاني' }, { value: 'awaiting_third', label: 'بانتظار الثالث' }] },
  ]);
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const empPickerList = React.useMemo(() =>
    MOCK_UNIFIED_EMPLOYEES.map(e => ({ id: e.id, name: e.nameAr })),
    [],
  );

  const filters: UnifiedFilterState = {
    branchId: (values.branch as string) || 'all',
    departmentId: (values.dept as string) || 'all',
    status: (values.status as UnifiedFilterState['status']) || 'all',
    type: (values.type as UnifiedFilterState['type']) || 'all',
    approvalStage: (values.stage as UnifiedFilterState['approvalStage']) || 'all',
    employeeIds: [...selectedEmpIds],
  };

  const [view, setView] = React.useState<'table' | 'calendar'>('table');
  const [calMonth, setCalMonth] = React.useState(() => new Date());
  const [detailLeave, setDetailLeave] = React.useState<UnifiedLeaveRecord | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editLeave, setEditLeave] = React.useState<UnifiedLeaveRecord | null>(null);

  // Apply filters
  const filtered = React.useMemo(() => {
    return leaves.filter((l) => {
      const emp = MOCK_UNIFIED_EMPLOYEES.find((e) => e.id === l.employeeId);
      if (!emp) return false;
      if (filters.branchId !== 'all' && emp.homeBranchId !== filters.branchId) return false;
      if (filters.departmentId !== 'all' && emp.departmentId !== filters.departmentId) return false;
      if (filters.employeeIds.length > 0 && !filters.employeeIds.includes(l.employeeId)) return false;
      if (filters.status !== 'all' && l.status !== filters.status) return false;
      if (filters.type !== 'all' && l.type !== filters.type) return false;
      if (filters.approvalStage !== 'all') {
        const stage = getApprovalStage(l);
        if (stage !== filters.approvalStage && !(filters.approvalStage === 'fully_approved' && stage === 'fully_approved')) return false;
      }
      return true;
    });
  }, [leaves, filters]);

  const updateLeave = (updated: UnifiedLeaveRecord) =>
    setLeaves((ls) => ls.map((l) => l.id === updated.id ? updated : l));

  const handleApprove = (leave: UnifiedLeaveRecord) => {
    const updated = applyStepDecision(leave, 'approve');
    updateLeave(updated);
    if (detailLeave?.id === updated.id) setDetailLeave(updated);
  };

  const handleReject = (leave: UnifiedLeaveRecord) => {
    const updated = applyStepDecision(leave, 'reject');
    updateLeave(updated);
    if (detailLeave?.id === updated.id) setDetailLeave(updated);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
          <button type="button" onClick={() => setView('table')} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all', view === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <List className="h-3.5 w-3.5" />
            جدول
          </button>
          <button type="button" onClick={() => setView('calendar')} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all', view === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <CalendarDays className="h-3.5 w-3.5" />
            تقويم
          </button>
        </div>
        <div className="flex items-center gap-2">
          <EmployeePicker employees={empPickerList} selected={selectedEmpIds} onChange={setSelectedEmpIds} />
          <Button variant="luxe" className="gap-2 shrink-0" onClick={() => { setEditLeave(null); setAddOpen(true); }}>
            <Plus className="h-4 w-4" />
            إضافة إجازة
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === 'table'
        ? <LeaveTable leaves={filtered} onDetail={setDetailLeave} onApprove={handleApprove} onReject={handleReject} />
        : <LeaveCalendar leaves={filtered} month={calMonth} onMonthChange={setCalMonth} onDetail={setDetailLeave} />
      }

      {/* Detail dialog */}
      {detailLeave && (
        <LeaveDetailDialog
          leave={detailLeave}
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
        onClose={() => { setAddOpen(false); setEditLeave(null); }}
        onSave={(l) => {
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

function LeaveTable({ leaves, onDetail, onApprove, onReject }: {
  leaves: UnifiedLeaveRecord[];
  onDetail: (l: UnifiedLeaveRecord) => void;
  onApprove: (l: UnifiedLeaveRecord) => void;
  onReject: (l: UnifiedLeaveRecord) => void;
}) {
  const columns: ColumnDef<UnifiedLeaveRecord>[] = [
    {
      key: 'employee',
      title: 'الموظف',
      render: (l) => {
        const emp = MOCK_UNIFIED_EMPLOYEES.find((e) => e.id === l.employeeId);
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {emp?.nameAr.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="font-medium">{emp?.nameAr ?? l.employeeId}</p>
              <p className="text-[10px] text-muted-foreground">{MOCK_DEPARTMENTS.find(d => d.id === emp?.departmentId)?.nameAr}</p>
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
      render: (l) => {
        const branch = MOCK_BRANCHES.find((b) => b.id === l.requestBranchId);
        return <span className="text-xs text-muted-foreground">{branch?.nameAr}</span>;
      },
    },
    {
      key: 'actions',
      title: 'قرار',
      isActions: true,
      render: (l) => {
        const canAct = canActOnLeave(l);
        return canAct ? (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600" onClick={(e) => { e.stopPropagation(); onApprove(l); }} aria-label="موافقة">
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
        const emp = MOCK_UNIFIED_EMPLOYEES.find((e) => e.id === l.employeeId);
        const dept = MOCK_DEPARTMENTS.find(d => d.id === emp?.departmentId);
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
                  <p className="text-[11px] text-muted-foreground truncate">{dept?.nameAr}</p>
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
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); onApprove(l); }}>
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

function LeaveCalendar({ leaves, month, onMonthChange, onDetail }: {
  leaves: UnifiedLeaveRecord[];
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
        <span className="font-display font-semibold">{format(month, 'MMMM yyyy', { locale: arSA })}</span>
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
                const emp = MOCK_UNIFIED_EMPLOYEES.find((e) => e.id === l.employeeId);
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

function LeaveDetailDialog({ leave, open, onClose, onApprove, onReject, onEdit }: {
  leave: UnifiedLeaveRecord;
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  const emp = MOCK_UNIFIED_EMPLOYEES.find((e) => e.id === leave.employeeId);
  const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp?.departmentId);
  const branch = MOCK_BRANCHES.find((b) => b.id === leave.requestBranchId);
  const balance = MOCK_BALANCES[leave.employeeId];
  const bal = balance?.[leave.type];
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
              <p className="text-xs text-muted-foreground">{dept?.nameAr}</p>
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

          {/* Balance */}
          {bal && (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">رصيد {LEAVE_TYPE_LABELS[leave.type]}</p>
              <p className="mt-1 font-display text-xl font-bold number-ar">
                {bal.used} <span className="text-sm font-normal text-muted-foreground">/ {bal.total} يوم</span>
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary" style={{ width: `${bal.total > 0 ? (bal.used / bal.total) * 100 : 0}%` }} />
              </div>
            </div>
          )}

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
                const icon = step.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
                      step.status === 'approved' ? 'text-emerald-600' :
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

function AddLeaveDialog({ open, editLeave, onClose, onSave }: {
  open: boolean;
  editLeave: UnifiedLeaveRecord | null;
  onClose: () => void;
  onSave: (l: UnifiedLeaveRecord) => void;
}) {
  function lid() { return `lv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

  const [empId, setEmpId] = React.useState('');
  const [branchId, setBranchId] = React.useState('');
  const [type, setType] = React.useState<UnifiedLeaveType>('annual');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && editLeave) {
      setEmpId(editLeave.employeeId);
      setBranchId(editLeave.requestBranchId);
      setType(editLeave.type);
      setStart(editLeave.start);
      setEnd(editLeave.end);
    } else if (open) {
      setEmpId(''); setBranchId(''); setType('annual'); setStart(''); setEnd('');
    }
    setError(null);
  }, [open, editLeave]);

  const submit = () => {
    if (!empId) { setError('اختر الموظف'); return; }
    if (!start || !end) { setError('حدد تاريخ البداية والنهاية'); return; }
    if (start > end) { setError('تاريخ البداية يجب أن يكون قبل النهاية'); return; }
    const record: UnifiedLeaveRecord = editLeave
      ? { ...editLeave, employeeId: empId, requestBranchId: branchId, type, start, end, workingDays: wDays(start, end) }
      : {
          id: lid(),
          employeeId: empId,
          type,
          status: 'pending',
          start,
          end,
          requestBranchId: branchId || MOCK_UNIFIED_EMPLOYEES.find(e => e.id === empId)?.homeBranchId || '',
          workingDays: wDays(start, end),
          noteAr: 'طلب إجازة جديد', noteEn: 'New leave request',
          approvalChain: defaultPendingApprovalChain(),
        };
    onSave(record);
  };

  const empOptions = MOCK_UNIFIED_EMPLOYEES.map((e) => ({ value: e.id, label: e.nameAr }));
  const selEmp = MOCK_UNIFIED_EMPLOYEES.find(e => e.id === empId);

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
            <Select value={branchId || (selEmp?.homeBranchId ?? '')} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
              <SelectContent>
                {MOCK_BRANCHES.map((b) => <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>نوع الإجازة</Label>
            <Select value={type} onValueChange={(v) => setType(v as UnifiedLeaveType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
          <Button variant="luxe" onClick={submit}>{editLeave ? 'حفظ التعديلات' : 'إضافة الإجازة'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
