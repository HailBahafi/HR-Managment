'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Send, MapPin, Briefcase, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { publicRecruitmentApi } from '@/features/hr/recruitment/lib/api/recruitment';
import { usePublicRecruitmentJob } from '@/features/hr/recruitment/hooks/usePublicRecruitment';
import type { AtsFormField, AtsFormFieldType } from '@/features/hr/recruitment/lib/ats/types';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

const FIELD_TYPE_ICONS: Record<AtsFormFieldType, React.ReactNode> = {
  text: <Briefcase className="h-3.5 w-3.5" />,
  number: <Star className="h-3.5 w-3.5" />,
  select: <MapPin className="h-3.5 w-3.5" />,
  file: <Upload className="h-3.5 w-3.5" />,
};

const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'دوام كامل',
  'part-time': 'دوام جزئي',
  contract: 'عقد',
  internship: 'تدريب',
};

interface PublicApplicationClientProps {
  jobSlug: string;
}

export function AtsPublicApplicationClient({ jobSlug }: PublicApplicationClientProps) {
  const router = useRouter();
  const { data, isLoading, isError } = usePublicRecruitmentJob(jobSlug);
  const job = data?.job;
  const form = data?.form;

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [fileData, setFileData] = React.useState<Record<string, string>>({});
  const [fileNames, setFileNames] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        جاري التحميل…
      </div>
    );
  }

  if (isError || !job || !form) {
    return (
      <div className="py-16 text-center space-y-3">
        <h1 className="text-2xl font-bold">الوظيفة غير موجودة</h1>
        <p className="text-muted-foreground">قد تمت إزالة هذه الوظيفة أو إيقافها.</p>
        <Button variant="outline" size="sm" asChild>
          <a href="/careers">العودة إلى الوظائف المتاحة</a>
        </Button>
      </div>
    );
  }

  const updateAnswer = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData((prev) => ({ ...prev, [fieldId]: reader.result as string }));
      setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    for (const field of form.fields) {
      if (field.required) {
        const val = field.type === 'file' ? fileNames[field.id] : answers[field.id];
        if (!val || String(val).trim() === '') {
          toast.error(`الحقل "${field.label}" مطلوب`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const fileField = form.fields.find((f) => f.type === 'file');
      const cvBase64 = fileField ? fileData[fileField.id] : undefined;
      await publicRecruitmentApi.submitApplication(jobSlug, {
        answers: { ...answers },
        cvFileName: fileField ? fileNames[fileField.id] ?? null : null,
        cvFileBase64: cvBase64 ?? null,
      });
      toast.success('تم تقديم طلبك بنجاح!');
      setTimeout(() => router.push('/careers'), 2000);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'recruitment.public.apply');
      toast.error(displayMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
          <a href="/careers">← جميع الوظائف</a>
        </Button>
      </div>
        <Card className="mb-6 overflow-hidden">
          <div className="relative bg-linear-to-br from-primary/10 via-primary/5 to-background px-6 pb-6 pt-8">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px]">{JOB_TYPE_LABELS[job.type]}</Badge>
                <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {job.location}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{job.department}</p>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-lg font-semibold">نموذج التقديم</h2>
            {form.fields.map((field: AtsFormField) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{FIELD_TYPE_ICONS[field.type]}</span>
                  <Label htmlFor={field.id}>{field.label}</Label>
                  {field.required && <span className="text-destructive">*</span>}
                </div>
                {field.type === 'text' && (
                  <Input id={field.id} value={answers[field.id] || ''} onChange={(e) => updateAnswer(field.id, e.target.value)} />
                )}
                {field.type === 'number' && (
                  <Input id={field.id} type="number" value={answers[field.id] || ''} onChange={(e) => updateAnswer(field.id, e.target.value)} />
                )}
                {field.type === 'select' && field.options && (
                  <Select value={answers[field.id] || ''} onValueChange={(v) => updateAnswer(field.id, v)}>
                    <SelectTrigger id={field.id}><SelectValue placeholder="اختر…" /></SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === 'file' && (
                  <div className="space-y-2">
                    <Input id={field.id} type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(field.id, e)} />
                    {fileNames[field.id] && (
                      <p className="text-xs text-muted-foreground">تم اختيار: {fileNames[field.id]}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <a href="/careers">إلغاء</a>
              </Button>
              <Button variant="luxe" onClick={() => void handleSubmit()} disabled={submitting}>
                <Send className="h-4 w-4 me-1" /> {submitting ? 'جارٍ الإرسال…' : 'تقديم الطلب'}
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
