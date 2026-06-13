'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, Loader2, AlertTriangle, ChevronDown,
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
  type EmployeeLeaveBalanceGroupDto,
  type EmployeeLeaveBalanceResponseDto,
  type EmployeeLeaveBalanceTypeItemDto,
  type CreateLeaveBalanceDto,
} from '@/features/hr/leaves/lib/api/leave-balances';
import type { LeaveTypeResponseDto } from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import {
  leaveTypeNameAr,
  loadCompanyLeaveTypes,
  resolveDefaultLeaveTypeId,
} from '@/features/hr/leaves/lib/leave-types-utils';
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

type DialogMode =
  | { mode: 'create'; employeeId?: string }
  | { mode: 'edit'; balance: EmployeeLeaveBalanceResponseDto };

function BalanceFormDialog({
  open,
  dialogMode,
  employees,
  leaveTypes,
  defaultLeaveTypeId,
  companyId,
  onClose,
  onSaved,
}: {
  open: boolean;
  dialogMode: DialogMode;
  employees: EmployeeResponseDto[];
  leaveTypes: LeaveTypeResponseDto[];
  defaultLeaveTypeId: string | null;
  companyId: string;
  onClose: () => void;
  onSaved: () => void;
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
      setEmployeeId(dialogMode.mode === 'create' ? (dialogMode.employeeId ?? '') : '');
      setLeaveTypeId(defaultLeaveTypeId ?? '');
      setTotalDays('');
      setUsedDays('0');
    }
  }, [open, dialogMode, defaultLeaveTypeId]);

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
      onSaved();
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
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!balance) return;
    setDeleting(true);
    try {
      await leaveBalancesApi.remove(balance.id);
      toast.success('تم حذف الرصيد');
      onDeleted();
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

// ─── Employee group card ───────────────────────────────────────────────────────

function LeaveTypeRow({
  leaveType,
  onEdit,
  onDelete,
}: {
  leaveType: EmployeeLeaveBalanceTypeItemDto;
  onEdit: (balance: EmployeeLeaveBalanceResponseDto) => void;
  onDelete: (balance: EmployeeLeaveBalanceResponseDto) => void;
}) {
  const flat: EmployeeLeaveBalanceResponseDto = {
    id: leaveType.id,
    companyId: '',
    employeeId: '',
    leaveTypeId: leaveType.leaveTypeId,
    usedDays: leaveType.usedDays,
    totalDays: leaveType.totalDays,
    remainingDays: leaveType.remainingDays,
    createdAt: leaveType.createdAt,
    updatedAt: leaveType.updatedAt,
    createdBy: leaveType.createdBy,
    updatedBy: leaveType.updatedBy,
  };

  const p = pct(leaveType.usedDays, leaveType.totalDays);
  const danger = p >= 90;
  const warn = p >= 70;

  return (
    <div className="border-t border-border/50 px-3.5 py-2.5 first:border-t-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-foreground">{leaveType.leaveTypeNameAr}</p>
        <div className="flex shrink-0 gap-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(flat)}
            aria-label="تعديل الرصيد"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(flat)}
            aria-label="حذف الرصيد"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border/60 rounded-lg border border-border/50 bg-muted/20">
        <div className="flex flex-col items-center gap-0 px-2 py-1.5">
          <span className="font-display text-sm font-bold tabular-nums text-foreground" dir="ltr">{leaveType.totalDays}</span>
          <span className="text-[9px] text-muted-foreground">الإجمالي</span>
        </div>
        <div className="flex flex-col items-center gap-0 px-2 py-1.5">
          <span className="font-display text-sm font-bold tabular-nums text-muted-foreground" dir="ltr">{leaveType.usedDays}</span>
          <span className="text-[9px] text-muted-foreground">المستخدم</span>
        </div>
        <div className="flex flex-col items-center gap-0 px-2 py-1.5">
          <span className={cn('font-display text-sm font-bold tabular-nums', danger ? 'text-destructive' : warn ? 'text-amber-500' : 'text-emerald-500')} dir="ltr">
            {leaveType.remainingDays}
          </span>
          <span className="text-[9px] text-muted-foreground">المتبقي</span>
        </div>
      </div>

      <div className="mt-2">
        <BalanceBar used={leaveType.usedDays} total={leaveType.totalDays} color="bg-emerald-500" />
      </div>
    </div>
  );
}

