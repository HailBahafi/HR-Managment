'use client';

import * as React from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker, type DateRangeValue } from '@/components/ui/DateRangePicker';
import { cn } from '@/shared/utils';

export type PeriodRange = DateRangeValue;

type Props = {
  value: PeriodRange;
  onChange: (range: PeriodRange) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

const AR_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function formatShortDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return '—';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fullMonthBounds(year: number, month: number): { from: string; to: string } {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

function formatPeriodLabel(from: string, to: string): string {
  if (!from || !to) return '';
  const fromMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(from);
  if (fromMatch) {
    const year = Number(fromMatch[1]);
    const month = Number(fromMatch[2]);
    const bounds = fullMonthBounds(year, month);
    if (from === bounds.from && to === bounds.to) {
      return `${AR_MONTH_NAMES[month - 1]} ${year}`;
    }
  }
  if (from === to) return formatShortDate(from);
  return `${formatShortDate(from)} — ${formatShortDate(to)}`;
}

/** Single control for month or custom date-range filtering in entity toolbars. */
export function EntityPeriodFilter({
  value,
  onChange,
  placeholder = 'اختر الفترة',
  className,
  triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const label = formatPeriodLabel(value.from, value.to);

  return (
    <div className={cn('shrink-0', className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          'h-8 min-w-[10rem] max-w-[16rem] justify-between gap-2 px-2.5 text-xs font-normal',
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={cn('truncate', !label && 'text-muted-foreground')}>
            {label || placeholder}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </Button>

      <DateRangePicker
        open={open}
        onOpenChange={setOpen}
        value={value}
        onApply={(range) => onChange(range)}
      />
    </div>
  );
}
