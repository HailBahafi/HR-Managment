'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, FileText, User, CalendarRange, Coins, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { usePageFilters } from '@/components/layouts/filter-panel-context';
import {
  ConfirmationModal, EmptyState,
  Pagination,
} from '@/features/hr/requests/components/shared-ui';
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
} from '@/features/hr/contracts/lib/contracts-store';
import { useHRContractTemplatesStore } from '@/features/hr/contracts/lib/contract-templates-store';
import { contractTemplatesApi } from '@/features/hr/contracts/contract-templates/lib/api/contract-templates';
import { applyContractTemplateToForm, computeTemplateEndDate } from '@/features/hr/contracts/employment/utils/apply-contract-template';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import { useHRContractArticlesStore } from '@/features/hr/contracts/lib/contract-articles-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { cn, formatNumber } from '@/shared/utils';
import { hrContractsRoutes } from '@/features/hr/contracts/constants/routes';
import {
  HR_CONTRACTS_MODE_PARAM,
  suggestContractNumber,
  type AllowanceLine,
  type EmploymentContractFormValues,
  emptyEmploymentContractForm,
  recordToEmploymentForm,
  cloneEmploymentFormFromContract,
  employmentFormToDraft,
  mergeEssentialArticleIds,
  EMPLOYMENT_STATUS_FILTER_OPTIONS,
  EMPLOYMENT_KIND_FILTER_OPTIONS,
} from '@/features/hr/contracts/employment/utils/employment-contract-form';
import { EmploymentContractTerminateModal as TerminateModal } from '@/features/hr/contracts/employment/components/employment-contract-terminate-modal';
import { EmploymentContractSignatureCard } from '@/features/hr/contracts/employment/components/employment-contract-signature-card';
import { EmploymentContractDetailDialog } from '@/features/hr/contracts/employment/components/employment-contract-detail-dialog';
import { EmploymentContractFormDialog } from '@/features/hr/contracts/employment/components/employment-contract-form-dialog';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { EmploymentContractPrintHtml } from '@/components/pdf/print/employment-contract-print-html';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId, useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { sendEmploymentContractCreatedNotification } from '@/features/hr/contracts/employment/services/contract-created-notification.service';

type FormValues = EmploymentContractFormValues;
const recordToForm = recordToEmploymentForm;
const cloneFormFromContract = cloneEmploymentFormFromContract;
const formToDraft = employmentFormToDraft;

type PanelMode = 'create' | 'edit';
type StatusFilter = 'all' | HRContractLifecycleStatus;
type KindFilter = 'all' | HRContractNature;

