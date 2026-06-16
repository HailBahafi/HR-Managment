'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import type { AssignmentsPanelModel } from '@/features/hr/attendance/assignment/hooks/useAssignmentsPanelModel';

export function AssignmentsBatchDialog({ model }: { model: AssignmentsPanelModel }) {
  const {
    open,
    setOpen,
    dialogContentEl,
    setDialogContentEl,
    templateId,
    setTemplateId,
    effectiveFrom,
    setEffectiveFrom,
    selectedIds,
    setSelectedIds,
    activeTemplates,
    multiOptions,
    submit,
  } = model;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={setDialogContentEl}
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-3xl"
      >
        <div className="shrink-0 space-y-2 border-b border-border px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-lg">ربط قالب بالموظفين</DialogTitle>
            <DialogDescription>اختر قالب الحضور وتاريخ التطبيق، ثم حدّد الموظفين المراد ربطهم.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label>قالب الحضور</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="قالب" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-effective-from">تاريخ التطبيق</Label>
            <DatePickerInput
              id="assignment-effective-from"
              value={effectiveFrom}
              onChange={setEffectiveFrom}
            />
          </div>
          <MultiSelect
            label="الموظفون"
            options={multiOptions}
            value={[...selectedIds]}
            onChange={(ids) => setSelectedIds(new Set(ids))}
            placeholder="اختر موظفين…"
            searchPlaceholder="بحث بالاسم أو الرقم…"
            emptyMessage="لا يوجد موظف مطابق"
            selectAllLabel="تحديد الكل"
            deselectAllLabel="إلغاء التحديد"
            listMaxHeight="min(220px,36vh)"
            popoverPortalContainer={dialogContentEl}
          />
        </div>
        <DialogFooter className={dialogFormFooterClass}>
          <Button variant="luxe" type="button" onClick={submit} disabled={!templateId || selectedIds.size === 0}>
            تأكيد الربط
          </Button>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
