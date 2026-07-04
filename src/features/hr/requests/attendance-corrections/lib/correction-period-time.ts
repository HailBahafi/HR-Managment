/** Wall-clock HH:mm in a fixed offset (same approach as daily breakdown UI). */
export function isoToTimePickerValue(
  iso: string | null | undefined,
  timezoneOffsetMinutes: number,
): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const localMs = parsed.getTime() + timezoneOffsetMinutes * 60_000;
  const local = new Date(localMs);
  const h = local.getUTCHours();
  const m = local.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timePickerToIso(
  workDate: string,
  time: string,
  timezoneOffsetMinutes: number,
): string | null {
  const trimmed = time.trim();
  if (!trimmed || !/^\d{1,2}:\d{2}$/.test(trimmed)) return null;
  const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(timezoneOffsetMinutes);
  const offH = String(Math.floor(abs / 60)).padStart(2, '0');
  const offM = String(abs % 60).padStart(2, '0');
  return `${workDate}T${trimmed}:00${sign}${offH}:${offM}`;
}

export function defaultTimezoneOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export function formatClockLabel(
  iso: string | null | undefined,
  timezoneOffsetMinutes: number,
): string {
  const value = isoToTimePickerValue(iso, timezoneOffsetMinutes);
  if (!value) return '—';
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  if (Number.isNaN(h)) return value;
  const period = h < 12 ? 'ص' : 'م';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}
