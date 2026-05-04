import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  EmployeeLeaveBalanceRow,
  LeaveBalanceCreditRequest,
  UnifiedLeaveType,
} from '@/lib/leaves/types';
import { MOCK_BALANCES } from '@/lib/leaves/unified-mock';

function uid() {
  return `lbc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function cloneBalanceRow(r: EmployeeLeaveBalanceRow): EmployeeLeaveBalanceRow {
  return {
    annual: { ...r.annual },
    sick: { ...r.sick },
    unpaid: { ...r.unpaid },
    maternity: { ...r.maternity },
    emergency: { ...r.emergency },
  };
}

function seedBalances(): Record<string, EmployeeLeaveBalanceRow> {
  const o: Record<string, EmployeeLeaveBalanceRow> = {};
  for (const [k, v] of Object.entries(MOCK_BALANCES)) {
    o[k] = cloneBalanceRow(v);
  }
  return o;
}

function normalizeBalances(raw: unknown): Record<string, EmployeeLeaveBalanceRow> {
  const out = seedBalances();
  if (!raw || typeof raw !== 'object') return out;
  const src = raw as Record<string, Partial<EmployeeLeaveBalanceRow>>;
  for (const id of Object.keys(out)) {
    const row = src[id];
    if (!row || typeof row !== 'object') continue;
    const base = out[id]!;
    const pick = (b: { used?: unknown; total?: unknown } | undefined, fb: { used: number; total: number }) => {
      if (!b || typeof b.total !== 'number') return fb;
      return { used: Number(b.used) || 0, total: Number(b.total) || 0 };
    };
    out[id] = {
      annual: pick(row.annual, base.annual),
      sick: pick(row.sick, base.sick),
      unpaid: pick(row.unpaid, base.unpaid),
      maternity: pick(row.maternity, base.maternity),
      emergency: pick(row.emergency, base.emergency),
    };
  }
  return out;
}

function applyDeltasToRow(
  row: EmployeeLeaveBalanceRow,
  deltas: Partial<Record<UnifiedLeaveType, number>>,
): EmployeeLeaveBalanceRow {
  const next = cloneBalanceRow(row);
  (Object.entries(deltas) as [UnifiedLeaveType, number | undefined][]).forEach(([t, d]) => {
    if (d == null || !Number.isFinite(d) || d <= 0) return;
    const add = Math.floor(d);
    const cell = next[t];
    if (cell) cell.total += add;
  });
  return next;
}

function sumLegacyDeltas(deltas: unknown): number {
  if (!deltas || typeof deltas !== 'object') return 0;
  let s = 0;
  for (const v of Object.values(deltas as Record<string, unknown>)) {
    const n = Math.floor(Number(v));
    if (Number.isFinite(n) && n > 0) s += n;
  }
  return s;
}

function normalizeCreditRequest(raw: unknown): LeaveBalanceCreditRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? '');
  if (!id) return null;
  const employeeId = String(o.employeeId ?? '');
  const employeeNameAr = String(o.employeeNameAr ?? '');
  const st = o.status;
  const status =
    st === 'approved' || st === 'rejected' || st === 'pending' ? st : 'pending';
  const createdAt = typeof o.createdAt === 'string' && o.createdAt ? o.createdAt : nowIso();

  let daysAdded = Math.floor(Number(o.daysAdded));
  if (!Number.isFinite(daysAdded) || daysAdded <= 0) {
    daysAdded = sumLegacyDeltas(o.deltas);
  }

  let reasonAr = typeof o.reasonAr === 'string' ? o.reasonAr : '';
  if (!reasonAr.trim() && typeof o.noteAr === 'string') reasonAr = o.noteAr;

  return {
    id,
    employeeId,
    employeeNameAr,
    daysAdded: Math.max(0, daysAdded),
    reasonAr,
    status,
    createdAt,
    decidedAt: typeof o.decidedAt === 'string' ? o.decidedAt : undefined,
  };
}

function migrateCreditRequestsList(raw: unknown): LeaveBalanceCreditRequest[] {
  if (!Array.isArray(raw)) return [...SEED_REQUESTS];
  const mapped = raw
    .map(normalizeCreditRequest)
    .filter((x): x is LeaveBalanceCreditRequest => x != null);
  return mapped.length ? mapped : [...SEED_REQUESTS];
}

const SEED_REQUESTS: LeaveBalanceCreditRequest[] = [
  {
    id: 'lbc-seed-1',
    employeeId: 'ue-02',
    employeeNameAr: 'ريم الشهراني',
    daysAdded: 3,
    reasonAr: 'تسوية نهاية خدمة — موافقة مجمّعة',
    status: 'pending',
    createdAt: '2026-04-28T10:00:00.000Z',
  },
];

interface LeaveBalanceCreditState {
  balances: Record<string, EmployeeLeaveBalanceRow>;
  creditRequests: LeaveBalanceCreditRequest[];
  submitCreditRequest: (input: {
    employeeId: string;
    employeeNameAr: string;
    daysAdded: number;
    reasonAr: string;
  }) => { ok: boolean; error?: string };
  approveCreditRequest: (id: string) => void;
  rejectCreditRequest: (id: string) => void;
}

export const useLeaveBalanceCreditStore = create<LeaveBalanceCreditState>()(
  persist(
    (set, get) => ({
      balances: seedBalances(),
      creditRequests: SEED_REQUESTS,

      submitCreditRequest: ({ employeeId, employeeNameAr, daysAdded, reasonAr }) => {
        const n = Math.floor(Number(daysAdded));
        if (!Number.isFinite(n) || n <= 0) {
          return { ok: false, error: 'أدخل عدداً صحيحاً أكبر من صفر للأيام المضافة.' };
        }
        const rec: LeaveBalanceCreditRequest = {
          id: uid(),
          employeeId,
          employeeNameAr,
          daysAdded: n,
          reasonAr: reasonAr.trim(),
          status: 'pending',
          createdAt: nowIso(),
        };
        set((s) => ({ creditRequests: [rec, ...s.creditRequests] }));
        return { ok: true };
      },

      approveCreditRequest: (id) => {
        const req = get().creditRequests.find((r) => r.id === id);
        if (!req || req.status !== 'pending') return;
        set((s) => {
          const row = s.balances[req.employeeId];
          if (!row) return s;
          const nextBalances =
            req.daysAdded > 0
              ? { ...s.balances, [req.employeeId]: applyDeltasToRow(row, { annual: req.daysAdded }) }
              : s.balances;
          return {
            balances: nextBalances,
            creditRequests: s.creditRequests.map((r) =>
              r.id === id
                ? { ...r, status: 'approved' as const, decidedAt: nowIso() }
                : r,
            ),
          };
        });
      },

      rejectCreditRequest: (id) => {
        set((s) => ({
          creditRequests: s.creditRequests.map((r) =>
            r.id === id && r.status === 'pending'
              ? { ...r, status: 'rejected' as const, decidedAt: nowIso() }
              : r,
          ),
        }));
      },
    }),
    {
      name: 'hr_leaves_balance_credit_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ balances: s.balances, creditRequests: s.creditRequests }),
      version: 2,
      migrate: (persisted: unknown) => {
        const p = persisted as { balances?: unknown; creditRequests?: unknown } | undefined;
        return {
          balances: normalizeBalances(p?.balances),
          creditRequests: migrateCreditRequestsList(p?.creditRequests),
        };
      },
    },
  ),
);
