'use client';

import * as React from 'react';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { defaultShiftPeriod, normalizeShiftTemplate } from '@/lib/attendance/defaults';
import type { ShiftTemplate, WeekDayIndex } from '@/lib/attendance/types';
import { useAttendanceStore } from '@/lib/attendance/store';
import { genId } from '@/lib/attendance/utils';
import { ShiftTemplateCard } from '@/features/hr/attendance/templates/components/shift-template-card';
import { ShiftTemplateDialogForm } from '@/features/hr/attendance/templates/components/shift-template-dialog-form';
import { DEFAULT_REST } from '@/features/hr/attendance/templates/constants/shift-templates-ui';
import {
  cloneTemplate,
  validateTemplate,
} from '@/features/hr/attendance/templates/utils/shift-template-helpers';

export function ShiftTemplatesPanel() {
  const shiftTemplates = useAttendanceStore((s) => s.shiftTemplates);
  const upsertTemplate = useAttendanceStore((s) => s.upsertTemplate);
  const removeTemplate = useAttendanceStore((s) => s.removeTemplate);

  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ShiftTemplate | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const buildDefault = (): ShiftTemplate => {
    const per = defaultShiftPeriod(genId('per'));
    return {
      id: genId('tpl'),
      nameAr: '',
      nameEn: '',
      colorHex: '#0f766e',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      isActive: true,
      weekDays: ([6, 0, 1, 2, 3, 4, 5] as WeekDayIndex[]).map((day) => ({
        day,
        isRest: DEFAULT_REST.includes(day),
        periods: DEFAULT_REST.includes(day) ? [] : [{ ...per, id: genId('per') }],
      })),
    };
  };

  const openCreate = () => {
    setDraft(buildDefault());
    setError(null);
    setOpen(true);
  };

  const openEdit = (t: ShiftTemplate) => {
    setDraft(normalizeShiftTemplate(cloneTemplate(t)));
    setError(null);
    setOpen(true);
  };

  const save = () => {
    if (!draft) return;
    const err = validateTemplate(draft);
    if (err) {
      setError(err);
      return;
    }
    upsertTemplate({ ...draft, nameEn: draft.nameAr.trim() });
    setOpen(false);
    setDraft(null);
  };

  const isEdit = !!draft && shiftTemplates.some((x) => x.id === draft.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="luxe" className="shrink-0 gap-2" type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" /> قالب جديد
        </Button>
      </div>

      {shiftTemplates.length === 0 ? (
        <EmptyStateCard
          icon={Clock}
          title="لا توجد قوالب بعد"
          description="أضف قالباً جديداً لتحديد أوقات الدوام"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shiftTemplates.map((t) => (
            <ShiftTemplateCard
              key={t.id}
              t={t}
              onEdit={() => openEdit(t)}
              onDelete={() => {
                if (window.confirm('حذف القالب؟')) removeTemplate(t.id);
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {isEdit ? 'تعديل القالب' : 'قالب دوام جديد'}
              </DialogTitle>
              <DialogDescription>
                حدد أيام العمل ثم أدخل أوقات الدوام — تُطبَّق تلقائياً على جميع الأيام المحددة.
              </DialogDescription>
            </DialogHeader>
          </div>

          {draft && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ShiftTemplateDialogForm draft={draft} setDraft={setDraft} />
              {error && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:justify-start sm:space-x-2 sm:space-x-reverse">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button variant="luxe" type="button" onClick={save}>
              حفظ القالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
