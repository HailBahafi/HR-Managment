'use client';

import * as React from 'react';
import { CheckCircle2, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { FormField, EmptyState } from '@/components/hr-requests/shared-ui';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { LeavesManagementToolbar } from '@/components/leaves/leaves-management-toolbar';
import { intervalOverlapsYmdRange } from '@/lib/hr-discipline/discipline-date-filter';
import { cn, toWesternDigits } from '@/lib/utils';
import {
  MOCK_UNIFIED_EMPLOYEES,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
} from '@/lib/leaves/unified-mock';
import { useLeaveBalanceCreditStore } from '@/lib/leaves/leave-balance-credit-store';
import type { LeaveBalanceCreditRequest } from '@/lib/leaves/types';

const CREDIT_STATUS_ORDER: readonly string[] = ['pending', 'approved', 'rejected'];

const CREDIT_STATUS_LABELS: Record<string, string> = {
  pending: 'في الانتظار',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
};

function creditRequestInDateRange(r: LeaveBalanceCreditRequest, from: string, to: string): boolean {
  const ymd = r.createdAt.slice(0, 10);
  return intervalOverlapsYmdRange(ymd, ymd, from, to);
}

function statusBadgeClass(status: LeaveBalanceCreditRequest['status']) {
  if (status === 'pending') return 'bg-gold/15 text-gold border-gold/30';
  if (status === 'approved') return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30';
  return 'bg-muted text-muted-foreground border-border';
}

function statusLabelAr(status: LeaveBalanceCreditRequest['status']) {
  return CREDIT_STATUS_LABELS[status] ?? status;
}

export function LeaveBalanceCreditClient() {
  const balances = useLeaveBalanceCreditStore((s) => s.balances);
  const creditRequests = useLeaveBalanceCreditStore((s) => s.creditRequests);
  const submitCreditRequest = useLeaveBalanceCreditStore((s) => s.submitCreditRequest);
  const approveCreditRequest = useLeaveBalanceCreditStore((s) => s.approveCreditRequest);
  const rejectCreditRequest = useLeaveBalanceCreditStore((s) => s.rejectCreditRequest);

  const [branchId, setBranchId] = React.useState('all');
  const [departmentId, setDepartmentId] = React.useState('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [dateBounds, setDateBounds] = React.useState<{ from: string; to: string }>({ from: '', to: '' });

  const [addOpen, setAddOpen] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState('');
  const [daysAddedRaw, setDaysAddedRaw] = React.useState('');
  const [reasonAr, setReasonAr] = React.useState('');

  const branchInlineOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الفروع' }, ...MOCK_BRANCHES.map((b) => ({ value: b.id, label: b.nameAr }))],
    [],
  );
  const deptInlineOptions = React.useMemo(
    () => [{ value: 'all', label: 'جميع الأقسام' }, ...MOCK_DEPARTMENTS.map((d) => ({ value: d.id, label: d.nameAr }))],
    [],
  );

  const empPickerList = React.useMemo(
    () => MOCK_UNIFIED_EMPLOYEES.map((e) => ({ id: e.id, name: e.nameAr })),
    [],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const baseFiltered = React.useMemo(() => {
    const empPick = [...selectedEmpIds];
    return creditRequests.filter((r) => {
      const emp = MOCK_UNIFIED_EMPLOYEES.find((e) => e.id === r.employeeId);
      if (!emp) return false;
      if (branchId !== 'all' && emp.homeBranchId !== branchId) return false;
      if (departmentId !== 'all' && emp.departmentId !== departmentId) return false;
      if (empPick.length > 0 && !empPick.includes(r.employeeId)) return false;
      if (!creditRequestInDateRange(r, dateBounds.from, dateBounds.to)) return false;
      return true;
    });
  }, [creditRequests, branchId, departmentId, selectedEmpIds, dateBounds.from, dateBounds.to]);

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

  const sortedRequests = React.useMemo(
    () => [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [filtered],
  );

  const resetAddForm = React.useCallback(() => {
    setEmployeeId('');
    setDaysAddedRaw('');
    setReasonAr('');
  }, []);

  const handleDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error('اختر الموظف.');
      return;
    }
    const emp = MOCK_UNIFIED_EMPLOYEES.find((x) => x.id === employeeId);
    if (!emp) {
      toast.error('الموظف غير موجود.');
      return;
    }
    const days = Number.parseInt(daysAddedRaw.trim(), 10);
    const res = submitCreditRequest({
      employeeId,
      employeeNameAr: emp.nameAr,
      daysAdded: days,
      reasonAr,
    });
    if (!res.ok) {
      toast.error(res.error ?? 'تعذر الحفظ');
      return;
    }
    toast.success('تم تسجيل الطلب — في الانتظار للموافقة.');
    resetAddForm();
    setAddOpen(false);
  };

  useEntityFilterSlot(
    () => (
      <LeavesManagementToolbar
        inlineSelects={[
          { id: 'branch', value: branchId, onChange: setBranchId, placeholder: 'الفرع', options: branchInlineOptions },
          { id: 'dept', value: departmentId, onChange: setDepartmentId, placeholder: 'القسم', options: deptInlineOptions },
        ]}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOrder={CREDIT_STATUS_ORDER}
        statusLabels={CREDIT_STATUS_LABELS}
        statusCounts={statusCounts}
        onDateBoundsChange={setDateBounds}
        trailingActions={(
          <Button
            variant="luxe"
            size="sm"
            className="h-8 gap-1 px-3 text-xs shadow-sm shrink-0"
            onClick={() => { resetAddForm(); setAddOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" />
            طلب إضافة رصيد
          </Button>
        )}
      />
    ),
    [
      branchId,
      departmentId,
      statusFilter,
      selectedEmpKey,
      dateBounds.from,
      dateBounds.to,
      statusCounts.all,
      statusCounts.pending,
      statusCounts.approved,
      statusCounts.rejected,
      empPickerList,
      branchInlineOptions,
      deptInlineOptions,
    ],
  );

  const columns: ColumnDef<LeaveBalanceCreditRequest>[] = React.useMemo(
    () => [
      {
        key: 'employee',
        title: 'الموظف',
        render: (r) => {
          const emp = MOCK_UNIFIED_EMPLOYEES.find((e) => e.id === r.employeeId);
          return (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {r.employeeNameAr.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{r.employeeNameAr}</p>
                {emp ? (
                  <p className="text-[10px] text-muted-foreground">
                    {MOCK_DEPARTMENTS.find((d) => d.id === emp.departmentId)?.nameAr ?? emp.nameEn}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        key: 'days',
        title: 'عدد الأيام المضافة',
        render: (r) => (
          <span className="font-mono text-sm tabular-nums" dir="ltr">
            +{toWesternDigits(String(r.daysAdded))}
          </span>
        ),
      },
      {
        key: 'reason',
        title: 'الوصف أو العنوان',
        hideOnMobile: true,
        render: (r) => (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">{r.reasonAr || '—'}</span>
        ),
      },
      {
        key: 'status',
        title: 'الحالة',
        render: (r) => (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
              statusBadgeClass(r.status),
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                r.status === 'pending'
                  ? 'bg-gold'
                  : r.status === 'approved'
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground',
              )}
            />
            {statusLabelAr(r.status)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        title: 'التاريخ',
        className: 'align-top',
        hideOnMobile: true,
        render: (r) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap" dir="ltr">
            {r.createdAt.slice(0, 16).replace('T', ' ')}
          </span>
        ),
      },
      {
        key: 'actions',
        title: 'إجراء',
        isActions: true,
        render: (r) => {
          if (r.status !== 'pending') {
            return (
              <span className="text-[10px] font-mono text-muted-foreground" dir="ltr">
                {r.decidedAt ? r.decidedAt.slice(0, 10) : '—'}
              </span>
            );
          }
          return (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                aria-label="موافقة"
                title="موافقة"
                onClick={(e) => {
                  e.stopPropagation();
                  approveCreditRequest(r.id);
                  toast.success('تمت الموافقة على الطلب وتحديث الرصيد السنوي.');
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="رفض"
                title="رفض"
                onClick={(e) => {
                  e.stopPropagation();
                  rejectCreditRequest(r.id);
                  toast.message('تم رفض الطلب.');
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [approveCreditRequest, rejectCreditRequest],
  );

  const selectedBalance = employeeId ? balances[employeeId] : null;

  return (
    <div className="space-y-5 animate-fade-in">
      <p className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground shadow-sm sm:text-sm">
        تُضاف الأيام إلى <strong className="text-foreground">سقف الرصيد السنوي</strong> بعد الموافقة. الطلبات الجديدة بحالة{' '}
        <strong className="text-foreground">في الانتظار</strong> حتى تصبح <strong className="text-foreground">تمت الموافقة</strong> أو تُرفض من الجدول.
      </p>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 px-0.5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">تقرير طلبات إضافة الرصيد</h2>
          <p className="text-xs text-muted-foreground">من الأحدث؛ الموافقة تحدّث الرصيد السنوي فوراً.</p>
        </div>

        {sortedRequests.length === 0 ? (
          <EmptyState title="لا توجد طلبات ضمن الفلاتر" />
        ) : (
          <DataTable
            columns={columns}
            data={sortedRequests}
            keyExtractor={(r) => r.id}
            emptyText="لا توجد طلبات"
            mobileCard={(r) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {r.employeeNameAr.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.employeeNameAr}</p>
                      <p className="text-[11px] font-mono text-muted-foreground" dir="ltr">
                        {r.createdAt.slice(0, 16).replace('T', ' ')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                      statusBadgeClass(r.status),
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        r.status === 'pending'
                          ? 'bg-gold'
                          : r.status === 'approved'
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground',
                      )}
                    />
                    {statusLabelAr(r.status)}
                  </span>
                </div>
                <p className="text-sm font-mono tabular-nums" dir="ltr">
                  +{toWesternDigits(String(r.daysAdded))} يوماً (سنوي)
                </p>
                {r.reasonAr ? <p className="text-[11px] text-muted-foreground line-clamp-3">{r.reasonAr}</p> : null}
                {r.status === 'pending' ? (
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                      onClick={() => {
                        approveCreditRequest(r.id);
                        toast.success('تمت الموافقة على الطلب وتحديث الرصيد السنوي.');
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => {
                        rejectCreditRequest(r.id);
                        toast.message('تم رفض الطلب.');
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" /> رفض
                    </Button>
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-muted-foreground" dir="ltr">
                    {r.decidedAt ? `تاريخ القرار: ${r.decidedAt.slice(0, 10)}` : '—'}
                  </p>
                )}
              </div>
            )}
          />
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) resetAddForm(); setAddOpen(o); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <form onSubmit={handleDialogSubmit}>
            <DialogHeader>
              <DialogTitle>طلب إضافة رصيد</DialogTitle>
              <DialogDescription>
                عدد الأيام المضافة إلى الرصيد السنوي، والوصف أو العنوان. يُسجَّل الطلب بحالة «في الانتظار» حتى الموافقة من التقرير.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <FormField label="الموظف">
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="h-10 w-full rounded-lg border-input bg-background">
                    <SelectValue placeholder="اختر الموظف…" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_UNIFIED_EMPLOYEES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              {selectedBalance ? (
                <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                  الرصيد السنوي الحالي: {toWesternDigits(String(selectedBalance.annual.used))}/
                  {toWesternDigits(String(selectedBalance.annual.total))}
                </p>
              ) : null}
              <FormField label="عدد الأيام المضافة إلى الرصيد (عام)">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder="مثال: 3"
                  value={daysAddedRaw}
                  onChange={(ev) => setDaysAddedRaw(ev.target.value)}
                  className="h-10 font-mono rounded-lg border-input bg-background"
                  dir="ltr"
                />
              </FormField>
              <FormField label="الوصف أو العنوان">
                <Textarea
                  value={reasonAr}
                  onChange={(e) => setReasonAr(e.target.value)}
                  placeholder="وصف مختصر أو عنوان الطلب…"
                  rows={3}
                  className="min-h-[88px] resize-none rounded-lg border-input bg-background"
                />
              </FormField>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); resetAddForm(); }}>
                إلغاء
              </Button>
              <Button type="submit" variant="luxe">
                تسجيل الطلب
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
