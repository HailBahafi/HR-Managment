'use client';

import * as React from 'react';
import { Bell, Check, Circle, Eye, EyeOff, FileDown, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/page-title-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/hr-requests/shared-ui';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { NotificationsRegisterPdf } from '@/components/pdf/notifications-register-pdf';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import { MOCK_APP_SESSION } from '@/lib/app-session';
import {
  useHRNotificationsStore,
  type HRNotificationRecord,
} from '@/lib/notifications/notifications-store';
import { data } from '@/lib/data';
import { matchesDateRange } from '@/lib/hr-discipline/discipline-date-filter';
import type { DateFilterTab } from '@/lib/hr-discipline/discipline-date-filter';
import { cn, formatDate } from '@/lib/utils';

type StatusFilter = 'all' | 'unread' | 'read';
type ViewMode = 'cards' | 'list';

const STATUS_ORDER: StatusFilter[] = ['unread', 'read'];
const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'الكل',
  unread: 'غير مقروء',
  read: 'مقروء',
};

const DATE_TAB_LABEL_AR: Record<DateFilterTab, string> = {
  all: 'كل الفترات',
  today: 'اليوم',
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  custom: 'فترة مخصصة',
};

const VIEW_MODE_TAB_CLASS =
  'discipline-toolbar-view-tab h-7 gap-1 px-2.5 text-[11px] transition-all duration-150 data-[state=active]:!font-semibold data-[state=active]:!shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background data-[state=active]:border data-[state=active]:border-primary/35';

function recipientName(employeeId: string, employees: { id: string; nameAr: string }[]) {
  return employees.find((e) => e.id === employeeId)?.nameAr ?? employeeId;
}

function employeePickerShowsAll(
  selected: Set<string>,
  employees: { id: string }[],
): boolean {
  if (selected.size === 0) return true;
  if (employees.length === 0) return true;
  return employees.every((e) => selected.has(e.id));
}

