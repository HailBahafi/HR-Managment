import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'rose-hr-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        user: state.user,
        accessProfile: state.accessProfile,
        activeCompanyId: state.activeCompanyId,
        activeBranchId: state.activeBranchId,
      }),
    },
  ),
);
