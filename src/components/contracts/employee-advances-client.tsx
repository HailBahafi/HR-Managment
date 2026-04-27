'use client';

import * as React from 'react';
import { Plus, Banknote, LayoutGrid, List, Download, User, Calendar, Coins, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SetPageTitle } from '@/components/set-page-title';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState, Pagination, SearchableDropdown, MinimalDropdown,
} from '@/components/hr-requests/shared-ui';
import {
  useHREmployeeAdvancesStore, ADVANCE_STATUS_LABELS,
  type HREmployeeAdvanceStatus,
} from '@/lib/contracts/employee-advances-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | HREmployeeAdvanceStatus;
type ViewMode = 'cards' | 'table';

const STATUS_COLORS: Record<HREmployeeAdvanceStatus, string> = {
  outstanding: 'text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30',
  repaid: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  cancelled: 'text-muted-foreground border-border bg-muted/40',
};

const STATUS_CARD_STYLE: Record<HREmployeeAdvanceStatus, { border: string; accent: string; icon: React.ElementType; iconClass: string }> = {
  outstanding: { border: 'border-warning/25',     accent: 'bg-warning/8',    icon: Clock,         iconClass: 'text-warning' },
  repaid:      { border: 'border-success/25',     accent: 'bg-success/8',    icon: CheckCircle2,  iconClass: 'text-success' },
  cancelled:   { border: 'border-border',         accent: 'bg-muted/40',     icon: XCircle,       iconClass: 'text-muted-foreground' },
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
    {
      key: 'status', label: 'الحالة', type: 'select',
      options: [
        { value: 'outstanding', label: ADVANCE_STATUS_LABELS.outstanding },
        { value: 'repaid', label: ADVANCE_STATUS_LABELS.repaid },
        { value: 'cancelled', label: ADVANCE_STATUS_LABELS.cancelled },
      ],
    },
  ]);

  const q = ((values.q as string) ?? '').toLowerCase();
  const statusFilter = (values.status as StatusFilter) || 'all';

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  const filtered = React.useMemo(() =>
    items
      .filter(x => {
        const matchQ = !q || x.employeeNameAr.includes(q) || x.note.toLowerCase().includes(q);
        const matchS = statusFilter === 'all' || x.status === statusFilter;
        return matchQ && matchS;
      })
      .sort((a, b) => b.advanceDate.localeCompare(a.advanceDate)),
    [items, q, statusFilter],
  );

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

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

  const outstandingItems = items.filter(x => x.status === 'outstanding');
  const repaidItems      = items.filter(x => x.status === 'repaid');
  const outstandingTotal = outstandingItems.reduce((s, x) => s + x.amount, 0);
  const repaidTotal      = repaidItems.reduce((s, x) => s + x.amount, 0);

  const [viewMode, setViewMode] = React.useState<ViewMode>('table');

  return (
    <>
      <SetPageTitle titleAr="سلف الموظفين" descriptionAr="تسجيل وإدارة سلف الموظفين واسترداداتها." iconName="Banknote" />

      {/* ── Summary stat strip ── */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
          <p className="text-[10px] font-medium text-muted-foreground">إجمالي السلف</p>
          <p className="text-2xl font-bold tabular-nums leading-none mt-0.5 text-foreground">{items.length}</p>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning/6 px-4 py-3 shadow-soft">
          <p className="text-[10px] font-medium text-muted-foreground">قيد التحصيل</p>
          <p className="text-2xl font-bold tabular-nums leading-none mt-0.5 text-warning">{outstandingItems.length}</p>
          <p className="text-[10px] tabular-nums text-muted-foreground mt-0.5">{outstandingTotal.toLocaleString('ar-SA')} SAR</p>
        </div>
        <div className="rounded-xl border border-success/20 bg-success/6 px-4 py-3 shadow-soft">
          <p className="text-[10px] font-medium text-muted-foreground">مُستردة</p>
          <p className="text-2xl font-bold tabular-nums leading-none mt-0.5 text-success">{repaidItems.length}</p>
          <p className="text-[10px] tabular-nums text-muted-foreground mt-0.5">{repaidTotal.toLocaleString('ar-SA')} SAR</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/6 px-4 py-3 shadow-soft">
          <p className="text-[10px] font-medium text-muted-foreground">إجمالي المبالغ</p>
          <p className="text-lg font-bold tabular-nums leading-snug mt-0.5 text-primary">
            {items.reduce((s, x) => s + x.amount, 0).toLocaleString('ar-SA')}
          </p>
          <p className="text-[10px] text-muted-foreground">SAR</p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{total} سلفة</span>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card p-0.5 shadow-soft">
            <button
              onClick={() => setViewMode('cards')}
              className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-all', viewMode === 'cards' ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          {filtered.length > 0 && (
            <Button variant="outline" onClick={downloadCsv} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />تصدير
            </Button>
          )}
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />سلفة جديدة
          </Button>
        </div>
      </div>

      {paged.length === 0 ? (
        <EmptyState icon={Banknote} title="لا توجد سلف" description="أضف سلفة جديدة لموظف للبدء." />
      ) : viewMode === 'cards' ? (
        /* ── CARDS VIEW ── */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {paged.map(x => {
            const style = STATUS_CARD_STYLE[x.status];
            const StatusIcon = style.icon;
            return (
              <Card key={x.id} className={cn('luxe-card border transition-all duration-200 hover:shadow-elevated', style.border)}>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', style.border, style.accent)}>
                        <StatusIcon className={cn('h-4 w-4', style.iconClass)} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{x.employeeNameAr}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{x.advanceDate}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('shrink-0 text-[10px]', STATUS_COLORS[x.status])}>
                      {ADVANCE_STATUS_LABELS[x.status]}
                    </Badge>
                  </div>

                  {/* Amount */}
                  <div className={cn('rounded-lg border px-3 py-2 mb-3 text-center', style.border, style.accent)}>
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {x.amount.toLocaleString('ar-SA')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{x.currency}</p>
                  </div>

                  {/* Note */}
                  {x.note && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">{x.note}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/50">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(x.id)}>تعديل</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmId(x.id)}>حذف</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="overflow-hidden rounded-2xl border border-border shadow-elevated animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-linear-to-b from-muted/70 to-muted/40 text-muted-foreground">
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs">الموظف</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs">المبلغ</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs hidden md:table-cell">التاريخ</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs">الحالة</th>
                  <th className="border-e border-border/60 px-4 py-3 text-right font-semibold text-xs hidden lg:table-cell">ملاحظة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map(x => (
                  <tr key={x.id} className="border-b border-border/50 last:border-0 even:bg-muted/10 hover:bg-primary/4 transition-colors duration-150">
                    <td className="border-e border-border/40 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium text-sm">{x.employeeNameAr}</span>
                      </div>
                    </td>
                    <td className="border-e border-border/40 px-4 py-3">
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        {x.amount.toLocaleString('ar-SA')}
                      </span>
                      <span className="ms-1 text-[10px] text-muted-foreground">{x.currency}</span>
                    </td>
                    <td className="border-e border-border/40 px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />{x.advanceDate}
                      </div>
                    </td>
                    <td className="border-e border-border/40 px-4 py-3">
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[x.status])}>
                        {ADVANCE_STATUS_LABELS[x.status]}
                      </Badge>
                    </td>
                    <td className="border-e border-border/40 px-4 py-3 hidden lg:table-cell max-w-[200px]">
                      <p className="truncate text-xs text-muted-foreground">{x.note || '—'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(x.id)}>تعديل</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmId(x.id)}>حذف</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > perPage && (
        <div className="mt-4">
          <Pagination page={page} perPage={perPage} total={total} onPage={setPage} onPerPage={() => {}} />
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
