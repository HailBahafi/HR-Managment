'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/utils';

/** Convert YYYY-MM-DD → Date (local midnight). Returns undefined for empty / invalid. */
function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Convert Date → YYYY-MM-DD string. */
function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface DatePickerInputProps {
  /** Value as YYYY-MM-DD string */
  value: string;
  /** Called with YYYY-MM-DD string when a date is selected */
  onChange: (ymd: string) => void;
  placeholder?: string;
  /** Minimum selectable date as YYYY-MM-DD */
  minDate?: string;
  /** Maximum selectable date as YYYY-MM-DD */
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'اختر تاريخاً',
  minDate,
  maxDate,
  disabled,
  className,
  id,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const selected = ymdToDate(value);
  const minD = ymdToDate(minDate ?? '');
  const maxD = ymdToDate(maxDate ?? '');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 text-sm font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 opacity-60" />
          {selected ? formatDisplay(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) { onChange(dateToYmd(d)); setOpen(false); }
          }}
          disabled={(d) => {
            if (minD && d < minD) return true;
            if (maxD && d > maxD) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