function EmployeeBalanceGroupCard({
  group,
  onEdit,
  onDelete,
  onAddType,
}: {
  group: EmployeeLeaveBalanceGroupDto;
  onEdit: (balance: EmployeeLeaveBalanceResponseDto) => void;
  onDelete: (balance: EmployeeLeaveBalanceResponseDto) => void;
  onAddType: (employeeId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const initials = group.employeeNameAr.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const hue = ((group.employeeId.charCodeAt(0) ?? 0) * 47) % 360;
  const p = pct(group.usedDays, group.totalDays);
  const danger = group.totalDays > 0 && p >= 90;
  const warn = group.totalDays > 0 && p >= 70;

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-3.5 pt-3.5 pb-2.5 text-right transition-colors hover:bg-muted/20"
        aria-expanded={expanded}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `hsl(${hue} 55% 45%)` }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{group.employeeNameAr}</p>
          <p className="text-[10px] text-muted-foreground">{group.leaveTypes.length} نوع إجازة</p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border/60 border-t border-border/60 bg-muted/30">
        <div className="flex flex-col items-center gap-0 px-2 py-2">
          <span className="font-display text-lg font-bold tabular-nums text-foreground" dir="ltr">{group.totalDays}</span>
          <span className="text-[9px] text-muted-foreground">الإجمالي</span>
        </div>
        <div className="flex flex-col items-center gap-0 px-2 py-2">
          <span className="font-display text-lg font-bold tabular-nums text-muted-foreground" dir="ltr">{group.usedDays}</span>
          <span className="text-[9px] text-muted-foreground">المستخدم</span>
        </div>
        <div className="flex flex-col items-center gap-0 px-2 py-2">
          <span className={cn('font-display text-lg font-bold tabular-nums', danger ? 'text-destructive' : warn ? 'text-amber-500' : 'text-emerald-500')} dir="ltr">
            {group.remainingDays}
          </span>
          <span className="text-[9px] text-muted-foreground">المتبقي</span>
        </div>
      </div>

      <div className="px-3.5 py-2">
        <BalanceBar used={group.usedDays} total={group.totalDays} color="bg-primary" />
      </div>

      {expanded && (
        <div className="border-t border-border/50 bg-card/50">
          <div className="flex items-center justify-between border-b border-border/40 px-3.5 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">تفاصيل أنواع الإجازة</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-[10px] text-muted-foreground hover:text-primary"
              onClick={() => onAddType(group.employeeId)}
            >
              <Plus className="h-3 w-3" />
              إضافة نوع
            </Button>
          </div>
          {group.leaveTypes.map((lt) => (
            <LeaveTypeRow
              key={lt.id}
              leaveType={lt}
              onEdit={(balance) => onEdit({ ...balance, employeeId: group.employeeId, companyId: group.companyId })}
              onDelete={(balance) => onDelete({ ...balance, employeeId: group.employeeId, companyId: group.companyId })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [groups, setGroups] = React.useState<EmployeeLeaveBalanceGroupDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeResponseDto[]>([]);
  const [defaultLeaveTypeId, setDefaultLeaveTypeId] = React.useState<string | null>(null);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [employeeFilter, setEmployeeFilter] = React.useState('all');

  const [formOpen, setFormOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<DialogMode>({ mode: 'create' });
  const [deleteTarget, setDeleteTarget] = React.useState<EmployeeLeaveBalanceResponseDto | null>(null);

  const reloadBalances = React.useCallback(async () => {
    if (!companyId) return;
    const balRes = await leaveBalancesApi.getAll({ companyId, limit: 1000 });
    setGroups(balRes.items);
  }, [companyId]);

  // Load all data
  React.useEffect(() => {
    if (!companyId) return;
    void (async () => {
      setLoading(true);
      try {
        const [balRes, ltRes, empRes] = await Promise.all([
          leaveBalancesApi.getAll({ companyId, limit: 1000 }),
          loadCompanyLeaveTypes({ companyId, limit: 200, isActive: true }),
          employeesApi.getAll({ companyId, limit: 1000 }),
        ]);
        setGroups(balRes.items);
        setLeaveTypes(ltRes.items);
        setDefaultLeaveTypeId(ltRes.defaultLeaveTypeId ?? resolveDefaultLeaveTypeId(ltRes.items));
        setEmployees(empRes.items);
      } catch { toast.error('فشل تحميل البيانات'); }
      finally { setLoading(false); }
    })();
  }, [companyId]);

  const filteredGroups = React.useMemo(() => {
    if (employeeFilter === 'all') return groups;
    return groups.filter((g) => g.employeeId === employeeFilter);
  }, [groups, employeeFilter]);

  const handleSaved = async () => {
    await reloadBalances();
  };

  const handleDeleted = async () => {
    await reloadBalances();
  };

  const openCreate = React.useCallback(() => { setDialogMode({ mode: 'create' }); setFormOpen(true); }, []);
  const openEdit = React.useCallback((balance: EmployeeLeaveBalanceResponseDto) => {
    setDialogMode({ mode: 'edit', balance });
    setFormOpen(true);
  }, []);
  const openAddForEmployee = React.useCallback((employeeId: string) => {
    setDialogMode({ mode: 'create', employeeId });
    setFormOpen(true);
  }, []);

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
    [employees],
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

  const deleteEmpName = deleteTarget
    ? (groups.find((g) => g.employeeId === deleteTarget.employeeId)?.employeeNameAr ?? '—')
    : '';
  const deleteLtName = deleteTarget ? leaveTypeNameAr(leaveTypes, deleteTarget.leaveTypeId) : '';

  return (
    <div className="space-y-5">
      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {groups.length === 0 ? 'لا توجد أرصدة إجازات مسجّلة' : 'لا نتائج تطابق الفلاتر الحالية'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => (
            <EmployeeBalanceGroupCard
              key={group.employeeId}
              group={group}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onAddType={openAddForEmployee}
            />
          ))}
        </div>
      )}

      <BalanceFormDialog
        open={formOpen}
        dialogMode={dialogMode}
        employees={employees}
        leaveTypes={leaveTypes}
        defaultLeaveTypeId={defaultLeaveTypeId}
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
