export const EMP_CONTRACT_STATUS_ORDER = ['active', 'suspended', 'ended'] as const;

export const EMP_CONTRACT_STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  ended: 'منتهي',
};

export const CONTRACT_TYPE_AR: Record<string, string> = {
  permanent: 'دائم',
  temporary: 'مؤقت',
  'part-time': 'جزئي',
  contract: 'تعاقد',
};

export function employeeStartYmd(e: { startDate: string }): string {
  const s = e.startDate;
  if (typeof s === 'string' && s.length >= 10) return s.slice(0, 10);
  try {
    return new Date(s).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}
