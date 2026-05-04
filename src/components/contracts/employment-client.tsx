'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, FileText, Trash2, User, CalendarRange, Coins, ChevronRight, BarChart2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SetPageTitle } from '@/components/set-page-title';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/entity-filter-slot-context';
import { usePageFilters } from '@/components/filter-panel-context';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState,
  MinimalDropdown, SearchableDropdown,
} from '@/components/hr-requests/shared-ui';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import {
  useHRContractsStore,
  CONTRACT_NATURE_LABELS,
  WORK_ARRANGEMENT_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  type HRContractDraft,
  type HRContractLifecycleStatus,
  type HRContractNature,
  type HRContractRecord,
  type HRWorkArrangement,
} from '@/lib/contracts/contracts-store';
import { useHRContractTemplatesStore } from '@/lib/contracts/contract-templates-store';
import { useHRAllowanceTypesStore } from '@/lib/contracts/allowance-types-store';
import { useHRContractArticlesStore } from '@/lib/contracts/contract-articles-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import { cn, formatNumber } from '@/lib/utils';

const HR_CONTRACTS_MODE_PARAM = 'mode';
const CURRENCIES = ['SAR', 'USD', 'EUR', 'GBP'];

function suggestContractNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `CL-${y}${m}${day}-${Math.floor(1000 + Math.random() * 9000)}`;
}

type AllowanceLine = { allowanceTypeId: string; amount: string };

type FormValues = {
  employeeId: string;
  contractNumber: string;
  contractType: HRContractNature;
  workArrangement: HRWorkArrangement;
  startDate: string;
  endDate: string;
  probationDays: string;
  annualLeaveDays: string;
  baseSalary: string;
  currency: string;
  templateId: string;
  allowanceLines: AllowanceLine[];
  allowancesNote: string;
  deductionsNote: string;
  articleIds: string[];
};

function emptyForm(): FormValues {
  return {
    employeeId: '', contractNumber: '', contractType: 'fixed_term', workArrangement: 'full_time',
    startDate: '', endDate: '', probationDays: '90', annualLeaveDays: '21', baseSalary: '',
    currency: 'SAR', templateId: '', allowanceLines: [{ allowanceTypeId: '', amount: '' }],
    allowancesNote: '', deductionsNote: '', articleIds: [],
  };
}

function recordToForm(r: HRContractRecord): FormValues {
  return {
    employeeId: r.employeeId,
    contractNumber: r.contractNumber,
    contractType: r.contractType,
    workArrangement: r.workArrangement,
    startDate: r.startDate, endDate: r.endDate,
    probationDays: r.probationDays != null ? String(r.probationDays) : '',
    annualLeaveDays: r.annualLeaveDays != null ? String(r.annualLeaveDays) : '',
    baseSalary: String(r.baseSalary), currency: r.currency,
    templateId: r.templateId ?? '',
    allowanceLines: r.allowanceLines?.length > 0
      ? r.allowanceLines.map(l => ({ allowanceTypeId: l.allowanceTypeId, amount: String(l.amount) }))
      : [{ allowanceTypeId: '', amount: '' }],
    allowancesNote: r.allowancesNote, deductionsNote: r.deductionsNote,
    articleIds: Array.isArray(r.articleIds) ? r.articleIds : [],
  };
}

/** نسخ حقول عقد موجود لمسودة جديدة: يُبقى `employeeId` للموظف المستهدف ويُولَّد رقم عقد جديد */
function cloneFormFromContract(preserveEmployeeId: string, source: HRContractRecord): FormValues {
  const merged = recordToForm(source);
  return {
    ...merged,
    employeeId: preserveEmployeeId,
    contractNumber: suggestContractNumber(),
    templateId: source.templateId ?? '',
  };
}

