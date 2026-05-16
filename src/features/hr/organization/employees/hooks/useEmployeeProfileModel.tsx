'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import { EMPLOYEE_PROFILE_SECTIONS } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import type { EmployeeProfileSectionId } from '@/features/hr/organization/employees/constants/EmployeeProfileSections';
import { useEmployeeProfileData } from '@/features/hr/organization/employees/hooks/useEmployeeProfileData';
import { useEmployeeProfilePayslipFilter } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePayslipFilter';
import { useEmployeeProfileLeave } from '@/features/hr/organization/employees/hooks/useEmployeeProfileLeave';
import { useEmployeeProfileAttendance } from '@/features/hr/organization/employees/hooks/useEmployeeProfileAttendance';
import { useEmployeeProfilePersonal } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePersonal';
import { useEmployeeProfileRosePdf } from '@/features/hr/organization/employees/hooks/useEmployeeProfileRosePdf';
import { useEmployeeProfilePermissions } from '@/features/hr/organization/employees/hooks/useEmployeeProfilePermissions';

const SECTIONS = EMPLOYEE_PROFILE_SECTIONS;

export function useEmployeeProfileModel(employee: Employee) {
  const [activeSection, setActiveSection] = React.useState<EmployeeProfileSectionId>('personal');
  const contentRef = React.useRef<HTMLElement | null>(null);

  const data = useEmployeeProfileData(employee);
  const payslip = useEmployeeProfilePayslipFilter(data.employeePayslipSeries);
  const leave = useEmployeeProfileLeave(employee);
  const attendance = useEmployeeProfileAttendance(employee, data.allEmployeeEvents, data.allEmployeeSummaries);
  const personal = useEmployeeProfilePersonal(employee, activeSection);
  const rose = useEmployeeProfileRosePdf(personal.draft);
  const permissions = useEmployeeProfilePermissions(employee);

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const counts: Partial<Record<EmployeeProfileSectionId, number>> = {
    requests: data.employeeRequests.length,
    violations: data.employeeViolations.length,
    contracts: data.employeeContracts.length,
    'rose-forms': data.roseFormsCount,
    'activity-log': data.activityLogCount,
    salary: data.employeePayslipSeries.length,
  };

  return {
    employee,
    SECTIONS,
    activeSection,
    setActiveSection,
    contentRef,
    counts,
    ...data,
    ...payslip,
    ...leave,
    ...attendance,
    ...personal,
    ...rose,
    ...permissions,
  };
}

export type EmployeeProfileModel = ReturnType<typeof useEmployeeProfileModel>;
