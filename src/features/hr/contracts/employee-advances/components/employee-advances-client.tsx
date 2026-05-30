'use client';

import * as React from 'react';
import { Plus, Banknote, Download } from 'lucide-react';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Badge } from '@/components/ui/badge';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState, SearchableDropdown, MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import {
  useHREmployeeAdvancesStore,
  ADVANCE_STATUS_LABELS,
  ADVANCE_KIND_LABELS,
  REPAYMENT_MODE_LABELS,
  type HREmployeeAdvance,
  type HREmployeeAdvanceKind,
  type HREmployeeAdvanceRepaymentMode,
  type HREmployeeAdvanceStatus,
} from '@/features/hr/contracts/lib/employee-advances-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { cn, formatNumber } from '@/shared/utils';

type StatusFilter = 'all' | HREmployeeAdvanceStatus;

const STATUS_COLORS: Record<HREmployeeAdvanceStatus, string> = {
  outstanding: 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30',
  repaid: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  cancelled: 'text-muted-foreground border-border bg-muted/40',
};

type DraftForm = {
  employeeId: string;
  employeeNameAr: string;
  amount: string;
  currency: string;
  advanceDate: string;
  note: string;
  status: HREmployeeAdvanceStatus;
  advanceKind: HREmployeeAdvanceKind;
  repaymentMode: HREmployeeAdvanceRepaymentMode;
  repaymentMonths: string;
  monthlyInstallment: string;
};

const EMPTY_FORM: DraftForm = {
  employeeId: '', employeeNameAr: '', amount: '', currency: 'SAR',
  advanceDate: new Date().toISOString().slice(0, 10), note: '', status: 'outstanding',
  advanceKind: 'personal',
  repaymentMode: 'by_months',
  repaymentMonths: '12',
  monthlyInstallment: '',
};

function repaymentLine(x: HREmployeeAdvance): string {
  if (x.repaymentMode === 'by_months' && x.repaymentMonths != null && x.repaymentMonths > 0) {
    const per = x.amount / x.repaymentMonths;
    return `${x.repaymentMonths} شهر · ≈ ${formatNumber(Math.round(per * 100) / 100)} ${x.currency}/شهر`;
  }
  if (x.repaymentMode === 'by_monthly_amount' && x.monthlyInstallmentAmount != null && x.monthlyInstallmentAmount > 0) {
    const approxMonths = Math.ceil(x.amount / x.monthlyInstallmentAmount);
    return `${formatNumber(x.monthlyInstallmentAmount)} ${x.currency}/شهر · ~${approxMonths} شهر`;
  }
  return '—';
}

