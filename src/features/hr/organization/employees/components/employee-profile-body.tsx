'use client';

import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { NewRequestDialog } from '@/components/requests/new-request-dialog';
import { useEmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeProfileShell } from '@/features/hr/organization/employees/components/employee-profile-shell';
import { EmployeePersonalSection } from '@/features/hr/organization/employees/components/sections/employee-personal-section';
import { EmployeeEmploymentSection } from '@/features/hr/organization/employees/components/sections/employee-employment-section';
import { EmployeeFinancialSection } from '@/features/hr/organization/employees/components/sections/employee-financial-section';
import { EmployeeAttendanceSection } from '@/features/hr/organization/employees/components/sections/employee-attendance-section';
import { EmployeeLeavesSection } from '@/features/hr/organization/employees/components/sections/employee-leaves-section';
import { EmployeeRequestsSection } from '@/features/hr/organization/employees/components/sections/employee-requests-section';
import { EmployeeViolationsSection } from '@/features/hr/organization/employees/components/sections/employee-violations-section';
import { EmployeeContractsSection } from '@/features/hr/organization/employees/components/sections/employee-contracts-section';
import { EmployeeRoseFormsSection } from '@/features/hr/organization/employees/components/sections/employee-rose-forms-section';
import { EmployeeActivityLogSection } from '@/features/hr/organization/employees/components/sections/employee-activity-log-section';
import { EmployeePermissionsSection } from '@/features/hr/organization/employees/components/sections/employee-permissions-section';
import { EmployeeSalarySection } from '@/features/hr/organization/employees/components/sections/employee-salary-section';
import type { Employee } from '@/types';
import { EmployeeHrPdfPrepDialog } from '@/features/hr/organization/employees/components/dialogs/employee-hr-pdf-prep-dialog';

export function EmployeeProfileBody({ employee }: { employee: Employee }) {
  const model = useEmployeeProfileModel(employee);

  return (
    <>
      <EmployeeProfileShell model={model}>
        {model.activeSection === 'personal' && <EmployeePersonalSection model={model} />}
        {model.activeSection === 'employment' && <EmployeeEmploymentSection model={model} />}
        {model.activeSection === 'financial' && <EmployeeFinancialSection model={model} />}
        {model.activeSection === 'attendance' && <EmployeeAttendanceSection model={model} />}
        {model.activeSection === 'leaves' && <EmployeeLeavesSection model={model} />}
        {model.activeSection === 'requests' && <EmployeeRequestsSection model={model} />}
        {model.activeSection === 'violations' && <EmployeeViolationsSection model={model} />}
        {model.activeSection === 'contracts' && <EmployeeContractsSection model={model} />}
        {model.activeSection === 'rose-forms' && <EmployeeRoseFormsSection model={model} />}
        {model.activeSection === 'activity-log' && <EmployeeActivityLogSection model={model} />}
        {model.activeSection === 'permissions' && <EmployeePermissionsSection model={model} />}
        {model.activeSection === 'salary' && <EmployeeSalarySection model={model} />}
      </EmployeeProfileShell>

      <EmployeeHrPdfPrepDialog
        open={model.hrPdfPrepKind != null}
        prepKind={model.hrPdfPrepKind}
        employee={model.employee}
        onCancel={model.cancelHrPdfPrep}
        onApplyResignation={(patch) => model.applyHrPdfPrepResult('resignation', patch)}
        onApplyClearance={(patch) => model.applyHrPdfPrepResult('clearance', patch)}
        onApplyCashReceipt={({ receipt }) =>
          model.applyHrPdfPrepResult('cash-receipt', {}, receipt)
        }
        onApplyExperience={(patch) => model.applyHrPdfPrepResult('experience', patch)}
      />

      <PdfPreviewExportDialog
        open={model.hrPdfPreviewOpen}
        onOpenChange={(openNext) => {
          if (!openNext) model.closeHrPdfPreview();
        }}
        title={model.rosePdfPreviewPayload.title}
        fileName={model.rosePdfPreviewPayload.fileName}
        document={model.rosePdfPreviewPayload.doc}
      />

      <NewRequestDialog
        open={model.leaveRequestOpen}
        onOpenChange={model.setLeaveRequestOpen}
        initialType="leave"
      />
    </>
  );
}
