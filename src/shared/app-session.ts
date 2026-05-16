/**
 * جلسة المستخدم الحالي (وهمية للعرض التجريبي).
 * صاحب النظام يرى جميع التنبيهات في صفحة التنبيهات مع فلترة بالموظف.
 */
export const MOCK_APP_SESSION = {
  employeeId: 'e1',
  employeeNameAr: 'عبدالرحمن المالكي',
  isSystemOwner: true,
} as const;

export type MockAppSession = typeof MOCK_APP_SESSION;
