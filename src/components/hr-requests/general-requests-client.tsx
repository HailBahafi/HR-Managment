'use client';

import * as React from 'react';
import { Eye, Trash2, Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePageFilters } from '@/components/filter-panel-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  MinimalDropdown, SearchableDropdown, ConfirmationModal, HRSettingsFormDrawer,
  FormField, PageHeader, EmptyState, Pagination, ActiveBadge,
} from './shared-ui';
import { HRRequestTemplateFieldsForm, validateTemplateRequired } from './template-fields-form';
import type { HRRequestTemplateFieldsFormValues } from './template-fields-form';
import { useHRConfigurationStore } from '@/lib/hr-requests/configuration-store';
import { useHRRequestSubmissionsStore } from '@/lib/hr-requests/submissions-store';
import { useHREmployeeDirectoryStore } from '@/lib/hr-requests/employee-directory-store';
import type { HRRequestSubmissionRecord, HRRequestTemplateEntity } from '@/lib/hr-requests/types';
import { HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID } from '@/lib/hr-requests/types';
import { cn } from '@/lib/utils';

const LS_PAGE = 'hr_requests_table_page';
const LS_PER = 'hr_requests_table_per';

function formatFieldSummary(record: HRRequestSubmissionRecord, template: HRRequestTemplateEntity | undefined): string {
  if (!template) return '—';
  const sorted = [...template.formFields].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 2);
  return sorted.map(f => {
    const v = record.fieldValues[f.id];
    if (v === undefined || v === null || v === '') return null;
    if (typeof v === 'boolean') return `${f.labelAr}: ${v ? 'نعم' : 'لا'}`;
    if (typeof v === 'object') return `${f.labelAr}: ${JSON.stringify(v).slice(0, 30)}`;
    return `${f.labelAr}: ${String(v).slice(0, 40)}`;
  }).filter(Boolean).join(' · ') || '—';
}

