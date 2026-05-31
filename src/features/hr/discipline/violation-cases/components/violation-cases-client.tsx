'use client';

import * as React from 'react';
import {
  Trash2, CalendarDays, Eye, CheckCircle2, XCircle, Edit3,
  FileDown, FileSpreadsheet, Plus, AlertTriangle, Scale, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parse, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField, EmptyState, SearchableDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useViolationCasesDirectoryModel } from '@/features/hr/discipline/violation-cases/hooks/useViolationCasesDirectoryModel';
import type { ViolationCaseRecord } from '@/features/hr/discipline/violation-cases/hooks/useViolationCasesDirectoryModel';
import type { ViolationRecordStatus } from '@/features/hr/discipline/lib/api/violation-records';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { companiesApi } from '@/features/hr/lib/api/companies';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { ViolationCasesRegisterPrintHtml } from '@/components/pdf/print/violation-cases-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { disciplineNoticesApi } from '@/features/hr/discipline/lib/api/discipline-notices';
import { disciplineInvestigationsApi } from '@/features/hr/discipline/lib/api/discipline-investigations';
import { disciplineAppealsApi } from '@/features/hr/discipline/lib/api/discipline-appeals';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  DirectoryTableContainer, DirectoryTable, DirectoryTableHeaderRow, DirectoryTableHead,
  DirectoryTableBody, DirectoryTableRow, DirectoryTableCell, DirectoryTableActionsCell,
} from '@/components/ui/directory-table';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ViolationRecordStatus, string> = {
  pending:    'قيد الانتظار',
  approved:   'معتمد',
  rejected:   'مرفوض',
  needs_edit: 'يحتاج تعديل',
};

const STATUS_COLORS: Record<ViolationRecordStatus, string> = {
  pending:    'text-primary border-primary/25 bg-primary/5',
  approved:   'text-success border-success/30 bg-success/10',
  rejected:   'text-destructive border-destructive/30 bg-destructive/10',
  needs_edit: 'text-warning border-warning/30 bg-warning/10',
};

const STATUS_ORDER: readonly ViolationRecordStatus[] = ['pending', 'approved', 'rejected', 'needs_edit'];
type StatusFilter = 'all' | ViolationRecordStatus;

// ─── Notice dialog (إنذار) ────────────────────────────────────────────────────

type NoticeKind = 'verbal' | 'first' | 'second' | 'final';
const NOTICE_KIND_LABELS: Record<NoticeKind, string> = {
  verbal: 'شفهي', first: 'إنذار أول', second: 'إنذار ثاني', final: 'إنذار نهائي',
};