export function EmployeeAdvancesClient() {
  const { items, add, update, remove, fetch: fetchAdvances } = useHREmployeeAdvancesStore();
  const allEmployees = useHREmployeeDirectoryStore(s => s.employees);
  const employees = React.useMemo(() => allEmployees.filter(e => e.status === 'active'), [allEmployees]);

  const empOptions = React.useMemo(() =>
    employees.map(e => ({ value: e.id, label: e.nameAr })),
    [employees],
  );

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const x of items) map.set(x.employeeId, x.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [items]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  // Debounce ref for backend fetch on filter changes
  const fetchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;
    const status = statusFilter !== 'all' ? statusFilter : undefined;
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    fetchDebounceRef.current = setTimeout(() => {
      fetchAdvances({ employeeId, status });
    }, 400);
    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    };
  }, [selectedEmpIds, statusFilter]);

  const advanceStatusCounts = React.useMemo((): Record<string, number> => ({
    all: items.length,
    outstanding: items.filter((x) => x.status === 'outstanding').length,
    repaid: items.filter((x) => x.status === 'repaid').length,
    cancelled: items.filter((x) => x.status === 'cancelled').length,
  }), [items]);

  const filtered = React.useMemo(
    () => [...items].sort((a, b) => b.advanceDate.localeCompare(a.advanceDate)),
    [items],
  );

  const total = filtered.length;

  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM); setError(null); setDrawerOpen(true);
  };
  const openEdit = (id: string) => {
    const x = items.find(i => i.id === id);
    if (!x) return;
    setEditId(id);
    setForm({
      employeeId: x.employeeId, employeeNameAr: x.employeeNameAr,
      amount: String(x.amount), currency: x.currency,
      advanceDate: x.advanceDate, note: x.note, status: x.status,
      advanceKind: x.advanceKind,
      repaymentMode: x.repaymentMode,
      repaymentMonths: x.repaymentMonths != null ? String(x.repaymentMonths) : '12',
      monthlyInstallment: x.monthlyInstallmentAmount != null ? String(x.monthlyInstallmentAmount) : '',
    });
    setError(null); setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!form.employeeId) { setError('اختر الموظف'); return; }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setError('المبلغ يجب أن يكون أكبر من صفر'); return; }
    if (!form.advanceDate) { setError('تاريخ السلفة مطلوب'); return; }
    let repaymentMonths: number | null = null;
    let monthlyInstallmentAmount: number | null = null;
    if (form.repaymentMode === 'by_months') {
      const m = parseInt(form.repaymentMonths, 10);
      if (!Number.isFinite(m) || m < 1 || m > 600) {
        setError('أدخل عدد أشهر صحيحاً (1–600)');
        return;
      }
      repaymentMonths = m;
    } else {
      const inst = parseFloat(form.monthlyInstallment);
      if (!form.monthlyInstallment.trim() || Number.isNaN(inst) || inst <= 0) {
        setError('أدخل مبلغ القسط الشهري');
        return;
      }
      if (inst > amount) {
        setError('المبلغ الشهري لا يجوز أن يتجاوز إجمالي السلفة');
        return;
      }
      monthlyInstallmentAmount = inst;
    }
    const payload = {
      employeeId: form.employeeId, employeeNameAr: form.employeeNameAr,
      amount, currency: form.currency,
      advanceDate: form.advanceDate, note: form.note, status: form.status,
      advanceKind: form.advanceKind,
      repaymentMode: form.repaymentMode,
      repaymentMonths,
      monthlyInstallmentAmount,
    };
    if (editId) { update(editId, payload); } else { add(payload); }
    setDrawerOpen(false);
  };

  const patch = (p: Partial<DraftForm>) => setForm(f => ({ ...f, ...p }));

  const handleEmployeeSelect = (id: string) => {
    const emp = employees.find(e => e.id === id);
    patch({ employeeId: id, employeeNameAr: emp?.nameAr ?? '' });
  };

  const downloadCsv = () => {
    const rows = [['الموظف', 'المبلغ', 'العملة', 'نوع السلفة', 'آلية القسط', 'عدد الأشهر', 'القسط الشهري', 'التاريخ', 'الحالة', 'ملاحظة']];
    filtered.forEach(x => rows.push([
      x.employeeNameAr,
      String(x.amount),
      x.currency,
      ADVANCE_KIND_LABELS[x.advanceKind],
      REPAYMENT_MODE_LABELS[x.repaymentMode],
      x.repaymentMonths != null ? String(x.repaymentMonths) : '',
      x.monthlyInstallmentAmount != null ? String(x.monthlyInstallmentAmount) : '',
      x.advanceDate,
      ADVANCE_STATUS_LABELS[x.status],
      x.note,
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = 'employee-advances.csv'; a.click();
  };

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          سلفة جديدة
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        statusOrder={['outstanding', 'repaid', 'cancelled']}
        statusLabels={{
          outstanding: ADVANCE_STATUS_LABELS.outstanding,
          repaid: ADVANCE_STATUS_LABELS.repaid,
          cancelled: ADVANCE_STATUS_LABELS.cancelled,
        }}
        statusCounts={advanceStatusCounts}
        onDateBoundsChange={() => {}}
        trailingActions={filtered.length > 0 ? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={downloadCsv}>
            <Download className="h-3.5 w-3.5" />تصدير
          </Button>
        ) : undefined}
      />
    ),
    [
      statusFilter,
      selectedEmpKey,
      advanceStatusCounts.all,
      advanceStatusCounts.outstanding,
      advanceStatusCounts.repaid,
      advanceStatusCounts.cancelled,
      filtered.length,
      empPickerList,
    ],
  );

  return (
    <>
      <SetPageTitle titleAr="سلف الموظفين" descriptionAr="تسجيل وإدارة سلف الموظفين واسترداداتها." iconName="Banknote" />

      <p className="text-sm text-muted-foreground">{total} سلفة</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Banknote} title="لا توجد سلف" description="أضف سلفة جديدة لموظف للبدء." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(x => (
            <div
              key={x.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
              onClick={() => openEdit(x.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{x.employeeNameAr}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{x.advanceDate}</p>
                </div>
                <Badge variant="outline" className={cn('shrink-0 text-[10px]', STATUS_COLORS[x.status])}>
                  {ADVANCE_STATUS_LABELS[x.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {ADVANCE_KIND_LABELS[x.advanceKind]}
                </Badge>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-center">
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {formatNumber(x.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground">{x.currency}</p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{repaymentLine(x)}</p>
              </div>
              {x.note && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">{x.note}</p>
              )}
              <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(x.id)}>تعديل</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmId(x.id)}>حذف</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل السلفة' : 'سلفة جديدة'}
        onSave={handleSave} error={error}
      >
        <FormField label="الموظف" required>
          <SearchableDropdown
            value={form.employeeId}
            onChange={handleEmployeeSelect}
            options={empOptions}
            placeholder="اختر الموظف…"
          />
        </FormField>
        <FormField label="المبلغ" required>
          <Input type="number" min="0" value={form.amount} onChange={e => patch({ amount: e.target.value })} placeholder="0" />
        </FormField>
        <FormField label="نوع السلفة" required>
          <MinimalDropdown
            value={form.advanceKind}
            onChange={v => patch({ advanceKind: v as HREmployeeAdvanceKind })}
            options={Object.entries(ADVANCE_KIND_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </FormField>
        <FormField label="آلية حساب القسط الشهري" span2>
          <MinimalDropdown
            value={form.repaymentMode}
            onChange={v => patch({ repaymentMode: v as HREmployeeAdvanceRepaymentMode })}
            options={Object.entries(REPAYMENT_MODE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          {form.repaymentMode === 'by_months' ? (
            <div className="mt-2 space-y-1">
              <p className="text-[11px] text-muted-foreground">يُقسَّط إجمالي السلفة على عدد الأشهر التي تدخلها.</p>
              <Input
                type="number"
                min={1}
                max={600}
                className="max-w-[10rem]"
                value={form.repaymentMonths}
                onChange={e => patch({ repaymentMonths: e.target.value })}
                placeholder="مثال: 12"
              />
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="text-[11px] text-muted-foreground">يُخصم شهرياً المبلغ التالي حتى اكتمال السداد.</p>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="max-w-[10rem]"
                value={form.monthlyInstallment}
                onChange={e => patch({ monthlyInstallment: e.target.value })}
                placeholder="مبلغ القسط"
              />
            </div>
          )}
        </FormField>
        <FormField label="العملة">
          <MinimalDropdown
            value={form.currency}
            onChange={v => patch({ currency: v })}
            options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }]}
          />
        </FormField>
        <FormField label="تاريخ السلفة" required>
          <DatePickerInput value={form.advanceDate} onChange={(ymd) => patch({ advanceDate: ymd })} />
        </FormField>
        <FormField label="الحالة">
          <MinimalDropdown
            value={form.status}
            onChange={v => patch({ status: v as HREmployeeAdvanceStatus })}
            options={[
              { value: 'outstanding', label: ADVANCE_STATUS_LABELS.outstanding },
              { value: 'repaid', label: ADVANCE_STATUS_LABELS.repaid },
              { value: 'cancelled', label: ADVANCE_STATUS_LABELS.cancelled },
            ]}
          />
        </FormField>
        <FormField label="ملاحظة" span2>
          <Input value={form.note} onChange={e => patch({ note: e.target.value })} placeholder="ملاحظة اختيارية…" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!confirmId}
        onOpenChange={v => { if (!v) setConfirmId(null); }}
        title="حذف السلفة"
        description="هل أنت متأكد من حذف هذا السجل؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={() => { if (confirmId) { remove(confirmId); setConfirmId(null); } }}
      />
    </>
  );
}
