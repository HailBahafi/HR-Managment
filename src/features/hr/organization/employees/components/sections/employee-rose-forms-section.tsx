'use client';

import * as React from 'react';
import { FileStack } from 'lucide-react';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeRoseFormsSection({ model: _ }: { model: EmployeeProfileModel }) {
  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="relative p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <FileStack className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">نماذج روز للتجارة</h2>
              <p className="text-sm text-muted-foreground mt-1">
                لا يوجد endpoint لهذه النماذج — هذه الميزة غير متصلة بالخادم بعد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
