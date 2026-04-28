'use client';

import * as React from 'react';
import { Link2, Plus, Search, Trash2, Users } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="luxe" className="gap-2" type="button" onClick={openBatchDialog}>
          <Plus className="h-4 w-4" />
          دفعة ربط
        </Button>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <Link2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد دفعات ربط بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {batches.map(({ batchId, rows, eff: efd }) => (
            <div
              key={batchId}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Link2 className="h-5 w-5" />
                </div>
                <Badge variant="subtle" className="gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  <span className="number-ar">{rows.length}</span>
                </Badge>
              </div>

              {/* Batch ID */}
              <h3 className="font-display text-sm font-bold leading-snug mb-1 group-hover:text-primary transition-colors">
                دفعة ربط
              </h3>
              <p className="font-mono text-[11px] text-muted-foreground mb-4 truncate" dir="ltr">
                <Link2 className="inline h-3 w-3 ml-1" />
                {batchId.slice(0, 20)}…
              </p>

              {/* Footer */}
              <div
                className="flex items-center justify-between border-t border-border/60 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">{efd ?? '—'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => { if (window.confirm('حذف كل عناصر هذه الدفعة؟')) removeCheckpointLinkBatch(batchId); }}
                >
                  <Trash2 className="h-3 w-3" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">دفعة ربط</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ساري من</Label>
              <SingleDatePicker value={eff} onChange={setEff} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>تصفية حسب القسم</Label>
                <Select value={employeeDepartmentFilter} onValueChange={setEmployeeDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="كل الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_DEPARTMENTS}>كل الأقسام</SelectItem>
                    {data.departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label>بحث موظفين</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={eq}
                    onChange={(e) => setEq(e.target.value)}
                    placeholder="اسم، رقم، قسم، حالة العقد (نشط، موقوف…)…"
                    className="bg-background pr-9"
                    aria-label="بحث في قائمة الموظفين"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border border-border p-1 space-y-0.5">
                  {employeesFiltered.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">لا يوجد موظف مطابق</p>
                  ) : (
                    employeesFiltered.slice(0, 120).map((e) => {
                      const dept = data.departments.find((d) => d.id === e.departmentId);
                      const st = e.contractStatus as ContractStatus;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => toggle(setEmpSel, e.id)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-right text-xs',
                            empSel.has(e.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
                          )}
                        >
                          <div className="min-w-0 flex-1 text-right">
                            <p className="truncate font-medium">{e.name}</p>
                            <p className="mt-0.5 flex flex-wrap items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                              <span className="font-mono tabular-nums" dir="ltr">
                                {e.employeeCode}
                              </span>
                              {dept?.name ? <span className="truncate">· {dept.name}</span> : null}
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
                <p className="text-[10px] text-muted-foreground">
                  محدد: <span className="number-ar">{empSel.size}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label>بحث نقاط</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={cq}
                    onChange={(e) => setCq(e.target.value)}
                    placeholder="اسم النقطة أو الإحداثيات…"
                    className="bg-background pr-9"
                    aria-label="بحث في قائمة نقاط التسجيل"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border border-border p-1 space-y-0.5">
                  {cps.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">لا توجد نقطة مطابقة</p>
                  ) : (
                    cps.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(setCpSel, c.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded px-2 py-1.5 text-right text-xs',
                          cpSel.has(c.id) ? 'bg-gold/15 text-gold' : 'hover:bg-muted/50',
                        )}
                      >
                        <span className="min-w-0 truncate">{c.nameAr}</span>
                      </button>
                    ))
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  محدد: <span className="number-ar">{cpSel.size}</span>
                </p>
              </div>
            </div>
            <p className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
              الروابط الناتجة:{' '}
              <span className="number-ar font-semibold text-foreground">{empSel.size * cpSel.size}</span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button variant="luxe" type="button" onClick={submit} disabled={empSel.size === 0 || cpSel.size === 0}>
              إنشاء الدفعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
