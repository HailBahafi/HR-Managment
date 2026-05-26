import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Arabic-Indic (٠–٩) and Persian (۰–۹) → Western ASCII digits (0–9). */
export function toWesternDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (ch) => {
    const code = ch.codePointAt(0)!;
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
    return ch;
  });
}

const LATN: Pick<Intl.NumberFormatOptions, 'numberingSystem'> = { numberingSystem: 'latn' };

export function formatCurrency(value: number): string {
  const n = Math.round(value);
  const s = new Intl.NumberFormat('en-US', {
    ...LATN,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  return `${s} ر.س`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    ...LATN,
    maximumFractionDigits: 20,
  }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const s = new Intl.DateTimeFormat('ar-SA', {
    ...LATN,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
  return toWesternDigits(s);
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const s = new Intl.DateTimeFormat('ar-SA', {
    ...LATN,
    month: 'short',
    day: 'numeric',
  }).format(d);
  return toWesternDigits(s);
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const s = new Intl.DateTimeFormat('ar-SA', {
    ...LATN,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return toWesternDigits(s);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return formatDate(d);
}
