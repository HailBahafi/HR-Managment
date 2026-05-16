'use client';

import * as React from 'react';
import { FileDown, Rows3, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePageFilters } from '@/components/layouts/filter-panel-context';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import { data } from '@/features/hr/lib/data';
import { useHRDisciplineAuditLogStore } from '@/features/hr/discipline/lib/discipline-audit-log-store';
import type { HRDisciplineAuditAction, HRDisciplineAuditCategory, HRDisciplineAuditLogEntry } from '@/features/hr/discipline/lib/discipline-audit-log';
import {
  AUDIT_ACTION_FILTER_ORDER,
  AUDIT_ACTION_LABELS_AR,
  AUDIT_CATEGORY_LABELS_AR,
} from '@/features/hr/discipline/lib/discipline-audit-log';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import { dateToYMD, matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { DisciplineAuditLogPrintHtml } from '@/components/pdf/print/discipline-audit-log-print-html';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';

type CatFilter = 'all' | HRDisciplineAuditCategory;
type StatusFilter = 'all' | HRDisciplineAuditAction;

function occurredAtToYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return dateToYMD(d);
}

function formatOccurred(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

function SnapshotComparisonTable({ previousSnapshotAr, currentSnapshotAr }: Pick<HRDisciplineAuditLogEntry, 'previousSnapshotAr' | 'currentSnapshotAr'>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[280px] border-collapse text-xs" dir="rtl">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            <th className="w-1/2 p-2.5 text-right font-semibold text-foreground">القيمة السابقة</th>
            <th className="w-1/2 p-2.5 text-right font-semibold text-foreground border-s border-border">القيمة الجديدة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top border-border border-e p-3 whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {previousSnapshotAr?.trim() ? previousSnapshotAr : '—'}
            </td>
            <td className="align-top p-3 whitespace-pre-wrap text-foreground leading-relaxed">
              {currentSnapshotAr?.trim() ? currentSnapshotAr : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CompareToggle({
  expanded,
  onToggle,
  compact,
}: {
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={expanded ? 'secondary' : 'outline'}
      size={compact ? 'sm' : 'default'}
      className={cn('gap-1.5 text-xs', compact ? 'h-8 px-2.5' : 'w-full sm:w-auto')}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      {expanded ? <Rows3 className="size-3.5 shrink-0" /> : <Table2 className="size-3.5 shrink-0" />}
      {expanded ? 'إخفاء جدول المقارنة' : 'عرض جدول المقارنة'}
    </Button>
  );
}

export function DisciplineAuditLogClient() {
  const entries = useHRDisciplineAuditLogStore((s) => s.entries);
  const { values } = usePageFilters([
    { key: 'q', label: 'بحث', type: 'text', placeholder: 'مرجع، اسم المُعدّل، محتوى…' },
  ]);
  const qRaw = (values.q as string) ?? '';
  const q = qRaw.trim().toLowerCase();

  const [catFilter, setCatFilter] = React.useState<CatFilter>('all');
  const [selectedActorIds, setSelectedActorIds] = React.useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('list');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({
    tab: 'all',
    hasRestriction: false,
  });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [expandedSnapshots, setExpandedSnapshots] = React.useState<Set<string>>(() => new Set());

  const toggleSnapshot = React.useCallback((id: string) => {
    setExpandedSnapshots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const actorPickerList = React.useMemo(() => {
    const names = new Set<string>();
    for (const e of entries) {
      if (e.actorNameAr?.trim()) names.add(e.actorNameAr.trim());
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'ar')).map((name) => ({ id: name, name }));
  }, [entries]);

  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => {
    setDateBounds(b);
  }, []);

  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => {
    setDateMeta(m);
  }, []);

  const searchAndActorFiltered = React.useMemo(() => {
    return entries.filter((e) => {
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (selectedActorIds.size > 0 && !selectedActorIds.has(e.actorNameAr.trim())) return false;
      if (!q) return true;
      const hay = [
        e.recordRefAr,
        e.actorNameAr,
        e.recordStatusAfterAr,
        e.previousSnapshotAr,
        e.currentSnapshotAr,
        e.recordId,
        AUDIT_CATEGORY_LABELS_AR[e.category],
        AUDIT_ACTION_LABELS_AR[e.actionType],
      ]
        .join('\n')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, catFilter, selectedActorIds, q]);

  const dateFiltered = React.useMemo(
    () =>
      searchAndActorFiltered.filter((e) =>
        matchesDateRange(occurredAtToYmd(e.occurredAt), dateBounds.from, dateBounds.to),
      ),
    [searchAndActorFiltered, dateBounds.from, dateBounds.to],
  );

  const dateRangeActive = dateMeta.hasRestriction;

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: dateFiltered.length };
    for (const a of AUDIT_ACTION_FILTER_ORDER) counts[a] = 0;
    for (const e of dateFiltered) {
      counts[e.actionType] = (counts[e.actionType] ?? 0) + 1;
    }
    return counts;
  }, [dateFiltered]);

  const listFiltered = React.useMemo(
    () => dateFiltered.filter((e) => statusFilter === 'all' || e.actionType === statusFilter),
    [dateFiltered, statusFilter],
  );

  const pdfRows = React.useMemo(
    () =>
      listFiltered.map((e) => ({
        occurredAtDisplay: formatOccurred(e.occurredAt),
        actorNameAr: e.actorNameAr,
        categoryAr: AUDIT_CATEGORY_LABELS_AR[e.category],
        actionAr: AUDIT_ACTION_LABELS_AR[e.actionType],
        recordRefAr: e.recordRefAr,
        statusAfterAr: e.recordStatusAfterAr,
      })),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      pdfRows.length === 0 ? null : (
        <DisciplineAuditLogPrintHtml
          companyNameAr={data.company.name}
          companyNameEn={data.company.nameEn}
          titleAr="سجل عمليات الانضباط الوظيفي"
          filterSummary={`الفئة: ${catFilter === 'all' ? 'الكل' : AUDIT_CATEGORY_LABELS_AR[catFilter]} · المُعدّلون: ${selectedActorIds.size === 0 ? 'الكل' : `${selectedActorIds.size} محدد`} · نوع العملية: ${statusFilter === 'all' ? 'الكل' : AUDIT_ACTION_LABELS_AR[statusFilter]} · التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}${qRaw.trim() ? ` · بحث: ${qRaw.trim()}` : ''}`}
          rows={pdfRows}
        />
      ),
    [pdfRows, catFilter, selectedActorIds.size, statusFilter, dateBounds.from, dateBounds.to, qRaw],
  );

  const categorySelect = (
    <div className="flex items-center gap-2">
      <label htmlFor="audit-log-category" className="text-[11px] text-muted-foreground whitespace-nowrap">
        فئة السجل
      </label>
      <select
        id="audit-log-category"
        title="فئة السجل"
        aria-label="فئة السجل"
        value={catFilter}
        onChange={(ev) => setCatFilter(ev.target.value as CatFilter)}
        className="h-8 max-w-44 rounded-lg border border-input bg-background px-2 text-xs"
      >
        <option value="all">الكل</option>
        <option value="violation_case">{AUDIT_CATEGORY_LABELS_AR.violation_case}</option>
        <option value="investigation">{AUDIT_CATEGORY_LABELS_AR.investigation}</option>
        <option value="appeal">{AUDIT_CATEGORY_LABELS_AR.appeal}</option>
      </select>
    </div>
  );

  const renderEntryCard = (e: HRDisciplineAuditLogEntry) => {
    const expanded = expandedSnapshots.has(e.id);
    return (
      <article
        key={e.id}
        className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground">{formatOccurred(e.occurredAt)}</p>
            <p className="font-semibold truncate">
              المُعدّل: <span className="font-normal">{e.actorNameAr}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              المرجع: <span className="font-mono text-foreground">{e.recordRefAr}</span>
              <span className="mx-1 text-border">·</span>
              <span className="text-[11px] text-muted-foreground">{e.recordId}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium">
              {AUDIT_CATEGORY_LABELS_AR[e.category]}
            </span>
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {AUDIT_ACTION_LABELS_AR[e.actionType]}
            </span>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-1">حالة السجل بعد العملية</p>
          <p className="text-sm rounded-lg bg-muted/50 border border-border px-3 py-2">{e.recordStatusAfterAr}</p>
        </div>
        <CompareToggle expanded={expanded} onToggle={() => toggleSnapshot(e.id)} />
        {expanded ? (
          <SnapshotComparisonTable previousSnapshotAr={e.previousSnapshotAr} currentSnapshotAr={e.currentSnapshotAr} />
        ) : (
          <p className="text-[11px] text-muted-foreground border border-dashed border-border/70 rounded-lg px-3 py-2 bg-muted/15">
            القيم السابقة والجديدة مخفية. استخدم «عرض جدول المقارنة» لإظهارها في جدول.
          </p>
        )}
      </article>
    );
  };

  const renderEntryList = (e: HRDisciplineAuditLogEntry) => {
    const expanded = expandedSnapshots.has(e.id);
    return (
      <React.Fragment key={e.id}>
        <tr className="border-b border-border/80 hover:bg-muted/25 transition-colors">
          <td className="p-2.5 align-middle text-xs whitespace-nowrap">{formatOccurred(e.occurredAt)}</td>
          <td className="p-2.5 align-middle text-xs font-medium max-w-[140px] truncate" title={e.actorNameAr}>
            {e.actorNameAr}
          </td>
          <td className="p-2.5 align-middle text-[11px]">{AUDIT_CATEGORY_LABELS_AR[e.category]}</td>
          <td className="p-2.5 align-middle text-[11px] text-primary font-medium">{AUDIT_ACTION_LABELS_AR[e.actionType]}</td>
          <td className="p-2.5 align-middle font-mono text-[11px]">{e.recordRefAr}</td>
          <td className="p-2.5 align-middle text-xs text-muted-foreground max-w-[220px]">
            <span className="line-clamp-2" title={e.recordStatusAfterAr}>{e.recordStatusAfterAr}</span>
          </td>
          <td className="p-2 align-middle whitespace-nowrap">
            <CompareToggle compact expanded={expanded} onToggle={() => toggleSnapshot(e.id)} />
          </td>
        </tr>
        {expanded ? (
          <tr className="border-b border-border bg-muted/15">
            <td colSpan={7} className="p-3">
              <SnapshotComparisonTable previousSnapshotAr={e.previousSnapshotAr} currentSnapshotAr={e.currentSnapshotAr} />
            </td>
          </tr>
        ) : null}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير سجل العمليات"
        fileName="discipline-audit-log.pdf"
        printable={printable}
      />

      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel=""
        onPrimaryAction={() => {}}
        beforeEmployeePicker={categorySelect}
        toolbarExtraTrailing={(
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => {
              if (pdfRows.length === 0) {
                toast.error('لا توجد عمليات للتصدير ضمن الفلاتر الحالية.');
                return;
              }
              setPdfOpen(true);
            }}
          >
            <FileDown className="h-3.5 w-3.5" />
            تصدير PDF
          </Button>
        )}
        empPickerEmployees={actorPickerList}
        selectedEmpIds={selectedActorIds}
        onSelectedEmpIdsChange={setSelectedActorIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        statusOrder={AUDIT_ACTION_FILTER_ORDER}
        statusLabels={AUDIT_ACTION_LABELS_AR as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />

      <p className="text-xs text-muted-foreground px-0.5">
        عرض فقط — سجل مرجعي للعمليات على المخالفات والتحقيقات والتظلمات. القيم التفصيلية السابقة والجديدة تظهر عند الطلب من جدول المقارنة.
      </p>

      {searchAndActorFiltered.length === 0 ? (
        <EmptyState title="لا توجد عمليات مطابقة للبحث أو المُعدّلين أو الفئة." />
      ) : dateFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center px-4">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'
              ? 'لا توجد عمليات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'
                ? 'لا توجد عمليات ضمن هذا الأسبوع ضمن النتائج الحالية.'
                : dateMeta.tab === 'month'
                  ? 'لا توجد عمليات ضمن هذا الشهر ضمن النتائج الحالية.'
                  : dateMeta.tab === 'custom' && dateRangeActive
                    ? 'لا توجد عمليات ضمن نطاق التاريخ المخصص.'
                    : 'لا توجد عمليات ضمن الفترة المحددة.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>
              عرض كل الفترات
            </Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <EmptyState title="لا توجد عمليات مطابقة لنوع العملية المحدد." />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listFiltered.map(renderEntryCard)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full min-w-[860px] border-collapse text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="p-2.5 text-right font-semibold">التاريخ والوقت</th>
                <th className="p-2.5 text-right font-semibold">المُعدّل</th>
                <th className="p-2.5 text-right font-semibold">الفئة</th>
                <th className="p-2.5 text-right font-semibold">العملية</th>
                <th className="p-2.5 text-right font-semibold">المرجع</th>
                <th className="p-2.5 text-right font-semibold">الحالة بعد العملية</th>
                <th className="p-2.5 text-right font-semibold w-[140px]">المقارنة</th>
              </tr>
            </thead>
            <tbody>{listFiltered.map(renderEntryList)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
