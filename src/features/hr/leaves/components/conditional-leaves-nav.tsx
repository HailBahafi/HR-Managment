'use client';

import { HideOnPathPrefixes } from '@/components/shared/hide-on-path-prefixes';
import { LeavesNav } from '@/features/hr/leaves/components/leaves-nav';
import { LEAVES_NAV_HIDDEN_PREFIXES } from '@/features/hr/leaves/constants/leaves-nav';

export function ConditionalLeavesNav() {
  return (
    <HideOnPathPrefixes prefixes={LEAVES_NAV_HIDDEN_PREFIXES}>
      <LeavesNav />
    </HideOnPathPrefixes>
  );
}
