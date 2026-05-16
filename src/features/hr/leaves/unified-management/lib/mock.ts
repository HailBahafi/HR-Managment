import type { EmployeeLeaveAnalyticsRow, TimelineLeaveBar } from '@/features/hr/leaves/analytics/types';
import type {
  UnifiedEmployee,
  UnifiedLeaveRecord,
  LeaveApprovalStep,
  EmployeeLeaveBalanceRow,
} from '@/features/hr/leaves/unified-management/types';

// ─── Mock branches / departments ──────────────────────────────────────────────

export const MOCK_BRANCHES = [
  { id: 'br-ruh', nameAr: 'الرياض', nameEn: 'Riyadh' },
  { id: 'br-jed', nameAr: 'جدة', nameEn: 'Jeddah' },
  { id: 'br-dmm', nameAr: 'الدمام', nameEn: 'Dammam' },
];

export const MOCK_DEPARTMENTS = [
  { id: 'dep-hr', nameAr: 'الموارد البشرية', nameEn: 'HR' },
  { id: 'dep-it', nameAr: 'تقنية المعلومات', nameEn: 'IT' },
  { id: 'dep-fin', nameAr: 'المالية', nameEn: 'Finance' },
  { id: 'dep-ops', nameAr: 'العمليات', nameEn: 'Operations' },
];

// ─── Mock employees ────────────────────────────────────────────────────────────

export const MOCK_UNIFIED_EMPLOYEES: UnifiedEmployee[] = [
  { id: 'ue-01', nameAr: 'عبدالرحمن المالكي', nameEn: 'Abdulrahman Al-Malki', departmentId: 'dep-hr', homeBranchId: 'br-ruh', postings: [] },
  { id: 'ue-02', nameAr: 'ريم الشهراني', nameEn: 'Reem Al-Shahrani', departmentId: 'dep-it', homeBranchId: 'br-ruh', postings: [] },
  { id: 'ue-03', nameAr: 'خالد العتيبي', nameEn: 'Khalid Al-Otaibi', departmentId: 'dep-fin', homeBranchId: 'br-jed', postings: [] },
  { id: 'ue-04', nameAr: 'نورة السلمي', nameEn: 'Noura Al-Salmi', departmentId: 'dep-ops', homeBranchId: 'br-jed', postings: [{ branchId: 'br-ruh', from: '2026-01-01', to: '2026-06-30' }] },
  { id: 'ue-05', nameAr: 'فهد الدوسري', nameEn: 'Fahad Al-Dossari', departmentId: 'dep-it', homeBranchId: 'br-dmm', postings: [] },
  { id: 'ue-06', nameAr: 'سارة القحطاني', nameEn: 'Sara Al-Qahtani', departmentId: 'dep-fin', homeBranchId: 'br-ruh', postings: [] },
  { id: 'ue-07', nameAr: 'محمد الزهراني', nameEn: 'Mohammed Al-Zahrani', departmentId: 'dep-ops', homeBranchId: 'br-dmm', postings: [] },
  { id: 'ue-08', nameAr: 'لمياء الحربي', nameEn: 'Lamya Al-Harbi', departmentId: 'dep-hr', homeBranchId: 'br-jed', postings: [] },
];

// ─── Approval chain helpers ────────────────────────────────────────────────────

export function defaultPendingApprovalChain(): LeaveApprovalStep[] {
  return [
    { id: 'step-1', nameAr: 'المدير المباشر', nameEn: 'Direct Manager', roleAr: 'مدير', roleEn: 'Manager', status: 'pending' },
    { id: 'step-2', nameAr: 'مدير الموارد البشرية', nameEn: 'HR Manager', roleAr: 'مدير HR', roleEn: 'HR Manager', status: 'waiting' },
    { id: 'step-3', nameAr: 'المدير العام', nameEn: 'General Manager', roleAr: 'مدير عام', roleEn: 'GM', status: 'waiting' },
  ];
}

