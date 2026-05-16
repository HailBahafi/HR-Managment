import { apiRequest } from '@/features/hr/lib/api/client';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult = {
  access_token: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
  };
};

export const authApi = {
  login(payload: LoginPayload) {
    return apiRequest<LoginResult>('/auth/login', { method: 'POST', body: payload });
  },
};

export function persistAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('access_token', token);
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('access_token');
}
