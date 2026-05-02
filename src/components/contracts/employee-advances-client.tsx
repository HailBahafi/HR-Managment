'use client';

import * as React from 'react';
import { Plus, Banknote, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SetPageTitle } from '@/components/set-page-title';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState, SearchableDropdown, MinimalDropdown,
} from '@/components/hr-requests/shared-ui';
import {
  useHREmployeeAdvancesStore, ADVANCE_STATUS_LABELS,
  type HREmployeeAdvanceStatus,
} from '@/lib/contracts/employee-advances-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import { cn, formatNumber } from '@/lib/utils';

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
};

const EMPTY_FORM: DraftForm = {
  employeeId: '', employeeNameAr: '', amount: '', currency: 'SAR',
  advanceDate: new Date().toISOString().slice(0, 10), note: '', status: 'outstanding',
};

export function EmployeeAdvancesClient() {
  const { items, add, update, remove } = useHREmployeeAdvancesStore();
  const allEmployees = useHREmployeeDirectoryStore(s => s.employees);
  const employees = React.useMemo(() => allEmployees.filter(e => e.status === 'active'), [allEmployees]);

  const empOptions = React.useMemo(() =>
    employees.map(e => ({ value: e.id, label: e.nameAr })),
    [employees],
  );

  const { values } = usePageFilters([
    { key: 'q', label: 'بحث', type: 'text', placeholder: 'بحث باسم الموظف…' },
  ]);

  const q = ((values.q as string) ?? '').toLowerCase();
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

  const narrowedForStatus = React.useMemo(
    () =>
      items.filter((x) => {
        const matchQ = !q || x.employeeNameAr.includes(q) || x.note.toLowerCase().includes(q);
        const matchEmp = selectedEmpIds.size === 0 || selectedEmpIds.has(x.employeeId);
        return matchQ && matchEmp;
      }),
    [items, q, selectedEmpIds],
  );

  const advanceStatusCounts = React.useMemo((): Record<string, number> => ({
    all: narrowedForStatus.length,
    outstanding: narrowedForStatus.filter((x) => x.status === 'outstanding').length,
    repaid: narrowedForStatus.filter((x) => x.status === 'repaid').length,
    cancelled: narrowedForStatus.filter((x) => x.status === 'cancelled').length,
  }), [narrowedForStatus]);

  const filtered = React.useMemo(
    () =>
      narrowedForStatus
        .filter((x) => statusFilter === 'all' || x.status === statusFilter)
        .sort((a, b) => b.advanceDate.localeCompare(a.advanceDate)),
    [narrowedForStatus, statusFilter],
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
    });
    setError(null); setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!form.employeeId) { setError('اختر الموظف'); return; }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setError('المبلغ يجب أن يكون أكبر من صفر'); return; }
    if (!form.advanceDate) { setError('تاريخ السلفة مطلوب'); return; }
    const payload = {
      employeeId: form.employeeId, employeeNameAr: form.employeeNameAr,
      amount, currency: form.currency,
      advanceDate: form.advanceDate, note: form.note, status: form.status,
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
    const rows = [['الموظف', 'المبلغ', 'العملة', 'التاريخ', 'الحالة', 'ملاحظة']];
    filtered.forEach(x => rows.push([x.employeeNameAr, String(x.amount), x.currency, x.advanceDate, ADVANCE_STATUS_LABELS[x.status], x.note]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = 'employee-advances.csv'; a.click();
  };

  return (
    <>
      <SetPageTitle titleAr="سلف الموظفين" descriptionAr="تسجيل وإدارة سلف الموظفين واسترداداتها." iconName="Banknote" />

      <div className="mb-4 space-y-2">
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
          trailingActions={(
            <>
              {filtered.length > 0 && (
                <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={downloadCsv}>
                  <Download className="h-3.5 w-3.5" />تصدير
                </Button>
              )}
              <Button size="sm" className="h-8 gap-1.5" onClick={openCreate}>
                <Plus className="h-4 w-4" />سلفة جديدة
              </Button>
            </>
          )}
        />
        <p className="text-sm text-muted-foreground">{total} سلفة</p>
      </div>

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
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-center">
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {formatNumber(x.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground">{x.currency}</p>
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
        <FormField label="العملة">
          <MinimalDropdown
            value={form.currency}
            onChange={v => patch({ currency: v })}
            options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }]}
          />
        </FormField>
        <FormField label="تاريخ السلفة" required>
          <Input type="date" value={form.advanceDate} onChange={e => patch({ advanceDate: e.target.value })} />
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
