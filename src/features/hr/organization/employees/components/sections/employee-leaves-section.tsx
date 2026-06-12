'use client';

import Link from 'next/link';
import { Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, cn } from '@/shared/utils';
import { Empty, LeaveBalanceCard } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeLeavesSection({ model }: { model: EmployeeProfileModel }) {
  const { leaveBalanceCards, setLeaveRequestOpen, leaveRequests, leavesLoading } = model;
  const leaveReqs = leaveRequests;

  if (leavesLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل الإجازات…
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-arabic-display text-lg font-semibold tracking-tight text-foreground">
            <Calendar className="h-5 w-5 shrink-0 text-primary" />
            الإجازات
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">رصيد الإجازات والطلبات</p>
        </div>
        <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 text-xs" asChild>
          <Link href="/hr/leaves">
            <ExternalLink className="h-3.5 w-3.5" />
            إدارة الإجازات
          </Link>
        </Button>
      </div>

      {leaveBalanceCards.length > 0 ? (
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {leaveBalanceCards.map((card) => (
            <LeaveBalanceCard
              key={card.leaveTypeId}
              title={card.title}
              year={card.year}
              entitlementLabel="إجمالي الرصيد (أيام)"
              entitled={card.entitled}
              used={card.used}
              available={card.available}
              yearEndExpected={card.yearEnd}
              accent={card.accent}
              onRequestLeave={() => setLeaveRequestOpen(true)}
            />
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <Empty icon={Calendar} text="لا توجد أرصدة إجازات مسجّلة" />
        </div>
      )}

      {leaveReqs.length > 0 ? (
        <div className="space-y-2">
          {leaveReqs.map((req) => {
            const isApproved = req.status === 'approved';
            const isPending = ['pending', 'under_review'].includes(req.status);
            return (
              <div
                key={req.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs',
                  isApproved ? 'border-success/30 border-r-2 border-r-success'
                    : isPending ? 'border-warning/30 border-r-2 border-r-warning'
                      : 'border-destructive/30 border-r-2 border-r-destructive',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    isApproved ? 'bg-success/10 text-success'
                      : isPending ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive',
                  )}
                  >
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{req.noteAr ?? 'طلب إجازة'}</div>
                    <div className="text-xs text-muted-foreground">
                      {req.startDate && formatDate(req.startDate)}
                      {req.endDate && ` ← ${formatDate(req.endDate)}`}
                      {req.workingDays != null && <> · {req.workingDays} يوم</>}
                    </div>
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={Calendar} text="لا توجد طلبات إجازة" />
      )}
    </section>
  );
}
