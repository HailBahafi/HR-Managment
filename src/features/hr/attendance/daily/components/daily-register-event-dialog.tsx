'use client';

import * as React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ModernTimePicker from '@/components/ui/modern-time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, dialogFormFooterClass } from '@/components/ui/dialog';
import { attendanceEventsApi, type AttendanceEventResponseDto } from '@/features/hr/attendance/lib/api/attendance-events';
import { useNextEventType } from '@/features/hr/attendance/daily/hooks/useNextEventType';
import {
  RegisterEventTypePicker,
  type RegisterableEventType,
} from '@/features/hr/attendance/daily/components/register-event-type-picker';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

const REGISTER_SUCCESS_MSG: Record<RegisterableEventType, string> = {
  check_in:  'تم تسجيل الحضور بنجاح',
  check_out: 'تم تسجيل الانصراف بنجاح',
};

function nowTimeLocal() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
  employeeName: string;
  workDate: string;
  companyId: string;
  onCreated?: (evt: AttendanceEventResponseDto) => void;
};

export function DailyRegisterEventDialog({ open, onOpenChange, employeeId, employeeName, workDate, companyId, onCreated }: Props) {
  const [eventType, setEventType] = React.useState<RegisterableEventType>('check_in');
  const [time, setTime] = React.useState(nowTimeLocal());
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const { loading: nextTypeLoading, nextEventType, message: nextTypeMessage, data: nextEventData } = useNextEventType({
    employeeId,
    companyId,
    workDate,
    enabled: open,
  });

  React.useEffect(() => {
    if (open) { setTime(nowTimeLocal()); setNotes(''); }
  }, [open]);

  React.useEffect(() => {
    if (open && !nextTypeLoading) setEventType(nextEventType);
  }, [open, nextTypeLoading, nextEventType]);

  const handleSave = async () => {
    if (!time) { toast.error('الوقت مطلوب'); return; }
    setSaving(true);
    try {
      const [hh, mm] = time.split(':');
      const occurredAt = new Date(`${workDate}T${hh}:${mm}:00`).toISOString();
      const res = await attendanceEventsApi.create({
        companyId,
        employeeId,
        eventType,
        occurredAt,
        workDate,
        source: 'manual_hr',
        notes: notes.trim() || null,
      });
      toast.success(REGISTER_SUCCESS_MSG[eventType]);
      onCreated?.(res);
      onOpenChange(false);
    } catch (err) {
      handleApiError(err, 'attendance/events');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right font-display text-base">تسجيل حدث حضور</DialogTitle>
          <p className="text-xs text-muted-foreground text-right">
            {employeeName} · <span dir="ltr">{workDate}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <RegisterEventTypePicker
            value={eventType}
            onChange={setEventType}
            nextEventType={nextEventType}
            loading={nextTypeLoading}
            message={nextTypeMessage}
            nextEventData={nextEventData}
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">نوع الحدث</Label>
            {nextTypeLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جاري تحديد نوع الحدث القادم…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {REGISTERABLE_EVENT_TYPES.map((t) => {
                    const m = REGISTER_EVENT_TYPE_META[t];
                    const Icon = m.icon;
                    const isSuggested = t === nextEventType;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEventType(t)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all',
                          eventType === t
                            ? 'border-primary bg-primary/8 text-primary shadow-sm ring-1 ring-primary/30'
                            : 'border-border bg-card text-muted-foreground hover:bg-accent/50',
                          isSuggested && eventType !== t && 'border-primary/25',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {m.labelAr}
                      </button>
                    );
                  })}
                </div>
                {nextTypeMessage ? (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{nextTypeMessage}</p>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              الوقت <span className="text-destructive">*</span>
            </Label>
            <ModernTimePicker value={time} onChange={setTime} placeholder="اختر الوقت" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">ملاحظة (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سبب التعديل اليدوي…"
              className="min-h-[56px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button onClick={handleSave} disabled={saving || nextTypeLoading} className="gap-2">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            تسجيل
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
