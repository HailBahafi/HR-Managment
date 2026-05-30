'use client';

import * as React from 'react';
import { CalendarDays, Clock, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useAssignmentsPanelModel } from '@/features/hr/attendance/assignment/hooks/useAssignmentsPanelModel';
import { AssignmentsBatchCard } from '@/features/hr/attendance/assignment/components/assignments-batch-card';
import { AssignmentsBatchDialog } from '@/features/hr/attendance/assignment/components/assignments-batch-dialog';

export function AssignmentsPanel() {
  const model = useAssignmentsPanelModel();
  const [viewBatchId, setViewBatchId] = React.useState<string | null>(null);

  const viewBatch = viewBatchId ? model.batches.find((b) => b.batchId === viewBatchId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="luxe" className="gap-2" type="button" onClick={model.openNew}>
          <Plus className="h-4 w-4" />
          ربط قالب جديد
        </Button>
      </div>

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
                <Button variant="outline" onClick={() => setViewBatchId(null)}>إغلاق</Button>
                <Button variant="luxe" onClick={() => { setViewBatchId(null); model.openEdit(viewBatch.batchId); }}>
                  <Clock className="h-4 w-4" /> تعديل
                </Button>
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
              <Label htmlFor="edit-eff" className="flex items-center gap-1.5 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                تاريخ التطبيق
              </Label>
              <Input
                id="edit-eff"
                type="date"
                value={model.editEffectiveFrom}
                onChange={(e) => model.setEditEffectiveFrom(e.target.value)}
                className="font-mono"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-all border-border hover:bg-muted/20">
              <span className="text-sm font-medium">مفعّل</span>
              <Checkbox
                checked={model.editIsActive}
                onCheckedChange={(v) => model.setEditIsActive(v === true)}
              />
            </label>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-muted/20 pt-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => model.setEditOpen(false)}>إلغاء</Button>
            <Button variant="luxe" type="button" onClick={() => void model.submitEdit()}>حفظ التعديلات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
