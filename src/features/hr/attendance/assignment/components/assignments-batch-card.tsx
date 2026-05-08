'use client';

import { Building2, CalendarDays, Clock, MapPin, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ShiftAssignment, ShiftTemplate } from '@/lib/attendance/types';

type Batch = {
  batchId: string;
  rows: ShiftAssignment[];
  templateId: string | undefined;
  effectiveFrom: string | undefined;
};

export function AssignmentsBatchCard({
  batch,
  shiftTemplates,
  onRemoveBatch,
}: {
  batch: Batch;
  shiftTemplates: ShiftTemplate[];
  onRemoveBatch: (batchId: string) => void;
}) {
  const { batchId, rows, templateId: tid, effectiveFrom: ef } = batch;
  const tpl = shiftTemplates.find((t) => t.id === tid);
  const targetType = rows[0]?.targetType;
  const TypeIcon = targetType === 'department' ? Building2 : targetType === 'location' ? MapPin : Users;
  const typeLabel = targetType === 'department' ? 'أقسام' : targetType === 'location' ? 'فروع' : 'موظفين';
  const names = rows.map((r) => r.targetLabel).filter(Boolean);
  const visibleNames = names.slice(0, 3);
  const remaining = names.length - visibleNames.length;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5">
            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {rows.length} {typeLabel}
            </span>
          </div>
        </div>

        <h3 className="mb-0.5 truncate font-display text-base font-bold leading-snug transition-colors group-hover:text-primary">
          {tpl?.nameAr ?? 'قالب محذوف'}
        </h3>
        <div className="mb-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span dir="ltr">{ef}</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1">
          {visibleNames.map((name, i) => (
            <span
              key={i}
              className="inline-flex max-w-[140px] items-center truncate rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {name}
            </span>
          ))}
          {remaining > 0 && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              +{remaining} آخرين
            </span>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-border/60 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              if (window.confirm('حذف كل عناصر هذه الدفعة؟')) onRemoveBatch(batchId);
            }}
          >
            <Trash2 className="h-3 w-3" /> حذف الربط
          </Button>
        </div>
      </div>
    </div>
  );
}
