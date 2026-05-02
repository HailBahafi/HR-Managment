'use client';

import * as React from 'react';

type EntityFilterSlotContextValue = {
  slot: React.ReactNode | null;
  setSlot: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

const EntityFilterSlotContext = React.createContext<EntityFilterSlotContextValue | null>(null);

export function EntityFilterSlotProvider({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = React.useState<React.ReactNode | null>(null);
  const value = React.useMemo(() => ({ slot, setSlot }), [slot]);
  return (
    <EntityFilterSlotContext.Provider value={value}>
      {children}
    </EntityFilterSlotContext.Provider>
  );
}

export function useEntityFilterSlotRegion(): EntityFilterSlotContextValue {
  const ctx = React.useContext(EntityFilterSlotContext);
  if (!ctx) {
    throw new Error('useEntityFilterSlotRegion must be used within EntityFilterSlotProvider');
  }
  return ctx;
}

/**
 * Renders the filter toolbar into the app layout slot above the page body.
 * Pass a render function; keep `deps` to primitives / stable references only
 * (never React elements or unstable store selectors) to avoid update loops.
 */
export function useEntityFilterSlot(render: () => React.ReactNode, deps: React.DependencyList): void {
  const { setSlot } = useEntityFilterSlotRegion();
  const renderRef = React.useRef(render);
  renderRef.current = render;

  React.useLayoutEffect(() => {
    setSlot(renderRef.current());
    return () => {
      setSlot(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies `deps` explicitly
  }, [setSlot, ...deps]);
}
