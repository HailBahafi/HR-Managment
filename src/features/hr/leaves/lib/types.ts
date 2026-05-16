/** HR Leaves module — type definitions */

// ─── Catalog types ────────────────────────────────────────────────────────────

export interface HRLeaveTypeRecord {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  paid: boolean;
  deductsFromBalance: boolean;
  requiresApproval: boolean;
  maxDaysPerRequest: number | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export interface HRPublicHolidayRecord {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  date: string; // MM-DD
  recurring: boolean;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}

// ─── Unified management types ─────────────────────────────────────────────────

export type UnifiedLeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'emergency';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApprovalStep {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  status: 'waiting' | 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
}

export interface BranchPosting {
  branchId: string;
  from: string;
  to: string;
}

export interface UnifiedEmployee {
  id: string;
  nameAr: string;
  nameEn: string;
  departmentId: string;
  homeBranchId: string;
  postings: BranchPosting[];
}

export interface UnifiedLeaveRecord {
  id: string;
  employeeId: string;
  type: UnifiedLeaveType;
  status: LeaveStatus;
  start: string;
  end: string;
  requestBranchId: string;
  workingDays: number;
  noteAr?: string;
  noteEn?: string;
  approvalChain: LeaveApprovalStep[];
}

export interface EmployeeLeaveBalanceRow {
  annual: { used: number; total: number };
  sick: { used: number; total: number };
  unpaid: { used: number; total: number };
  maternity: { used: number; total: number };
  emergency: { used: number; total: number };
}

/** طلب إضافة رصيد إجازة (اعتماد يدوي) */
export interface LeaveBalanceCreditRequest {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  /** يُضاف إلى سقف الرصيد السنوي عند الموافقة */
  daysAdded: number;
  reasonAr: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
}

export interface UnifiedFilterState {
  branchId: string;
  departmentId: string;
  employeeIds: string[];
  status: string;
  type: string;
  approvalStage: 'all' | 'fully_approved' | 'awaiting_first' | 'awaiting_second' | 'awaiting_third';
}

// ─── Analytics types ──────────────────────────────────────────────────────────

export type AnalyticsTimelineScale = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface EmployeeLeaveAnalyticsRow {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  branchId: string;
  annualConsumed: number;
  annualTotal: number;
  sickUsed: number;
  sickCap: number;
  absenceDays: number;
  avatarHue: number;
}

export interface TimelineLeaveBar {
  id: string;
  employeeId: string;
  branchId: string;
  leaveType: UnifiedLeaveType;
  rangeStart: string;
  rangeEnd: string;
  daysCount: number;
}