export function EmploymentContractsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get(HR_CONTRACTS_MODE_PARAM);

  const { data: activeCompany } = useActiveCompany();
  const companyId = useDefaultCompanyId();
  const { contracts, add, update, remove, activate, terminate, archive, createAmendmentDraft, fetch: fetchContracts } = useHRContractsStore();
  const { templates, fetch: fetchTemplates } = useHRContractTemplatesStore();
  const { items: allowanceTypes, fetch: fetchAllowanceTypes } = useHRAllowanceTypesStore();
  const { articles, fetch: fetchArticles } = useHRContractArticlesStore();
  const { employees: allEmployees, fetch: fetchEmployees } = useHREmployeeDirectoryStore();
  const employees = React.useMemo(() => allEmployees.filter(e => e.status === 'active'), [allEmployees]);

  React.useEffect(() => {
    if (!companyId) return;
    fetchContracts();
    fetchTemplates();
    fetchArticles();
    fetchEmployees();
    fetchAllowanceTypes();
  }, [companyId, fetchContracts, fetchTemplates, fetchArticles, fetchEmployees, fetchAllowanceTypes]);

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
  const templateOptions = React.useMemo(
    () => [
      { value: '', label: 'بدون قالب' },
      ...[...templates]
        .filter((t) => t.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.nameAr.localeCompare(b.nameAr, 'ar'))
        .map((t) => ({ value: t.id, label: t.nameAr })),
    ],
    [templates],
  );
  const [applyingTemplate, setApplyingTemplate] = React.useState(false);
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
  const [detailContractId, setDetailContractId] = React.useState<string | null>(null);
  const [detailRefreshKey, setDetailRefreshKey] = React.useState(0);
  const [selected, setSelected] = React.useState<HRContractRecord | null>(null);
  const [form, setForm] = React.useState<FormValues>(() => emptyEmploymentContractForm());
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [terminateId, setTerminateId] = React.useState<string | null>(null);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [copyFromEmployeeId, setCopyFromEmployeeId] = React.useState('');
  const [copyFromContractId, setCopyFromContractId] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);

  React.useEffect(() => {
    if (drawerOpen && companyId && allowanceTypes.length === 0) {
      void fetchAllowanceTypes();
    }
  }, [drawerOpen, companyId, allowanceTypes.length, fetchAllowanceTypes]);

  const [contractPdfOpen, setContractPdfOpen] = React.useState(false);
  const [contractPrintable, setContractPrintable] = React.useState<React.ReactElement | null>(null);

  const getEmpName = (id: string) => allEmployees.find(e => e.id === id)?.nameAr ?? id;

  React.useEffect(() => {
    if (!contractPdfOpen) setContractPrintable(null);
  }, [contractPdfOpen]);

  const openEmploymentContractPdf = React.useCallback((source?: FormValues, employeeNameOverride?: string) => {
    const values = source ?? form;
    if (!values.employeeId.trim()) {
      toast.error('اختر الموظف أولاً');
      return;
    }
    if (!values.startDate.trim()) {
      toast.error('حدّد تاريخ البداية لاستكمال نص العرض');
      return;
    }
    const empAr = employeeNameOverride ?? getEmpName(values.employeeId);
    const allowanceRows = values.allowanceLines
      .filter((l) => l.allowanceTypeId.trim())
      .map((l) => ({
        labelAr: allowanceTypes.find((a) => a.id === l.allowanceTypeId)?.nameAr ?? l.allowanceTypeId,
        amount: String(l.amount || '0'),
      }));
    const selectedArticles = values.articleIds
      .map((id) => articles.find((a) => a.id === id))
      .filter(Boolean) as typeof articles;

    selectedArticles.sort((a, b) => {
      if (a!.isBasic !== b!.isBasic) return a!.isBasic ? -1 : 1;
      return a!.code.localeCompare(b!.code);
    });

    const artLines = selectedArticles.map((a) => ({
      code: a.code,
      titleAr: a.title,
      bodySnippet:
        `${(a.body || '').replace(/\s+/g, ' ').trim().slice(0, 480)}${(a.body?.length ?? 0) > 480 ? '…' : ''}`,
    }));

    const company = {
      nameAr: activeCompany?.nameAr ?? '',
      nameEn: activeCompany?.nameEn ?? '',
    };

    const printable = (
      <EmploymentContractPrintHtml
        logoSrc={getPdfLogoSrc()}
        company={company}
        employeeNameAr={empAr}
        contractNumber={values.contractNumber.trim() || '—'}
        natureLabelAr={CONTRACT_NATURE_LABELS[values.contractType]}
        arrangementLabelAr={WORK_ARRANGEMENT_LABELS[values.workArrangement]}
        startDate={values.startDate}
        endDate={values.endDate}
        probationDaysLabel={values.probationDays.trim() ? `${values.probationDays} يوم` : 'بدون'}
        annualLeaveDaysLabel={`${values.annualLeaveDays || '—'} يوم`}
        baseSalary={formatNumber(Number(values.baseSalary) || 0)}
        currency={values.currency}
        allowancesNote={values.allowancesNote}
        deductionsNote={values.deductionsNote}
        allowanceRows={allowanceRows}
        articles={artLines}
      />
    );
    setContractPrintable(printable);
    setContractPdfOpen(true);
  }, [
    form,
    allowanceTypes,
    articles,
    activeCompany,
    getEmpName,
  ]);

  const openContractPdfFromRecord = React.useCallback((record: HRContractRecord) => {
    openEmploymentContractPdf(recordToForm(record), record.employeeNameAr || getEmpName(record.employeeId));
  }, [openEmploymentContractPdf, getEmpName]);

  const syncContractInStore = React.useCallback((record: HRContractRecord) => {
    useHRContractsStore.setState((s) => ({
      contracts: s.contracts.some((c) => c.id === record.id)
        ? s.contracts.map((c) => (c.id === record.id ? record : c))
        : [record, ...s.contracts],
    }));
  }, []);

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
      const f = {
        ...emptyEmploymentContractForm(essentialArticleIds),
        contractNumber: suggestContractNumber(),
      };
      setSelected(null); setForm(f); setPanelMode('create'); setError(null);
      setCopyFromEmployeeId(''); setCopyFromContractId('');
      setDrawerOpen(true);
    }
  }, [modeParam, essentialArticleIds]);

  React.useEffect(() => {
    if (!drawerOpen || essentialArticleIds.length === 0) return;
    setForm((f) => {
      const merged = mergeEssentialArticleIds(f.articleIds, essentialArticleIds);
      if (merged.length === f.articleIds.length && essentialArticleIds.every((id) => f.articleIds.includes(id))) {
        return f;
      }
      return { ...f, articleIds: merged };
    });
  }, [essentialArticleIds, drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setCopyFromEmployeeId('');
    setCopyFromContractId('');
    if (modeParam) {
      router.replace(hrContractsRoutes.employment, { scroll: false });
    }
  };

  const handleApplyCopyFromContract = () => {
    const src = contracts.find(c => c.id === copyFromContractId);
    if (!src) {
      toast.error('اختر عقد المصدر أولاً');
      return;
    }
    setForm(f => {
      const cloned = cloneFormFromContract(f.employeeId, src);
      return {
        ...cloned,
        articleIds: mergeEssentialArticleIds(cloned.articleIds, essentialArticleIds),
      };
    });
    toast.success('تم نسخ بيانات العقد. راجع الموظف المستهدف والتواريخ ثم احفظ.');
  };

  const openCreate = () => {
    router.push(`${hrContractsRoutes.employment}?${HR_CONTRACTS_MODE_PARAM}=createContract`);
  };

  const activeFilterCount = (kindFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (selectedEmpIds.size > 0 ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          عقد جديد
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const openView = (c: HRContractRecord) => {
    if (modeParam) router.replace(hrContractsRoutes.employment, { scroll: false });
    setDetailContractId(c.id);
  };

  const openEditFromDetail = (c: HRContractRecord) => {
    setDetailContractId(null);
    setSelected(c);
    setForm({
      ...recordToForm(c),
      articleIds: mergeEssentialArticleIds(c.articleIds, essentialArticleIds),
    });
    setPanelMode('edit');
    setError(null);
    setDrawerOpen(true);
  };

  const openAmendment = async (c: HRContractRecord) => {
    const res = await createAmendmentDraft(c.id);
    if (!res.ok) { toast.error(res.message); return; }
    const draft = useHRContractsStore.getState().contracts.find(x => x.id === res.id);
    if (draft) {
      setSelected(draft);
      setForm({
        ...recordToForm(draft),
        articleIds: mergeEssentialArticleIds(draft.articleIds, essentialArticleIds),
      });
      setPanelMode('edit');
      setError(null);
      setDrawerOpen(true);
    }
    toast.success('تم إنشاء مسودة التعديل الرسمي.');
  };

  const handleSave = async () => {
    if (!form.employeeId) { setError('اختر الموظف'); return; }
    if (!form.contractNumber.trim()) { setError('رقم العقد مطلوب'); return; }
    if (!form.startDate) { setError('تاريخ البداية مطلوب'); return; }
    if (form.contractType === 'fixed_term' && !form.endDate) { setError('تاريخ الانتهاء مطلوب للعقود محددة المدة'); return; }
    const alRaw = form.annualLeaveDays.trim();
    const alNum = parseInt(alRaw, 10);
    if (alRaw === '' || !Number.isFinite(alNum) || alNum < 0 || alNum > 366) {
      setError('أدخل عدداً صحيحاً للإجازات السنوية (0–366 يوماً).');
      return;
    }
    try {
      const payload = {
        ...form,
        articleIds: mergeEssentialArticleIds(form.articleIds, essentialArticleIds),
      };
      if (panelMode === 'create') {
        const contractId = await add(formToDraft(payload, 'draft'));
        const companyId = getDefaultCompanyId() ?? '';
        const actor = useAuthStore.getState().user?.email ?? undefined;

        let notificationSent = false;
        if (companyId && form.employeeId) {
          try {
            await sendEmploymentContractCreatedNotification({
              companyId,
              contractId,
              employeeId: form.employeeId,
              contractNumber: form.contractNumber.trim(),
              startDate: form.startDate,
              createdBy: actor,
            });
            notificationSent = true;
          } catch (notifErr) {
            const { displayMessage } = handleApiError(notifErr, 'employment-contract.notification');
            toast.error(`تم إنشاء العقد لكن فشل إرسال الإشعار: ${displayMessage}`);
          }
        }

        toast.success(
          notificationSent
            ? `تم إنشاء العقد كمسودة — وتم إرسال إشعار إلى ${getEmpName(form.employeeId)}.`
            : 'تم إنشاء العقد كمسودة.',
        );
      } else if (panelMode === 'edit' && selected) {
        const ok = await update(selected.id, formToDraft(payload, selected.status));
        if (!ok) { setError('لا يمكن تعديل عقد غير مسودة'); return; }
      }
      closeDrawer();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleActivate = async (id: string) => {
    const res = await activate(id);
    if (!res.ok) toast.error(res.message);
    else {
      toast.success('تم تفعيل العقد.');
      setDetailRefreshKey((k) => k + 1);
    }
  };

  const handleTerminate = async () => {
    if (!terminateId) return;
    const res = await terminate(terminateId, terminateReason);
    if (!res.ok) toast.error(res.message); else toast.success('تم إنهاء العقد.');
    setTerminateId(null); setTerminateReason('');
  };

  const handleArchive = async (id: string) => {
    const res = await archive(id);
    if (!res.ok) toast.error(res.message); else toast.success('تم أرشفة العقد.');
  };

  const patch = (p: Partial<FormValues>) => setForm(f => ({ ...f, ...p }));

  const applyTemplate = async (tplId: string) => {
    if (!tplId) {
      patch({ templateId: '' });
      return;
    }
    setApplyingTemplate(true);
    try {
      const template = await contractTemplatesApi.get(tplId);
      patch(
        applyContractTemplateToForm(template, {
          essentialArticleIds,
          startDate: form.startDate,
        }),
      );
      toast.success(`تم تطبيق قالب «${template.nameAr}» على النموذج`);
    } catch (e) {
      toast.error((e as Error).message || 'تعذّر تحميل القالب');
      patch({ templateId: '' });
    } finally {
      setApplyingTemplate(false);
    }
  };

  React.useEffect(() => {
    if (!form.templateId || !form.startDate || !drawerOpen) return;
    const cached = templates.find((t) => t.id === form.templateId);
    if (!cached?.durationMonths) return;
    const end = computeTemplateEndDate(
      form.contractType,
      cached.durationMonths,
      form.startDate,
    );
    if (end && end !== form.endDate) {
      setForm((f) => ({ ...f, endDate: end }));
    }
  }, [form.startDate, form.templateId, form.contractType, form.endDate, templates, panelMode]);

  const updateAllowanceLine = (idx: number, p: Partial<AllowanceLine>) => {
    setForm(f => ({ ...f, allowanceLines: f.allowanceLines.map((l, i) => i === idx ? { ...l, ...p } : l) }));
  };
  const addAllowanceLine = () => setForm(f => ({ ...f, allowanceLines: [...f.allowanceLines, { allowanceTypeId: '', amount: '' }] }));
  const removeAllowanceLine = (idx: number) => setForm(f => ({
    ...f,
    allowanceLines: f.allowanceLines.length <= 1 ? [{ allowanceTypeId: '', amount: '' }] : f.allowanceLines.filter((_, i) => i !== idx),
  }));

  const toggleArticle = (id: string) => {
    if (essentialArticleIds.includes(id)) return;
    setForm(f => ({
      ...f,
      articleIds: f.articleIds.includes(id)
        ? f.articleIds.filter(x => x !== id)
        : mergeEssentialArticleIds([...f.articleIds, id], essentialArticleIds),
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

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, kindFilter, selectedEmpKey, perPage]);

  const paged = React.useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

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
        trailingActions={undefined}
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
          {c.employeeSigned ? (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:text-success" onClick={() => handleActivate(c.id)}>تفعيل</Button>
          ) : null}
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmDelete(c.id)}>حذف</Button>
        </>
      )}
      {c.status === 'pending_signature' && c.employeeSigned ? (
        <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:text-success" onClick={() => handleActivate(c.id)}>تفعيل</Button>
      ) : null}
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

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد عقود" description="أنشئ عقد عمل جديداً للبدء." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paged.map(c => (
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
              <EmploymentContractSignatureCard
                signed={c.employeeSigned}
                rejectionReason={c.rejectionReason}
                contractStatus={c.status}
                variant="compact"
              />
              <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <ContractActions c={c} />
              </div>
            </div>
          ))}
          </div>
          {total > perPage ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <Pagination
                page={page}
                perPage={perPage}
                total={total}
                onPage={setPage}
                onPerPage={setPerPage}
              />
            </div>
          ) : null}
        </>
      )}

      <EmploymentContractDetailDialog
        contractId={detailContractId}
        open={!!detailContractId}
        onOpenChange={(open) => { if (!open) setDetailContractId(null); }}
        refreshKey={detailRefreshKey}
        onLoaded={syncContractInStore}
        onEditDraft={openEditFromDetail}
        onDownloadPdf={openContractPdfFromRecord}
      />

      <EmploymentContractFormDialog
        open={drawerOpen}
        onOpenChange={(open) => { if (!open) closeDrawer(); }}
        mode={panelMode}
        form={form}
        error={error}
        applyingTemplate={applyingTemplate}
        templateOptions={templateOptions}
        empOptions={empOptions}
        allowanceOptions={allowanceOptions}
        activeArticles={activeArticles}
        essentialArticleIds={essentialArticleIds}
        copyFromEmployeeId={copyFromEmployeeId}
        copyFromContractId={copyFromContractId}
        copySourceEmpOptions={copySourceEmpOptions}
        copySourceContractOptions={copySourceContractOptions}
        getEmpName={getEmpName}
        onSave={() => { void handleSave(); }}
        onPreviewPdf={() => openEmploymentContractPdf()}
        onPatch={patch}
        onApplyTemplate={(id) => { void applyTemplate(id); }}
        onCopyFromEmployeeChange={(id) => { setCopyFromEmployeeId(id); setCopyFromContractId(''); }}
        onCopyFromContractChange={setCopyFromContractId}
        onApplyCopyFromContract={handleApplyCopyFromContract}
        onToggleArticle={toggleArticle}
        onUpdateAllowanceLine={updateAllowanceLine}
        onAddAllowanceLine={addAllowanceLine}
        onRemoveAllowanceLine={removeAllowanceLine}
      />

      <PdfPreviewExportDialog
        open={contractPdfOpen}
        onOpenChange={setContractPdfOpen}
        title="معاينة — عقد العمل الحالي في النموذج"
        fileName={`employment-contract-${(form.contractNumber || 'draft').replace(/[^\w\-]+/g, '_')}.pdf`}
        printable={contractPrintable}
        emptyMessage="تعذر إعداد المعاينة — تحقق من بيانات النموذج."
      />

      {/* Delete */}
      <ConfirmationModal
        open={!!confirmDelete}
        onOpenChange={v => { if (!v) setConfirmDelete(null); }}
        title="حذف العقد"
        description="هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع."
        confirmLabel="حذف" variant="destructive"
        onConfirm={async () => { if (confirmDelete) { await remove(confirmDelete); setConfirmDelete(null); } }}
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
