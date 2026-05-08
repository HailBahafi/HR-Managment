'use client';

import { FileText } from 'lucide-react';
import { StatusBadge, RequestTypeLabel } from '@/components/status-badge';
import { formatDate, cn } from '@/lib/utils';
import { Empty, SectionH } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeRequestsSection({ model }: { model: EmployeeProfileModel }) {
  const { employeeRequests } = model;

  return (
    <section>
      <SectionH
        icon={FileText}
        title="الطلبات"
        subtitle={`${employeeRequests.length} طلب مسجّل`}
      />
      {employeeRequests.length > 0 ? (
        <div className="space-y-2">
          {employeeRequests.map((req) => {
            const isApproved = req.status === 'approved';
            const isPending = ['pending', 'under_review'].includes(req.status);
            return (
              <div
                key={req.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs',
                  isApproved ? 'border-success/30 border-r-2 border-r-success'
                    : isPending ? 'border-warning/30 border-r-2 border-r-warning'
                      : 'border-border/60 border-r-2 border-r-muted-foreground/25',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    isApproved ? 'bg-success/10 text-success'
                      : isPending ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground',
                  )}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      <RequestTypeLabel type={req.type} />
                      <span className="text-muted-foreground/70 mx-1.5">·</span>
                      <span className="text-muted-foreground/80">{req.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(req.submittedAt)}
                      {req.requestNumber && (
                        <>
                          <span className="mx-1.5 text-muted-foreground/40">·</span>
                          <span className="font-mono">#{req.requestNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={FileText} text="لا توجد طلبات" />
      )}
    </section>
  );
}
