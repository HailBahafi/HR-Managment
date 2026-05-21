'use client';

import * as React from 'react';
import { Trash2, CalendarDays, Megaphone, Send, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageFilters } from '@/components/layouts/filter-panel-context';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { Checkbox } from '@/components/ui/checkbox';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { useDisciplineCircularsDirectoryModel } from '@/features/hr/discipline/circulars/hooks/useDisciplineCircularsDirectoryModel';
import { toCircularAudienceType } from '@/features/hr/discipline/circulars/services/discipline-circulars.service';
import type { HRDisciplineCircularAudience } from '@/features/hr/discipline/lib/types';
import {
  CIRCULAR_AUDIENCE_LABELS,
  CIRCULAR_AUDIENCE_FILTER_ORDER,
} from '@/features/hr/discipline/lib/types';
import type { HRDisciplineCircularRecord } from '@/features/hr/discipline/lib/types';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { DisciplineCircularPrintHtml } from '@/components/pdf/print/discipline-circular-print-html';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { tryBuildCircularAudienceSnapshot } from '@/features/hr/discipline/circulars/utils/build-circular-audience-summary';

const AUDIENCE_OPTIONS = (Object.entries(CIRCULAR_AUDIENCE_LABELS) as [HRDisciplineCircularAudience, string][]).map(
  ([v, l]) => ({ value: v, label: l }),
);

type AudienceFilter = 'all' | HRDisciplineCircularAudience;

interface DraftForm {
  titleAr: string;
  bodyAr: string;
  date: string;
  audience: HRDisciplineCircularAudience;
  branchIds: Set<string>;
  departmentIds: Set<string>;
  targetEmployeeIds: Set<string>;
  /** تنفيذ الإرسال فور الحفظ — الافتراضي لا */
  executeSend: boolean;
}

const EMPTY: DraftForm = {
  titleAr: '',
  bodyAr: '',
  date: new Date().toISOString().slice(0, 10),
  audience: 'all',
  branchIds: new Set(),
  departmentIds: new Set(),
  targetEmployeeIds: new Set(),
  executeSend: false,
};

