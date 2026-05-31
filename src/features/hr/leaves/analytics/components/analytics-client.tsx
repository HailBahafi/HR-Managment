'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, Loader2, AlertTriangle,
  Users, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import {
  leaveBalancesApi,
  type EmployeeLeaveBalanceResponseDto,
  type CreateLeaveBalanceDto,
} from '@/features/hr/leaves/lib/api/leave-balances';
import { leaveTypesApi, type LeaveTypeResponseDto } from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(used: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(Math.round((used / total) * 100), 100);
}

function BalanceBar({ used, total, color }: { used: number; total: number; color: string }) {
  const p = pct(used, total);
  const danger = p >= 90;
  const warn = p >= 70;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', danger ? 'bg-destructive' : warn ? 'bg-warning' : color)}
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground" dir="ltr">
        {used}/{total}
      </span>
    </div>
  );
}

// ─── Create / Edit dialog ─────────────────────────────────────────────────────

type DialogMode = { mode: 'create' } | { mode: 'edit'; balance: EmployeeLeaveBalanceResponseDto };

function BalanceFormDialog({
  open,
  dialogMode,
  employees,
  leaveTypes,
  companyId,
  onClose,
  onSaved,
}: {
  open: boolean;
  dialogMode: DialogMode;
  employees: EmployeeResponseDto[];
  leaveTypes: LeaveTypeResponseDto[];
  companyId: string;
  onClose: () => void;
  onSaved: (b: EmployeeLeaveBalanceResponseDto) => void;
}) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [leaveTypeId, setLeaveTypeId] = React.useState('');
  const [totalDays, setTotalDays] = React.useState('');
  const [usedDays, setUsedDays] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (dialogMode.mode === 'edit') {
      setEmployeeId(dialogMode.balance.employeeId);
      setLeaveTypeId(dialogMode.balance.leaveTypeId);
      setTotalDays(String(dialogMode.balance.totalDays));
      setUsedDays(String(dialogMode.balance.usedDays));
    } else {
      setEmployeeId('');
      setLeaveTypeId('');
      setTotalDays('');
      setUsedDays('0');
    }
  }, [open, dialogMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(totalDays);
    const used = Number(usedDays);
    if (!employeeId || !leaveTypeId || isNaN(total) || total < 0) {
      toast.error('يرجى تعبئة جميع الحقول بشكل صحيح');
      return;
    }
    setSaving(true);
    try {
      let saved: EmployeeLeaveBalanceResponseDto;
      if (dialogMode.mode === 'create') {
        const payload: CreateLeaveBalanceDto = { companyId, employeeId, leaveTypeId, totalDays: total, usedDays: used };
        saved = await leaveBalancesApi.create(payload);
        toast.success('تم إنشاء الرصيد');
      } else {
        saved = await leaveBalancesApi.update(dialogMode.balance.id, { totalDays: total, usedDays: used });
        toast.success('تم تحديث الرصيد');
      }
      onSaved(saved);
      onClose();
    } catch { toast.error('حدث خطأ أثناء الحفظ'); }
    finally { setSaving(false); }
  };

  const isEdit = dialogMode.mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="text-right font-display text-base">
            {isEdit ? 'تعديل رصيد إجازة' : 'إضافة رصيد إجازة'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Employee */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">الموظف</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} disabled={isEdit}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="اختر موظفاً..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">نوع الإجازة</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId} disabled={isEdit}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="اختر نوع الإجازة..." />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>{lt.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">إجمالي الأيام</Label>
              <Input
                type="number"
                min="0"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                className="h-9 text-sm"
                placeholder="21"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">أيام مستخدمة</Label>
              <Input
                type="number"
                min="0"
                value={usedDays}
                onChange={(e) => setUsedDays(e.target.value)}
                className="h-9 text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start pt-1">
            <Button type="submit" disabled={saving} className="flex-1 gap-2">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? 'حفظ التعديلات' : 'إنشاء الرصيد'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  balance,
  employeeName,
  leaveTypeName,
  onClose,
  onDeleted,
}: {
  balance: EmployeeLeaveBalanceResponseDto | null;
  employeeName: string;
  leaveTypeName: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!balance) return;
    setDeleting(true);
    try {
      await leaveBalancesApi.remove(balance.id);
      toast.success('تم حذف الرصيد');
      onDeleted(balance.id);
      onClose();
    } catch { toast.error('فشل الحذف'); }
    finally { setDeleting(false); }
  };

  return (
    <Dialog open={!!balance} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right font-display text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            حذف رصيد الإجازة
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          هل أنت متأكد من حذف رصيد <span className="font-semibold text-foreground">{leaveTypeName}</span> للموظف{' '}
          <span className="font-semibold text-foreground">{employeeName}</span>؟ لا يمكن التراجع.
        </p>
        <DialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
          <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex-1 gap-2">
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            حذف
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, variant = 'default',
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: 'default' | 'destructive';
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 shadow-soft',
      variant === 'destructive' ? 'border-destructive/20' : 'border-border',
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className={cn(
            'mt-1 font-display text-2xl font-bold tabular-nums',
            variant === 'destructive' ? 'text-destructive' : 'text-foreground',
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          'rounded-lg p-2',
          variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Employee balance card ────────────────────────────────────────────────────

const LEAVE_TYPE_COLORS = [
  'bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500',
  'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
];

function EmployeeBalanceCard({
  employeeId,
  employeeName,
  balances,
  leaveTypes,
  onEdit,
  onDelete,
}: {
  employeeId: string;
  employeeName: string;
  balances: EmployeeLeaveBalanceResponseDto[];
  leaveTypes: LeaveTypeResponseDto[];
  onEdit: (b: EmployeeLeaveBalanceResponseDto) => void;
  onDelete: (b: EmployeeLeaveBalanceResponseDto) => void;
}) {
  const initials = employeeName.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const hue = ((employeeId.charCodeAt(0) ?? 0) * 47) % 360;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="divide-y divide-border/50">
        {balances.length === 0 ? (
          <div className="space-y-1.5 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: `hsl(${hue} 55% 45%)` }}
              >
                {initials}
              </div>
              <p className="min-w-0 truncate text-sm font-semibold">{employeeName}</p>
            </div>
            <p className="text-xs text-muted-foreground">لا توجد أرصدة</p>
          </div>
        ) : (
          balances.map((b, idx) => {
            const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
            const color = LEAVE_TYPE_COLORS[idx % LEAVE_TYPE_COLORS.length] ?? 'bg-primary';
            const rowPct = pct(b.usedDays, b.totalDays);

            return (
              <div key={b.id} className="px-4 py-3">
                {/* Row 1 — employee name + label/bar justify-between */}
                <div className="flex min-w-0 items-center gap-2 pb-2">
                  {idx === 0 ? (
                    <>
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ background: `hsl(${hue} 55% 45%)` }}
                      >
                        {initials}
                      </div>
                      <p className="max-w-[5rem] shrink-0 truncate text-sm font-semibold">{employeeName}</p>
                    </>
                  ) : (
                    <div className="flex shrink-0 gap-2" aria-hidden>
                      <div className="h-9 w-9" />
                      <div className="w-20" />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full max-w-[16rem] justify-center">
                      <p className="truncate text-xs font-medium">{lt?.nameAr ?? '—'}</p>
                    </div>
                    <div className="flex w-full max-w-[12rem] items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            rowPct >= 90 ? 'bg-destructive' : rowPct >= 70 ? 'bg-amber-500' : color,
                          )}
                          style={{ width: `${rowPct}%` }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground" dir="ltr">
                        {b.usedDays}/{b.totalDays}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 — edit & delete (left side in RTL) */}
                <div className="flex w-full justify-end gap-0.5 border-t border-border/60 pt-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onEdit(b)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(b)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [balances, setBalances] = React.useState<EmployeeLeaveBalanceResponseDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeResponseDto[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [employeeFilter, setEmployeeFilter] = React.useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState('all');

  const [formOpen, setFormOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>({ mode: 'create' });
  const [deleteTarget, setDeleteTarget] = React.useState<EmployeeLeaveBalanceResponseDto | null>(null);

  // Load all data
  React.useEffect(() => {
    if (!companyId) return;
    void (async () => {
      setLoading(true);
      try {
        const [balRes, ltRes, empRes] = await Promise.all([
          leaveBalancesApi.getAll({ companyId, limit: 1000 }),
          leaveTypesApi.getAll({ companyId, limit: 200 }),
          employeesApi.getAll({ companyId, limit: 500 }),
        ]);
        setBalances(balRes.items);
        setLeaveTypes(ltRes.items);
        setEmployees(empRes.items);
      } catch { toast.error('فشل تحميل البيانات'); }
      finally { setLoading(false); }
    })();
  }, [companyId]);

  // Employee lookup map
  const empMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const e of employees) m.set(e.id, e.nameAr);
    return m;
  }, [employees]);

  // Filtered balances
  const filteredBalances = React.useMemo(() => {
    return balances.filter((b) => {
      if (employeeFilter !== 'all' && b.employeeId !== employeeFilter) return false;
      if (leaveTypeFilter !== 'all' && b.leaveTypeId !== leaveTypeFilter) return false;
      return true;
    });
  }, [balances, employeeFilter, leaveTypeFilter]);

  // Group by employee
  const grouped = React.useMemo(() => {
    const m = new Map<string, EmployeeLeaveBalanceResponseDto[]>();
    for (const b of filteredBalances) {
      if (!m.has(b.employeeId)) m.set(b.employeeId, []);
      m.get(b.employeeId)!.push(b);
    }
    // Sort by employee name
    return [...m.entries()].sort((a, b) =>
      (empMap.get(a[0]) ?? '').localeCompare(empMap.get(b[0]) ?? '', 'ar'),
    );
  }, [filteredBalances, empMap]);

  // KPIs
  const totalEmployees = grouped.length;
  const totalBalances = filteredBalances.length;
  const exhausted = filteredBalances.filter((b) => b.remainingDays <= 0).length;

  const handleSaved = (b: EmployeeLeaveBalanceResponseDto) => {
    setBalances((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = b; return n; }
      return [...prev, b];
    });
  };

  const handleDeleted = (id: string) => {
    setBalances((prev) => prev.filter((b) => b.id !== id));
  };

  const openCreate = React.useCallback(() => { setDialogMode({ mode: 'create' }); setFormOpen(true); }, []);
  const openEdit = React.useCallback((b: EmployeeLeaveBalanceResponseDto) => { setDialogMode({ mode: 'edit', balance: b }); setFormOpen(true); }, []);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <Button type="button" variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          إضافة رصيد
        </Button>
      </div>
    ),
    [openCreate],
  );

  const employeeFilterOptions = React.useMemo(
    () => [
      { value: 'all', label: 'كل الموظفين' },
      ...employees.map((emp) => ({ value: emp.id, label: emp.nameAr })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employees.length],
  );

  const leaveTypeFilterOptions = React.useMemo(
    () => [
      { value: 'all', label: 'كل الأنواع' },
      ...leaveTypes.map((lt) => ({ value: lt.id, label: lt.nameAr })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaveTypes.length],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          { id: 'employee', value: employeeFilter, onChange: setEmployeeFilter, placeholder: 'الموظف', options: employeeFilterOptions },
          { id: 'leaveType', value: leaveTypeFilter, onChange: setLeaveTypeFilter, placeholder: 'نوع الإجازة', options: leaveTypeFilterOptions },
        ]}
      />
    ),
    [employeeFilter, leaveTypeFilter, employeeFilterOptions, leaveTypeFilterOptions],
  );

  const deleteEmpName = deleteTarget ? (empMap.get(deleteTarget.employeeId) ?? '—') : '';
  const deleteLtName = deleteTarget ? (leaveTypes.find((t) => t.id === deleteTarget.leaveTypeId)?.nameAr ?? '—') : '';

  return (
    <div className="space-y-5">
      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {balances.length === 0 ? 'لا توجد أرصدة إجازات مسجّلة بعد' : 'لا نتائج تطابق الفلاتر الحالية'}
          </p>
          {balances.length === 0 && (
            <Button type="button" size="sm" variant="outline" onClick={openCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              أضف أول رصيد
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.map(([empId, empBalances]) => (
            <EmployeeBalanceCard
              key={empId}
              employeeId={empId}
              employeeName={empMap.get(empId) ?? empId}
              balances={empBalances}
              leaveTypes={leaveTypes}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <BalanceFormDialog
        open={formOpen}
        dialogMode={dialogMode}
        employees={employees}
        leaveTypes={leaveTypes}
        companyId={companyId}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
      <DeleteDialog
        balance={deleteTarget}
        employeeName={deleteEmpName}
        leaveTypeName={deleteLtName}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
