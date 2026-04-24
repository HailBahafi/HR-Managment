'use client';

import * as React from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { arSA } from 'date-fns/locale';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, locale = arSA, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      className={cn('nawa-rdp-calendar', className)}
      classNames={{ ...defaults, ...classNames }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
