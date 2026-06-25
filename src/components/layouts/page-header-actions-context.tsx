'use client';

import * as React from 'react';

type PageHeaderActionsSetters = {
  setSlot: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  setFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type PageHeaderActionsState = {
  slot: React.ReactNode | null;
  filterPanelOpen: boolean;
};

const PageHeaderActionsStateContext = React.createContext<PageHeaderActionsState | null>(null);
const PageHeaderActionsSettersRefContext = React.createContext<React.MutableRefObject<PageHeaderActionsSetters> | null>(null);

function serializeHeaderActionDeps(deps: React.DependencyList): string {
  try {
    return JSON.stringify(deps);
  } catch {
    return String(deps.length);
  }
}

export function PageHeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = React.useState<React.ReactNode | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(true);

  const settersRef = React.useRef<PageHeaderActionsSetters>({ setSlot, setFilterPanelOpen });
  settersRef.current.setSlot = setSlot;
  settersRef.current.setFilterPanelOpen = setFilterPanelOpen;

  const state = React.useMemo(
    (): PageHeaderActionsState => ({ slot, filterPanelOpen }),
    [slot, filterPanelOpen],
  );

  return (
    <PageHeaderActionsSettersRefContext.Provider value={settersRef}>
      <PageHeaderActionsStateContext.Provider value={state}>
        {children}
      </PageHeaderActionsStateContext.Provider>
    </PageHeaderActionsSettersRefContext.Provider>
  );
}

/** Read header slot / filter-panel visibility (Topbar, filter region, toggle button). */
export function usePageHeaderActionsState(): PageHeaderActionsState {
  const ctx = React.useContext(PageHeaderActionsStateContext);
  if (!ctx) throw new Error('usePageHeaderActionsState must be used within PageHeaderActionsProvider');
  return ctx;
}

/** Stable setters ref — does not re-render when slot or filterPanelOpen changes. */
export function usePageHeaderActionsSettersRef(): React.MutableRefObject<PageHeaderActionsSetters> {
  const ctx = React.useContext(PageHeaderActionsSettersRefContext);
  if (!ctx) throw new Error('usePageHeaderActionsSettersRef must be used within PageHeaderActionsProvider');
  return ctx;
}

/** @deprecated Prefer usePageHeaderActionsState + usePageHeaderActionsSettersRef */
export function usePageHeaderActionsRegion() {
  const state = usePageHeaderActionsState();
  const settersRef = usePageHeaderActionsSettersRef();
  return {
    ...state,
    setSlot: settersRef.current.setSlot,
    setFilterPanelOpen: settersRef.current.setFilterPanelOpen,
  };
}

/**
 * Inject action buttons into topbar Row 2 from any page component.
 * Uses setters ref only so updating the slot does not re-render the page.
 */
export function usePageHeaderActions(render: () => React.ReactNode, deps: React.DependencyList): void {
  const settersRef = usePageHeaderActionsSettersRef();
  const renderRef = React.useRef(render);
  renderRef.current = render;

  const depsKey = serializeHeaderActionDeps(deps);
  const lastDepsKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lastDepsKeyRef.current === depsKey) return;
    lastDepsKeyRef.current = depsKey;
    settersRef.current.setSlot(renderRef.current());
    settersRef.current.setFilterPanelOpen(true);
  }, [depsKey, settersRef]);

  React.useEffect(() => {
    return () => {
      lastDepsKeyRef.current = null;
      settersRef.current.setSlot(null);
      settersRef.current.setFilterPanelOpen(false);
    };
  }, [settersRef]);
}
