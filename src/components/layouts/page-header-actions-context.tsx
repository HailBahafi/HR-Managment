'use client';

import * as React from 'react';

type PageHeaderActionsSlotContextValue = {
  renderFnRef: React.MutableRefObject<(() => React.ReactNode) | null>;
  reRenderSlotRef: React.MutableRefObject<(() => void) | null>;
};

type PageHeaderFilterContextValue = {
  filterPanelOpen: boolean;
};

type PageHeaderActionsSetters = {
  setFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const PageHeaderActionsSlotContext =
  React.createContext<PageHeaderActionsSlotContextValue | null>(null);

const PageHeaderFilterContext =
  React.createContext<PageHeaderFilterContextValue | null>(null);

const PageHeaderActionsSettersRefContext =
  React.createContext<React.MutableRefObject<PageHeaderActionsSetters> | null>(null);

function serializeHeaderActionDeps(deps: React.DependencyList): string {
  try {
    return JSON.stringify(deps);
  } catch {
    return String(deps.length);
  }
}

export function PageHeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const renderFnRef = React.useRef<(() => React.ReactNode) | null>(null);
  const reRenderSlotRef = React.useRef<(() => void) | null>(null);
  const slotValue = React.useRef<PageHeaderActionsSlotContextValue>({
    renderFnRef,
    reRenderSlotRef,
  }).current;

  const [filterPanelOpen, setFilterPanelOpen] = React.useState(true);

  const settersRef = React.useRef<PageHeaderActionsSetters>({ setFilterPanelOpen });
  settersRef.current.setFilterPanelOpen = setFilterPanelOpen;

  const filterValue = React.useMemo(
    () => ({ filterPanelOpen }),
    [filterPanelOpen],
  );

  return (
    <PageHeaderActionsSlotContext.Provider value={slotValue}>
      <PageHeaderActionsSettersRefContext.Provider value={settersRef}>
        <PageHeaderFilterContext.Provider value={filterValue}>
          {children}
        </PageHeaderFilterContext.Provider>
      </PageHeaderActionsSettersRefContext.Provider>
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

export function usePageHeaderActionsState(): PageHeaderFilterContextValue {
  const ctx = React.useContext(PageHeaderFilterContext);
  if (!ctx) {
    throw new Error('usePageHeaderActionsState must be used within PageHeaderActionsProvider');
  }
  return ctx;
}

export function usePageHeaderActionsSettersRef(): React.MutableRefObject<PageHeaderActionsSetters> {
  const ctx = React.useContext(PageHeaderActionsSettersRefContext);
  if (!ctx) {
    throw new Error('usePageHeaderActionsSettersRef must be used within PageHeaderActionsProvider');
  }
  return ctx;
}

export function usePageHeaderFilterRegion(): PageHeaderFilterContextValue & PageHeaderActionsSetters {
  const { filterPanelOpen } = usePageHeaderActionsState();
  const settersRef = usePageHeaderActionsSettersRef();
  return {
    filterPanelOpen,
    setFilterPanelOpen: settersRef.current.setFilterPanelOpen,
  };
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
  const settersRef = usePageHeaderActionsSettersRef();

  const renderRef = React.useRef(render);
  renderRef.current = render;

  renderFnRef.current = () => renderRef.current();

  const depsKey = serializeHeaderActionDeps(deps);
  const lastDepsKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lastDepsKeyRef.current === depsKey) return;
    lastDepsKeyRef.current = depsKey;
    settersRef.current.setFilterPanelOpen(true);
    reRenderSlotRef.current?.();
  }, [depsKey, reRenderSlotRef, settersRef]);

  React.useEffect(() => {
    return () => {
      renderFnRef.current = null;
      lastDepsKeyRef.current = null;
      settersRef.current.setFilterPanelOpen(false);
      reRenderSlotRef.current?.();
    };
  }, [renderFnRef, reRenderSlotRef, settersRef]);
}
