import * as React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  icon: LucideIcon;
  accent?: 'primary' | 'gold' | 'success' | 'warning' | 'destructive';
  description?: string;
  sparkline?: number[];
}

const accentMap = {
  primary: 'text-primary bg-primary/10',
  gold: 'text-gold bg-gold/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
};

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = 'primary',
  description,
  sparkline,
}: KpiCardProps) {
  const isPositive = (delta ?? 0) >= 0;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft transition-all hover:shadow-elevated">
      {/* Corner accent */}
      <div className={cn('absolute -left-8 -top-8 h-24 w-24 rounded-full blur-3xl opacity-30 transition-opacity group-hover:opacity-50', accentMap[accent].split(' ')[1])} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight number-ar">{value}</span>
            {delta !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold',
                  isPositive ? 'text-success' : 'text-destructive',
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(delta)}%
              </span>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>

        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', accentMap[accent])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      {/* Sparkline */}
      {sparkline && (
        <div className="relative mt-4 flex h-10 items-end gap-0.5">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline);
            const height = (v / max) * 100;
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-t-sm transition-all',
                  i === sparkline.length - 1 ? accentMap[accent].split(' ')[0].replace('text-', 'bg-') : 'bg-muted',
                )}
                style={{ height: `${height}%`, minHeight: '4px' }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
