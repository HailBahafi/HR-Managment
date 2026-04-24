import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { data } from '@/lib/data';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HREmployeeStatus = 'active' | 'probation' | 'suspended';
export type HREmployeeHierarchyRole = 'ceo' | 'executive' | 'gm' | 'dept_head' | 'supervisor' | 'staff';

export interface HREmployeeDirectoryRow {
  id: string;
  bridgeId: string;
  nameAr: string;
  nameEn: string;
  nationalId: string;
  departmentId: string;
  jobTitleAr: string;
  jobTitleEn: string;
  hireDate: string;
  status: HREmployeeStatus;
  email?: string;
  mobile?: string;
  notes?: string;
  reportsToId: string | null;
  hierarchyRole: HREmployeeHierarchyRole;
}

// kept for backward compatibility with existing imports
export type HREmployeeDirectoryEntry = HREmployeeDirectoryRow;

// ─── Seed ─────────────────────────────────────────────────────────────────────

const ROLE_MAP: Record<string, HREmployeeHierarchyRole> = {
  'hr-manager': 'dept_head', 'it-manager': 'dept_head', 'finance-manager': 'dept_head',
  'marketing-manager': 'dept_head', 'sales-manager': 'dept_head',
  'operations-manager': 'dept_head', 'admin': 'gm',
};

function toStatus(s: string): HREmployeeStatus {
  return (s === 'active' || s === 'probation' || s === 'suspended') ? s : 'active';
}

function guessRole(position: string, idx: number): HREmployeeHierarchyRole {
  if (idx === 0) return 'ceo';
  if (position.includes('مدير') && idx < 4) return 'gm';
  if (position.includes('مدير')) return 'dept_head';
  if (position.includes('مشرف') || position.includes('رئيس')) return 'supervisor';
  return 'staff';
}

const SEED: HREmployeeDirectoryRow[] = data.employees.map((e, i) => ({
  id: e.id,
  bridgeId: e.employeeCode ?? `NW-${1000 + i}`,
  nameAr: e.name,
  nameEn: e.nameEn ?? e.name,
  nationalId: e.nationalId ?? '',
  departmentId: e.departmentId,
  jobTitleAr: e.position,
  jobTitleEn: e.position,
  hireDate: e.startDate,
  status: toStatus(e.contractStatus),
  email: e.email,
  mobile: e.phone,
  reportsToId: e.managerId ?? null,
  hierarchyRole: ROLE_MAP[e.role ?? ''] ?? guessRole(e.position, i),
}));

// ─── Store ────────────────────────────────────────────────────────────────────

function uid() { return `emp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

interface DirectoryState {
  employees: HREmployeeDirectoryRow[];
  addEmployee: (draft: Omit<HREmployeeDirectoryRow, 'id'>) => string;
  updateEmployee: (id: string, patch: Partial<Omit<HREmployeeDirectoryRow, 'id'>>) => void;
  deleteEmployee: (id: string) => void;
  getById: (id: string) => HREmployeeDirectoryRow | undefined;
  resetToSeed: () => void;
  // computed helpers
  activeEmployees: HREmployeeDirectoryRow[];
}

export const useHREmployeeDirectoryStore = create<DirectoryState>()(
  persist(
    (set, get) => ({
      employees: SEED,

      addEmployee: (draft) => {
        const id = uid();
        const row: HREmployeeDirectoryRow = { ...draft, id };
        set(s => ({ employees: [...s.employees, row] }));
        return id;
      },

      updateEmployee: (id, patch) => {
        set(s => ({ employees: s.employees.map(e => e.id === id ? { ...e, ...patch } : e) }));
      },

      deleteEmployee: (id) => {
        set(s => ({
          employees: s.employees
            .filter(e => e.id !== id)
            .map(e => e.reportsToId === id ? { ...e, reportsToId: null } : e),
        }));
      },

      getById: (id) => get().employees.find(e => e.id === id),

      resetToSeed: () => set({ employees: SEED }),

      get activeEmployees() { return get().employees.filter(e => e.status === 'active'); },
    }),
    {
      name: 'hr-employee-directory-storage',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (_: unknown, version: number) => {
        if (version < 4) return { employees: SEED };
        return _ as DirectoryState;
      },
    },
  ),
);
