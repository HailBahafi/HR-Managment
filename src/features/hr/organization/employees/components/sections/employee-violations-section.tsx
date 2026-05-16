'use client';

import Link from 'next/link';
import { AlertTriangle, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, cn } from '@/shared/utils';
import { CASE_STATUS_LABELS, type HRViolationCaseStatus } from '@/features/hr/discipline/lib/types';
import { Empty, SectionH } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeViolationsSection({ model }: { model: EmployeeProfileModel }) {
  const { employeeViolations } = model;

  return (
    <section>
      <SectionH
        icon={AlertTriangle}
        title="المخالفات"
        subtitle="سجل المخالفات والإنذارات"
        action={(
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href="/hr/discipline/cases"><ExternalLink className="h-3 w-3" />السجل الكامل</Link>
          </Button>
        )}
      />
      {employeeViolations.length > 0 ? (
        <div className="space-y-2">
          {employeeViolations.map((v) => {
            const st = v.status as HRViolationCaseStatus;
            const isOpen = st === 'draft' || st === 'submitted' || st === 'under_review';
            const isRejected = st === 'rejected';
            const isGranted = st === 'approved' || st === 'executed';
            const isClosed = st === 'closed';
            return (
              <div
                key={v.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs border-r-2',
                  isOpen && 'border-warning/25 bg-warning/5 border-r-warning',
                  isRejected && 'border-destructive/25 bg-destructive/5 border-r-destructive',
                  isGranted && 'border-border/60 border-r-success/40',
                  isClosed && 'border-border/60 border-r-muted-foreground/30 bg-muted/10',
                  !isOpen && !isRejected && !isGranted && !isClosed && 'border-border/60 border-r-border',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    isOpen && 'bg-warning/10 text-warning',
                    isRejected && 'bg-destructive/10 text-destructive',
                    isGranted && 'bg-success/10 text-success',
                    isClosed && 'bg-muted text-muted-foreground',
                    !isOpen && !isRejected && !isGranted && !isClosed && 'bg-muted text-muted-foreground',
                  )}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{v.typeNameAr}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {formatDate(v.date)}
                      {v.description && <> <span className="mx-1.5 text-muted-foreground/40">·</span> {v.description}</>}
                    </div>
                    {v.typeHasDeduction && (
                      <div className="text-xs text-destructive mt-0.5">
                        خصم {v.typeDeductionValue}
                        {' '}
                        {v.typeDeductionKind === 'amount' ? 'ريال' : v.typeDeductionKind === 'day' ? 'يوم' : 'ساعة'}
                      </div>
                    )}
                  </div>
                </div>
                <StatusBadge status={v.status} labelOverride={CASE_STATUS_LABELS[st]} />
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={Award} text="سجل نظيف — لا توجد مخالفات" />
      )}
    </section>
  );
}
