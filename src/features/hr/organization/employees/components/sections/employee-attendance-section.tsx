'use client';

import {
  X,
  Clock,
  Layers,
  Link2,
  MapPinned,
  Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import { cn } from '@/lib/utils';
import { EmployeeAttendanceDialogs } from '@/features/hr/organization/employees/components/dialogs/EmployeeAttendanceDialogs';
import { EmployeeAttendanceRecentEvents } from '@/features/hr/organization/employees/components/sections/employee-attendance-recent-events';
import { EmployeeAttendanceStatsGrid } from '@/features/hr/organization/employees/components/sections/employee-attendance-stats-grid';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeAttendanceSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    attFrom,
    setAttFrom,
    attTo,
    setAttTo,
    employeeSummaries,
    attendanceStats,
    employeeAssignments,
    shiftTemplates,
    employeeCheckpoints,
    checkpoints,
    openShiftDialog,
    openCpDialog,
    shiftOpen,
    setShiftOpen,
    shiftMode,
    setShiftMode,
    shiftTemplateId,
    setShiftTemplateId,
    shiftDate,
    setShiftDate,
    shiftHours,
    setShiftHours,
    shiftUnlinkTarget,
    setShiftUnlinkTarget,
    submitShift,
    removeAssignment,
    cpOpen,
    setCpOpen,
    cpDate,
    setCpDate,
    cpSel,
    setCpSel,
    cpQuery,
    setCpQuery,
    cpUnlinkTarget,
    setCpUnlinkTarget,
    submitCpLink,
    removeCheckpointLink,
    employeeEvents,
  } = model;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">تصفية بالتاريخ:</span>
        <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:min-w-0 sm:flex-1 sm:flex-row sm:items-stretch sm:gap-2">
          <SingleDatePicker
            value={attFrom}
            onChange={setAttFrom}
            placeholder="من تاريخ"
            wrapperClassName="min-w-0 w-full sm:min-w-[11rem] sm:flex-1"
            className="h-8 min-w-0 text-xs"
          />
          <span className="flex shrink-0 items-center justify-center text-muted-foreground text-xs sm:w-6" aria-hidden>←</span>
          <SingleDatePicker
            value={attTo}
            onChange={setAttTo}
            placeholder="إلى تاريخ"
            wrapperClassName="min-w-0 w-full sm:min-w-[11rem] sm:flex-1"
            className="h-8 min-w-0 text-xs"
          />
          {(attFrom || attTo) && (
            <button
              type="button"
              onClick={() => {
                setAttFrom('');
                setAttTo('');
              }}
              className="flex shrink-0 items-center justify-center gap-1 self-start rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors sm:self-center"
            >
              <X className="h-3 w-3" />
              مسح
            </button>
          )}
        </div>
        {(attFrom || attTo) && (
          <span className="text-[11px] font-medium text-primary shrink-0 sm:ms-auto">
            {employeeSummaries.length} سجل
          </span>
        )}
      </div>

      <EmployeeAttendanceStatsGrid
        presentDays={attendanceStats.presentDays}
        lateHours={attendanceStats.lateHours}
        absentDays={attendanceStats.absentDays}
        earlyLeaveDays={attendanceStats.earlyLeaveDays}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">الشيفت المرتبط</h3>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] px-2" onClick={openShiftDialog}>
              <Layers className="h-3 w-3" /> ربط
            </Button>
          </div>
          <div className="p-2 space-y-1.5">
            {employeeAssignments.length > 0 ? employeeAssignments.map((asg) => {
              const isOpen = asg.templateId === '__open__';
              const tpl = !isOpen ? shiftTemplates.find((t) => t.id === asg.templateId) : null;
              return (
                <div
                  key={asg.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 border-r-2"
                  style={{ borderRightColor: !isOpen && tpl ? tpl.colorHex : undefined }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={!isOpen && tpl ? { background: `${tpl.colorHex}22`, color: tpl.colorHex } : undefined}
                    >
                      {isOpen ? <Clock className="h-3.5 w-3.5 text-primary" /> : <Layers className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">
                        {isOpen ? `شيفت مفتوح · ${asg.openShiftHours ?? '?'} ساعة` : (tpl?.nameAr ?? 'شيفت')}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono" dir="ltr">{asg.effectiveFrom}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setShiftUnlinkTarget(asg.id)}>
                    <Unlink className="h-3 w-3" />
                  </Button>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center gap-1.5 py-5 text-center text-muted-foreground">
                <Layers className="h-5 w-5 opacity-40" />
                <p className="text-xs">لم يُرتبط بشيفت بعد</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">نقاط التسجيل</h3>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px] px-2" onClick={openCpDialog}>
              <Link2 className="h-3 w-3" /> ربط
            </Button>
          </div>
          <div className="p-2 space-y-1.5">
            {employeeCheckpoints.length > 0 ? employeeCheckpoints.map((link) => {
              const cp = checkpoints.find((c) => c.id === link.checkInPointId);
              return (
                <div
                  key={link.id}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 border-r-2',
                    link.linkActive ? 'border-r-success' : 'border-r-muted-foreground/25',
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                      link.linkActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                    )}
                    >
                      <MapPinned className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{cp?.nameAr || 'نقطة تسجيل'}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                          {cp?.latitude?.toFixed(4)}, {cp?.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={link.linkActive ? 'success' : 'subtle'} className="text-[10px] h-4 px-1.5">
                      {link.linkActive ? 'نشط' : 'موقوف'}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => setCpUnlinkTarget(link.id)}>
                      <Unlink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center gap-1.5 py-5 text-center text-muted-foreground">
                <MapPinned className="h-5 w-5 opacity-40" />
                <p className="text-xs">لا توجد نقاط مرتبطة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EmployeeAttendanceRecentEvents employeeEvents={employeeEvents} />

      <EmployeeAttendanceDialogs
        employeeName={employee.name}
        shiftOpen={shiftOpen}
        setShiftOpen={setShiftOpen}
        shiftMode={shiftMode}
        setShiftMode={setShiftMode}
        shiftTemplateId={shiftTemplateId}
        setShiftTemplateId={setShiftTemplateId}
        shiftDate={shiftDate}
        setShiftDate={setShiftDate}
        shiftHours={shiftHours}
        setShiftHours={setShiftHours}
        shiftUnlinkTarget={shiftUnlinkTarget}
        setShiftUnlinkTarget={setShiftUnlinkTarget}
        submitShift={submitShift}
        removeAssignment={removeAssignment}
        cpOpen={cpOpen}
        setCpOpen={setCpOpen}
        cpDate={cpDate}
        setCpDate={setCpDate}
        cpSel={cpSel}
        setCpSel={setCpSel}
        cpQuery={cpQuery}
        setCpQuery={setCpQuery}
        cpUnlinkTarget={cpUnlinkTarget}
        setCpUnlinkTarget={setCpUnlinkTarget}
        submitCpLink={submitCpLink}
        removeCheckpointLink={removeCheckpointLink}
        checkpoints={checkpoints}
        shiftTemplates={shiftTemplates}
        employeeCheckpoints={employeeCheckpoints}
      />
    </section>
  );
}
