import * as React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="rose-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--gold))" />
          <stop offset="1" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="hsl(var(--primary))" />
      <path
        d="M14 34V14h4l12 16V14h4v20h-4L18 18v16h-4z"
        fill="url(#rose-g)"
        fillRule="evenodd"
      />
      <circle cx="38" cy="12" r="3" fill="hsl(var(--gold))" />
    </svg>
  );
}

export function LogoWithText({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Logo size={40} />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight">روز</span>
        <span className="text-[10px] text-muted-foreground tracking-wider uppercase">rose HR</span>
      </div>
    </div>
  );
}