export function NotificationsPage() {
  useSetPageTitle({
    titleAr: 'التنبيهات',
    descriptionAr: MOCK_APP_SESSION.isSystemOwner
      ? 'جميع تنبيهات النظام مع الفلترة'
      : 'تنبيهاتك',
    iconName: 'Bell',
  });

  const session = MOCK_APP_SESSION;
  const { items, markRead, markUnread, dismissFromInbox } = useHRNotificationsStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({
    tab: 'all',
    hasRestriction: false,
  });
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<ViewMode>('cards');
  const [pdfOpen, setPdfOpen] = React.useState(false);

  const empPickerList = React.useMemo(
    () => activeEmployees.map((e) => ({ id: e.id, name: e.nameAr })),
    [activeEmployees],
  );

  const scopedItems = React.useMemo(() => {
    let rows: HRNotificationRecord[] = [...items];

    if (!session.isSystemOwner) {
      rows = rows.filter((r) => r.recipientEmployeeId === session.employeeId && !r.dismissedAt);
    } else {
      if (!employeePickerShowsAll(selectedEmpIds, activeEmployees)) {
        rows = rows.filter((r) => selectedEmpIds.has(r.recipientEmployeeId));
      }
      rows = rows.filter((r) => !r.dismissedAt);
    }

    rows = rows.filter((r) => matchesDateRange(r.createdAt.slice(0, 10), dateBounds.from, dateBounds.to));
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [
    items,
    session.isSystemOwner,
    session.employeeId,
    selectedEmpIds,
    activeEmployees,
    dateBounds.from,
    dateBounds.to,
  ]);

  const statusCounts = React.useMemo(() => {
    const all = scopedItems.length;
    const unread = scopedItems.filter((r) => !r.readAt).length;
    const read = scopedItems.filter((r) => !!r.readAt).length;
    return { all, unread, read };
  }, [scopedItems]);

  const filtered = React.useMemo(() => {
    if (statusFilter === 'unread') return scopedItems.filter((r) => !r.readAt);
    if (statusFilter === 'read') return scopedItems.filter((r) => !!r.readAt);
    return scopedItems;
  }, [scopedItems, statusFilter]);

  const filterSummaryPdf = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(`الفترة: ${DATE_TAB_LABEL_AR[dateMeta.tab]}`);
    parts.push(`الحالة: ${STATUS_LABELS[statusFilter]}`);
    if (session.isSystemOwner) {
      parts.push(
        employeePickerShowsAll(selectedEmpIds, activeEmployees)
          ? 'الموظفون: الجميع'
          : `الموظفون: ${selectedEmpIds.size} محدد`,
      );
    }
    return parts.join(' · ');
  }, [dateMeta.tab, statusFilter, session.isSystemOwner, selectedEmpIds, activeEmployees]);

  const pdfDoc = React.useMemo(() => {
    if (filtered.length === 0) return null;
    const pdfRows = filtered.map((n) => ({
      dateYmd: n.createdAt.slice(0, 10),
      titleAr: n.titleAr,
      recipientNameAr: recipientName(n.recipientEmployeeId, activeEmployees),
      readAr: n.readAt ? 'مقروء' : 'غير مقروء',
      inboxAr: n.dismissedAt ? 'مخفية' : 'ظاهرة',
    }));
    return (
      <NotificationsRegisterPdf
        companyNameAr={data.company.name}
        companyNameEn={data.company.nameEn ?? 'Rose HR'}
        titleAr="تقرير التنبيهات"
        filterSummary={filterSummaryPdf}
        rows={pdfRows}
        includeRecipientColumn={session.isSystemOwner}
      />
    );
  }, [filtered, filterSummaryPdf, activeEmployees, session.isSystemOwner]);

  const openPdf = () => {
    if (filtered.length === 0) {
      toast.error('لا توجد تنبيهات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    setPdfOpen(true);
  };

  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => {
    setDateBounds(b);
  }, []);

  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => {
    setDateMeta(m);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-8" dir="rtl">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير التنبيهات"
        fileName={`notifications-${new Date().toISOString().slice(0, 10)}.pdf`}
        document={pdfDoc}
      />

      <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground leading-tight">تنبيهات الموظفين</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {session.isSystemOwner
                ? 'فلترة بالفترات والحالات والموظفين — التصدير والعرض كما في باقي الوحدات.'
                : 'تنبيهاتك فقط؛ «إزالة من الصندوق» لا تحذف السجل من النظام.'}
            </p>
          </div>
        </div>
      </div>

      <EntityFilterToolbar
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        statusOrder={STATUS_ORDER}
        statusLabels={STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
        showEmployeePicker={session.isSystemOwner}
        trailingActions={
          <>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs shadow-xs" onClick={openPdf}>
              <FileDown className="h-3.5 w-3.5 shrink-0" />
              تصدير PDF
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-8 gap-0.5 bg-muted/70 p-0.5">
                <TabsTrigger value="cards" className={VIEW_MODE_TAB_CLASS}>
                  <LayoutGrid className="h-3 w-3 shrink-0" />
                  بطاقات
                </TabsTrigger>
                <TabsTrigger value="list" className={VIEW_MODE_TAB_CLASS}>
                  <List className="h-3 w-3 shrink-0" />
                  قائمة
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
      />

      {scopedItems.length === 0 ? (
        <EmptyState
          title="لا توجد تنبيهات مطابقة"
          description={
            dateMeta.hasRestriction
              ? 'جرّب توسيع الفترة أو إعادة ضبط الفلاتر من أزرار × بجانب الفترات والحالات.'
              : 'لا توجد بيانات ضمن المعايير الحالية.'
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد تنبيهات بهذه الحالة"
          description={`لا يوجد ما يطابق «${STATUS_LABELS[statusFilter]}» ضمن النتائج الحالية.`}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/25"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    n.readAt
                      ? 'border-success/35 bg-success/10 text-success'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40',
                  )}
                  title={n.readAt ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
                  onClick={() => (n.readAt ? markUnread(n.id) : markRead(n.id))}
                >
                  {n.readAt ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-sm font-semibold leading-snug text-foreground">{n.titleAr}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground tabular-nums" dir="ltr">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              </div>
              {n.bodyAr ? <p className="line-clamp-3 text-xs text-muted-foreground">{n.bodyAr}</p> : null}
              {session.isSystemOwner ? (
                <p className="text-[11px] text-muted-foreground">
                  المستلم:{' '}
                  <span className="font-medium text-foreground">
                    {recipientName(n.recipientEmployeeId, activeEmployees)}
                  </span>
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {n.dismissedAt ? (
                    <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                      <EyeOff className="h-3 w-3" />
                      مخفية من الصندوق
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                      <Eye className="h-3 w-3" />
                      في الصندوق
                    </Badge>
                  )}
                </div>
                {!n.dismissedAt ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => dismissFromInbox(n.id)}
                  >
                    إزالة من الصندوق
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-right">
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">القراءة</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                <th className="p-3 text-xs font-semibold text-muted-foreground">التنبيه</th>
                {session.isSystemOwner ? (
                  <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">المستلم</th>
                ) : null}
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">الصندوق</th>
                <th className="whitespace-nowrap p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="p-3">
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                        n.readAt
                          ? 'border-success/30 bg-success/10 text-success'
                          : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/35',
                      )}
                      title={n.readAt ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
                      onClick={() => (n.readAt ? markUnread(n.id) : markRead(n.id))}
                    >
                      {n.readAt ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs tabular-nums text-muted-foreground" dir="ltr">
                    {formatDate(n.createdAt)}
                  </td>
                  <td className="max-w-[280px] p-3">
                    <p className="font-medium leading-snug">{n.titleAr}</p>
                    {n.bodyAr ? <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.bodyAr}</p> : null}
                  </td>
                  {session.isSystemOwner ? (
                    <td className="whitespace-nowrap p-3 text-xs">{recipientName(n.recipientEmployeeId, activeEmployees)}</td>
                  ) : null}
                  <td className="p-3">
                    {n.dismissedAt ? (
                      <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                        <EyeOff className="h-3 w-3" />
                        مخفية
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                        <Eye className="h-3 w-3" />
                        ظاهرة
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {!n.dismissedAt ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => dismissFromInbox(n.id)}
                      >
                        إزالة من الصندوق
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
