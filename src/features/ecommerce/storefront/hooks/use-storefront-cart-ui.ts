'use client';

import { create } from 'zustand';

export type CartLine = {
  productId: string;
  quantity: number;
};

interface StorefrontCartUiState {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useStorefrontCartUi = create<StorefrontCartUiState>((set, get) => ({
  lines: [],
  addItem: (productId, quantity = 1) => {
    const existing = get().lines.find((line) => line.productId === productId);
    if (existing) {
      set({
        lines: get().lines.map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + quantity } : line,
        ),
      });
      return;
    }
    set({ lines: [...get().lines, { productId, quantity }] });
  },
  removeItem: (productId) => set({ lines: get().lines.filter((line) => line.productId !== productId) }),
  setQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      lines: get().lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    });
  },
  clear: () => set({ lines: [] }),
}));

export function useCartItemCount(): number {
  return useStorefrontCartUi((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));
}
