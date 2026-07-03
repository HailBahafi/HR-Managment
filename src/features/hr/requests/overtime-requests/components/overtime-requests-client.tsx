'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Timer, CalendarDays, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState, SearchableDropdown,
} from '@/components/ui/shared-dialogs';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import {
  EntityActionCard,
  EntityActionCardChip,
  EntityActionCardGrid,
  EntityActionCardMetric,
  EntityActionCardMetricsRow,
  type WorkflowStatusTone,
} from '@/components/ui/entity-action-card';
import { RequestApproverStatesPanel } from '@/features/hr/requests/components/request-approver-states-panel';
import { RequestApproversInline } from '@/features/hr/requests/components/request-approvers-inline';
import {
  ApprovalActionCell,
  ApprovalActionButtons,
} from '@/features/hr/requests/components/request-approval-actions';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { Can } from '@/components/shared/can';
import { cn } from '@/shared/utils';
import { STATUS_PILL } from '@/shared/status-pill-classes';
import {
  useOvertimeRequestsDirectoryModel,
  OVERTIME_STATUS_LABELS,
} from '@/features/hr/requests/overtime-requests/hooks/useOvertimeRequestsDirectoryModel';
import { formatMinutesAsHM, type OvertimeRequestRecord } from '@/features/hr/requests/overtime-requests/services/overtime-requests.service';
import type { OvertimeRequestStatusDto } from '@/features/hr/requests/lib/api/overtime-requests';

const STATUS_COLORS: Record<OvertimeRequestStatusDto, string> = {
  pending: STATUS_PILL.pending,
  approved: STATUS_PILL.approved,
  rejected: STATUS_PILL.rejected,
  cancelled: STATUS_PILL.cancelled,
};

const STATUS_TONE: Record<OvertimeRequestStatusDto, WorkflowStatusTone> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'muted',
};

type DraftForm = {
  employeeId: string;
  workDate: string;
  hours: string;
  minutes: string;
  reasonAr: string;
};

const EMPTY_FORM: DraftForm = {
  employeeId: '',
  workDate: new Date().toISOString().slice(0, 10),
  hours: '1',
  minutes: '0',
  reasonAr: '',
};

function isEditable(status: OvertimeRequestStatusDto): boolean {
  return status === 'pending';
}

function isCancellable(status: OvertimeRequestStatusDto): boolean {
  return status === 'pending';
}

function isDeletable(status: OvertimeRequestStatusDto): boolean {
  return status === 'rejected' || status === 'cancelled';
}

