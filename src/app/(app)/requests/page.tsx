'use client';

import * as React from 'react';
import { FileCheck2, Plus, CheckCircle, XCircle, Clock, Eye, FileText, CalendarDays, Wallet, Mail, Package, Filter, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, RequestTypeLabel } from '@/components/status-badge';
import { data, getEmployee } from '@/lib/data';
import { relativeTime, formatDate, formatCurrency, getInitials, cn } from '@/lib/utils';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const requestSchema = z.object({
  type: z.string().min(1, 'اختر نوع الطلب'),
  title: z.string().min(3, 'العنوان مطلوب'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

type RequestForm = z.infer<typeof requestSchema>;

const requestTypes = [
  { value: 'leave', label: 'إجازة', icon: CalendarDays, color: '#0f766e' },
  { value: 'permission', label: 'استئذان', icon: Clock, color: '#ca8a04' },
  { value: 'advance', label: 'سلفة مالية', icon: Wallet, color: '#be185d' },
  { value: 'salary-letter', label: 'خطاب تعريف', icon: Mail, color: '#0891b2' },
  { value: 'equipment', label: 'طلب معدات', icon: Package, color: '#7c3aed' },
  { value: 'attendance-correction', label: 'تصحيح حضور', icon: FileText, color: '#c2410c' },
];

export default function RequestsPage() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [openNew, setOpenNew] = React.useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: '',
      title: '',
      description: '',
      fromDate: '',
      toDate: '',
    },
  });

  const fromDateVal = useWatch({ control, name: 'fromDate' });

  const onSubmit = (values: RequestForm) => {
    console.log('New request:', values);
    reset();
    setOpenNew(false);
  };

  const pendingRequests = data.requests.filter((r) => r.status === 'pending');
  const approvedRequests = data.requests.filter((r) => r.status === 'approved');
  const rejectedRequests = data.requests.filter((r) => r.status === 'rejected');
  const inReviewRequests = data.requests.filter((r) => r.status === 'in-review');

  const selectedReq = selected ? data.requests.find((r) => r.id === selected) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            <div className="h-px w-6 bg-gold" />
            مركز الطلبات
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">الطلبات والموافقات</h1>
          <p className="mt-1 text-muted-foreground">
            <span className="font-semibold text-foreground number-ar">{pendingRequests.length}</span> طلب بانتظار مراجعتك
          </p>
        </div>

        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button variant="luxe" className="gap-2">
              <Plus className="h-4 w-4" />
              طلب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">تقديم طلب جديد</DialogTitle>
              <DialogDescription>املأ النموذج لتقديم طلبك. سيتم توجيهه إلى المدير المباشر.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>نوع الطلب</Label>
                <div className="grid grid-cols-3 gap-2">
                  {requestTypes.map((t) => (
                    <label
                      key={t.value}
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-border p-3 transition-all hover:border-gold/40 hover:bg-muted/30 has-[:checked]:border-gold has-[:checked]:bg-gold/5"
                    >
                      <input type="radio" value={t.value} {...register('type')} className="sr-only" />
                      <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: `${t.color}20`, color: t.color }}>
                        <t.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium">{t.label}</span>
                    </label>
                  ))}
                </div>
                {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>عنوان الطلب</Label>
                <Input placeholder="مثال: إجازة اعتيادية لمدة 5 أيام" {...register('title')} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Controller
                    name="fromDate"
                    control={control}
                    render={({ field }) => (
                      <SingleDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="من…"
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Controller
                    name="toDate"
                    control={control}
                    render={({ field }) => (
                      <SingleDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="إلى…"
                        min={fromDateVal || undefined}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف والتفاصيل</Label>
                <Textarea placeholder="اكتب تفاصيل طلبك هنا..." rows={4} {...register('description')} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenNew(false)} className="flex-1">إلغاء</Button>
                <Button type="submit" variant="luxe" className="flex-1">تقديم الطلب</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <RequestStatCard label="قيد الانتظار" value={pendingRequests.length} icon={Clock} accent="warning" />
        <RequestStatCard label="قيد المراجعة" value={inReviewRequests.length} icon={Eye} accent="gold" />
        <RequestStatCard label="تمت الموافقة" value={approvedRequests.length} icon={CheckCircle} accent="success" />
        <RequestStatCard label="مرفوض" value={rejectedRequests.length} icon={XCircle} accent="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">الواردة ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="in-review">قيد المراجعة ({inReviewRequests.length})</TabsTrigger>
              <TabsTrigger value="all">الكل ({data.requests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4 space-y-2">
              {pendingRequests.map((req) => <RequestRow key={req.id} request={req} selected={selected === req.id} onClick={() => setSelected(req.id)} />)}
              {pendingRequests.length === 0 && <EmptyState />}
            </TabsContent>
            <TabsContent value="in-review" className="mt-4 space-y-2">
              {inReviewRequests.map((req) => <RequestRow key={req.id} request={req} selected={selected === req.id} onClick={() => setSelected(req.id)} />)}
            </TabsContent>
            <TabsContent value="all" className="mt-4 space-y-2">
              {data.requests.map((req) => <RequestRow key={req.id} request={req} selected={selected === req.id} onClick={() => setSelected(req.id)} />)}
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          {selectedReq ? (
            <RequestDetail request={selectedReq} />
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileCheck2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold">اختر طلباً لعرض التفاصيل</h3>
              <p className="mt-1 text-sm text-muted-foreground">انقر على أي طلب من القائمة لمشاهدة تفاصيله الكاملة والمخطط الزمني</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestRow({ request, selected, onClick }: { request: typeof data.requests[0]; selected: boolean; onClick: () => void }) {
  const emp = getEmployee(request.employeeId);
  const type = requestTypes.find((t) => t.value === request.type);
  if (!emp) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-right shadow-soft transition-all hover:border-gold/40 hover:shadow-elevated',
        selected && 'border-gold bg-gold/5 shadow-elevated',
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={emp.avatar} />
        <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{emp.name}</p>
          <StatusBadge status={request.status} />
        </div>
        <div className="flex items-center gap-2 text-xs">
          {type && (
            <>
              <div className="flex items-center gap-1" style={{ color: type.color }}>
                <type.icon className="h-3 w-3" />
                <span className="font-medium">{type.label}</span>
              </div>
              <span className="text-muted-foreground">·</span>
            </>
          )}
          <span className="text-muted-foreground">{request.requestNumber}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{relativeTime(request.submittedAt)}</span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{request.title}</p>
      </div>
    </button>
  );
}

function RequestDetail({ request }: { request: typeof data.requests[0] }) {
  const emp = getEmployee(request.employeeId);
  const type = requestTypes.find((t) => t.value === request.type);
  if (!emp) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-elevated">
      {/* Header */}
      <div className="relative border-b border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          {type && (
            <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: `${type.color}20`, color: type.color }}>
              <type.icon className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">{request.title}</h3>
            <p className="text-xs text-muted-foreground">{request.requestNumber}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Employee */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={emp.avatar} />
            <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{emp.name}</p>
            <p className="text-xs text-muted-foreground">{emp.position}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">التفاصيل</Label>
          <p className="mt-2 text-sm leading-relaxed">{request.description}</p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs">
          {request.fromDate && (
            <div>
              <p className="text-muted-foreground">من تاريخ</p>
              <p className="mt-0.5 font-semibold">{formatDate(request.fromDate)}</p>
            </div>
          )}
          {request.toDate && (
            <div>
              <p className="text-muted-foreground">إلى تاريخ</p>
              <p className="mt-0.5 font-semibold">{formatDate(request.toDate)}</p>
            </div>
          )}
          {request.daysCount && (
            <div>
              <p className="text-muted-foreground">عدد الأيام</p>
              <p className="mt-0.5 font-semibold number-ar">{request.daysCount} أيام</p>
            </div>
          )}
          {request.amount && (
            <div>
              <p className="text-muted-foreground">المبلغ المطلوب</p>
              <p className="mt-0.5 font-semibold">{formatCurrency(request.amount)}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">المخطط الزمني</Label>
          <div className="relative space-y-4">
            {request.timeline.map((step, i) => (
              <div key={step.id} className="relative flex gap-3">
                {i !== request.timeline.length - 1 && (
                  <div className="absolute right-[11px] top-6 h-full w-px bg-border" />
                )}
                <div className={cn(
                  'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  i === request.timeline.length - 1
                    ? 'border-gold bg-gold/15'
                    : 'border-success bg-success/10',
                )}>
                  <div className={cn('h-2 w-2 rounded-full', i === request.timeline.length - 1 ? 'bg-gold' : 'bg-success')} />
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{step.action}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(step.at)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.by} · {step.byRole}</p>
                  {'note' in step && step.note ? (
                    <p className="mt-2 rounded-md border border-border bg-muted/30 p-2 text-xs italic">{step.note}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2 border-t border-border bg-muted/20 p-4">
          <Button variant="outline" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
            <XCircle className="h-4 w-4" />
            رفض
          </Button>
          <Button variant="luxe" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            موافقة
          </Button>
        </div>
      )}
    </div>
  );
}

function RequestStatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent: string }) {
  const map: Record<string, string> = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
    gold: 'text-gold bg-gold/10',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', map[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-2xl font-bold number-ar">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <CheckCircle className="mb-3 h-8 w-8 text-muted-foreground opacity-50" />
      <h3 className="font-display font-semibold">لا توجد طلبات</h3>
      <p className="mt-1 text-sm text-muted-foreground">لا توجد طلبات بهذه الحالة حالياً</p>
    </div>
  );
}