export function GeneralRequestsClient() {
  const { departments, requestTypes, templates, getTemplateById } = useHRConfigurationStore();
  const { submissions, addSubmission, deleteSubmission } = useHRRequestSubmissionsStore();
  const { activeEmployees } = useHREmployeeDirectoryStore();

  const [refreshing, setRefreshing] = React.useState(false);

  // Pagination
  const [page, setPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PAGE) ?? '1') : 1);
  const [perPage, setPerPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PER) ?? '10') : 10);

  // Drawer / modals
  const [createOpen, setCreateOpen] = React.useState(false);
  const [viewRecord, setViewRecord] = React.useState<HRRequestSubmissionRecord | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Create form state
  const [formDeptId, setFormDeptId] = React.useState('');
  const [formTypeId, setFormTypeId] = React.useState('');
  const [formEmpId, setFormEmpId] = React.useState('');
  const [formValues, setFormValues] = React.useState<HRRequestTemplateFieldsFormValues>({});

  // Derived
  const activeDepts = departments.filter(d => d.isActive);
  const deptOptions = [{ value: 'all', label: 'جميع الأقسام' }, ...activeDepts.map(d => ({ value: d.id, label: d.nameAr }))];
  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));

  const { values } = usePageFilters([
    { key: 'search', label: 'بحث', type: 'text', placeholder: 'اسم الموظف، القسم، أو نوع الطلب…' },
    { key: 'dept', label: 'القسم', type: 'select', options: activeDepts.map(d => ({ value: d.id, label: d.nameAr })) },
    { key: 'emp', label: 'الموظف', type: 'select', options: empOptions.map(e => ({ value: e.value, label: e.label })) },
  ]);
  const appliedSearch = (values.search as string) ?? '';
  const appliedDept = (values.dept as string) ?? 'all';
  const appliedEmp = (values.emp as string) ?? '';

  const formDeptTypes = requestTypes.filter(rt =>
    rt.isActive && (rt.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID || rt.departmentId === formDeptId)
  ).sort((a, b) => a.sortOrder - b.sortOrder);

  const selectedRt = requestTypes.find(rt => rt.id === formTypeId);
  const resolvedTemplate = React.useMemo((): HRRequestTemplateEntity | undefined => {
    if (!selectedRt) return undefined;
    return getTemplateById(selectedRt.templateId)
      ?? templates.find(t => t.isUniversalDefault)
      ?? templates[0];
  }, [selectedRt, templates, getTemplateById]);

  // Filter
  const filtered = React.useMemo(() => {
    const q = appliedSearch.toLowerCase();
    return submissions.filter(s => {
      if (appliedDept !== 'all' && s.departmentId !== appliedDept) return false;
      if (appliedEmp && s.employeeId !== appliedEmp) return false;
      if (q && !s.departmentNameAr.includes(q) && !s.requestTypeNameAr.includes(q) && !s.employeeNameAr.includes(q) && !JSON.stringify(s.fieldValues).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [submissions, appliedSearch, appliedDept, appliedEmp]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);


  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const resetCreate = () => {
    setFormDeptId(''); setFormTypeId(''); setFormEmpId(''); setFormValues({}); setCreateError(null);
  };

  const handleSave = () => {
    if (!formEmpId) { setCreateError('يرجى اختيار موظف'); return; }
    if (!formDeptId) { setCreateError('يرجى اختيار القسم'); return; }
    if (!formTypeId) { setCreateError('يرجى اختيار نوع الطلب'); return; }
    if (resolvedTemplate) {
      const err = validateTemplateRequired(resolvedTemplate.formFields, formValues);
      if (err) { setCreateError(err); return; }
    }
    const dept = departments.find(d => d.id === formDeptId);
    const rt = requestTypes.find(r => r.id === formTypeId);
    const emp = activeEmployees.find(e => e.id === formEmpId);
    if (!dept || !rt || !emp) return;
    addSubmission({
      employeeId: emp.id, employeeNameAr: emp.nameAr, employeeNameEn: emp.nameAr,
      requestTypeId: rt.id, requestTypeNameAr: rt.nameAr, requestTypeNameEn: rt.nameAr,
      departmentId: dept.id, departmentNameAr: dept.nameAr, departmentNameEn: dept.nameAr,
      templateId: resolvedTemplate?.id ?? null,
      fieldValues: formValues,
    });
    setCreateOpen(false);
    resetCreate();
  };

  React.useEffect(() => { localStorage.setItem(LS_PAGE, String(page)); }, [page]);
  React.useEffect(() => { localStorage.setItem(LS_PER, String(perPage)); }, [perPage]);

  const viewTemplate = viewRecord ? getTemplateById(viewRecord.templateId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} /> تحديث
        </Button>
        <Button variant="luxe" className="gap-2" onClick={() => { resetCreate(); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" /> طلب جديد
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {paginated.length === 0 ? (
          <EmptyState icon={Search} title="لا توجد طلبات" description="جرّب تعديل الفلاتر أو أضف طلباً جديداً" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-right">القسم</th>
                  <th className="px-4 py-3 text-right">الموظف</th>
                  <th className="px-4 py-3 text-right">نوع الطلب</th>
                  <th className="px-4 py-3 text-right">ملخص الحقول</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => {
                  const tpl = getTemplateById(r.templateId);
                  return (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-xs">{r.departmentNameAr}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.employeeNameAr}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{r.employeeNameEn}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{r.requestTypeNameAr}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {formatFieldSummary(r, tpl)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" type="button" onClick={() => setViewRecord(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" type="button" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} perPage={perPage} total={filtered.length} onPage={p => setPage(p)} onPerPage={p => { setPerPage(p); setPage(1); }} />
      </div>

      {/* Create drawer */}
      <HRSettingsFormDrawer
        open={createOpen}
        onOpenChange={v => { setCreateOpen(v); if (!v) resetCreate(); }}
        title="إنشاء طلب جديد"
        description="اختر القسم ونوع الطلب ثم أدخل بيانات النموذج"
        onSave={handleSave}
        saveLabel="إرسال الطلب"
        error={createError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="القسم" required>
            <MinimalDropdown value={formDeptId} onChange={v => { setFormDeptId(v); setFormTypeId(''); setFormValues({}); }} options={activeDepts.map(d => ({ value: d.id, label: d.nameAr }))} placeholder="اختر القسم" />
          </FormField>
          <FormField label="نوع الطلب" required>
            <MinimalDropdown
              value={formTypeId}
              onChange={v => { setFormTypeId(v); setFormValues({}); }}
              options={formDeptTypes.map(rt => ({ value: rt.id, label: rt.nameAr }))}
              placeholder={formDeptId ? (formDeptTypes.length ? 'اختر النوع' : 'لا توجد أنواع') : 'اختر القسم أولاً'}
              disabled={!formDeptId || formDeptTypes.length === 0}
            />
          </FormField>
          <FormField label="الموظف" required span2>
            <SearchableDropdown value={formEmpId} onChange={setFormEmpId} options={empOptions} placeholder="ابحث عن موظف…" />
          </FormField>
        </div>
        {resolvedTemplate && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">القالب المستخدم:</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{resolvedTemplate.nameAr}</span>
            </div>
            <HRRequestTemplateFieldsForm template={resolvedTemplate} values={formValues} onChange={setFormValues} />
          </>
        )}
      </HRSettingsFormDrawer>

      {/* View modal */}
      <Dialog open={!!viewRecord} onOpenChange={v => !v && setViewRecord(null)}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle>{viewRecord?.requestTypeNameAr}</DialogTitle>
              <DialogDescription>
                {viewRecord?.employeeNameAr} · {viewRecord?.departmentNameAr}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            {viewRecord && (() => {
              const fields = viewTemplate?.formFields ?? [];
              const sorted = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
              if (sorted.length === 0) return <p className="text-sm text-muted-foreground">لا توجد حقول</p>;
              return sorted.map(f => {
                const v = viewRecord.fieldValues[f.id];
                const display = v === undefined || v === null ? '—' : typeof v === 'boolean' ? (v ? 'نعم' : 'لا') : Array.isArray(v) ? (v as string[]).join('، ') : String(v);
                return (
                  <div key={f.id} className="flex flex-col gap-0.5 rounded-lg bg-muted/30 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">{f.labelAr}</p>
                    <p className="text-sm font-medium">{display || '—'}</p>
                  </div>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="حذف الطلب"
        description="سيتم حذف هذا الطلب نهائياً ولا يمكن التراجع."
        onConfirm={() => { if (deleteId) deleteSubmission(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