function approvedChain(): LeaveApprovalStep[] {
  return defaultPendingApprovalChain().map((s) => ({ ...s, status: 'approved' as const, decidedAt: '2026-04-01T09:00:00Z' }));
}

function workingDays(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

// ─── Mock leaves ──────────────────────────────────────────────────────────────

export const MOCK_UNIFIED_LEAVES: UnifiedLeaveRecord[] = [
  {
    id: 'lv-01', employeeId: 'ue-01', type: 'annual', status: 'pending',
    start: '2026-05-01', end: '2026-05-07', requestBranchId: 'br-ruh',
    workingDays: workingDays('2026-05-01', '2026-05-07'),
    noteAr: 'إجازة عائلية سنوية', noteEn: 'Annual family vacation',
    approvalChain: defaultPendingApprovalChain(),
  },
  {
    id: 'lv-02', employeeId: 'ue-02', type: 'sick', status: 'approved',
    start: '2026-04-15', end: '2026-04-17', requestBranchId: 'br-ruh',
    workingDays: workingDays('2026-04-15', '2026-04-17'),
    noteAr: 'مراجعة طبية', noteEn: 'Medical review',
    approvalChain: approvedChain(),
  },
  {
    id: 'lv-03', employeeId: 'ue-03', type: 'emergency', status: 'pending',
    start: '2026-04-25', end: '2026-04-25', requestBranchId: 'br-jed',
    workingDays: 1,
    noteAr: 'ظروف طارئة', noteEn: 'Emergency circumstances',
    approvalChain: defaultPendingApprovalChain(),
  },
  {
    id: 'lv-04', employeeId: 'ue-04', type: 'annual', status: 'approved',
    start: '2026-04-20', end: '2026-04-24', requestBranchId: 'br-ruh',
    workingDays: workingDays('2026-04-20', '2026-04-24'),
    approvalChain: approvedChain(),
  },
  {
    id: 'lv-05', employeeId: 'ue-05', type: 'unpaid', status: 'rejected',
    start: '2026-04-10', end: '2026-04-14', requestBranchId: 'br-dmm',
    workingDays: workingDays('2026-04-10', '2026-04-14'),
    approvalChain: defaultPendingApprovalChain().map((s, i) => i === 0 ? { ...s, status: 'rejected' as const, decidedAt: '2026-04-05T10:00:00Z' } : s),
  },
  {
    id: 'lv-06', employeeId: 'ue-06', type: 'maternity', status: 'approved',
    start: '2026-03-01', end: '2026-05-10', requestBranchId: 'br-ruh',
    workingDays: workingDays('2026-03-01', '2026-05-10'),
    noteAr: 'إجازة أمومة', noteEn: 'Maternity leave',
    approvalChain: approvedChain(),
  },
  {
    id: 'lv-07', employeeId: 'ue-07', type: 'sick', status: 'pending',
    start: '2026-04-22', end: '2026-04-23', requestBranchId: 'br-dmm',
    workingDays: 2,
    approvalChain: defaultPendingApprovalChain(),
  },
  {
    id: 'lv-08', employeeId: 'ue-08', type: 'annual', status: 'approved',
    start: '2026-05-05', end: '2026-05-09', requestBranchId: 'br-jed',
    workingDays: workingDays('2026-05-05', '2026-05-09'),
    approvalChain: approvedChain(),
  },
];

// ─── Mock balances ─────────────────────────────────────────────────────────────

export const MOCK_BALANCES: Record<string, EmployeeLeaveBalanceRow> = {
  'ue-01': { annual: { used: 5, total: 21 }, sick: { used: 0, total: 30 }, unpaid: { used: 0, total: 0 }, maternity: { used: 0, total: 0 }, emergency: { used: 1, total: 3 } },
  'ue-02': { annual: { used: 3, total: 21 }, sick: { used: 3, total: 30 }, unpaid: { used: 0, total: 0 }, maternity: { used: 0, total: 0 }, emergency: { used: 0, total: 3 } },
  'ue-03': { annual: { used: 0, total: 21 }, sick: { used: 0, total: 30 }, unpaid: { used: 5, total: 0 }, maternity: { used: 0, total: 0 }, emergency: { used: 1, total: 3 } },
  'ue-04': { annual: { used: 5, total: 21 }, sick: { used: 0, total: 30 }, unpaid: { used: 0, total: 0 }, maternity: { used: 0, total: 0 }, emergency: { used: 0, total: 3 } },
  'ue-05': { annual: { used: 0, total: 21 }, sick: { used: 0, total: 30 }, unpaid: { used: 5, total: 0 }, maternity: { used: 0, total: 0 }, emergency: { used: 0, total: 3 } },
  'ue-06': { annual: { used: 0, total: 21 }, sick: { used: 0, total: 30 }, unpaid: { used: 0, total: 0 }, maternity: { used: 70, total: 70 }, emergency: { used: 0, total: 3 } },
  'ue-07': { annual: { used: 0, total: 21 }, sick: { used: 2, total: 30 }, unpaid: { used: 0, total: 0 }, maternity: { used: 0, total: 0 }, emergency: { used: 0, total: 3 } },
  'ue-08': { annual: { used: 5, total: 21 }, sick: { used: 0, total: 30 }, unpaid: { used: 0, total: 0 }, maternity: { used: 0, total: 0 }, emergency: { used: 0, total: 3 } },
};

// ─── Analytics mock data ──────────────────────────────────────────────────────

export const MOCK_ANALYTICS_EMPLOYEES: EmployeeLeaveAnalyticsRow[] = [
  { id: 'ue-01', nameAr: 'عبدالرحمن المالكي', nameEn: 'Abdulrahman Al-Malki', roleAr: 'مدير الموارد البشرية', branchId: 'br-ruh', annualConsumed: 5, annualTotal: 21, sickUsed: 0, sickCap: 30, absenceDays: 0, avatarHue: 160 },
  { id: 'ue-02', nameAr: 'ريم الشهراني', nameEn: 'Reem Al-Shahrani', roleAr: 'مطور برمجيات', branchId: 'br-ruh', annualConsumed: 3, annualTotal: 21, sickUsed: 3, sickCap: 30, absenceDays: 1, avatarHue: 200 },
  { id: 'ue-03', nameAr: 'خالد العتيبي', nameEn: 'Khalid Al-Otaibi', roleAr: 'محاسب', branchId: 'br-jed', annualConsumed: 0, annualTotal: 21, sickUsed: 0, sickCap: 30, absenceDays: 5, avatarHue: 30 },
  { id: 'ue-04', nameAr: 'نورة السلمي', nameEn: 'Noura Al-Salmi', roleAr: 'مدير العمليات', branchId: 'br-jed', annualConsumed: 5, annualTotal: 21, sickUsed: 0, sickCap: 30, absenceDays: 0, avatarHue: 280 },
  { id: 'ue-05', nameAr: 'فهد الدوسري', nameEn: 'Fahad Al-Dossari', roleAr: 'مهندس شبكات', branchId: 'br-dmm', annualConsumed: 0, annualTotal: 21, sickUsed: 0, sickCap: 30, absenceDays: 0, avatarHue: 50 },
  { id: 'ue-06', nameAr: 'سارة القحطاني', nameEn: 'Sara Al-Qahtani', roleAr: 'مديرة الشؤون المالية', branchId: 'br-ruh', annualConsumed: 0, annualTotal: 21, sickUsed: 0, sickCap: 30, absenceDays: 0, avatarHue: 320 },
  { id: 'ue-07', nameAr: 'محمد الزهراني', nameEn: 'Mohammed Al-Zahrani', roleAr: 'مشرف عمليات', branchId: 'br-dmm', annualConsumed: 0, annualTotal: 21, sickUsed: 2, sickCap: 30, absenceDays: 2, avatarHue: 100 },
  { id: 'ue-08', nameAr: 'لمياء الحربي', nameEn: 'Lamya Al-Harbi', roleAr: 'أخصائية موارد بشرية', branchId: 'br-jed', annualConsumed: 5, annualTotal: 21, sickUsed: 0, sickCap: 30, absenceDays: 0, avatarHue: 240 },
];

export const MOCK_ANALYTICS_TIMELINE_BARS: TimelineLeaveBar[] = [
  { id: 'bar-01', employeeId: 'ue-01', branchId: 'br-ruh', leaveType: 'annual', rangeStart: '2026-05-01', rangeEnd: '2026-05-07', daysCount: 7 },
  { id: 'bar-02', employeeId: 'ue-02', branchId: 'br-ruh', leaveType: 'sick', rangeStart: '2026-04-15', rangeEnd: '2026-04-17', daysCount: 3 },
  { id: 'bar-03', employeeId: 'ue-03', branchId: 'br-jed', leaveType: 'emergency', rangeStart: '2026-04-25', rangeEnd: '2026-04-25', daysCount: 1 },
  { id: 'bar-04', employeeId: 'ue-04', branchId: 'br-jed', leaveType: 'annual', rangeStart: '2026-04-20', rangeEnd: '2026-04-24', daysCount: 5 },
  { id: 'bar-05', employeeId: 'ue-06', branchId: 'br-ruh', leaveType: 'maternity', rangeStart: '2026-03-01', rangeEnd: '2026-05-10', daysCount: 70 },
  { id: 'bar-06', employeeId: 'ue-07', branchId: 'br-dmm', leaveType: 'sick', rangeStart: '2026-04-22', rangeEnd: '2026-04-23', daysCount: 2 },
  { id: 'bar-07', employeeId: 'ue-08', branchId: 'br-jed', leaveType: 'annual', rangeStart: '2026-05-05', rangeEnd: '2026-05-09', daysCount: 5 },
];

// ─── Approval logic ────────────────────────────────────────────────────────────

export function applyStepDecision(
  leave: UnifiedLeaveRecord,
  action: 'approve' | 'reject',
): UnifiedLeaveRecord {
  if (leave.status !== 'pending') return leave;
  const chain = leave.approvalChain.map((s) => ({ ...s }));
  const idx = chain.findIndex((s) => s.status === 'pending');
  if (idx === -1) return leave;
  const now = new Date().toISOString();
  if (action === 'reject') {
    chain[idx]!.status = 'rejected';
    chain[idx]!.decidedAt = now;
    return { ...leave, approvalChain: chain, status: 'rejected' };
  }
  chain[idx]!.status = 'approved';
  chain[idx]!.decidedAt = now;
  const nextIdx = chain.findIndex((s, i) => i > idx && s.status === 'waiting');
  if (nextIdx !== -1) {
    chain[nextIdx]!.status = 'pending';
    return { ...leave, approvalChain: chain };
  }
  return { ...leave, approvalChain: chain, status: 'approved' };
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

export function canActOnLeave(leave: UnifiedLeaveRecord): boolean {
  return leave.status === 'pending' && leave.approvalChain.some((s) => s.status === 'pending');
}

export function getApprovalStage(leave: UnifiedLeaveRecord): 'fully_approved' | 'awaiting_first' | 'awaiting_second' | 'awaiting_third' | 'other' {
  if (leave.status === 'approved') return 'fully_approved';
  const pendingIdx = leave.approvalChain.findIndex((s) => s.status === 'pending');
  if (pendingIdx === 0) return 'awaiting_first';
  if (pendingIdx === 1) return 'awaiting_second';
  if (pendingIdx === 2) return 'awaiting_third';
  return 'other';
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', unpaid: 'بدون راتب', maternity: 'أمومة', emergency: 'طارئة',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار', approved: 'موافق عليه', rejected: 'مرفوض', cancelled: 'ملغاة',
};
