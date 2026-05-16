import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/features/auth/lib/api/auth';
import { useAuthStore } from '@/features/auth/lib/auth-store';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

/** Hydrates user from HttpOnly cookie on refresh (no token in JS). */
export function useAuthSession() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: async () => {
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    enabled: !user,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}
