'use client';

import * as React from 'react';
import {
  DayPicker,
  getDefaultClassNames,
  formatCaption,
  formatMonthDropdown,
  formatWeekNumber,
  formatYearDropdown,
} from 'react-day-picker';
import { arSA } from 'date-fns/locale';

import { cn, toWesternDigits } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/** Force Western digits (0–9) in grid while keeping Arabic month/weekday labels. */
const LATIN_NUMERAL_FORMATTERS: NonNullable<CalendarProps['formatters']> = {
  formatDay: (date) => String(date.getDate()),
  formatCaption: (month, options, dateLib) =>
    toWesternDigits(formatCaption(month, options, dateLib)),
  formatMonthDropdown: (month, dateLib) =>
    toWesternDigits(formatMonthDropdown(month, dateLib)),
  formatYearDropdown: (year, dateLib) =>
    toWesternDigits(formatYearDropdown(year, dateLib)),
  formatWeekNumber: (weekNumber) => (weekNumber < 10 ? `0${weekNumber}` : `${weekNumber}`),
};

function Calendar({ className, classNames, locale = arSA, showOutsideDays = true, formatters, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      formatters={{ ...LATIN_NUMERAL_FORMATTERS, ...formatters }}
      className={cn('rose-rdp-calendar', className)}
      classNames={{ ...defaults, ...classNames }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