function NoticeDialog({
  open, onClose, violationCase, companyId,
}: {
  open: boolean; onClose: () => void;
  violationCase: ViolationCaseRecord | null;
  companyId: string;
}) {
  const [kind, setKind] = React.useState<NoticeKind>('first');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setKind('first');
      setDate(new Date().toISOString().slice(0, 10));
      setReason(violationCase ? `مخالفة: ${violationCase.typeNameAr} — ${violationCase.caseNumber}` : '');
    }
  }, [open, violationCase]);

  const handleSave = async () => {
    if (!violationCase || !companyId) return;
    setSaving(true);
    try {
      await disciplineNoticesApi.create({
        companyId,
        employeeId: violationCase.employeeId,
        noticeKind: kind,
        reasonAr: reason.trim() || `مخالفة: ${violationCase.typeNameAr}`,
        noticeDate: date,
        violationRecordId: violationCase.id,
      });
      toast.success('تم إنشاء الإنذار');
      onClose();
    } catch { toast.error('فشل إنشاء الإنذار'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            إصدار إنذار
          </DialogTitle>
          <DialogDescription className="text-right text-xs text-muted-foreground">
            {violationCase?.caseNumber} · {violationCase?.employeeNameAr}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <FormField label="نوع الإنذار" required>
            <Select value={kind} onValueChange={(v) => setKind(v as NoticeKind)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(NOTICE_KIND_LABELS) as [NoticeKind, string][]).map(([k, l]) => (
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="تاريخ الإنذار" required>
            <DatePickerInput value={date} onChange={setDate} />
          </FormField>
          <FormField label="سبب الإنذار" required>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FormField>
        </div>
        <DialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            إصدار الإنذار
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Investigation dialog (تحقيق) ────────────────────────────────────────────

function InvestigationDialog({
  open, onClose, violationCase, companyId, employees,
}: {
  open: boolean; onClose: () => void;
  violationCase: ViolationCaseRecord | null;
  companyId: string;
  employees: { id: string; nameAr: string }[];
}) {
  const [investigatorId, setInvestigatorId] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [statement, setStatement] = React.useState('');
  const [result, setResult] = React.useState<'proven' | 'not_proven'>('proven');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) { setInvestigatorId(''); setDate(new Date().toISOString().slice(0, 10)); setStatement(''); setResult('proven'); }
  }, [open]);

  const empOptions = employees.map((e) => ({ value: e.id, label: e.nameAr }));

  const handleSave = async () => {
    if (!violationCase || !companyId || !investigatorId) {
      toast.error('يرجى اختيار المحقق');
      return;
    }
    setSaving(true);
    try {
      await disciplineInvestigationsApi.create({
        companyId,
        violationRecordId: violationCase.id,
        investigatorEmployeeId: investigatorId,
        investigationDate: date,
        employeeStatement: statement.trim() || null,
        result,
      });
      toast.success('تم إنشاء التحقيق');
      onClose();
    } catch { toast.error('فشل إنشاء التحقيق'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right text-base">
            <Search className="h-4 w-4 text-blue-500" />
            فتح تحقيق
          </DialogTitle>
          <DialogDescription className="text-right text-xs text-muted-foreground">
            {violationCase?.caseNumber} · {violationCase?.employeeNameAr}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <FormField label="المحقق" required>
            <SearchableDropdown value={investigatorId} onChange={setInvestigatorId} options={empOptions} placeholder="اختر المحقق…" />
          </FormField>
          <FormField label="تاريخ التحقيق" required>
            <DatePickerInput value={date} onChange={setDate} />
          </FormField>
          <FormField label="نتيجة التحقيق" required>
            <Select value={result} onValueChange={(v) => setResult(v as 'proven' | 'not_proven')}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="proven">ثابتة</SelectItem>
                <SelectItem value="not_proven">غير ثابتة</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="أقوال الموظف">
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="اختياري…"
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FormField>
        </div>
        <DialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            فتح التحقيق
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Appeal dialog (تظلم) ─────────────────────────────────────────────────────

function AppealDialog({
  open, onClose, violationCase, companyId,
}: {
  open: boolean; onClose: () => void;
  violationCase: ViolationCaseRecord | null;
  companyId: string;
}) {
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [grounds, setGrounds] = React.useState('');
  const [channel, setChannel] = React.useState<string>('written');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) { setDate(new Date().toISOString().slice(0, 10)); setGrounds(''); setChannel('written'); }
  }, [open]);

  const handleSave = async () => {
    if (!violationCase || !companyId) return;
    if (!grounds.trim()) { toast.error('أسباب التظلم مطلوبة'); return; }
    setSaving(true);
    try {
      await disciplineAppealsApi.create({
        companyId,
        violationRecordId: violationCase.id,
        appealDate: date,
        groundsAr: grounds.trim(),
        channel: channel as 'in_person' | 'written' | 'email' | 'phone' | 'system',
        status: 'pending',
      });
      toast.success('تم تقديم التظلم');
      onClose();
    } catch { toast.error('فشل تقديم التظلم'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right text-base">
            <Scale className="h-4 w-4 text-violet-500" />
            تقديم تظلم
          </DialogTitle>
          <DialogDescription className="text-right text-xs text-muted-foreground">
            {violationCase?.caseNumber} · {violationCase?.employeeNameAr}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <FormField label="تاريخ التظلم" required>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn('w-full justify-start gap-2 text-sm', !date && 'text-muted-foreground')}
                >
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  {date
                    ? (() => {
                        const d = parse(date, 'yyyy-MM-dd', new Date());
                        return isValid(d) ? format(d, 'dd MMMM yyyy', { locale: arSA }) : date;
                      })()
                    : 'اختر التاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={(() => {
                    const d = parse(date, 'yyyy-MM-dd', new Date());
                    return isValid(d) ? d : undefined;
                  })()}
                  onSelect={(day) => { if (day) setDate(format(day, 'yyyy-MM-dd')); }}
                  defaultMonth={(() => {
                    const d = parse(date, 'yyyy-MM-dd', new Date());
                    return isValid(d) ? d : new Date();
                  })()}
                />
              </PopoverContent>
            </Popover>
          </FormField>
          <FormField label="قناة التظلم">
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="written">خطي</SelectItem>
                <SelectItem value="in_person">شخصي</SelectItem>
                <SelectItem value="email">بريد إلكتروني</SelectItem>
                <SelectItem value="phone">هاتف</SelectItem>
                <SelectItem value="system">النظام</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="أسباب التظلم" required>
            <textarea
              value={grounds}
              onChange={(e) => setGrounds(e.target.value)}
              placeholder="اكتب أسباب التظلم…"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FormField>
        </div>
        <DialogFooter className="gap-2 sm:flex-row-reverse sm:justify-start">
          <Button variant="luxe" onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            تقديم التظلم
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Type requirement badges ──────────────────────────────────────────────────

function TypeRequirementBadges({ needsWarning, needsInvestigation }: { needsWarning: boolean; needsInvestigation: boolean }) {
  if (!needsWarning && !needsInvestigation) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {needsInvestigation && (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
          <Search className="h-3 w-3" />
          يحتاج تحقيق
        </span>
      )}
      {needsWarning && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          يحتاج إنذار
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CreateForm {
  employeeId: string; date: string; violationTypeId: string;
  description: string; notes: string; attachmentsNote: string;
}
const CREATE_EMPTY: CreateForm = { employeeId: '', date: '', violationTypeId: '', description: '', notes: '', attachmentsNote: '' };

interface EditForm { date: string; description: string; notes: string; attachmentsNote: string; }

export function ViolationCasesClient() {
  const hook = useViolationCasesDirectoryModel();
  const { cases, employees, violationTypes, loading, listError, createCase, updateCase, decideCase, deleteCase, reload } = hook;
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';

  const [companyNameAr, setCompanyNameAr] = React.useState('');
  const [companyNameEn, setCompanyNameEn] = React.useState('');
  React.useEffect(() => {
    void (async () => {
      try {
        const res = await companiesApi.getAll({ limit: 1 });
        const c = res.items[0];
        if (c) { setCompanyNameAr(c.nameAr); setCompanyNameEn(c.nameEn ?? ''); }
      } catch { /* ignore */ }
    })();
  }, []);

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);

  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CreateForm>(CREATE_EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [viewCase, setViewCase] = React.useState<ViolationCaseRecord | null>(null);
  const [editCase, setEditCase] = React.useState<ViolationCaseRecord | null>(null);
  const [editForm, setEditForm] = React.useState<EditForm>({ date: '', description: '', notes: '', attachmentsNote: '' });
  const [editSaving, setEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [rejectCase, setRejectCase] = React.useState<ViolationCaseRecord | null>(null);
  const [rejectNote, setRejectNote] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Post-create action dialogs
  const [noticeCase, setNoticeCase] = React.useState<ViolationCaseRecord | null>(null);
  const [investigationCase, setInvestigationCase] = React.useState<ViolationCaseRecord | null>(null);
  const [appealCase, setAppealCase] = React.useState<ViolationCaseRecord | null>(null);

  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => setDateBounds(b), []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => setDateMeta(m), []);

  // Selected type flags for the create form
  const selectedType = React.useMemo(
    () => violationTypes.find((t) => t.id === draft.violationTypeId) ?? null,
    [violationTypes, draft.violationTypeId],
  );

  const empPickerList = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cases) map.set(c.employeeId, c.employeeNameAr);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [cases]);

  // Debounced backend fetch whenever employee or date filters change
  const dateDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;
    if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
    dateDebounceRef.current = setTimeout(() => {
      void reload({
        employeeId,
        violationDateFrom: dateBounds.from || undefined,
        violationDateTo: dateBounds.to || undefined,
      });
    }, 400);
    return () => { if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmpIds, dateBounds.from, dateBounds.to]);

  // Status filter applied locally (API doesn't support it)
  const listFiltered = React.useMemo(
    () => (statusFilter === 'all' ? cases : cases.filter((c) => c.status === statusFilter)),
    [cases, statusFilter],
  );
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: cases.length };
    for (const s of STATUS_ORDER) counts[s] = 0;
    for (const c of cases) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, [cases]);

  const dateRangeActive = dateMeta.hasRestriction;
  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => { setDraft(CREATE_EMPTY); setFormError(null); setCreateOpen(true); }}>
          <Plus className="h-3.5 w-3.5" />
          مخالفة جديدة
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const violationPdfRows = React.useMemo(
    () => listFiltered.map((c) => ({
      caseNumber: c.caseNumber, employeeNameAr: c.employeeNameAr,
      typeNameAr: c.typeNameAr, date: c.date,
      statusAr: STATUS_LABELS[c.status], description: c.description,
    })),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      violationPdfRows.length === 0 ? null : (
        <ViolationCasesRegisterPrintHtml
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn}
          titleAr="سجل مخالفات الموظفين"
          filterSummary={`الموظفون: ${selectedEmpIds.size === 0 ? 'الكل' : `${selectedEmpIds.size} محدد`} · الحالة: ${statusFilter === 'all' ? 'الكل' : STATUS_LABELS[statusFilter as ViolationRecordStatus]} · التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`}
          rows={violationPdfRows}
        />
      ),
    [violationPdfRows, selectedEmpIds.size, statusFilter, dateBounds.from, dateBounds.to],
  );

  const handleExportExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) { toast.error('لا توجد مخالفات للتصدير ضمن الفلاتر الحالية.'); return; }
    const rows: XlsxCell[][] = [
      ['رقم القضية', 'الموظف', 'نوع المخالفة', 'التاريخ', 'الحالة', 'الوصف'],
      ...listFiltered.map((c) => [c.caseNumber, c.employeeNameAr, c.typeNameAr, c.date, STATUS_LABELS[c.status], c.description]),
    ];
    await downloadXlsxFromAoA('violation-cases.xlsx', 'المخالفات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const empOptions = employees.map(e => ({ value: e.id, label: e.nameAr }));
  const typeOptions = violationTypes.filter(t => t.isActive).map(t => ({ value: t.id, label: t.nameAr, sub: t.code }));
  const setD = (patch: Partial<CreateForm>) => setDraft(d => ({ ...d, ...patch }));

  // After creating a violation, check if type needs notice/investigation and prompt
  const handleCreate = async () => {
    setFormError(null);
    if (!draft.employeeId)         { setFormError('الموظف مطلوب'); return; }
    if (!draft.violationTypeId)    { setFormError('نوع المخالفة مطلوب'); return; }
    if (!draft.date)               { setFormError('التاريخ مطلوب'); return; }
    if (!draft.description.trim()) { setFormError('الوصف مطلوب'); return; }
    setSaving(true);
    try {
      await createCase({
        employeeId: draft.employeeId,
        violationTypeId: draft.violationTypeId,
        date: draft.date,
        description: draft.description,
        notes: draft.notes || null,
        attachmentsNote: draft.attachmentsNote || null,
      });
      toast.success('تم حفظ المخالفة');
      setCreateOpen(false);

      // After save, reload gives us the new case — find it from the updated list
      // We use a small delay then open the contextual dialog
      const type = violationTypes.find((t) => t.id === draft.violationTypeId);
      if (type?.needsInvestigation || type?.needsWarning) {
        toast.info(
          type.needsInvestigation && type.needsWarning
            ? 'هذا النوع يتطلب تحقيقاً وإنذاراً — يمكنك إضافتهما من البطاقة'
            : type.needsInvestigation
              ? 'هذا النوع يتطلب فتح تحقيق — يمكنك إضافته من البطاقة'
              : 'هذا النوع يتطلب إصدار إنذار — يمكنك إضافته من البطاقة',
          { duration: 5000 },
        );
      }
      setDraft(CREATE_EMPTY);
    } catch {
      setFormError('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: ViolationCaseRecord) => {
    setEditCase(c);
    setEditForm({ date: c.date, description: c.description, notes: c.notes ?? '', attachmentsNote: c.attachmentsNote ?? '' });
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!editCase) return;
    setEditError(null);
    if (!editForm.description.trim()) { setEditError('الوصف مطلوب'); return; }
    setEditSaving(true);
    try {
      await updateCase(editCase.id, {
        violationDate: editForm.date,
        description: editForm.description,
        notes: editForm.notes || null,
        attachmentsNote: editForm.attachmentsNote || null,
      });
      toast.success('تم تحديث المخالفة');
      setEditCase(null);
    } catch {
      setEditError('حدث خطأ أثناء الحفظ');
    } finally {
      setEditSaving(false);
    }
  };

  const handleApprove = async (c: ViolationCaseRecord) => {
    try { await decideCase(c.id, { decision: 'approve' }); toast.success(`تمت الموافقة على ${c.caseNumber}`); }
    catch { toast.error('فشلت الموافقة'); }
  };

  const handleReject = async () => {
    if (!rejectCase) return;
    try {
      await decideCase(rejectCase.id, { decision: 'reject', notes: rejectNote.trim() || null });
      toast.success('تم رفض المخالفة');
    } catch { toast.error('فشل الرفض'); }
    setRejectCase(null);
    setRejectNote('');
  };

  // Get the type info for a given case (from violationTypes list)
  const typeFor = (c: ViolationCaseRecord) => violationTypes.find((t) => t.id === c.violationTypeId);

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel="مخالفة جديدة"
        onPrimaryAction={() => { setDraft(CREATE_EMPTY); setFormError(null); setCreateOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
              onClick={() => { if (violationPdfRows.length === 0) { toast.error('لا توجد مخالفات للتصدير ضمن الفلاتر الحالية.'); return; } setPdfOpen(true); }}>
              <FileDown className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
          </>
        )}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        statusOrder={STATUS_ORDER}
        statusLabels={STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [empPickerList, selectedEmpIds, statusFilter, statusCounts, viewMode, violationPdfRows, onDateBoundsChange, onDateFilterMetaChange],
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl border border-border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (listError) {
    return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">{listError}</div>;
  }

  return (
    <div className="space-y-4">
      <PdfPreviewExportDialog open={pdfOpen} onOpenChange={setPdfOpen} title="معاينة تصدير سجل المخالفات" fileName="violation-cases.pdf" printable={printable} />

      {cases.length === 0 && !loading ? (
        <EmptyState title="لا توجد مخالفات مطابقة للفلاتر المحددة." />
      ) : listFiltered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد مخالفات بحالة «{STATUS_LABELS[statusFilter as ViolationRecordStatus]}».
          </p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>عرض الكل</Button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listFiltered.map((c) => {
            const type = typeFor(c);
            return (
              <div key={c.id} className="flex flex-col space-y-3 rounded-xl border border-border bg-card p-5 shadow-soft">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold text-muted-foreground" dir="ltr">{c.caseNumber}</p>
                    <p className="mt-0.5 truncate font-semibold">{c.employeeNameAr}</p>
                  </div>
                  <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[c.status])}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>

                {/* Type chip + date + requirement badges */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground truncate max-w-[10rem]">
                      {c.typeNameAr}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground tabular-nums" dir="ltr">
                      <CalendarDays className="h-3 w-3 shrink-0" />{c.date}
                    </span>
                  </div>
                  {type && (
                    <TypeRequirementBadges needsWarning={type.needsWarning} needsInvestigation={type.needsInvestigation} />
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
                  <Button variant="ghost" size="sm" type="button" className="h-8 gap-1 px-2 text-xs" onClick={() => setViewCase(c)}>
                    <Eye className="h-3.5 w-3.5" /> عرض
                  </Button>
                  <Button variant="ghost" size="sm" type="button"
                    className="h-8 gap-1 px-2 text-xs text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                    onClick={() => void handleApprove(c)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                  </Button>
                  <Button variant="ghost" size="sm" type="button"
                    className="h-8 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => { setRejectNote(''); setRejectCase(c); }}>
                    <XCircle className="h-3.5 w-3.5" /> رفض
                  </Button>
                  <Button variant="ghost" size="sm" type="button"
                    className="h-8 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                    onClick={() => openEdit(c)}>
                    <Edit3 className="h-3.5 w-3.5" /> تعديل
                  </Button>
                </div>

                {/* Contextual action row: إنذار / تحقيق / تظلم */}
                <div className="flex flex-wrap gap-1">
                  {type?.needsWarning && (
                    <Button variant="outline" size="sm" type="button"
                      className="h-7 gap-1 border-amber-500/30 px-2 text-[11px] text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                      onClick={() => setNoticeCase(c)}>
                      <AlertTriangle className="h-3 w-3" /> إنذار
                    </Button>
                  )}
                  {type?.needsInvestigation && (
                    <Button variant="outline" size="sm" type="button"
                      className="h-7 gap-1 border-blue-500/30 px-2 text-[11px] text-blue-700 hover:bg-blue-500/10 dark:text-blue-400"
                      onClick={() => setInvestigationCase(c)}>
                      <Search className="h-3 w-3" /> تحقيق
                    </Button>
                  )}
                  <Button variant="outline" size="sm" type="button"
                    className="h-7 gap-1 border-violet-500/30 px-2 text-[11px] text-violet-700 hover:bg-violet-500/10 dark:text-violet-400"
                    onClick={() => setAppealCase(c)}>
                    <Scale className="h-3 w-3" /> تظلم
                  </Button>
                </div>

                {/* Footer: delete */}
                <div className="mt-auto flex justify-end border-t border-border pt-3">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DirectoryTableContainer>
          <DirectoryTable className="min-w-[900px]">
            <DirectoryTableHeaderRow>
              <DirectoryTableHead className="whitespace-nowrap">الرقم</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">الموظف</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">نوع المخالفة</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">التاريخ</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">الحالة</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">المتطلبات</DirectoryTableHead>
              <DirectoryTableHead className="whitespace-nowrap">إجراءات</DirectoryTableHead>
            </DirectoryTableHeaderRow>
            <DirectoryTableBody>
              {listFiltered.map((c) => {
                const type = typeFor(c);
                return (
                  <DirectoryTableRow key={c.id}>
                    <DirectoryTableCell className="font-mono text-xs font-medium tabular-nums text-muted-foreground" dir="ltr">{c.caseNumber}</DirectoryTableCell>
                    <DirectoryTableCell className="max-w-[10rem] truncate font-medium">{c.employeeNameAr}</DirectoryTableCell>
                    <DirectoryTableCell className="max-w-[9rem] truncate text-xs text-muted-foreground">{c.typeNameAr}</DirectoryTableCell>
                    <DirectoryTableCell className="whitespace-nowrap font-mono text-xs tabular-nums" dir="ltr">{c.date}</DirectoryTableCell>
                    <DirectoryTableCell>
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[c.status])}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </DirectoryTableCell>
                    <DirectoryTableCell>
                      <div className="flex flex-wrap gap-1">
                        {type?.needsInvestigation && (
                          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-[9px] text-blue-700 dark:text-blue-400">تحقيق</Badge>
                        )}
                        {type?.needsWarning && (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[9px] text-amber-700 dark:text-amber-400">إنذار</Badge>
                        )}
                      </div>
                    </DirectoryTableCell>
                    <DirectoryTableActionsCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" type="button" onClick={() => setViewCase(c)}>
                          <Eye className="h-3.5 w-3.5" /> عرض
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-emerald-700 hover:bg-emerald-500/10" type="button" onClick={() => void handleApprove(c)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> موافقة
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10" type="button" onClick={() => { setRejectNote(''); setRejectCase(c); }}>
                          <XCircle className="h-3.5 w-3.5" /> رفض
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-500/10" type="button" onClick={() => openEdit(c)}>
                          <Edit3 className="h-3.5 w-3.5" /> تعديل
                        </Button>
                        {type?.needsWarning && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-amber-700 hover:bg-amber-500/10" type="button" onClick={() => setNoticeCase(c)}>
                            <AlertTriangle className="h-3 w-3" /> إنذار
                          </Button>
                        )}
                        {type?.needsInvestigation && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-blue-700 hover:bg-blue-500/10" type="button" onClick={() => setInvestigationCase(c)}>
                            <Search className="h-3 w-3" /> تحقيق
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] text-violet-700 hover:bg-violet-500/10" type="button" onClick={() => setAppealCase(c)}>
                          <Scale className="h-3 w-3" /> تظلم
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" type="button" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </DirectoryTableActionsCell>
                  </DirectoryTableRow>
                );
              })}
            </DirectoryTableBody>
          </DirectoryTable>
        </DirectoryTableContainer>
      )}

      {/* ── Create Drawer ── */}
      <HRSettingsFormDrawer open={createOpen} onOpenChange={setCreateOpen} title="مخالفة جديدة" size="lg"
        onSave={() => void handleCreate()} saveDisabled={saving} error={formError}>
        <FormField label="الموظف" required>
          <SearchableDropdown value={draft.employeeId} onChange={v => setD({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
        </FormField>
        <FormField label="نوع المخالفة" required>
          <SearchableDropdown value={draft.violationTypeId} onChange={v => setD({ violationTypeId: v })} options={typeOptions} placeholder="اختر نوع المخالفة…" />
        </FormField>

        {/* Live type requirement indicators */}
        {selectedType && (selectedType.needsWarning || selectedType.needsInvestigation) && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">هذا النوع يتطلب:</p>
            <TypeRequirementBadges needsWarning={selectedType.needsWarning} needsInvestigation={selectedType.needsInvestigation} />
            <p className="text-[11px] text-muted-foreground">سيمكنك إضافتها بعد حفظ المخالفة من البطاقة.</p>
          </div>
        )}

        <FormField label="تاريخ المخالفة" required>
          <DatePickerInput value={draft.date} onChange={(ymd) => setD({ date: ymd })} />
        </FormField>
        <FormField label="الوصف" required>
          <textarea value={draft.description} onChange={e => setD({ description: e.target.value })} placeholder="اكتب وصف المخالفة…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظات">
          <textarea value={draft.notes} onChange={e => setD({ notes: e.target.value })} placeholder="ملاحظات إضافية…"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={draft.attachmentsNote} onChange={e => setD({ attachmentsNote: e.target.value })} placeholder="وصف المستندات المرفقة…" />
        </FormField>
      </HRSettingsFormDrawer>

      {/* ── Edit Drawer ── */}
      <HRSettingsFormDrawer open={!!editCase} onOpenChange={v => !v && setEditCase(null)}
        title={`تعديل: ${editCase?.caseNumber ?? ''}`} size="lg"
        onSave={() => void handleEdit()} saveDisabled={editSaving} error={editError}>
        <FormField label="تاريخ المخالفة" required>
          <DatePickerInput value={editForm.date} onChange={(ymd) => setEditForm(f => ({ ...f, date: ymd }))} />
        </FormField>
        <FormField label="الوصف" required>
          <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف المخالفة…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظات">
          <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية…"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={editForm.attachmentsNote} onChange={e => setEditForm(f => ({ ...f, attachmentsNote: e.target.value }))} placeholder="وصف المستندات المرفقة…" />
        </FormField>
      </HRSettingsFormDrawer>

      {/* ── View Dialog ── */}
      <Dialog open={!!viewCase} onOpenChange={v => !v && setViewCase(null)}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{viewCase?.caseNumber}</DialogTitle>
            <DialogDescription className="sr-only">تفاصيل المخالفة</DialogDescription>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">الموظف</span><p className="font-medium">{viewCase.employeeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">نوع المخالفة</span><p className="font-medium">{viewCase.typeNameAr}</p></div>
                <div><span className="text-muted-foreground text-xs">التاريخ</span><p>{viewCase.date}</p></div>
                <div>
                  <span className="text-muted-foreground text-xs">الحالة</span>
                  <p><span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', STATUS_COLORS[viewCase.status])}>{STATUS_LABELS[viewCase.status]}</span></p>
                </div>
              </div>
              {(() => { const t = typeFor(viewCase); return t && (t.needsWarning || t.needsInvestigation) ? <TypeRequirementBadges needsWarning={t.needsWarning} needsInvestigation={t.needsInvestigation} /> : null; })()}
              <div><span className="text-muted-foreground text-xs">الوصف</span><p className="mt-1">{viewCase.description}</p></div>
              {viewCase.notes && <div><span className="text-muted-foreground text-xs">ملاحظات</span><p className="mt-1">{viewCase.notes}</p></div>}
              {viewCase.attachmentsNote && <div><span className="text-muted-foreground text-xs">المرفقات</span><p className="mt-1">{viewCase.attachmentsNote}</p></div>}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                {typeFor(viewCase)?.needsWarning && (
                  <Button size="sm" variant="outline" className="gap-1.5 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                    onClick={() => { setViewCase(null); setNoticeCase(viewCase); }}>
                    <AlertTriangle className="h-3.5 w-3.5" /> إصدار إنذار
                  </Button>
                )}
                {typeFor(viewCase)?.needsInvestigation && (
                  <Button size="sm" variant="outline" className="gap-1.5 border-blue-500/30 text-blue-700 hover:bg-blue-500/10"
                    onClick={() => { setViewCase(null); setInvestigationCase(viewCase); }}>
                    <Search className="h-3.5 w-3.5" /> فتح تحقيق
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 border-violet-500/30 text-violet-700 hover:bg-violet-500/10"
                  onClick={() => { setViewCase(null); setAppealCase(viewCase); }}>
                  <Scale className="h-3.5 w-3.5" /> تقديم تظلم
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={!!rejectCase} onOpenChange={v => !v && setRejectCase(null)}>
        <DialogContent className="sm:max-w-sm border-border">
          <DialogHeader>
            <DialogTitle>رفض المخالفة {rejectCase?.caseNumber}</DialogTitle>
            <DialogDescription className="sr-only">أدخل سبب الرفض اختياريًا ثم أكّد.</DialogDescription>
          </DialogHeader>
          <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="سبب الرفض (اختياري)…" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectCase(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => void handleReject()}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            try { await deleteCase(deleteId); toast.success('تم الحذف'); } catch { toast.error('فشل الحذف'); }
            setDeleteId(null);
          }
        }}
        title="حذف المخالفة"
      />

      {/* ── Contextual dialogs ── */}
      <NoticeDialog
        open={!!noticeCase}
        onClose={() => setNoticeCase(null)}
        violationCase={noticeCase}
        companyId={companyId}
      />
      <InvestigationDialog
        open={!!investigationCase}
        onClose={() => setInvestigationCase(null)}
        violationCase={investigationCase}
        companyId={companyId}
        employees={employees}
      />
      <AppealDialog
        open={!!appealCase}
        onClose={() => setAppealCase(null)}
        violationCase={appealCase}
        companyId={companyId}
      />
    </div>
  );
}
