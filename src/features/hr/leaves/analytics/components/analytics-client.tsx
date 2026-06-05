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

function EmployeeBalanceCard({
  employeeId,
  employeeName,
  balance,
  onEdit,
  onDelete,
}: {
  employeeId: string;
  employeeName: string;
  balance: EmployeeLeaveBalanceResponseDto;
  onEdit: (b: EmployeeLeaveBalanceResponseDto) => void;
  onDelete: (b: EmployeeLeaveBalanceResponseDto) => void;
}) {
  const initials = employeeName.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const hue = ((employeeId.charCodeAt(0) ?? 0) * 47) % 360;
  const used = balance.usedDays;
  const total = balance.totalDays;
  const remaining = balance.remainingDays;
  const p = pct(used, total);
  const danger = p >= 90;
  const warn = p >= 70;

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3.5 pb-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: `hsl(${hue} 55% 45%)` }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight">{employeeName}</p>
          <p className="text-[10px] text-muted-foreground">إجازة سنوية</p>
        </div>
        <div className="flex shrink-0 gap-0 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => onEdit(balance)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onDelete(balance)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border/60 border-t border-border/60 bg-muted/30">
        <div className="flex flex-col items-center gap-0 px-2 py-2">
          <span className="font-display text-base font-bold tabular-nums text-foreground" dir="ltr">{total}</span>
          <span className="text-[9px] text-muted-foreground">الإجمالي</span>
        </div>
        <div className="flex flex-col items-center gap-0 px-2 py-2">
          <span className="font-display text-base font-bold tabular-nums text-muted-foreground" dir="ltr">{used}</span>
          <span className="text-[9px] text-muted-foreground">المستخدم</span>
        </div>
        <div className="flex flex-col items-center gap-0 px-2 py-2">
          <span className={cn('font-display text-base font-bold tabular-nums', danger ? 'text-destructive' : warn ? 'text-amber-500' : 'text-emerald-500')} dir="ltr">
            {remaining}
          </span>
          <span className="text-[9px] text-muted-foreground">المتبقي</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3.5 py-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all duration-500', danger ? 'bg-destructive' : warn ? 'bg-amber-500' : 'bg-emerald-500')}
            style={{ width: `${p}%` }}
          />
        </div>
        <p className="mt-1 text-[9px] text-muted-foreground">{p}% مستخدم</p>
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

  // Annual leave type id
  const annualLeaveTypeId = React.useMemo(
    () => leaveTypes.find((lt) => lt.nameAr === 'إجازة سنوية')?.id ?? null,
    [leaveTypes],
  );

  // Filtered balances — only إجازة سنوية
  const filteredBalances = React.useMemo(() => {
    return balances.filter((b) => {
      if (annualLeaveTypeId && b.leaveTypeId !== annualLeaveTypeId) return false;
      if (employeeFilter !== 'all' && b.employeeId !== employeeFilter) return false;
      return true;
    });
  }, [balances, annualLeaveTypeId, employeeFilter]);

  // One balance per employee (annual leave only)
  const grouped = React.useMemo(() => {
    return filteredBalances
      .slice()
      .sort((a, b) => (empMap.get(a.employeeId) ?? '').localeCompare(empMap.get(b.employeeId) ?? '', 'ar'));
  }, [filteredBalances, empMap]);

  // KPIs
  const totalEmployees = grouped.length;
  const exhausted = grouped.filter((b) => b.remainingDays <= 0).length;

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

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          { id: 'employee', value: employeeFilter, onChange: setEmployeeFilter, placeholder: 'الموظف', options: employeeFilterOptions },
        ]}
      />
    ),
    [employeeFilter, employeeFilterOptions],
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grouped.map((b) => (
            <EmployeeBalanceCard
              key={b.id}
              employeeId={b.employeeId}
              employeeName={empMap.get(b.employeeId) ?? b.employeeId}
              balance={b}
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
