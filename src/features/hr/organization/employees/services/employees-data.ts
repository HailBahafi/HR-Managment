import employeesPayload from '../../../../../../data/employees.json';
import type { Employee } from '@/types';

/** Server-safe read of seeded employees from `data/employees.json`. */
export function getEmployeesFromSeed(): Employee[] {
  return employeesPayload.employees as Employee[];
}

export function getEmployeeFromSeedById(id: string): Employee | undefined {
  return getEmployeesFromSeed().find((e) => e.id === id);
}
