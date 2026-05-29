'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, Loader2, AlertTriangle, Search, ChevronDown, ChevronRight,
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

// ─── Employee balance row ─────────────────────────────────────────────────────

const LEAVE_TYPE_COLORS = [
  'bg-primary', 'bg-success', 'bg-warning', 'bg-blue-500',
  'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
];

function EmployeeBalanceRow({
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
  const [expanded, setExpanded] = React.useState(false);
  const totalUsed = balances.reduce((s, b) => s + b.usedDays, 0);
  const totalAlloc = balances.reduce((s, b) => s + b.totalDays, 0);
  const initials = employeeName.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const hue = ((employeeId.charCodeAt(0) ?? 0) * 47) % 360;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Employee header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/30"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `hsl(${hue} 55% 45%)` }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{employeeName}</p>
          <p className="text-[11px] text-muted-foreground">
            {balances.length} نوع إجازة · {totalUsed}/{totalAlloc} يوم مستخدم
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {totalAlloc > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full bg-primary transition-all',
                    pct(totalUsed, totalAlloc) >= 90 ? 'bg-destructive' :
                    pct(totalUsed, totalAlloc) >= 70 ? 'bg-warning' : 'bg-primary'
                  )}
                  style={{ width: `${pct(totalUsed, totalAlloc)}%` }}
                />
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground" dir="ltr">
                {pct(totalUsed, totalAlloc)}%
              </span>
            </div>
          )}
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded leave type rows */}
      {expanded && (
        <div className="border-t border-border/60 divide-y divide-border/40">
          {balances.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">لا توجد أرصدة مسجّلة</p>
          ) : (
            balances.map((b, idx) => {
              const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
              const color = LEAVE_TYPE_COLORS[idx % LEAVE_TYPE_COLORS.length] ?? 'bg-primary';
              const remaining = b.remainingDays;
              return (
                <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={cn('h-3 w-3 shrink-0 rounded-sm', color)} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{lt?.nameAr ?? b.leaveTypeId}</span>
                      {remaining <= 2 && remaining >= 0 && (
                        <Badge variant="outline" className="h-4 border-destructive/40 bg-destructive/5 px-1.5 text-[9px] text-destructive">
                          {remaining === 0 ? 'استُنفد' : `${remaining} يوم متبقي`}
                        </Badge>
                      )}
                    </div>
                    <BalanceBar used={b.usedDays} total={b.totalDays} color={color} />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums" dir="ltr">
                      {b.remainingDays} متبقي
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => onEdit(b)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(b)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
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

  const [search, setSearch] = React.useState('');
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
      if (leaveTypeFilter !== 'all' && b.leaveTypeId !== leaveTypeFilter) return false;
      if (search.trim()) {
        const name = empMap.get(b.employeeId) ?? '';
        if (!name.includes(search.trim())) return false;
      }
      return true;
    });
  }, [balances, leaveTypeFilter, search, empMap]);

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

  const openCreate = () => { setDialogMode({ mode: 'create' }); setFormOpen(true); };
  const openEdit = (b: EmployeeLeaveBalanceResponseDto) => { setDialogMode({ mode: 'edit', balance: b }); setFormOpen(true); };

  const deleteEmpName = deleteTarget ? (empMap.get(deleteTarget.employeeId) ?? '—') : '';
  const deleteLtName = deleteTarget ? (leaveTypes.find((t) => t.id === deleteTarget.leaveTypeId)?.nameAr ?? '—') : '';

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الموظف..."
            className="h-9 ps-9 text-sm"
          />
        </div>
        <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue placeholder="نوع الإجازة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {leaveTypes.map((lt) => (
              <SelectItem key={lt.id} value={lt.id}>{lt.nameAr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          إضافة رصيد
        </Button>
      </div>

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
            <EmployeeBalanceRow
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
