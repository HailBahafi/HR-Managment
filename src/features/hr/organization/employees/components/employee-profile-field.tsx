'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { cn } from '@/shared/utils';
import { Prop } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';

export type EmployeeProfileDraft = Employee;

type FieldProps<K extends keyof EmployeeProfileDraft> = {
  field: K;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number';
  mono?: boolean;
  accent?: 'primary' | 'gold' | 'success' | 'warning' | 'destructive';
  format?: (v: EmployeeProfileDraft[K]) => React.ReactNode;
  icon: React.ElementType;
  label: string;
  editable?: boolean;
  draft: EmployeeProfileDraft;
  editingPersonal: boolean;
  updateField: <Key extends keyof EmployeeProfileDraft>(key: Key, value: EmployeeProfileDraft[Key]) => void;
};

export function EmployeeProfileField<K extends keyof EmployeeProfileDraft>({
  field,
  type = 'text',
  mono,
  accent,
  format,
  icon,
  label,
  editable = false,
  draft,
  editingPersonal,
  updateField,
}: FieldProps<K>) {
  const value = draft[field];
  const display: React.ReactNode = format ? format(value) : (value as React.ReactNode);

  if (!editable || !editingPersonal) {
    return <Prop icon={icon} label={label} mono={mono} accent={accent}>{display}</Prop>;
  }

  return (
    <div className="group relative flex items-start gap-3 py-3 px-3.5 rounded-xl border border-primary/30 bg-card transition-all">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {React.createElement(icon, { className: 'h-3.5 w-3.5' })}
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80 mb-1 font-medium block">{label}</label>
        <input
          type={type}
          value={String(value ?? '')}
          onChange={(e) => {
            const v = type === 'number' ? Number(e.target.value) : e.target.value;
            updateField(field, v as EmployeeProfileDraft[K]);
          }}
          dir={mono ? 'ltr' : undefined}
          className={cn(
            'w-full bg-transparent text-sm font-medium text-foreground border-0 border-b border-primary/30 px-0 py-0.5 focus:outline-none focus:border-primary transition-colors',
            mono && 'font-mono text-xs',
          )}
        />
      </div>
    </div>
  );
}
