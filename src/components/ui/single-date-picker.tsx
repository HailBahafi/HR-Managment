'use client';

import * as React from 'react';
import { format, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { Matcher } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ISO = 'yyyy-MM-dd';

/** Parse `yyyy-MM-dd` in local calendar (avoids UTC shift). */
export function parseIsoDateLocal(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const [y, m, d] = value.split('-').map((n) => Number(n));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return undefined;
  const dt = new Date(y, m - 1, d);
  if (
    !isValid(dt)
    || dt.getFullYear() !== y
    || dt.getMonth() !== m - 1
    || dt.getDate() !== d
  ) {
    return undefined;
  }
  return dt;
}

export type SingleDatePickerProps = {
  value: string | undefined;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Root wrapper (e.g. full width in grids). */
  wrapperClassName?: string;
  id?: string;
  name?: string;
  /** Inclusive minimum (`yyyy-MM-dd`). */
  min?: string;
  /** Inclusive maximum (`yyyy-MM-dd`). */
  max?: string;
  align?: 'start' | 'center' | 'end';
  /**
   * Optional portal container for the popover.
   * Avoid passing a dialog panel that uses `overflow-hidden` — the calendar will be clipped.
   * Omit to use the default body portal (recommended inside modals).
   */
  popoverContainer?: HTMLElement | DocumentFragment | null;
};

export function SingleDatePicker({
  value,
  onChange,
  placeholder = 'اختر التاريخ',
  disabled,
  className,
  wrapperClassName,
  id,
  name,
  min,
  max,
  align = 'end',
  popoverContainer,
}: SingleDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseIsoDateLocal(value);

  const disabledMatchers = React.useMemo((): Matcher | Matcher[] | undefined => {
    const list: Matcher[] = [];
    const minD = parseIsoDateLocal(min);
    const maxD = parseIsoDateLocal(max);
    if (minD) list.push({ before: minD });
    if (maxD) list.push({ after: maxD });
    if (list.length === 0) return undefined;
    return list.length === 1 ? list[0]! : list;
  }, [min, max]);

  const label = selected
    ? format(selected, 'EEEE، d MMMM yyyy', { locale: arSA })
    : null;

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {name ? <input type="hidden" name={name} value={value ?? ''} aria-hidden /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-expanded={open}
            className={cn(
              'flex min-h-11 w-full justify-start gap-2 rounded-md border-input bg-background px-3 py-2.5 text-right font-normal shadow-none transition-[border-color,box-shadow,background-color]',
              selected ? 'items-start' : 'items-center',
              !selected && 'text-muted-foreground',
              selected && 'border-primary/30 bg-primary/[0.05] text-foreground shadow-sm',
              className,
            )}
          >
            <CalendarIcon className={cn('h-4 w-4 shrink-0 text-muted-foreground', selected && 'mt-0.5')} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-right text-sm">
              {selected ? (
                <>
                  <span className="font-medium text-foreground">{label}</span>
                </>
              ) : (
                placeholder
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-[calc(100vw-1.5rem)] overflow-visible p-1"
          align={align}
          dir="rtl"
          sideOffset={8}
          collisionPadding={16}
          container={popoverContainer ?? undefined}
        >
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(d) => {
              if (d) onChange(format(d, ISO));
              setOpen(false);
            }}
            disabled={disabledMatchers}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

SingleDatePicker.displayName = 'SingleDatePicker';