function formToDraft(v: FormValues, status: HRContractLifecycleStatus = 'draft'): HRContractDraft {
  const al = v.annualLeaveDays.trim();
  const annualLeaveDays = al === '' ? null : (() => {
    const n = parseInt(al, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  })();
  return {
    employeeId: v.employeeId, contractNumber: v.contractNumber.trim(),
    contractType: v.contractType,
    workArrangement: v.workArrangement,
    startDate: v.startDate, endDate: v.endDate,
    probationDays: v.probationDays ? parseInt(v.probationDays) : null,
    annualLeaveDays,
    baseSalary: parseFloat(v.baseSalary) || 0, currency: v.currency,
    status,
    templateId: v.templateId || null,
    allowanceLines: v.allowanceLines
      .filter(l => l.allowanceTypeId)
      .map(l => ({ allowanceTypeId: l.allowanceTypeId, amount: parseFloat(l.amount) || 0 })),
    allowancesNote: v.allowancesNote, deductionsNote: v.deductionsNote,
    amendsContractId: null, supersededByContractId: null,
    earlyTerminationReason: null, articleIds: v.articleIds,
  };
}

type PanelMode = 'create' | 'edit' | 'view';
type StatusFilter = 'all' | HRContractLifecycleStatus;
type KindFilter = 'all' | HRContractNature;

const EMPLOYMENT_STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'كل الحالات' },
  ...(Object.entries(CONTRACT_STATUS_LABELS) as [HRContractLifecycleStatus, string][]).map(([v, l]) => ({ value: v, label: l })),
];

const EMPLOYMENT_KIND_FILTER_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'كل الأنواع' },
  ...(Object.entries(CONTRACT_NATURE_LABELS) as [HRContractNature, string][]).map(([v, l]) => ({ value: v, label: l })),
];

