'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, ArrowRight, GripVertical, X,
  FileText, Hash, List, Paperclip, Briefcase, MapPin, Building2, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AtsFormField, AtsFormFieldType, AtsJobType } from '@/lib/ats/types';
import { uid, slugify } from '@/lib/ats/utils';
import { useAtsStore } from '@/lib/ats/store';

const FIELD_TYPES: { type: AtsFormFieldType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'text',   label: 'نص',     icon: FileText,   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { type: 'number', label: 'رقم',    icon: Hash,       color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { type: 'select', label: 'قائمة',  icon: List,       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { type: 'file',   label: 'ملف',    icon: Paperclip,  color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

function SelectOptionsEditor({ options = [], onChange }: { options: string[]; onChange: (opts: string[]) => void }) {
  const [inputValue, setInputValue] = React.useState('');
  const add = (val: string) => {
    const t = val.trim();
    if (!t) return;
    if (options.includes(t)) { toast.error('الخيار موجود مسبقاً'); return; }
    onChange([...options, t]);
    setInputValue('');
  };
  return (
    <div className="space-y-2">
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs shadow-sm">
              {opt}
              <button type="button" onClick={() => onChange(options.filter((_, j) => j !== i))}
                className="ms-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive hover:text-white transition-colors">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(inputValue); } }}
          placeholder="اكتب خياراً واضغط Enter أو +" className="h-8 text-xs" />
        <Button type="button" variant="outline" size="sm" className="h-8 px-2 shrink-0" onClick={() => add(inputValue)} disabled={!inputValue.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function JobCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { currentTenantId, getTenantJobs, getTenantForms, addJob, updateJob, addForm, updateForm } = useAtsStore();

  const existingJob = editId ? getTenantJobs().find((j) => j.id === editId) : undefined;
  const existingForm = existingJob ? getTenantForms().find((f) => f.id === existingJob.formId) : undefined;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [jobType, setJobType] = React.useState<AtsJobType>('full-time');
  const [fields, setFields] = React.useState<AtsFormField[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title);
      setDescription(existingJob.description);
      setDepartment(existingJob.department);
      setLocation(existingJob.location);
      setJobType(existingJob.type);
    }
    if (existingForm) setFields(existingForm.fields.map((f) => ({ ...f })));
    else setFields([]);
    setError(null);
  }, [existingJob, existingForm]);

  const addField = (type: AtsFormFieldType) =>
    setFields((prev) => [...prev, { id: `field-${uid()}`, type, label: '', required: true, options: type === 'select' ? [] : undefined }]);

  const removeField = (i: number) => setFields((prev) => prev.filter((_, j) => j !== i));
  const updateField = (i: number, patch: Partial<AtsFormField>) => setFields((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  const handleDragStart = (e: React.DragEvent, i: number) => { setDraggingIdx(i); e.dataTransfer.setData('text/plain', String(i)); };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); if (draggingIdx !== null && draggingIdx !== i) setDragOverIdx(i); };
  const handleDrop = (e: React.DragEvent, to: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (!isNaN(from) && from !== to) {
      setFields((prev) => { const n = [...prev]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });
    }
    setDraggingIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDraggingIdx(null); setDragOverIdx(null); };

  const handleSave = () => {
    if (!title.trim()) { setError('يرجى إدخال عنوان الوظيفة'); return; }
    if (!department.trim()) { setError('يرجى إدخال القسم'); return; }
    if (fields.length === 0) { setError('يجب إضافة حقل واحد على الأقل'); return; }
    for (const f of fields) {
      if (!f.label.trim()) { setError('جميع الحقول يجب أن تحتوي على اسم'); return; }
      if (f.type === 'select' && (!f.options || f.options.length === 0)) { setError('حقول القائمة تحتاج خياراً واحداً على الأقل'); return; }
    }
    const slug = slugify(title);
    if (existingJob && existingForm) {
      updateJob(existingJob.id, { title: title.trim(), description: description.trim(), department: department.trim(), location: location.trim(), type: jobType, slug });
      updateForm(existingForm.id, { title: `نموذج التقديم - ${title.trim()}`, description: description.trim(), fields });
      toast.success('تم تحديث الوظيفة');
    } else {
      addForm({ tenantId: currentTenantId, jobId: `job-${uid()}`, title: `نموذج التقديم - ${title.trim()}`, description: description.trim(), fields });
      addJob({ tenantId: currentTenantId, title: title.trim(), slug, description: description.trim(), department: department.trim(), location: location.trim(), type: jobType, isActive: true, formId: `form-${uid()}` });
      toast.success('تم إنشاء الوظيفة');
    }
    router.push('/hr/recruitment/ats-admin');
  };

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => router.push('/hr/recruitment/ats-admin')}>
          <ArrowRight className="h-4 w-4" /> العودة
        </Button>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-lg font-semibold leading-none">{existingJob ? 'تعديل وظيفة' : 'وظيفة جديدة'}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">أدخل تفاصيل الوظيفة وابنِ نموذج التقديم</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Job details */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-4 pt-5 px-5">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-primary" /> تفاصيل الوظيفة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="space-y-1.5">
                <Label htmlFor="job-title" className="text-xs font-medium">عنوان الوظيفة <span className="text-destructive">*</span></Label>
                <Input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: مطور تطبيقات جوال" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="job-dept" className="text-xs font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> القسم <span className="text-destructive">*</span>
                  </Label>
                  <Input id="job-dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="تقنية المعلومات" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="job-loc" className="text-xs font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> الموقع
                  </Label>
                  <Input id="job-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="الرياض" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-type" className="text-xs font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" /> نوع الدوام
                </Label>
                <Select value={jobType} onValueChange={(v) => setJobType(v as AtsJobType)}>
                  <SelectTrigger id="job-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">دوام كامل</SelectItem>
                    <SelectItem value="part-time">دوام جزئي</SelectItem>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="internship">تدريب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-desc" className="text-xs font-medium">وصف الوظيفة</Label>
                <Textarea id="job-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="المهام والمتطلبات والمؤهلات…" rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Form builder */}
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <List className="h-4 w-4 text-primary" /> حقول نموذج التقديم
                  {fields.length > 0 && <span className="text-xs text-muted-foreground font-normal">({fields.length})</span>}
                </CardTitle>
                <div className="flex gap-1.5">
                  {FIELD_TYPES.map(({ type, label, icon: Icon, color }) => (
                    <Button key={type} type="button" variant="outline" size="sm" className={`h-7 gap-1 text-[11px] px-2 border ${color}`} onClick={() => addField(type)}>
                      <Icon className="h-3 w-3" /> {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <List className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">اضغط على نوع الحقل أعلاه لإضافته</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, idx) => {
                    const cfg = FIELD_TYPES.find((t) => t.type === field.type)!;
                    const isDragging = draggingIdx === idx;
                    const isDragOver = dragOverIdx === idx && draggingIdx !== idx;
                    return (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`relative rounded-lg border bg-card p-3.5 shadow-soft transition-all
                          ${isDragging ? 'opacity-40 scale-[0.98] cursor-grabbing' : 'cursor-grab hover:shadow-elevated'}
                          ${isDragOver ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
                      >
                        {isDragOver && <div className="absolute -top-px left-3 right-3 h-0.5 rounded-full bg-primary" />}
                        <div className="mb-3 flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0 ${cfg.color}`}>
                            <cfg.icon className="h-2.5 w-2.5 me-1" />{cfg.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate flex-1">{field.label || 'حقل بدون اسم'}</span>
                          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground/60 hover:text-destructive shrink-0" onClick={() => removeField(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">اسم الحقل</Label>
                            <Input value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="الاسم الظاهر للمتقدم" className="h-8 text-xs" />
                          </div>
                          <div className="flex items-center gap-2 pt-4">
                            <Checkbox id={`req-${field.id}`} checked={field.required} onCheckedChange={(v) => updateField(idx, { required: !!v })} />
                            <Label htmlFor={`req-${field.id}`} className="text-xs font-normal cursor-pointer">حقل إلزامي</Label>
                          </div>
                        </div>
                        {field.type === 'select' && (
                          <div className="mt-3 space-y-1">
                            <Label className="text-[11px] text-muted-foreground">الخيارات</Label>
                            <SelectOptionsEditor options={field.options ?? []} onChange={(opts) => updateField(idx, { options: opts })} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Sticky summary + actions */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold">ملخص الوظيفة</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{title || <span className="opacity-40">العنوان</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{department || <span className="opacity-40">القسم</span>}</span>
                </div>
                {location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <List className="h-3.5 w-3.5 shrink-0" />
                  <span>{fields.length} حقل في النموذج</span>
                </div>
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">{error}</p>
              )}
              <div className="space-y-2 pt-1">
                <Button variant="luxe" className="w-full" onClick={handleSave}>
                  {existingJob ? 'حفظ التعديلات' : 'إنشاء الوظيفة'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/hr/recruitment/ats-admin')}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
