'use client';

import { CalendarDays, Clock, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useAssignmentsPanelModel } from '@/features/hr/attendance/assignment/hooks/useAssignmentsPanelModel';
import { AssignmentsBatchCard } from '@/features/hr/attendance/assignment/components/assignments-batch-card';
import { AssignmentsBatchDialog } from '@/features/hr/attendance/assignment/components/assignments-batch-dialog';

export function AssignmentsPanel() {
  const model = useAssignmentsPanelModel();

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
              shiftTemplates={model.shiftTemplates}
              onRemoveBatch={model.removeAssignmentBatch}
              onEditBatch={model.openEdit}
            />
          ))}
        </div>
      )}

      <AssignmentsBatchDialog model={model} />

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
