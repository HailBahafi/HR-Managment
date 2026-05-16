import * as React from 'react';
import { cn } from '@/shared/utils';

/** Outer shell + horizontal scroll for directory list tables. */
export function DirectoryTableContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-soft', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function DirectoryTable({ className, ...props }: React.ComponentProps<'table'>) {
  return <table className={cn('w-full text-sm', className)} {...props} />;
}

export function DirectoryTableHeaderRow({ className, children, ...props }: React.ComponentProps<'tr'>) {
  return (
    <thead>
      <tr
        className={cn('border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground', className)}
        {...props}
      >
        {children}
      </tr>
    </thead>
  );
}

export function DirectoryTableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 text-end', className)} {...props} />;
}

export function DirectoryTableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function DirectoryTableRow({
  interactive,
  className,
  ...props
}: React.ComponentProps<'tr'> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        'border-b border-border/60',
        interactive && 'cursor-pointer hover:bg-muted/25',
        className,
      )}
      {...props}
    />
  );
}

export function DirectoryTableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3', className)} {...props} />;
}

/** Actions column: isolates clicks from row navigation. */
export function DirectoryTableActionsCell({
  className,
  children,
  onClick,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <DirectoryTableCell
      className={cn('text-start w-28', className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      <div className="flex justify-end gap-1">{children}</div>
    </DirectoryTableCell>
  );
}
