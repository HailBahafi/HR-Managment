/** تصفية السجلات بتاريخ YYYY-MM-DD (إنذارات، تحقيقات، تظلمات، مخالفات، …) */

export type DateFilterTab = 'all' | 'today' | 'week' | 'month' | 'custom';

export function recordDateComparable(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
}

export function dateToYMD(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function todayYMD(): string {
  return dateToYMD(new Date());
}

/** من الأحد إلى السبت (التقويم المحلي) */
export function thisWeekSunSatYMD(): { from: string; to: string } {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = day.getDay();
  const sun = new Date(day);
  sun.setDate(day.getDate() - dow);
  const sat = new Date(sun);
  sat.setDate(sun.getDate() + 6);
  return { from: dateToYMD(sun), to: dateToYMD(sat) };
}

/** أول وآخر يوم من الشهر الحالي (التقويم المحلي) */
export function thisCalendarMonthYMD(): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: dateToYMD(first), to: dateToYMD(last) };
}

export function hasDateRangeFilter(fromStr: string, toStr: string): boolean {
  return Boolean(fromStr.trim() || toStr.trim());
}

export function comparableRangeBounds(fromStr: string, toStr: string): { lo: number | null; hi: number | null } {
  let lo = fromStr.trim() ? recordDateComparable(fromStr) : null;
  let hi = toStr.trim() ? recordDateComparable(toStr) : null;
  if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];
  return { lo, hi };
}

export function matchesDateRange(dateStr: string, fromStr: string, toStr: string): boolean {
  if (!hasDateRangeFilter(fromStr, toStr)) return true;
  const cd = recordDateComparable(dateStr);
  if (cd == null) return false;
  const { lo, hi } = comparableRangeBounds(fromStr, toStr);
  if (lo != null && cd < lo) return false;
  if (hi != null && cd > hi) return false;
  return true;
}

export function ymdToMDYDisplay(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return '';
  return `${m[2]}/${m[3]}/${m[1]}`;
}

export function parseMDYToYMD(text: string): '' | null | string {
  const t = text.trim();
  if (!t) return '';
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return dateToYMD(d);
}

export function effectiveDateRange(tab: DateFilterTab, customFrom: string, customTo: string): { from: string; to: string } {
  switch (tab) {
    case 'all':
      return { from: '', to: '' };
    case 'today': {
      const t = todayYMD();
      return { from: t, to: t };
    }
    case 'week':
      return thisWeekSunSatYMD();
    case 'month':
      return thisCalendarMonthYMD();
    case 'custom':
      return { from: customFrom.trim(), to: customTo.trim() };
    default:
      return { from: '', to: '' };
  }
}

export function dateFilterHasRestriction(tab: DateFilterTab, customFrom: string, customTo: string): boolean {
  const { from, to } = effectiveDateRange(tab, customFrom, customTo);
  return hasDateRangeFilter(from, to);
}
