'use client';

import * as React from 'react';
import { CalendarDays, Clock, Plus, Users } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { useAssignmentsPanelModel } from '@/features/hr/attendance/assignment/hooks/useAssignmentsPanelModel';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { AssignmentsBatchCard } from '@/features/hr/attendance/assignment/components/assignments-batch-card';
import { AssignmentsBatchDialog } from '@/features/hr/attendance/assignment/components/assignments-batch-dialog';

export function AssignmentsPanel() {
  const model = useAssignmentsPanelModel();
  const [viewBatchId, setViewBatchId] = React.useState<string | null>(null);

  const viewBatch = viewBatchId ? model.batches.find((b) => b.batchId === viewBatchId) : null;

  usePageHeaderActions(
    () => (
      <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" type="button" onClick={model.openNew}>
        <Plus className="h-3.5 w-3.5" />
        ربط قالب جديد
      </Button>
    ),
    [model.openNew],
  );

  return (
    <div className="space-y-4">

      {model.batches.length === 0 ? (
        <EmptyStateCard icon={Users} title="لا توجد دفعات تعيين بعد" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {model.batches.map((batch) => (
            <AssignmentsBatchCard
              key={batch.batchId}
              batch={batch}
              onRemoveBatch={model.removeAssignmentBatch}
              onEditBatch={model.openEdit}
              onViewBatch={setViewBatchId}
            />
          ))}
        </div>
      )}

      <AssignmentsBatchDialog model={model} />

      {/* ── Detail dialog ── */}
      <Dialog open={!!viewBatch} onOpenChange={(o) => !o && setViewBatchId(null)}>
        <DialogContent className="max-w-lg border-border" dir="rtl">
          {viewBatch && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ background: viewBatch.colorHex ? `#${viewBatch.colorHex.replace('#', '')}` : '#6366f1' }}
                  >
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-lg">{viewBatch.templateName}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3" />
                      <span dir="ltr">{viewBatch.effectiveFrom ?? '—'}</span>
                      <span className="mx-1">·</span>
                      <span>{viewBatch.activeAssignments} نشط من {viewBatch.totalAssignments}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="max-h-[60vh] overflow-y-auto">
                {viewBatch.rows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">لا يوجد موظفون مرتبطون</p>
                ) : (
                  <div className="space-y-1.5 py-2">
                    {viewBatch.rows.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {row.targetLabel.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{row.targetLabel}</p>
                          <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">{row.employeeCode}</p>
                        </div>
                        <Badge
                          variant={row.isActive ? 'success' : 'secondary'}
                          className="shrink-0 text-[10px]"
                        >
                          {row.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="luxe" onClick={() => { setViewBatchId(null); model.openEdit(viewBatch.batchId); }}>
                  <Clock className="h-4 w-4" /> تعديل
                </Button>
                <Button variant="outline" onClick={() => setViewBatchId(null)}>إغلاق</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit batch dialog ── */}
      <Dialog open={model.editOpen} onOpenChange={model.setEditOpen}>
        <DialogContent className="max-w-sm border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">تعديل الدفعة</DialogTitle>
                <DialogDescription className="text-xs">تعديل تاريخ التطبيق وحالة التفعيل لكل عناصر الدفعة</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                تاريخ التطبيق
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-start gap-2 text-sm', !model.editEffectiveFrom && 'text-muted-foreground')}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    {model.editEffectiveFrom
                      ? (() => {
                          const d = parse(model.editEffectiveFrom, 'yyyy-MM-dd', new Date());
                          return isValid(d) ? format(d, 'dd MMMM yyyy', { locale: arSA }) : model.editEffectiveFrom;
                        })()
                      : 'اختر التاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={(() => {
                      const d = parse(model.editEffectiveFrom, 'yyyy-MM-dd', new Date());
                      return isValid(d) ? d : undefined;
                    })()}
                    onSelect={(day) => {
                      if (day) model.setEditEffectiveFrom(format(day, 'yyyy-MM-dd'));
                    }}
                    defaultMonth={(() => {
                      const d = parse(model.editEffectiveFrom, 'yyyy-MM-dd', new Date());
                      return isValid(d) ? d : new Date();
                    })()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all border-border hover:bg-muted/20">
              <span className="text-sm font-medium">مفعّل</span>
              <Checkbox
                checked={model.editIsActive}
                onCheckedChange={(v) => model.setEditIsActive(v === true)}
              />
            </label>
          </div>

          <DialogFooter className={dialogFormFooterClass}>
            <Button variant="luxe" type="button" onClick={() => void model.submitEdit()}>حفظ التعديلات</Button>
            <Button variant="outline" type="button" onClick={() => model.setEditOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
