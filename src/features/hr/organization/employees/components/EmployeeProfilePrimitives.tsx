'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function fmtAttendanceHours(hours: number): string {
  if (!Number.isFinite(hours) || hours === 0) return '0';
  const rounded = Math.round(hours * 10) / 10;
  const n = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${n} س`;
}

export function Prop({ icon: Icon, label, children, mono, accent }: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  accent?: 'primary' | 'gold' | 'success' | 'warning' | 'destructive';
}) {
  if (children === null || children === undefined || children === '' || children === false) return null;
  const accentCls = {
    primary: 'text-primary',
    gold: 'text-gold',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  } as const;
  return (
    <div className="group relative flex items-start gap-3 py-3 px-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-xs transition-all">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80 mb-0.5 font-medium">{label}</div>
        <div className={cn(
          'text-sm font-medium truncate min-w-0',
          mono && 'font-mono text-xs',
          accent ? accentCls[accent] : 'text-foreground',
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function SectionH({ action }: {
  icon?: React.ElementType;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  if (!action) return null;
  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      {action}
    </div>
  );
}

export function FieldGroup({ title, hint, children }: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-7 last:mb-0">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {hint && <span className="text-[10px] text-muted-foreground/60">{hint}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {children}
      </div>
    </div>
  );
}

export function ItemRow({ children, href }: {
  children: React.ReactNode;
  href?: string;
}) {
  const cls = 'group flex items-center justify-between gap-3 py-3 px-3 -mx-3 rounded-md border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors';
  if (href) return <Link href={href} className={cn(cls, 'cursor-pointer')}>{children}</Link>;
  return <div className={cls}>{children}</div>;
}

export function Stat({ value, label, sub, accent, icon: Icon }: {
  value: React.ReactNode;
  label: string;
  sub?: string;
  accent?: 'gold' | 'success' | 'destructive' | 'warning' | 'primary';
  icon?: React.ElementType;
}) {
  const accentCls = {
    gold: 'text-gold border-gold/20 bg-gold/5',
    success: 'text-success border-success/20 bg-success/5',
    destructive: 'text-destructive border-destructive/20 bg-destructive/5',
    warning: 'text-warning border-warning/20 bg-warning/5',
    primary: 'text-primary border-primary/20 bg-primary/5',
  } as const;
  const valueColor = accent ? accentCls[accent].split(' ')[0] : 'text-foreground';
  const cardBorder = accent ? accentCls[accent].split(' ').slice(1).join(' ') : 'border-border/50 bg-card';
  return (
    <div className={cn('relative rounded-xl border p-4 transition-all hover:shadow-xs', cardBorder)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</div>
        {Icon && <Icon className={cn('h-3.5 w-3.5', valueColor, 'opacity-70')} />}
      </div>
      <div className={cn('font-arabic-display text-2xl font-semibold tabular-nums leading-none', valueColor)}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Empty({ icon: Icon, text, action }: {
  icon: React.ElementType;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-8 text-center text-muted-foreground border border-dashed border-border/60 rounded-xl bg-muted/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 border border-border/50">
        <Icon className="h-5 w-5 opacity-60" />
      </div>
      <p className="text-sm">{text}</p>
      {action}
    </div>
  );
}

export function fmtLeaveBalance(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

type LeaveCardAccent = 'success' | 'primary';

export function LeaveBalanceCard({
  title,
  year,
  entitlementLabel,
  entitled,
  used,
  available,
  yearEndExpected,
  onRequestLeave,
  accent = 'success',
}: {
  title: string;
  year: number;
  entitlementLabel: string;
  entitled: number;
  used: number;
  available: number;
  yearEndExpected: number;
  onRequestLeave: () => void;
  accent?: LeaveCardAccent;
}) {
  const pctUsed = entitled > 0 ? Math.min(100, (used / entitled) * 100) : 0;
  const barCls = accent === 'primary' ? 'bg-primary' : 'bg-success';
  const availTextCls = accent === 'primary' ? 'text-primary' : 'text-success';
  const availDotCls = accent === 'primary' ? 'bg-primary' : 'bg-success';
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3" dir="rtl">
        <h3 className="min-w-0 text-right text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <span className="shrink-0 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
          {year}
        </span>
      </div>

      <div className="py-4" dir="rtl">
        <div className="flex h-2.5 w-full justify-end overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-[width] duration-300', barCls)}
            style={{ width: `${pctUsed}%` }}
          />
        </div>
      </div>

      <div className="space-y-0 border-t border-border" dir="rtl">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm">
          <span className="font-arabic-display text-base font-semibold tabular-nums text-foreground">{fmtLeaveBalance(entitled)}</span>
          <span className="text-right text-muted-foreground">{entitlementLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm">
          <span className={cn('font-arabic-display text-base font-semibold tabular-nums', availTextCls)}>
            {fmtLeaveBalance(available)}
          </span>
          <span className="flex items-center gap-2 text-right text-foreground">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', availDotCls)} aria-hidden />
            المتاح للاستخدام
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm">
          <span className="font-arabic-display text-base font-semibold tabular-nums text-foreground">{fmtLeaveBalance(used)}</span>
          <span className="flex items-center gap-2 text-right text-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
            الإجازات المستخدمة
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-sm">
          <span className="font-arabic-display text-base font-semibold tabular-nums text-foreground">
            {fmtLeaveBalance(yearEndExpected)}
          </span>
          <span className="flex items-center gap-2 text-right text-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-border" aria-hidden />
            الرصيد المتوقع بنهاية السنة
          </span>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl text-sm font-medium"
          onClick={onRequestLeave}
        >
          طلب إجازة
        </Button>
      </div>
    </div>
  );
}