function IdCheckboxList({
  options,
  selected,
  onSelectedChange,
}: {
  options: { id: string; label: string }[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
}) {
  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };
  return (
    <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/15 p-3">
      {options.map((o) => (
        <label key={o.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox
            checked={selected.has(o.id)}
            onCheckedChange={(v) => toggle(o.id, v === true)}
          />
          <span className="leading-snug">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function circularAppliesToEmployee(
  c: HRDisciplineCircularRecord,
  empId: string,
  branchId: string | null,
  departmentId: string | null,
): boolean {
  switch (c.audience) {
    case 'all':
      return true;
    case 'employees':
      return c.targetEmployeeIds.includes(empId);
    case 'branch':
      if (!branchId) return false;
      return c.branchIds.length > 0 && c.branchIds.includes(branchId);
    case 'department':
      if (!departmentId) return false;
      return c.departmentIds.length > 0 && c.departmentIds.includes(departmentId);
    default:
      return false;
  }
}

function circularMatchesEmpToolbarFilter(
  c: HRDisciplineCircularRecord,
  selectedEmpIds: Set<string>,
  employeeById: Map<string, { branchId: string | null; departmentId: string | null }>,
): boolean {
  if (selectedEmpIds.size === 0) return true;
  for (const empId of selectedEmpIds) {
    const emp = employeeById.get(empId);
    if (!emp) continue;
    if (circularAppliesToEmployee(c, empId, emp.branchId, emp.departmentId)) return true;
  }
  return false;
}

export function CircularsClient() {
  const m = useDisciplineCircularsDirectoryModel();
  const { circulars } = m;

  const { values } = usePageFilters([{ key: 'q', label: 'بحث', type: 'text', placeholder: 'بحث في العنوان أو النص أو النطاق…' }]);
  const q = ((values.q as string) ?? '').trim();
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [audienceFilter, setAudienceFilter] = React.useState<AudienceFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => { setDateBounds(b); }, []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => { setDateMeta(m); }, []);

  const empPickerList = React.useMemo(
    () => m.employees.map((e) => ({ id: e.id, name: e.nameAr })),
    [m.employees],
  );
  const employeeById = React.useMemo(
    () => new Map(m.employees.map((e) => [e.id, e])),
    [m.employees],
  );
  const branchOptions = m.branchOptions;
  const departmentOptions = m.departmentOptions;
  const branchNameById = React.useMemo(
    () => Object.fromEntries(branchOptions.map((o) => [o.value, o.label])),
    [branchOptions],
  );
  const departmentNameById = React.useMemo(
    () => Object.fromEntries(departmentOptions.map((o) => [o.value, o.label])),
    [departmentOptions],
  );

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const [circularPdfOpen, setCircularPdfOpen] = React.useState(false);
  const [circularPrintable, setCircularPrintable] = React.useState<React.ReactElement | null>(null);

  const openCircularPdfPreview = React.useCallback(() => {
    if (!draft.bodyAr.trim()) {
      toast.error('أدخل نص التعميم قبل التصدير');
      return;
    }
    const built = tryBuildCircularAudienceSnapshot(draft, { branchNameById, departmentNameById });
    if (!built.ok) {
      toast.error(built.error);
      return;
    }
    const logo = getPdfLogoSrc();
    const company = m.company
      ? { nameAr: m.company.nameAr, nameEn: m.company.nameEn ?? m.company.nameAr }
      : { nameAr: '—', nameEn: '—' };
    setCircularPrintable(
      <DisciplineCircularPrintHtml
        logoSrc={logo}
        company={company}
        titleAr={draft.titleAr.trim() || 'تعميم'}
        issuedDate={draft.date}
        audienceSummaryAr={built.data.audienceSummaryAr}
        bodyAr={draft.bodyAr.trim()}
        sendFooterAr={draft.executeSend ? `حالة الطباعة: مخطط للإرسال فور الحفظ — ${new Date().toISOString().slice(0, 10)}` : 'مسودة — لم يُرسل بعد'}
      />,
    );
    setCircularPdfOpen(true);
  }, [branchNameById, departmentNameById, draft, m.company]);

  React.useEffect(() => {
    if (!circularPdfOpen) setCircularPrintable(null);
  }, [circularPdfOpen]);

  const searchFiltered = React.useMemo(
    () =>
      circulars.filter((c) => {
        const hay = `${c.titleAr} ${c.bodyAr} ${c.audienceSummaryAr}`;
        const matchQ = !q || hay.includes(q);
        return matchQ && circularMatchesEmpToolbarFilter(c, selectedEmpIds, employeeById);
      }),
    [circulars, employeeById, q, selectedEmpIds],
  );

  const filtered = React.useMemo(
    () => searchFiltered.filter((c) => matchesDateRange(c.date, dateBounds.from, dateBounds.to)),
    [searchFiltered, dateBounds.from, dateBounds.to],
  );

  const listFiltered = React.useMemo(
    () => (audienceFilter === 'all' ? filtered : filtered.filter((c) => c.audience === audienceFilter)),
    [filtered, audienceFilter],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: filtered.length };
    for (const a of CIRCULAR_AUDIENCE_FILTER_ORDER) counts[a] = 0;
    for (const c of filtered) counts[c.audience] = (counts[c.audience] ?? 0) + 1;
    return counts;
  }, [filtered]);

  const dateRangeActive = dateMeta.hasRestriction;

  const set = (patch: Partial<DraftForm>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = async () => {
    setFormError(null);
    if (!draft.bodyAr.trim()) { setFormError('نص التعميم مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    if (!m.companyId) { setFormError('تعذر تحديد الشركة'); return; }

    const built = tryBuildCircularAudienceSnapshot(draft, { branchNameById, departmentNameById });
    if (!built.ok) { setFormError(built.error); return; }

    const { branchIds, departmentIds, targetEmployeeIds } = built.data;

    const audienceType = toCircularAudienceType(draft.audience);
    const audienceTargetIds =
      draft.audience === 'employees'
        ? targetEmployeeIds
        : draft.audience === 'branch'
          ? branchIds
          : draft.audience === 'department'
            ? departmentIds
            : undefined;

    try {
      await m.add({
        companyId: m.companyId,
        titleAr: draft.titleAr.trim() ? draft.titleAr.trim() : null,
        bodyAr: draft.bodyAr.trim(),
        issueDate: draft.date,
        audienceType,
        audienceTargetIds,
        sendOnSave: draft.executeSend,
      });
      toast.success(
        draft.executeSend
          ? 'تم إصدار التعميم وإرساله إلى المستلمين'
          : 'تم حفظ التعميم دون إرسال — يمكنك الإرسال لاحقاً من عرض الجدول',
      );
      setDrawerOpen(false);
      setDraft(EMPTY);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-circulars.save');
      setFormError(displayMessage);
    }
  };

  return (
    <div className="space-y-4">
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        primaryActionLabel="تعميم جديد"
        onPrimaryAction={() => {
          setDraft({ ...EMPTY, date: new Date().toISOString().slice(0, 10), executeSend: false });
          setFormError(null);
          setDrawerOpen(true);
        }}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={audienceFilter}
        onStatusFilterChange={(v) => setAudienceFilter(v as AudienceFilter)}
        statusOrder={CIRCULAR_AUDIENCE_FILTER_ORDER}
        statusLabels={CIRCULAR_AUDIENCE_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />

      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">
          {m.listError}
        </p>
      ) : null}

      {m.loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد تعميمات مطابقة للبحث أو للموظفين المحددين في شريط الفلاتر." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'
              ? 'لا توجد تعميمات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'
                ? 'لا توجد تعميمات ضمن هذا الأسبوع ضمن النتائج الحالية.'
                : dateMeta.tab === 'month'
                  ? 'لا توجد تعميمات ضمن هذا الشهر ضمن النتائج الحالية.'
                  : dateMeta.tab === 'custom' && dateRangeActive
                    ? 'لا توجد تعميمات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
                    : 'لا توجد تعميمات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>
              عرض كل الفترات
            </Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد تعميمات بنطاق «{audienceFilter === 'all' ? '' : CIRCULAR_AUDIENCE_LABELS[audienceFilter]}» مع عوامل البحث الحالية.
          </p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>
            عرض الكل
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map((c) => (
            <div key={c.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    <Megaphone className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    {c.titleAr || 'تعميم'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground" dir="ltr">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {c.date}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="inline-flex max-w-[10rem] items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium leading-tight text-primary">
                    {c.audienceSummaryAr}
                  </span>
                  <span
                    className={
                      c.sentAt
                        ? 'text-[10px] text-muted-foreground'
                        : 'rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200'
                    }
                  >
                    {c.sentAt ? 'مُرسل' : 'لم يُرسل'}
                  </span>
                </div>
              </div>
              <p className="line-clamp-4 text-xs text-muted-foreground">{c.bodyAr}</p>
              <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                {!c.sentAt ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    type="button"
                    onClick={() => {
                      void (async () => {
                        try {
                          await m.markSent(c.id);
                          toast.success('تم إرسال التعميم');
                        } catch (err) {
                          const { displayMessage } = handleApiError(err, 'discipline-circulars.send');
                          toast.error(displayMessage);
                        }
                      })();
                    }}
                  >
                    <Send className="h-3.5 w-3.5" /> إرسال التعميم
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-right">
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">العنوان</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">النطاق</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الإرسال</th>
                <th className="p-3 text-xs font-semibold text-muted-foreground">النص</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {listFiltered.map((c) => (
                <tr key={c.id} className="border-b border-border/70 transition-colors hover:bg-muted/25">
                  <td className="max-w-[12rem] truncate p-3 font-medium">{c.titleAr || '—'}</td>
                  <td className="max-w-[14rem] whitespace-normal p-3 text-xs">{c.audienceSummaryAr}</td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs tabular-nums" dir="ltr">{c.date}</td>
                  <td className="whitespace-nowrap p-3">
                    {c.sentAt ? (
                      <span className="text-xs text-muted-foreground">مُرسل</span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              await m.markSent(c.id);
                              toast.success('تم إرسال التعميم');
                            } catch (err) {
                              const { displayMessage } = handleApiError(err, 'discipline-circulars.send');
                              toast.error(displayMessage);
                            }
                          })();
                        }}
                      >
                        <Send className="h-3 w-3" />
                        إرسال التعميم
                      </Button>
                    )}
                  </td>
                  <td className="max-w-[24rem] truncate p-3 text-xs text-muted-foreground">{c.bodyAr}</td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" type="button" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="تعميم جديد"
        size="lg"
        onSave={() => void handleSave()}
        error={formError}
        footerExtra={(
          <Button type="button" variant="secondary" size="sm" className="gap-1.5 text-xs h-9" onClick={openCircularPdfPreview}>
            <FileDown className="h-3.5 w-3.5 shrink-0" />
            معاينة / تنزيل PDF
          </Button>
        )}
      >
        <FormField label="عنوان التعميم (اختياري)">
          <Input value={draft.titleAr} onChange={(e) => set({ titleAr: e.target.value })} placeholder="مثال: تعميم بخصوص سياسة الحضور…" />
        </FormField>
        <FormField label="نص التعميم" required>
          <textarea
            value={draft.bodyAr}
            onChange={(e) => set({ bodyAr: e.target.value })}
            placeholder="اكتب نص التعميم الذي سيصل إلى الفئة المستهدفة…"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FormField>
        <FormField label="تاريخ الإصدار" required>
          <Input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
        </FormField>
        <FormField label="المستلمون" required>
          <MinimalDropdown
            value={draft.audience}
            onChange={(v) => {
              const next = v as HRDisciplineCircularAudience;
              set({
                audience: next,
                branchIds: new Set(),
                departmentIds: new Set(),
                targetEmployeeIds: new Set(),
              });
            }}
            options={AUDIENCE_OPTIONS}
          />
        </FormField>
        {draft.audience === 'branch' ? (
          <FormField label="الفروع (اختيار متعدد)" required>
            <IdCheckboxList
              options={branchOptions.map((o) => ({ id: o.value, label: o.label }))}
              selected={draft.branchIds}
              onSelectedChange={(s) => set({ branchIds: s })}
            />
          </FormField>
        ) : null}
        {draft.audience === 'department' ? (
          <FormField label="الأقسام (اختيار متعدد)" required>
            <IdCheckboxList
              options={departmentOptions.map((o) => ({ id: o.value, label: o.label }))}
              selected={draft.departmentIds}
              onSelectedChange={(s) => set({ departmentIds: s })}
            />
          </FormField>
        ) : null}
        {draft.audience === 'employees' ? (
          <FormField label="اختيار الموظفين" required>
            <EmployeePicker
              employees={empPickerList}
              selected={draft.targetEmployeeIds}
              onChange={(s) => set({ targetEmployeeIds: s })}
            />
          </FormField>
        ) : null}
        <FormField label="تنفيذ">
          <p className="mb-2 text-[11px] text-muted-foreground">
            الافتراضي: لا إرسال — يُحفظ التعميم فقط حتى تختار الإرسال من هنا أو من عرض الجدول.
          </p>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/10 p-3">
            <Checkbox
              checked={draft.executeSend}
              onCheckedChange={(v) => set({ executeSend: v === true })}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              إرسال التعميم إلى المستلمين فور الحفظ
            </span>
          </label>
        </FormField>
      </HRSettingsFormDrawer>

      <PdfPreviewExportDialog
        open={circularPdfOpen}
        onOpenChange={setCircularPdfOpen}
        title="معاينة — تعميم إداري"
        fileName={`discipline-circular-${draft.date || 'draft'}.pdf`}
        printable={circularPrintable}
        emptyMessage="تعذر إنشاء المعاينة — تحقق من الحقول."
      />

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          void (async () => {
            try {
              await m.remove(deleteId);
              toast.success('تم حذف التعميم');
              setDeleteId(null);
            } catch (err) {
              const { displayMessage } = handleApiError(err, 'discipline-circulars.delete');
              toast.error(displayMessage);
            }
          })();
        }}
        title="حذف التعميم"
      />
    </div>
  );
}
