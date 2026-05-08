import { data, getEmployee } from '@/lib/data';
import type { OrganizationTreeNode } from '@/features/hr/organization/types/organization-tree';

export function buildOrganizationTree(): OrganizationTreeNode {
  return {
    id: 'company',
    name: data.company.name,
    type: 'company',
    meta: `${data.company.totalEmployees} موظف`,
    children: data.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      type: 'branch' as const,
      meta: `${branch.employeesCount} موظف · ${branch.city}`,
      color: '#0f766e',
      children: data.departments
        .filter((d) => d.branchId === branch.id)
        .map((dept) => {
          const deptEmployees = data.employees.filter((e) => e.departmentId === dept.id);
          return {
            id: dept.id,
            name: dept.name,
            type: 'department' as const,
            meta: `${dept.employeesCount} موظف`,
            color: dept.color,
            children: deptEmployees.map((emp) => ({
              id: emp.id,
              name: emp.name,
              type: 'employee' as const,
              meta: emp.position,
              avatar: emp.avatar,
              color: dept.color,
            })),
          };
        }),
    })),
  };
}
