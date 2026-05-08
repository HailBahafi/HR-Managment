import mockData from '../../data/mock-data.json';
import employeesData from '../../data/employees.json';
import attendanceData from '../../data/attendance.json';
import requestsData from '../../data/requests.json';
import payrollData from '../../data/payroll.json';

export const data = {
  company: mockData.company,
  branches: mockData.branches,
  departments: mockData.departments,
  employees: employeesData.employees,
  shifts: mockData.shifts,
  geoPoints: mockData.geoPoints,
  activities: mockData.activities,
  roles: mockData.roles,
  attendanceToday: attendanceData.attendanceToday,
  attendanceTrend: attendanceData.attendanceTrend,
  requests: requestsData.requests,
  requestStats: requestsData.stats,
  payrollCurrent: payrollData.currentRun,
  payrollHistory: payrollData.history,
  payslips: payrollData.payslips,
  payrollTrend: payrollData.trend,
  payrollByBranch: payrollData.byBranch,
};

export function getEmployee(id: string) {
  return data.employees.find((e) => e.id === id);
}

export function getBranch(id: string) {
  return data.branches.find((b) => b.id === id);
}

export function getDepartment(id: string) {
  return data.departments.find((d) => d.id === id);
}
