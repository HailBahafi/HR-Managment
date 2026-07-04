import type { LucideIcon } from 'lucide-react';
import {
  Calculator,
  LayoutGrid,
  Settings,
  Users,
} from 'lucide-react';
import type { ApplicationResponseDto } from '@/features/system/applications/lib/api/applications';

const ICON_BY_KEY: Record<string, LucideIcon> = {
  users: Users,
  calculator: Calculator,
  settings: Settings,
  'layout-grid': LayoutGrid,
};

const TILE_BY_CODE: Record<string, { tileClass: string }> = {
  hr: { tileClass: 'bg-emerald-600 shadow-emerald-900/40' },
  accounting: { tileClass: 'bg-slate-500 shadow-slate-900/40' },
  system: { tileClass: 'bg-amber-500 shadow-amber-900/40' },
};

const FALLBACK_TILES = [
  'bg-violet-600 shadow-violet-900/40',
  'bg-sky-600 shadow-sky-900/40',
  'bg-rose-600 shadow-rose-900/40',
  'bg-teal-600 shadow-teal-900/40',
];

export function resolveApplicationIcon(app: ApplicationResponseDto): LucideIcon {
  const key = app.icon?.trim().toLowerCase();
  if (key && ICON_BY_KEY[key]) return ICON_BY_KEY[key]!;
  return LayoutGrid;
}

export function resolveApplicationTileClass(
  app: ApplicationResponseDto,
  index: number,
): string {
  const preset = TILE_BY_CODE[app.code];
  if (preset) return preset.tileClass;
  return FALLBACK_TILES[index % FALLBACK_TILES.length]!;
}
