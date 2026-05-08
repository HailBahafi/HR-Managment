'use client';

import * as React from 'react';
import { data } from '@/lib/data';
import { buildOrganizationTree } from '@/features/hr/organization/utils/build-organization-tree';

export function useOrganizationTreeModel() {
  const tree = React.useMemo(() => buildOrganizationTree(), []);
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(['company', ...data.branches.map((b) => b.id)]),
  );

  const toggle = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { tree, expanded, toggle };
}
