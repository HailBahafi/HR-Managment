'use client';

import * as React from 'react';
import { Link2, Plus, Search, Trash2, Users, MapPin, CalendarDays, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAttendanceStore } from '@/lib/attendance/store';
import { data } from '@/lib/data';
import type { ContractStatus, ContractType } from '@/types';
import { cn } from '@/lib/utils';

type DataEmployee = (typeof data.employees)[number];

const ALL_DEPARTMENTS = 'all';

const CONTRACT_STATUS_AR: Record<ContractStatus, string> = {
  active: 'نشط على رأس العمل ساري التوظيف',
  suspended: 'موقوف معلق إيقاف',
  ended: 'منتهي انتهاء',
};

const CONTRACT_TYPE_AR: Record<ContractType, string> = {
  permanent: 'دائم',
  temporary: 'مؤقت',
  'part-time': 'دوام جزئي',
  contract: 'عقد عمل',
};

function employeeSearchHaystack(e: DataEmployee): string {
  const branch = data.branches.find((b) => b.id === e.branchId);
  const dept = data.departments.find((d) => d.id === e.departmentId);
  const ext = e as DataEmployee & {
    openStream?: string;
    village?: string;
    district?: string;
    city?: string;
    neighborhood?: string;
  };
  const addressTokens = (e.address ?? '')
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const st = e.contractStatus as ContractStatus;
  const ct = e.contractType as ContractType;
  return [
    e.name,
    e.employeeCode,
    e.email,
    e.phone,
    e.nationality,
    e.position,
    e.address,
    e.nationalId,
    e.contractStatus,
    CONTRACT_STATUS_AR[st] ?? '',
    e.contractType,
    CONTRACT_TYPE_AR[ct] ?? '',
    branch?.name,
    branch?.city,
    dept?.name,
    ext.openStream,
    ext.village,
    ext.district,
    ext.city,
    ext.neighborhood,
    ...addressTokens,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function CheckpointLinksPanel() {
  const checkpointLinks = useAttendanceStore((s) => s.checkpointLinks);
  const checkpoints = useAttendanceStore((s) => s.checkpoints);
  const addCheckpointLinkBatch = useAttendanceStore((s) => s.addCheckpointLinkBatch);
  const removeCheckpointLinkBatch = useAttendanceStore((s) => s.removeCheckpointLinkBatch);

  const [open, setOpen] = React.useState(false);
  const [eff, setEff] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [empSel, setEmpSel] = React.useState<Set<string>>(new Set());
  const [cpSel, setCpSel] = React.useState<Set<string>>(new Set());
  const [eq, setEq] = React.useState('');
  const [cq, setCq] = React.useState('');
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = React.useState(ALL_DEPARTMENTS);

  const batches = React.useMemo(() => {
    const m = new Map<string, typeof checkpointLinks>();
    for (const l of checkpointLinks) {
      const k = l.batchId ?? l.id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    }
    return [...m.entries()].map(([batchId, rows]) => ({
      batchId,
      rows,
      eff: rows[0]?.effectiveFrom,
    }));
  }, [checkpointLinks]);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    set((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const openBatchDialog = () => {
    setEff(new Date().toISOString().slice(0, 10));
    setEmpSel(new Set());
    setCpSel(new Set());
    setEq('');
    setCq('');
    setEmployeeDepartmentFilter(ALL_DEPARTMENTS);
    setOpen(true);
  };

  const submit = () => {
    if (empSel.size === 0 || cpSel.size === 0) return;
    const pairs: { employeeId: string; checkInPointId: string }[] = [];
    for (const e of empSel) {
      for (const c of cpSel) {
        pairs.push({ employeeId: e, checkInPointId: c });
      }
    }
    addCheckpointLinkBatch({ effectiveFrom: eff, pairs });
    setOpen(false);
    setEmpSel(new Set());
    setCpSel(new Set());
  };

  const employeesFiltered = React.useMemo(() => {
    const base =
      employeeDepartmentFilter === ALL_DEPARTMENTS
        ? data.employees
        : data.employees.filter((e) => e.departmentId === employeeDepartmentFilter);
    const q = eq.trim().toLowerCase();
    if (!q) return base;
    return base.filter((e) => employeeSearchHaystack(e).includes(q));
  }, [eq, employeeDepartmentFilter]);

  React.useEffect(() => {
    const allowed = new Set(employeesFiltered.map((e) => e.id));
    setEmpSel((prev) => {
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [employeesFiltered]);

  const cps = React.useMemo(() => {
    const q = cq.trim().toLowerCase();
    if (!q) return checkpoints;
    return checkpoints.filter((c) => {
      const blob = [c.nameAr, String(c.latitude), String(c.longitude)].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [checkpoints, cq]);

  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  return (
    <div className="space-y-5">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="number-ar font-semibold text-foreground">{batches.length}</span> دفعة ربط
          </p>
        </div>
        <Button variant="luxe" className="gap-2" type="button" onClick={openBatchDialog}>
          <Plus className="h-4 w-4" /> ربط نقاط بموظفين
        </Button>
      </div>

      {/* ── Empty state ── */}
      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/50 bg-muted/10 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Link2 className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">لا توجد دفعات ربط بعد</p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">اضغط «ربط نقاط بموظفين» لإنشاء أول دفعة</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openBatchDialog}>
            <Plus className="h-3.5 w-3.5" /> إنشاء دفعة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {batches.map(({ batchId, rows, eff: efd }) => {
            const empIds = [...new Set(rows.map((r) => r.employeeId))];
            const cpIds  = [...new Set(rows.map((r) => r.checkInPointId))];
            const emps   = empIds.map((id) => data.employees.find((e) => e.id === id)).filter(Boolean) as (typeof data.employees)[number][];
            const cpoints = cpIds.map((id) => checkpoints.find((c) => c.id === id)).filter(Boolean) as (typeof checkpoints)[number][];
            const overflowEmps = Math.max(0, emps.length - 3);
            return (
              <div
                key={batchId}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
              >
                {/* coloured accent strip */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                <div className="p-5">
                  {/* top row */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Link2 className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="subtle" className="gap-1 text-[10px]">
                        <Users className="h-3 w-3" />
                        <span className="number-ar">{empIds.length}</span>
                      </Badge>
                      <Badge variant="subtle" className="gap-1 text-[10px]">
                        <MapPin className="h-3 w-3" />
                        <span className="number-ar">{cpIds.length}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* employee avatars */}
                  <div className="mb-3 flex items-center gap-0">
                    {emps.slice(0, 3).map((e, i) => (
                      <div
                        key={e.id}
                        title={e.name}
                        className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground"
                        style={{ marginRight: i > 0 ? '-8px' : undefined, zIndex: 3 - i }}
                      >
                        {(e as DataEmployee & { avatar?: string }).avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={(e as DataEmployee & { avatar?: string }).avatar} alt={e.name} className="h-full w-full object-cover" />
                        ) : (
                          e.name.slice(0, 1)
                        )}
                      </div>
                    ))}
                    {overflowEmps > 0 && (
                      <div
                        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground"
                        style={{ marginRight: '-8px', zIndex: 0 }}
                      >
                        +{overflowEmps}
                      </div>
                    )}
                  </div>

                  {/* checkpoint names */}
                  <div className="mb-4 space-y-1">
                    {cpoints.slice(0, 2).map((cp) => (
                      <div key={cp.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-gold" />
                        <span className="truncate">{cp.nameAr}</span>
                      </div>
                    ))}
                    {cpoints.length > 2 && (
                      <p className="text-[11px] text-muted-foreground/60">+{cpoints.length - 2} نقاط أخرى</p>
                    )}
                  </div>

                  {/* footer */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="font-mono tabular-nums" dir="ltr">{efd ?? '—'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(batchId)}
                    >
                      <Trash2 className="h-3 w-3" /> حذف
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create batch dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-3xl">
          {/* dialog header */}
          <DialogHeader className="border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">ربط نقاط بموظفين</DialogTitle>
                <DialogDescription className="text-xs">
                  اختر الموظفين ونقاط التسجيل لإنشاء روابط الحضور دفعةً واحدة
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* date + body */}
          <div className="flex flex-1 flex-col gap-0 overflow-hidden">
            {/* effective date row */}
            <div className="flex items-center gap-4 border-b border-border bg-muted/20 px-6 py-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Label className="shrink-0 text-sm">ساري من</Label>
              <div className="w-44">
                <SingleDatePicker value={eff} onChange={setEff} />
              </div>
              {empSel.size > 0 && cpSel.size > 0 && (
                <div className="mr-auto flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="number-ar">{empSel.size * cpSel.size}</span> رابط سيُنشأ
                </div>
              )}
            </div>

            {/* two-column selector */}
            <div className="grid flex-1 grid-cols-2 divide-x divide-x-reverse divide-border overflow-hidden">

              {/* ── Employees column ── */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">الموظفون</span>
                    {empSel.size > 0 && (
                      <Badge variant="subtle" className="number-ar text-[10px]">{empSel.size} محدد</Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => {
                      const allIds = new Set(employeesFiltered.slice(0, 120).map((e) => e.id));
                      const allSelected = [...allIds].every((id) => empSel.has(id));
                      setEmpSel(allSelected ? new Set() : allIds);
                    }}
                  >
                    {[...employeesFiltered.slice(0, 120).map((e) => e.id)].every((id) => empSel.has(id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                  </button>
                </div>

                <div className="space-y-2 border-b border-border px-3 py-2.5">
                  <Select value={employeeDepartmentFilter} onValueChange={setEmployeeDepartmentFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="كل الأقسام" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_DEPARTMENTS}>كل الأقسام</SelectItem>
                      {data.departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={eq}
                      onChange={(e) => setEq(e.target.value)}
                      placeholder="اسم، رقم، قسم…"
                      className="h-8 bg-background pr-8 text-xs"
                      aria-label="بحث في قائمة الموظفين"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                  {employeesFiltered.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">لا يوجد موظف مطابق</p>
                  ) : (
                    employeesFiltered.slice(0, 120).map((e) => {
                      const dept = data.departments.find((d) => d.id === e.departmentId);
                      const st   = e.contractStatus as ContractStatus;
                      const sel  = empSel.has(e.id);
                      const emp  = e as DataEmployee & { avatar?: string };
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => toggle(setEmpSel, e.id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-xs transition-colors',
                            sel ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
                          )}
                        >
                          <div className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                            sel ? 'border-primary bg-primary' : 'border-border',
                          )}>
                            {sel && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {emp.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={emp.avatar} alt={e.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold">{e.name.slice(0, 1)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{e.name}</p>
                            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span className="font-mono" dir="ltr">{e.employeeCode}</span>
                              {dept?.name && <span>· {dept.name}</span>}
                            </p>
                          </div>
                          <Badge
                            variant={st === 'active' ? 'success' : st === 'suspended' ? 'warning' : 'secondary'}
                            className="shrink-0 px-1.5 py-0 text-[9px]"
                          >
                            {CONTRACT_STATUS_AR[st]?.split(' ')[0] ?? st}
                          </Badge>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Checkpoints column ── */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-amber-500/5 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold">نقاط التسجيل</span>
                    {cpSel.size > 0 && (
                      <Badge variant="subtle" className="number-ar text-[10px]">{cpSel.size} محدد</Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-amber-600 hover:underline"
                    onClick={() => {
                      const allIds = new Set(cps.map((c) => c.id));
                      const allSelected = [...allIds].every((id) => cpSel.has(id));
                      setCpSel(allSelected ? new Set() : allIds);
                    }}
                  >
                    {cps.every((c) => cpSel.has(c.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                  </button>
                </div>

                <div className="border-b border-border px-3 py-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={cq}
                      onChange={(e) => setCq(e.target.value)}
                      placeholder="اسم النقطة أو الإحداثيات…"
                      className="h-8 bg-background pr-8 text-xs"
                      aria-label="بحث في قائمة نقاط التسجيل"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                  {cps.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">لا توجد نقطة مطابقة</p>
                  ) : (
                    cps.map((c) => {
                      const sel = cpSel.has(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggle(setCpSel, c.id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-xs transition-colors',
                            sel ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'hover:bg-muted/50',
                          )}
                        >
                          <div className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                            sel ? 'border-amber-500 bg-amber-500' : 'border-border',
                          )}>
                            {sel && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            sel ? 'bg-amber-500/20' : 'bg-muted',
                          )}>
                            <MapPin className={cn('h-4 w-4', sel ? 'text-amber-500' : 'text-muted-foreground')} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{c.nameAr}</p>
                            <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                              {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

            </div>{/* end two-column grid */}
          </div>{/* end body */}

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
            <div className="text-xs text-muted-foreground">
              {empSel.size > 0 && cpSel.size > 0 ? (
                <span>
                  <span className="number-ar font-semibold text-foreground">{empSel.size}</span> موظف
                  {' × '}
                  <span className="number-ar font-semibold text-foreground">{cpSel.size}</span> نقطة
                  {' = '}
                  <span className="number-ar font-semibold text-primary">{empSel.size * cpSel.size}</span> رابط
                </span>
              ) : (
                <span>اختر موظفين ونقاط لإنشاء الروابط</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button
                variant="luxe"
                type="button"
                onClick={submit}
                disabled={empSel.size === 0 || cpSel.size === 0}
              >
                <Link2 className="h-4 w-4" /> إنشاء الدفعة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف دفعة الربط
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              هل أنت متأكد من حذف كل عناصر هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteTarget) { removeCheckpointLinkBatch(deleteTarget); setDeleteTarget(null); } }}
            >
              <Trash2 className="h-4 w-4" /> حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
