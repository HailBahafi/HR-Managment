'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LabelWithTooltip } from '@/components/ui/tooltip';

export function ShiftMiniField({
  label,
  value,
  onChange,
  tooltip,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tooltip?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {tooltip ? (
        <LabelWithTooltip label={label} tooltip={tooltip} tooltipSide="top" />
      ) : (
        <Label className="text-[10px] text-muted-foreground">{label}</Label>
      )}
      <Input
        type="number"
        className="h-8 font-mono text-xs"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