export function OvertimeRequestsClient() {
  const m = useOvertimeRequestsDirectoryModel();

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);

  const patch = (p: Partial<DraftForm>) => setForm((f) => ({ ...f, ...p }));

  React.useEffect(() => {
    if (!m.drawerOpen) return;
    if (m.editTarget) {
      setForm({
        employeeId: m.editTarget.employeeId,
        workDate: m.editTarget.workDate,
        hours: String(Math.floor(m.editTarget.requestedMinutes / 60)),
        minutes: String(m.editTarget.requestedMinutes % 60),
        reasonAr: m.editTarget.reasonAr,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [m.drawerOpen, m.editTarget]);

  if (m.accessDenied) {
    return <ForbiddenState title="لا تملك صلاحية الوصول لطلبات العمل الإضافي" />;
  }

  const handleSave = async () => {
    if (!form.employeeId) { setError('اختر الموظف'); return; }
    if (!form.workDate) { setError('تاريخ العمل الإضافي مطلوب'); return; }
    const hours = parseInt(form.hours || '0', 10);
    const minutes = parseInt(form.minutes || '0', 10);
    const totalMinutes = (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
    if (totalMinutes < 1) { setError('أدخل مدة عمل إضافي صحيحة (دقيقة واحدة على الأقل)'); return; }
    if (!form.reasonAr.trim() || form.reasonAr.trim().length < 3) {
      setError('السبب مطلوب (٣ أحرف على الأقل)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (m.editTarget) {
        await m.updateRequest(m.editTarget.id, {
          requestedMinutes: totalMinutes,
          reasonAr: form.reasonAr.trim(),
        });
        toast.success('تم تحديث طلب العمل الإضافي.');
      } else {
        await m.createRequest({
          employeeId: form.employeeId,
          workDate: form.workDate,
          requestedMinutes: totalMinutes,
          reasonAr: form.reasonAr.trim(),
        });
        toast.success('تم تقديم طلب العمل الإضافي.');
      }
      m.setDrawerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (x: OvertimeRequestRecord) => {
    if (!isEditable(x.status)) return;
    m.setEditTarget(x);
    m.setDrawerOpen(true);
  };

  const openDetail = (x: OvertimeRequestRecord) => m.setDetailTarget(x);

  const columns = React.useMemo((): ColumnDef<OvertimeRequestRecord>[] => [
    {
      key: 'employee',
      title: 'الموظف',
      render: (x) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{x.employeeNameAr}</p>
          {x.departmentNameAr ? <p className="text-[10px] text-muted-foreground">{x.departmentNameAr}</p> : null}
        </div>
      ),
    },
    {
      key: 'workDate',
      title: 'تاريخ العمل الإضافي',
      render: (x) => <TableDateCell value={x.workDate} />,
    },
    {
      key: 'minutes',
      title: 'المدة المطلوبة',
      render: (x) => <span className="tabular-nums font-medium" dir="ltr">{formatMinutesAsHM(x.requestedMinutes)}</span>,
    },
    {
      key: 'approvedMinutes',
      title: 'المدة المعتمدة',
      hideOnMobile: true,
      render: (x) => (
        <span className="tabular-nums text-muted-foreground" dir="ltr">
          {x.approvedMinutes != null ? formatMinutesAsHM(x.approvedMinutes) : '—'}
        </span>
      ),
    },
    {
      key: 'reasonAr',
      title: 'السبب',
      render: (x) => (
        <span className="text-xs text-muted-foreground max-w-[220px] truncate block">{x.reasonAr || '—'}</span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (x) => (
        <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[x.status])}>
          {OVERTIME_STATUS_LABELS[x.status]}
        </Badge>
      ),
    },
    {
      key: 'approvers',
      title: 'مسار الموافقة',
      hideOnMobile: true,
      render: (x) => <RequestApproversInline states={x.approverStates} />,
    },
    {
      key: 'decisionNotes',
      title: 'ملاحظات القرار',
      hideOnMobile: true,
      render: (x) => (
        <span className="line-clamp-2 max-w-[12rem] text-xs text-muted-foreground" title={x.decisionNotesAr || undefined}>
          {x.decisionNotesAr || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      render: (x) => {
        const loading = m.actionLoadingId === x.id;
        const menuItems = [
          { label: 'التفاصيل', onClick: () => openDetail(x) },
          ...(isEditable(x.status) ? [{ label: 'تعديل', onClick: () => openEdit(x) }] : []),
          ...(isCancellable(x.status) ? [{ label: 'سحب الطلب', onClick: () => m.setCancelId(x.id) }] : []),
          ...(isDeletable(x.status) ? [{
            label: 'حذف', onClick: () => m.setDeleteId(x.id), separator: true as const, destructive: true,
          }] : []),
        ];
        return (
          <div className="flex items-start justify-end gap-1">
            {m.canShowApprovalActions(x) ? (
              <ApprovalActionCell
                states={x.approverStates}
                currentEmployeeId={m.currentEmployeeId}
                getUiState={() => m.getApprovalUiState(x)}
                onApprove={() => void m.handleApprove(x)}
                onReject={() => void m.handleReject(x)}
              />
            ) : null}
            <TableRowActions menuItems={menuItems} />
            {loading ? <span className="text-[10px] text-muted-foreground">…</span> : null}
          </div>
        );
      },
    },
  ], [m]);

  return (
    <>
      <SetPageTitle
        titleAr="طلبات العمل الإضافي"
        descriptionAr="تقديم واعتماد طلبات العمل الإضافي للموظفين."
        iconName="Timer"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-5">
        {!m.loading && m.items.length === 0 && m.pagination.total === 0 ? (
          <EmptyState icon={Timer} title="لا توجد طلبات عمل إضافي" description="أضف طلب عمل إضافي جديد لموظف للبدء." />
        ) : (
          <DirectoryPagedViews items={m.items} serverPagination={m.pagination} loading={m.loading}>
            {(pageItems) => m.viewMode === 'list' ? (
              <DataTable
                variant="directory"
                alwaysShowTable
                tableClassName="min-w-[1200px]"
                columns={columns}
                data={pageItems}
                keyExtractor={(x) => x.id}
                emptyText="لا توجد طلبات"
                onRowClick={(x) => {
                  if (isEditable(x.status)) openEdit(x);
                  else openDetail(x);
                }}
              />
            ) : (
              <EntityActionCardGrid>
                {pageItems.map((x) => {
                  const loading = m.actionLoadingId === x.id;
                  return (
                    <EntityActionCard
                      key={x.id}
                      title={x.employeeNameAr}
                      subtitle={x.departmentNameAr || undefined}
                      onClick={() => (isEditable(x.status) ? openEdit(x) : openDetail(x))}
                      status={{ label: OVERTIME_STATUS_LABELS[x.status], tone: STATUS_TONE[x.status] }}
                      chips={
                        <>
                          <EntityActionCardChip className="font-mono tabular-nums">
                            <span className="inline-flex items-center gap-1" dir="ltr">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              {x.workDate}
                            </span>
                          </EntityActionCardChip>
                        </>
                      }
                      metrics={
                        <EntityActionCardMetricsRow>
                          <EntityActionCardMetric label="المدة المطلوبة" value={formatMinutesAsHM(x.requestedMinutes)} dir="ltr" />
                          <EntityActionCardMetric
                            label="المدة المعتمدة"
                            value={x.approvedMinutes != null ? formatMinutesAsHM(x.approvedMinutes) : '—'}
                            dir="ltr"
                          />
                        </EntityActionCardMetricsRow>
                      }
                      description={
                        [x.reasonAr, x.decisionNotesAr?.trim() ? `ملاحظات القرار: ${x.decisionNotesAr}` : '']
                          .filter(Boolean)
                          .join(' — ') || undefined
                      }
                      workflow={
                        m.canShowApprovalActions(x)
                          ? {
                              showApproveReject: true,
                              onApprove: () => void m.handleApprove(x),
                              onReject: () => void m.handleReject(x),
                              disabled: !m.getApprovalUiState(x).canAct,
                              waitingReason: m.getApprovalUiState(x).reasonAr ?? undefined,
                            }
                          : undefined
                      }
                      extraFooter={
                        isCancellable(x.status) || isDeletable(x.status) ? (
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            {isCancellable(x.status) ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-amber-600"
                                disabled={loading}
                                onClick={() => m.setCancelId(x.id)}
                              >
                                <Ban className="h-3 w-3 me-1" />
                                سحب الطلب
                              </Button>
                            ) : null}
                            {isDeletable(x.status) ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                disabled={loading}
                                onClick={() => m.setDeleteId(x.id)}
                              >
                                حذف
                              </Button>
                            ) : null}
                          </div>
                        ) : undefined
                      }
                    >
                      <RequestApproversInline states={x.approverStates} />
                      <RequestApproverStatesPanel states={x.approverStates} compact className="border-0 bg-transparent p-0" />
                    </EntityActionCard>
                  );
                })}
              </EntityActionCardGrid>
            )}
          </DirectoryPagedViews>
        )}
      </div>

      <Can permission="hr.requests.overtime-requests.create">
        <HRSettingsFormDrawer
          open={m.drawerOpen}
          onOpenChange={m.setDrawerOpen}
          title={m.editTarget ? 'تعديل طلب العمل الإضافي' : 'طلب عمل إضافي جديد'}
          onSave={() => void handleSave()}
          saveDisabled={saving}
          error={error}
        >
          <FormField label="الموظف" required>
            <SearchableDropdown
              value={form.employeeId}
              onChange={(id) => patch({ employeeId: id })}
              options={m.employees}
              placeholder="اختر الموظف…"
              disabled={!!m.editTarget}
            />
          </FormField>
          <FormField label="تاريخ العمل الإضافي" required>
            <DatePickerInput value={form.workDate} onChange={(ymd) => patch({ workDate: ymd })} disabled={!!m.editTarget} />
          </FormField>
          <FormField label="المدة المطلوبة" required span2>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Input type="number" min={0} value={form.hours} onChange={(e) => patch({ hours: e.target.value })} placeholder="ساعات" />
                <p className="text-[10px] text-muted-foreground">ساعات</p>
              </div>
              <div className="flex-1 space-y-1">
                <Input type="number" min={0} max={59} value={form.minutes} onChange={(e) => patch({ minutes: e.target.value })} placeholder="دقائق" />
                <p className="text-[10px] text-muted-foreground">دقائق</p>
              </div>
            </div>
          </FormField>
          <FormField label="سبب طلب العمل الإضافي" required span2>
            <Textarea
              value={form.reasonAr}
              onChange={(e) => patch({ reasonAr: e.target.value })}
              rows={3}
              minLength={3}
              placeholder="اشرح سبب الحاجة للعمل الإضافي (٣ أحرف على الأقل)…"
            />
          </FormField>
          {!m.editTarget ? (
            <p className="col-span-2 text-[11px] text-muted-foreground">
              يُقدَّم الطلب بحالة «قيد الموافقة»، ويمكن اعتماده مباشرة إن لم يوجد مسار موافقة مُسنَد لهذا النوع من الطلبات.
            </p>
          ) : null}
        </HRSettingsFormDrawer>
      </Can>

      <ConfirmationModal
        open={!!m.cancelId}
        onOpenChange={(v) => { if (!v) m.setCancelId(null); }}
        title="سحب طلب العمل الإضافي"
        description="هل أنت متأكد من سحب هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="سحب الطلب"
        variant="destructive"
        onConfirm={() => void m.handleCancel()}
      />

      <ConfirmationModal
        open={!!m.deleteId}
        onOpenChange={(v) => { if (!v) m.setDeleteId(null); }}
        title="حذف طلب العمل الإضافي"
        description="هل أنت متأكد من حذف هذا الطلب نهائياً؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={() => void m.handleDelete()}
      />

      <Dialog open={m.detailTarget != null} onOpenChange={(o) => { if (!o) m.setDetailTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب العمل الإضافي</DialogTitle>
          </DialogHeader>
          {m.detailTarget ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">الموظف</p>
                  <p className="text-sm font-medium">{m.detailTarget.employeeNameAr}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">القسم</p>
                  <p className="text-sm font-medium">{m.detailTarget.departmentNameAr || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ العمل الإضافي</p>
                  <p className="text-sm font-medium font-mono">{m.detailTarget.workDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">حالة الطلب</p>
                  <p className="text-sm font-medium">{OVERTIME_STATUS_LABELS[m.detailTarget.status]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المدة المطلوبة</p>
                  <p className="text-sm font-medium tabular-nums" dir="ltr">{formatMinutesAsHM(m.detailTarget.requestedMinutes)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المدة المعتمدة</p>
                  <p className="text-sm font-medium tabular-nums" dir="ltr">
                    {m.detailTarget.approvedMinutes != null ? formatMinutesAsHM(m.detailTarget.approvedMinutes) : '—'}
                  </p>
                </div>
                {m.detailTarget.previousOvertimeMinutes != null ? (
                  <div>
                    <p className="text-xs text-muted-foreground">إضافي سابق في اليوم</p>
                    <p className="text-sm font-medium tabular-nums" dir="ltr">
                      {formatMinutesAsHM(m.detailTarget.previousOvertimeMinutes)}
                      {m.detailTarget.previousOvertimePayrollAllowed ? ' · محتسب في الرواتب' : ''}
                    </p>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">السبب</p>
                  <p className="text-sm">{m.detailTarget.reasonAr || '—'}</p>
                </div>
                {m.detailTarget.decisionNotesAr ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">ملاحظات القرار</p>
                    <p className="text-sm">{m.detailTarget.decisionNotesAr}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ التقديم</p>
                  <p className="text-sm font-medium font-mono">{m.detailTarget.submittedAt.slice(0, 10)}</p>
                </div>
                {m.detailTarget.decidedAt ? (
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ القرار</p>
                    <p className="text-sm font-medium font-mono">{m.detailTarget.decidedAt.slice(0, 10)}</p>
                  </div>
                ) : null}
              </div>
              <RequestApproversInline states={m.detailTarget.approverStates} />
              <RequestApproverStatesPanel states={m.detailTarget.approverStates} />
              {m.canShowApprovalActions(m.detailTarget) ? (
                <ApprovalActionButtons
                  states={m.detailTarget.approverStates}
                  currentEmployeeId={m.currentEmployeeId}
                  getUiState={() => m.getApprovalUiState(m.detailTarget!)}
                  onApprove={() => void m.handleApprove(m.detailTarget!)}
                  onReject={() => void m.handleReject(m.detailTarget!)}
                />
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

