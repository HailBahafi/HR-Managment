import EmployeeProfilePage from '@/features/hr/organization/employees/components/employee-detail-page';

export default function OrganizationEmployeeDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EmployeeProfilePage params={params} />;
}
