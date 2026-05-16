'use client';

import Link from 'next/link';
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, cn } from '@/shared/utils';
import { Empty, LeaveBalanceCard } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeLeavesSection({ model }: { model: EmployeeProfileModel }) {
  const { leaveBalanceDisplay, setLeaveRequestOpen, employeeRequests } = model;
  const leaveReqs = employeeRequests.filter((r) => r.type === 'leave');

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

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeaveBalanceCard
          title="إجازة سنوية"
          year={leaveBalanceDisplay.year}
          entitlementLabel="الاستحقاق السنوي"
          entitled={leaveBalanceDisplay.entitled}
          used={leaveBalanceDisplay.annual.used}
          available={leaveBalanceDisplay.annual.available}
          yearEndExpected={leaveBalanceDisplay.annual.yearEnd}
          accent="success"
          onRequestLeave={() => setLeaveRequestOpen(true)}
        />
        <LeaveBalanceCard
          title="إجازة مرضية"
          year={leaveBalanceDisplay.year}
          entitlementLabel="الاستحقاق المعتمد (أيام)"
          entitled={leaveBalanceDisplay.entitled}
          used={leaveBalanceDisplay.sick.used}
          available={leaveBalanceDisplay.sick.available}
          yearEndExpected={leaveBalanceDisplay.sick.yearEnd}
          accent="primary"
          onRequestLeave={() => setLeaveRequestOpen(true)}
        />
      </div>

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
                    <div className="text-sm font-medium truncate">{req.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {req.fromDate && formatDate(req.fromDate)}
                      {req.toDate && ` ← ${formatDate(req.toDate)}`}
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
