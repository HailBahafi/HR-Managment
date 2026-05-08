'use client';

import * as React from 'react';
import {
  EntityFilterToolbar,
  type EntityFilterToolbarHandle,
  type EntityFilterToolbarProps,
} from '@/components/ui/entity-filter-toolbar';

export type LeavesManagementToolbarHandle = EntityFilterToolbarHandle;

export type LeavesManagementToolbarProps = Omit<EntityFilterToolbarProps, 'trailingActions'> & {
  trailingActions: React.ReactNode;
};

export const LeavesManagementToolbar = React.forwardRef<
  LeavesManagementToolbarHandle,
  LeavesManagementToolbarProps
>(function LeavesManagementToolbar(props, ref) {
  const { trailingActions, ...rest } = props;
  return (
    <EntityFilterToolbar
      ref={ref}
      {...rest}
      trailingActions={trailingActions}
    />
  );
});