function TerminateModal({ open, reason, onReasonChange, onConfirm, onCancel }: {
  open: boolean; reason: string; onReasonChange: (v: string) => void;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent className="border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>إنهاء العقد</DialogTitle>
          <DialogDescription>
            أدخل سبب الإنهاء المبكر ثم أكّد الإجراء.
          </DialogDescription>
        </DialogHeader>
        <Input value={reason} onChange={e => onReasonChange(e.target.value)} placeholder="سبب الإنهاء…" />
        <DialogFooter className="gap-2 sm:justify-start sm:space-x-2 sm:space-x-reverse">
          <Button variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button variant="destructive" onClick={onConfirm}>إنهاء العقد</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmploymentContractsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get(HR_CONTRACTS_MODE_PARAM);

  const { contracts, add, update, remove, activate, terminate, archive, createAmendmentDraft, syncExpiredByEndDate } = useHRContractsStore();
  const { templates } = useHRContractTemplatesStore();
  const { items: allowanceTypes } = useHRAllowanceTypesStore();
  const { articles } = useHRContractArticlesStore();
  const allEmployees = useHREmployeeDirectoryStore(s => s.employees);
  const employees = React.useMemo(() => allEmployees.filter(e => e.status === 'active'), [allEmployees]);

  React.useEffect(() => { syncExpiredByEndDate(); }, [syncExpiredByEndDate]);

  const essentialArticleIds = React.useMemo(
    () => articles.filter(a => a.isActive && a.isBasic).map(a => a.id),
    [articles],
  );

  const activeArticles = React.useMemo(
    () => [...articles].filter(a => a.isActive).sort((a, b) => {
      if (a.isBasic !== b.isBasic) return a.isBasic ? -1 : 1;
      return a.code.localeCompare(b.code);
    }),
    [articles],
  );

  const empOptions = React.useMemo(() => employees.map(e => ({ value: e.id, label: `${e.nameAr} — ${e.jobTitleAr}` })), [employees]);
  const templateOptions = React.useMemo(() => [
    { value: '', label: 'بدون قالب' },
    ...templates.filter(t => t.isActive).map(t => ({ value: t.id, label: t.nameAr })),
  ], [templates]);
  const allowanceOptions = React.useMemo(() =>
    allowanceTypes.filter(a => a.isActive).map(a => ({ value: a.id, label: `${a.code} — ${a.nameAr}` })),
    [allowanceTypes],
  );

  const { values, setValue } = usePageFilters([
    {
      key: 'status', label: 'الحالة', type: 'select',
      options: EMPLOYMENT_STATUS_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
    },
    {
      key: 'kind', label: 'نوع العقد', type: 'select',
      options: EMPLOYMENT_KIND_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
    },
  ]);

  const statusFilter = (values.status as StatusFilter) || 'all';
  const kindFilter = (values.kind as KindFilter) || 'all';

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of contracts) {
      const name = allEmployees.find(e => e.id === c.employeeId)?.nameAr ?? c.employeeId;
      map.set(c.employeeId, name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [contracts, allEmployees]);

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<PanelMode>('create');
  const [selected, setSelected] = React.useState<HRContractRecord | null>(null);
  const [form, setForm] = React.useState<FormValues>(emptyForm());
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [terminateId, setTerminateId] = React.useState<string | null>(null);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [copyFromEmployeeId, setCopyFromEmployeeId] = React.useState('');
  const [copyFromContractId, setCopyFromContractId] = React.useState('');

  const getEmpName = (id: string) => allEmployees.find(e => e.id === id)?.nameAr ?? id;

  const copySourceEmpOptions = React.useMemo(() => {
    const ids = new Set(contracts.map(c => c.employeeId));
    return employees.filter(e => ids.has(e.id)).map(e => ({ value: e.id, label: `${e.nameAr} — ${e.jobTitleAr}` }));
  }, [contracts, employees]);

  const copySourceContractOptions = React.useMemo(() => {
    if (!copyFromEmployeeId) return [];
    return [...contracts]
      .filter(c => c.employeeId === copyFromEmployeeId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(c => ({
        value: c.id,
        label: `${c.contractNumber} · ${CONTRACT_NATURE_LABELS[c.contractType]} · ${CONTRACT_STATUS_LABELS[c.status]} · ${c.startDate}`,
      }));
  }, [contracts, copyFromEmployeeId]);

  /* ── URL mode sync ── */
  React.useEffect(() => {
    if (modeParam === 'createContract') {
      const f = { ...emptyForm(), contractNumber: suggestContractNumber(), articleIds: [...essentialArticleIds] };
      setSelected(null); setForm(f); setPanelMode('create'); setError(null);
      setCopyFromEmployeeId(''); setCopyFromContractId('');
      setDrawerOpen(true);
    }
  }, [modeParam]);

  /* ── pre-select essentials when articles load ── */
  React.useEffect(() => {
    if (panelMode === 'create' && form.articleIds.length === 0 && essentialArticleIds.length > 0) {
      setForm(f => ({ ...f, articleIds: [...essentialArticleIds] }));
    }
  }, [essentialArticleIds, panelMode]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setCopyFromEmployeeId('');
    setCopyFromContractId('');
    if (modeParam) {
      router.replace('/hr/contracts/employment', { scroll: false });
    }
  };

  const handleApplyCopyFromContract = () => {
    const src = contracts.find(c => c.id === copyFromContractId);
    if (!src) {
      toast.error('اختر عقد المصدر أولاً');
      return;
    }
    setForm(f => cloneFormFromContract(f.employeeId, src));
    toast.success('تم نسخ بيانات العقد. راجع الموظف المستهدف والتواريخ ثم احفظ.');
  };

  const openCreate = () => {
    router.push(`/hr/contracts/employment?${HR_CONTRACTS_MODE_PARAM}=createContract`);
  };

  const openView = (c: HRContractRecord) => {
    if (modeParam) router.replace('/hr/contracts/employment', { scroll: false });
    setSelected(c); setForm(recordToForm(c)); setPanelMode('view'); setError(null); setDrawerOpen(true);
  };

  const openEdit = (c: HRContractRecord) => {
    if (c.status !== 'draft') {
      toast.info('التعديل المباشر للمسودات فقط. للعقد النشط استخدم «تعديل رسمي».');
      openView(c);
      return;
    }
    if (modeParam) router.replace('/hr/contracts/employment', { scroll: false });
    setSelected(c); setForm(recordToForm(c)); setPanelMode('edit'); setError(null); setDrawerOpen(true);
  };

  const openAmendment = (c: HRContractRecord) => {
    const res = createAmendmentDraft(c.id);
    if (!res.ok) { toast.error(res.message); return; }
    const draft = contracts.find(x => x.id === res.id);
    if (draft) { setSelected(draft); setForm(recordToForm(draft)); setPanelMode('edit'); setError(null); setDrawerOpen(true); }
    toast.success('تم إنشاء مسودة التعديل الرسمي.');
  };

  const handleSave = () => {
    if (!form.employeeId) { setError('اختر الموظف'); return; }
    if (!form.contractNumber.trim()) { setError('رقم العقد مطلوب'); return; }
    if (!form.startDate || !form.endDate) { setError('تواريخ العقد مطلوبة'); return; }
    const alRaw = form.annualLeaveDays.trim();
    const alNum = parseInt(alRaw, 10);
    if (alRaw === '' || !Number.isFinite(alNum) || alNum < 0 || alNum > 366) {
      setError('أدخل عدداً صحيحاً للإجازات السنوية (0–366 يوماً).');
      return;
    }
    if (panelMode === 'create') {
      add(formToDraft(form, 'draft'));
      toast.success('تم إنشاء العقد كمسودة.');
    } else if (panelMode === 'edit' && selected) {
      const ok = update(selected.id, formToDraft(form, selected.status));
      if (!ok) { setError('لا يمكن تعديل عقد غير مسودة'); return; }
    }
    closeDrawer();
  };

  const handleActivate = (id: string) => {
    const res = activate(id);
    if (!res.ok) toast.error(res.message); else toast.success('تم تفعيل العقد.');
  };

  const handleTerminate = () => {
    if (!terminateId) return;
    const res = terminate(terminateId, terminateReason);
    if (!res.ok) toast.error(res.message); else toast.success('تم إنهاء العقد.');
    setTerminateId(null); setTerminateReason('');
  };

  const handleArchive = (id: string) => {
    const res = archive(id);
    if (!res.ok) toast.error(res.message); else toast.success('تم أرشفة العقد.');
  };

  const patch = (p: Partial<FormValues>) => setForm(f => ({ ...f, ...p }));

  const applyTemplate = (tplId: string) => {
    const t = templates.find(x => x.id === tplId);
    if (!t) { patch({ templateId: '' }); return; }
    patch({
      templateId: tplId,
      contractType: t.defaultContractNature,
      workArrangement: t.defaultWorkArrangement,
      probationDays: t.defaultProbationDays != null ? String(t.defaultProbationDays) : '',
      baseSalary: String(t.suggestedBaseSalary), currency: t.currency,
      allowanceLines: t.allowanceTypeIds.length > 0
        ? t.allowanceTypeIds.map(id => ({ allowanceTypeId: id, amount: String(allowanceTypes.find(a => a.id === id)?.typicalAmount ?? 0) }))
        : [{ allowanceTypeId: '', amount: '' }],
    });
  };

  const updateAllowanceLine = (idx: number, p: Partial<AllowanceLine>) => {
    setForm(f => ({ ...f, allowanceLines: f.allowanceLines.map((l, i) => i === idx ? { ...l, ...p } : l) }));
  };
  const addAllowanceLine = () => setForm(f => ({ ...f, allowanceLines: [...f.allowanceLines, { allowanceTypeId: '', amount: '' }] }));
  const removeAllowanceLine = (idx: number) => setForm(f => ({
    ...f,
    allowanceLines: f.allowanceLines.length <= 1 ? [{ allowanceTypeId: '', amount: '' }] : f.allowanceLines.filter((_, i) => i !== idx),
  }));

  const toggleArticle = (id: string) => {
    setForm(f => ({
      ...f,
      articleIds: f.articleIds.includes(id) ? f.articleIds.filter(x => x !== id) : [...f.articleIds, id],
    }));
  };

  const narrowedEmp = React.useMemo(
    () => contracts.filter(c => selectedEmpIds.size === 0 || selectedEmpIds.has(c.employeeId)),
    [contracts, selectedEmpIds],
  );

  const narrowedForKind = React.useMemo(
    () => narrowedEmp.filter(c => kindFilter === 'all' || c.contractType === kindFilter),
    [narrowedEmp, kindFilter],
  );

  const employmentStatusOrder = React.useMemo(
    () => EMPLOYMENT_STATUS_FILTER_OPTIONS.filter((o): o is { value: HRContractLifecycleStatus; label: string } => o.value !== 'all').map(o => o.value),
    [],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: narrowedForKind.length };
    for (const s of employmentStatusOrder) {
      counts[s] = narrowedForKind.filter(c => c.status === s).length;
    }
    return counts;
  }, [narrowedForKind, employmentStatusOrder]);

  const filtered = React.useMemo(
    () =>
      narrowedForKind
        .filter(c => statusFilter === 'all' || c.status === statusFilter)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [narrowedForKind, statusFilter],
  );

  const total = filtered.length;
  const readOnly = panelMode === 'view';

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setValue('status', v)}
        statusOrder={employmentStatusOrder}
        statusLabels={CONTRACT_STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          {
            id: 'contract-kind',
            value: kindFilter,
            onChange: (v) => setValue('kind', v),
            options: EMPLOYMENT_KIND_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
            placeholder: 'نوع العقد',
          },
        ]}
        trailingActions={(
          <Button onClick={openCreate} className="h-8 gap-1.5 px-3 text-xs shadow-sm">
            <Plus className="h-4 w-4" />عقد جديد
          </Button>
        )}
      />
    ),
    [
      statusFilter,
      kindFilter,
      selectedEmpKey,
      statusCounts,
      empPickerList,
      employmentStatusOrder,
    ],
  );

  const ContractActions = ({ c }: { c: HRContractRecord }) => (
    <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
      {c.status === 'draft' && (
        <>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(c)}>تعديل</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:text-success" onClick={() => handleActivate(c.id)}>تفعيل</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmDelete(c.id)}>حذف</Button>
        </>
      )}
      {c.status === 'active' && (
        <>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openAmendment(c)}>تعديل رسمي</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => { setTerminateId(c.id); setTerminateReason(''); }}>إنهاء</Button>
        </>
      )}
      {(c.status === 'expired' || c.status === 'terminated') && (
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleArchive(c.id)}>أرشفة</Button>
      )}
    </div>
  );

  return (
    <>
      <SetPageTitle titleAr="عقود العمل" descriptionAr="إدارة دورة حياة عقود العمل الوظيفية." iconName="FileText" />

      <p className="mb-2 text-sm text-muted-foreground">{total} عقد</p>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد عقود" description="أنشئ عقد عمل جديداً للبدء." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
              onClick={() => openView(c)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{getEmpName(c.employeeId)}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{c.contractNumber}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('shrink-0 text-[10px]', CONTRACT_STATUS_COLORS[c.status])}>
                  {CONTRACT_STATUS_LABELS[c.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="min-w-0 leading-tight">
                    {CONTRACT_NATURE_LABELS[c.contractType]}
                    <span className="text-muted-foreground"> · </span>
                    {WORK_ARRANGEMENT_LABELS[c.workArrangement]}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                  <CalendarRange className="h-3 w-3" />{c.startDate}
                  <ChevronRight className="h-3 w-3 opacity-40" />
                  {c.endDate}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
                <Coins className="h-3.5 w-3.5 text-gold" />
                {formatNumber(c.baseSalary)}
                <span className="text-[10px] font-normal text-muted-foreground">{c.currency}</span>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <ContractActions c={c} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Contract drawer form ── */}
      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={open => { if (!open) closeDrawer(); }}
        title={panelMode === 'create' ? 'عقد جديد' : panelMode === 'edit' ? 'تعديل العقد' : 'تفاصيل العقد'}
        description={
          panelMode === 'view'
            ? 'عرض تفاصيل العقد دون تعديل.'
            : panelMode === 'edit'
              ? 'عدّل الحقول ثم احفظ التغييرات.'
              : 'أنشئ عقد عمل — أو انسخ بيانات عقد موظف آخر ثم اربطه بالموظف الجديد.'
        }
        size="xl"
        onSave={readOnly ? closeDrawer : handleSave}
        saveLabel={readOnly ? 'إغلاق' : 'حفظ'}
        error={error}
      >
        {!readOnly && panelMode !== 'create' && (
          <FormField label="القالب">
            <MinimalDropdown value={form.templateId} onChange={applyTemplate} options={templateOptions} placeholder="اختر قالباً (اختياري)…" />
          </FormField>
        )}

        {/* Employee */}
        <FormField label="الموظف" required>
          {readOnly ? (
            <Input value={getEmpName(form.employeeId)} readOnly className="bg-muted/30" />
          ) : (
            <SearchableDropdown value={form.employeeId} onChange={v => patch({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
          )}
        </FormField>

        {!readOnly && panelMode === 'create' && (
          <FormField label="نسخ من عقد موظف آخر" span2>
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
              اختر أولاً <strong className="text-foreground">الموظف المستهدف</strong> أعلاه، ثم موظفاً لديه عقداً واختر العقد؛ يُنسخ نوع العقد والدوام والتواريخ والراتب والبدلات والمواد وغيرها، مع الإبقاء على الموظف المستهدف وتوليد{' '}
              <strong className="text-foreground">رقم عقد جديد</strong>.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 basis-[14rem]">
                <SearchableDropdown
                  value={copyFromEmployeeId}
                  onChange={(id) => { setCopyFromEmployeeId(id); setCopyFromContractId(''); }}
                  options={copySourceEmpOptions}
                  placeholder={copySourceEmpOptions.length ? 'موظف المصدر (لديه عقد)…' : 'لا يوجد موظف لديه عقد بعد'}
                />
              </div>
              <div className="min-w-0 flex-1 basis-[14rem]">
                <MinimalDropdown
                  value={copyFromContractId}
                  onChange={setCopyFromContractId}
                  options={[
                    { value: '', label: '— اختر عقد المصدر —' },
                    ...copySourceContractOptions,
                  ]}
                  placeholder="عقد المصدر"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 shrink-0 gap-1.5"
                disabled={!copyFromContractId}
                onClick={handleApplyCopyFromContract}
              >
                <Copy className="h-3.5 w-3.5" />
                تطبيق النسخ
              </Button>
            </div>
          </FormField>
        )}

        {/* Contract number */}
        <FormField label="رقم العقد" required>
          <Input value={form.contractNumber} onChange={e => patch({ contractNumber: e.target.value })} readOnly={readOnly} className={readOnly ? 'bg-muted/30' : ''} />
        </FormField>

        {/* Type */}
        <FormField label="نوع العقد">
          {readOnly ? (
            <Input value={CONTRACT_NATURE_LABELS[form.contractType]} readOnly className="bg-muted/30" />
          ) : (
            <MinimalDropdown
              value={form.contractType}
              onChange={v => patch({ contractType: v as HRContractNature })}
              options={Object.entries(CONTRACT_NATURE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
          )}
        </FormField>

        <FormField label="نوع الدوام">
          {readOnly ? (
            <Input value={WORK_ARRANGEMENT_LABELS[form.workArrangement]} readOnly className="bg-muted/30" />
          ) : (
            <MinimalDropdown
              value={form.workArrangement}
              onChange={v => patch({ workArrangement: v as HRWorkArrangement })}
              options={Object.entries(WORK_ARRANGEMENT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
          )}
        </FormField>

        {/* Dates */}
        <FormField label="تاريخ البداية" required>
          <SingleDatePicker
            value={form.startDate || undefined}
            onChange={(next) => patch({ startDate: next })}
            placeholder="اختر تاريخ البداية"
            disabled={readOnly}
            max={form.endDate || undefined}
          />
        </FormField>
        <FormField label="تاريخ الانتهاء" required>
          <SingleDatePicker
            value={form.endDate || undefined}
            onChange={(next) => patch({ endDate: next })}
            placeholder="اختر تاريخ الانتهاء"
            disabled={readOnly}
            min={form.startDate || undefined}
          />
        </FormField>

        {/* Probation */}
        <FormField label="أيام التجربة">
          <Input type="number" min="0" value={form.probationDays} onChange={e => patch({ probationDays: e.target.value })} readOnly={readOnly} className={readOnly ? 'bg-muted/30' : ''} placeholder="90" />
        </FormField>

        {/* Annual leave (contract entitlement) */}
        <FormField label="الإجازات السنوية" required>
          <Input
            type="number"
            min="0"
            max="366"
            step="1"
            value={form.annualLeaveDays}
            onChange={e => patch({ annualLeaveDays: e.target.value })}
            readOnly={readOnly}
            className={readOnly ? 'bg-muted/30' : ''}
            placeholder="مثال: 21"
          />
          <p className="text-[10px] text-muted-foreground mt-1">إجمالي أيام الإجازة السنوية المعتمدة في العقد لكل سنة ميلادية.</p>
        </FormField>

        {/* Salary */}
        <FormField label="الراتب الأساسي" required>
          <Input type="number" min="0" value={form.baseSalary} onChange={e => patch({ baseSalary: e.target.value })} readOnly={readOnly} className={readOnly ? 'bg-muted/30' : ''} placeholder="0" />
        </FormField>

        {/* Currency */}
        <FormField label="العملة">
          {readOnly ? (
            <Input value={form.currency} readOnly className="bg-muted/30" />
          ) : (
            <MinimalDropdown value={form.currency} onChange={v => patch({ currency: v })} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
          )}
        </FormField>

        {/* Allowance lines */}
        <FormField label="البدلات من الدليل" span2>
          <div className="space-y-2">
            {form.allowanceLines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  {readOnly ? (
                    <Input value={allowanceTypes.find(a => a.id === line.allowanceTypeId)?.nameAr ?? line.allowanceTypeId} readOnly className="bg-muted/30 text-xs" />
                  ) : (
                    <MinimalDropdown
                      value={line.allowanceTypeId}
                      onChange={v => updateAllowanceLine(idx, { allowanceTypeId: v })}
                      options={[{ value: '', label: 'اختر البدل…' }, ...allowanceOptions]}
                    />
                  )}
                </div>
                <Input
                  type="number" min="0" className="w-24 text-xs"
                  value={line.amount} placeholder="0"
                  onChange={e => updateAllowanceLine(idx, { amount: e.target.value })}
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeAllowanceLine(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addAllowanceLine}>
                <Plus className="h-3 w-3" />إضافة بدل
              </Button>
            )}
          </div>
        </FormField>

        {/* Notes */}
        <FormField label="ملاحظات البدلات" span2>
          <Input value={form.allowancesNote} onChange={e => patch({ allowancesNote: e.target.value })} readOnly={readOnly} className={readOnly ? 'bg-muted/30' : ''} placeholder="ملاحظات البدلات…" />
        </FormField>
        <FormField label="ملاحظات الخصومات" span2>
          <Input value={form.deductionsNote} onChange={e => patch({ deductionsNote: e.target.value })} readOnly={readOnly} className={readOnly ? 'bg-muted/30' : ''} placeholder="ملاحظات الخصومات…" />
        </FormField>

        {/* Contract articles */}
        <FormField label={`مواد العقد ${form.articleIds.length > 0 ? `(${form.articleIds.length} محدّد)` : ''}`} span2>
          {activeArticles.length === 0 ? (
            <p className="text-xs text-muted-foreground">لا توجد مواد فعّالة — أضف مواداً من صفحة «مواد العقود».</p>
          ) : (
            <div className="rounded-lg border border-border divide-y divide-border max-h-56 overflow-y-auto">
              {activeArticles.map(a => (
                <label key={a.id} className={cn(
                  'flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                  readOnly ? 'cursor-default' : 'hover:bg-muted/30',
                  form.articleIds.includes(a.id) && 'bg-primary/5',
                )}>
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border"
                    checked={form.articleIds.includes(a.id)}
                    onChange={() => !readOnly && toggleArticle(a.id)}
                    disabled={readOnly}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground">{a.code}</span>
                      {a.isBasic && <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400">أساسية</span>}
                    </div>
                    <p className="text-xs font-medium leading-snug">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{a.body.slice(0, 80)}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {!readOnly && activeArticles.length > 0 && essentialArticleIds.length > 0 && (
            <Button
              size="sm" variant="ghost" className="mt-1 h-7 text-xs text-primary"
              onClick={() => setForm(f => ({ ...f, articleIds: [...new Set([...f.articleIds, ...essentialArticleIds])] }))}
            >
              إعادة تضمين الأساسية
            </Button>
          )}
        </FormField>
      </HRSettingsFormDrawer>

      {/* Delete */}
      <ConfirmationModal
        open={!!confirmDelete}
        onOpenChange={v => { if (!v) setConfirmDelete(null); }}
        title="حذف العقد"
        description="هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع."
        confirmLabel="حذف" variant="destructive"
        onConfirm={() => { if (confirmDelete) { remove(confirmDelete); setConfirmDelete(null); } }}
      />

      {/* Terminate */}
      <TerminateModal
        open={!!terminateId} reason={terminateReason}
        onReasonChange={setTerminateReason}
        onConfirm={handleTerminate}
        onCancel={() => { setTerminateId(null); setTerminateReason(''); }}
      />
    </>
  );
}
