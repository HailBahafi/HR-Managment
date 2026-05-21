'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import type { AssignmentTargetType, ShiftTemplate } from '@/features/hr/attendance/lib/types';
import { ASSIGNMENTS_ALL_DEPARTMENTS } from '@/features/hr/attendance/assignment/constants/assignments-panel';
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
    targetType,
    onTargetTypeChange,
    employeeDepartmentFilter,
    setEmployeeDepartmentFilter,
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
        className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-lg"
      >
        <div className="shrink-0 space-y-2 border-b border-border px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-lg">ربط قالب بالموظفين</DialogTitle>
            <DialogDescription>اختر قالب الحضور وتاريخ التطبيق، ثم حدد الموظفين أو الأقسام المراد ربطهم.</DialogDescription>
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
            <Input
              id="assignment-effective-from"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>تطبيق على</Label>
            <Select value={targetType} onValueChange={(v) => onTargetTypeChange(v as AssignmentTargetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">موظفين</SelectItem>
                <SelectItem value="department">أقسام</SelectItem>
                <SelectItem value="location">فروع</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {targetType === 'employee' ? (
            <div className="space-y-2">
              <Label>تصفية الموظفين حسب القسم</Label>
              <Select value={employeeDepartmentFilter} onValueChange={setEmployeeDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ASSIGNMENTS_ALL_DEPARTMENTS}>كل الأقسام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <MultiSelect
            label="الأهداف"
            options={multiOptions}
            value={[...selectedIds]}
            onChange={(ids) => setSelectedIds(new Set(ids))}
            placeholder={
              targetType === 'employee' ? 'اختر موظفين…' : targetType === 'department' ? 'اختر أقسام…' : 'اختر فروع…'
            }
            searchPlaceholder={targetType === 'employee' ? 'بحث بالاسم أو القسم…' : 'بحث بالاسم…'}
            emptyMessage="لا توجد عناصر مطابقة"
            selectAllLabel="تحديد الكل"
            deselectAllLabel="إلغاء التحديد"
            listMaxHeight="min(220px,36vh)"
            popoverPortalContainer={dialogContentEl}
          />
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button variant="luxe" type="button" onClick={submit} disabled={!templateId || selectedIds.size === 0}>
            تأكيد الربط
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
