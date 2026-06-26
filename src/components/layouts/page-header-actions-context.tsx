'use client';

import * as React from 'react';

type PageHeaderActionsSlotContextValue = {
  renderFnRef: React.MutableRefObject<(() => React.ReactNode) | null>;
  reRenderSlotRef: React.MutableRefObject<(() => void) | null>;
};

type PageHeaderFilterContextValue = {
  filterPanelOpen: boolean;
  setFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const PageHeaderActionsSlotContext =
  React.createContext<PageHeaderActionsSlotContextValue | null>(null);

const PageHeaderFilterContext =
  React.createContext<PageHeaderFilterContextValue | null>(null);

export function PageHeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const renderFnRef = React.useRef<(() => React.ReactNode) | null>(null);
  const reRenderSlotRef = React.useRef<(() => void) | null>(null);
  const slotValue = React.useRef<PageHeaderActionsSlotContextValue>({
    renderFnRef,
    reRenderSlotRef,
  }).current;

  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const filterValue = React.useMemo(
    () => ({ filterPanelOpen, setFilterPanelOpen }),
    [filterPanelOpen],
  );

  return (
    <PageHeaderActionsSlotContext.Provider value={slotValue}>
      <PageHeaderFilterContext.Provider value={filterValue}>
        {children}
      </PageHeaderFilterContext.Provider>
    </PageHeaderActionsSlotContext.Provider>
  );
}

export function usePageHeaderActionsSlotRegion(): PageHeaderActionsSlotContextValue {
  const ctx = React.useContext(PageHeaderActionsSlotContext);
  if (!ctx) {
    throw new Error(
      'usePageHeaderActionsSlotRegion must be used within PageHeaderActionsProvider',
    );
  }
  return ctx;
}

export function usePageHeaderFilterRegion(): PageHeaderFilterContextValue {
  const ctx = React.useContext(PageHeaderFilterContext);
  if (!ctx) {
    throw new Error(
      'usePageHeaderFilterRegion must be used within PageHeaderActionsProvider',
    );
  }
  return ctx;
}

function serializeHeaderActionDeps(deps: React.DependencyList): string {
  try {
    return JSON.stringify(deps);
  } catch {
    return String(deps.length);
  }
}

/**
 * Inject action buttons into topbar Row 2 from any page component.
 *
 * Uses the same ref + callback pattern as `useEntityFilterSlot` so updating
 * the header slot never re-renders the caller — unstable deps cannot loop.
 */
export function usePageHeaderActions(
  render: () => React.ReactNode,
  deps: React.DependencyList,
): void {
  const { renderFnRef, reRenderSlotRef } = usePageHeaderActionsSlotRegion();
  const { setFilterPanelOpen } = usePageHeaderFilterRegion();

  const renderRef = React.useRef(render);
  renderRef.current = render;

  renderFnRef.current = () => renderRef.current();

  const depsKey = serializeHeaderActionDeps(deps);
  const lastDepsKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lastDepsKeyRef.current === depsKey) return;
    lastDepsKeyRef.current = depsKey;
    reRenderSlotRef.current?.();
  }, [depsKey, reRenderSlotRef]);

  React.useEffect(() => {
    return () => {
      renderFnRef.current = null;
      lastDepsKeyRef.current = null;
      setFilterPanelOpen(false);
      reRenderSlotRef.current?.();
    };
  }, [renderFnRef, reRenderSlotRef, setFilterPanelOpen]);
}
