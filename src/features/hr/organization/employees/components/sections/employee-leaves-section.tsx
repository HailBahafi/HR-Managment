'use client';

import Link from 'next/link';
import { Calendar, ExternalLink, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, cn } from '@/shared/utils';
import { Empty, LeaveBalanceCard } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function SummaryTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-arabic-display text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function EmployeeLeavesSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    leaveBalanceCards,
    leaveSummary,
    openLeaveRequest,
    filteredLeaveRequests,
    leavesLoading,
    leavesError,
    leaveTypeFilter,
    setLeaveTypeFilter,
    leaveStatusFilter,
    setLeaveStatusFilter,
    leaveTypeFilterOptions,
    leaveStatusFilterOptions,
    leaveStatusLabels,
  } = model;

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
          <p className="mt-1 text-xs text-muted-foreground">رصيد الإجازات وطلبات الموظف</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="luxe"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => openLeaveRequest()}
          >
            <Plus className="h-3.5 w-3.5" />
            طلب إجازة
          </Button>
          <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 text-xs" asChild>
            <Link href="/hr/leaves">
              <ExternalLink className="h-3.5 w-3.5" />
              إدارة الإجازات
            </Link>
          </Button>
        </div>
      </div>

      {leavesError ? (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {leavesError}
        </div>
      ) : null}

      {leaveBalanceCards.length > 0 ? (
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {leaveBalanceCards.map((card) => (
            <LeaveBalanceCard
              key={card.leaveTypeId}
              title={card.title}
              year={card.year}
              entitlementLabel={card.hasBalanceRow ? 'إجمالي الرصيد (أيام)' : 'لا يوجد رصيد مسجّل بعد'}
              entitled={card.entitled}
              used={card.used}
              available={card.available}
              yearEndExpected={card.yearEnd}
              accent={card.accent}
              onRequestLeave={() => openLeaveRequest(card.leaveTypeId)}
            />
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <Empty icon={Calendar} text="لا توجد أنواع إجازة أو أرصدة مسجّلة" />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          طلبات الإجازة
          {filteredLeaveRequests.length !== leaveSummary.requestCount ? (
            <span className="mr-2 text-xs font-normal text-muted-foreground">
              ({filteredLeaveRequests.length} من {leaveSummary.requestCount})
            </span>
          ) : null}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Select
            value={leaveTypeFilter}
            onValueChange={(v) => setLeaveTypeFilter(v as typeof leaveTypeFilter)}
          >
            <SelectTrigger className="h-9 w-[11rem] text-xs">
              <SelectValue placeholder="نوع الإجازة" />
            </SelectTrigger>
            <SelectContent>
              {leaveTypeFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={leaveStatusFilter}
            onValueChange={(v) => setLeaveStatusFilter(v as typeof leaveStatusFilter)}
          >
            <SelectTrigger className="h-9 w-[10rem] text-xs">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              {leaveStatusFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredLeaveRequests.length > 0 ? (
        <div className="space-y-2">
          {filteredLeaveRequests.map((req) => {
            const isApproved = req.status === 'approved';
            const isPending = req.status === 'pending';
            const isCancelled = req.status === 'cancelled';
            return (
              <div
                key={req.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:shadow-xs',
                  isApproved ? 'border-success/30 border-r-2 border-r-success'
                    : isPending ? 'border-warning/30 border-r-2 border-r-warning'
                      : isCancelled ? 'border-border border-r-2 border-r-muted-foreground/40'
                        : 'border-destructive/30 border-r-2 border-r-destructive',
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    isApproved ? 'bg-success/10 text-success'
                      : isPending ? 'bg-warning/10 text-warning'
                        : isCancelled ? 'bg-muted text-muted-foreground'
                          : 'bg-destructive/10 text-destructive',
                  )}
                  >
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {req.leaveTypeNameAr || req.reasonAr || 'طلب إجازة'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {req.startDate && formatDate(req.startDate)}
                      {req.endDate && ` ← ${formatDate(req.endDate)}`}
                      {req.workingDays != null && <> · {req.workingDays} يوم</>}
                    </div>
                    {req.reasonAr && req.leaveTypeNameAr ? (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{req.reasonAr}</p>
                    ) : null}
                  </div>
                </div>
                <StatusBadge
                  status={req.status}
                  labelOverride={leaveStatusLabels[req.status] ?? req.status}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          icon={Calendar}
          text={
            leaveSummary.requestCount > 0
              ? 'لا توجد طلبات مطابقة للفلتر الحالي'
              : `لا توجد طلبات إجازة لـ ${employee.name}`
          }
        />
      )}
    </section>
  );
}
