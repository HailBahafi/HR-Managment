import { create } from 'zustand';
import type { AccessProfile } from '@/features/auth/types/access-profile';
import type { AuthUser } from '@/features/auth/types/access-profile';

interface AuthState {
  user: AuthUser | null;
  accessProfile: AccessProfile | null;
  activeCompanyId: string | null;
  activeBranchId: string | null;

  setUser: (user: AuthUser) => void;
  setAccessProfile: (profile: AccessProfile) => void;
  setActiveContext: (companyId: string, branchId?: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessProfile: null,
  activeCompanyId: null,
  activeBranchId: null,

  setUser: (user) => set({ user }),

  setAccessProfile: (profile) =>
    set((state) => ({
      accessProfile: profile,
      activeCompanyId: state.activeCompanyId ?? profile.defaultCompanyId,
      activeBranchId: state.activeBranchId ?? profile.defaultBranchId,
    })),

  setActiveContext: (companyId, branchId = null) =>
    set({ activeCompanyId: companyId, activeBranchId: branchId }),

  clear: () =>
    set({
      user: null,
      accessProfile: null,
      activeCompanyId: null,
      activeBranchId: null,
    }),
}));
