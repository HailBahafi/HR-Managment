export type ContractStatus = 'active' | 'suspended' | 'ended';
export type ContractType = 'permanent' | 'temporary' | 'part-time' | 'contract';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early-leave' | 'on-leave';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'in-review';
export type RequestType = 'leave' | 'permission' | 'advance' | 'salary-letter' | 'equipment' | 'attendance-correction';

export interface Branch {
  id: string;
  name: string;
  nameEn: string;
  city: string;
  employeesCount: number;
  manager: string;
}

export interface Department {
  id: string;
  name: string;
  branchId: string;
  managerId: string;
  employeesCount: number;
  color: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  nationalId: string;
  nationality: string;
  avatar: string;
  position: string;
  departmentId: string;
  branchId: string;
  managerId: string | null;
  contractType: ContractType;
  contractStatus: ContractStatus;
  startDate: string;
  endDate?: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  gosi: number;
  bankAccount: string;
  iban: string;
  address: string;
  /** Optional location / administrative fields for search & display (mock/API). */
  openStream?: string;
  village?: string;
  district?: string;
  city?: string;
  emergencyContact: string;
  gender: 'male' | 'female';
  birthDate: string;
  maritalStatus: 'single' | 'married';
  role: string;
  /** ربط بدور النظام في إعدادات الصلاحيات (mock). عند الغياب يُستنتج من `role`. */
  assignedRoleId?: string | null;
}

export interface Shift {
  id: string;
  name: string;
  periods: { start: string; end: string; label: string }[];
  graceMinutes: number;
  color: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  shiftId: string;
  geoPointId?: string;
  notes?: string;
}

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  branchId: string;
  assignedEmployees: string[];
}

export interface Request {
  id: string;
  requestNumber: string;
  employeeId: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  submittedAt: string;
  fromDate?: string;
  toDate?: string;
  amount?: number;
  daysCount?: number;
  timeline: {
    id: string;
    action: string;
    by: string;
    byRole: string;
    at: string;
    note?: string;
  }[];
  attachments?: string[];
}

export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: 'draft' | 'processing' | 'completed';
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeesCount: number;
  processedAt?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  baseSalary: number;
  housing: number;
  transport: number;
  otherAllowances: number;
  overtime: number;
  gosi: number;
  absenceDeduction: number;
  latenessDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  gross: number;
  net: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
}

export interface ActivityItem {
  id: string;
  type: 'request' | 'attendance' | 'employee' | 'payroll' | 'system';
  title: string;
  description: string;
  user: string;
  userAvatar: string;
  timestamp: string;
  icon: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
  color: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  actions: ('view' | 'create' | 'edit' | 'delete' | 'approve')[];
}
