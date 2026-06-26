import { publicConfig } from '@/shared/config';

/** Same-origin API base used by fetch (handles LAN / proxy in production). */
export function resolveApiBaseUrl(configuredUrl = publicConfig.apiUrl): string {
  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const currentHost = window.location.hostname;
  const isLocalPage = currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '::1';
  if (isLocalPage) {
    return configuredUrl;
  }

  try {
    const apiHost = new URL(configuredUrl, window.location.origin).hostname;
    const isLocalApi = apiHost === 'localhost' || apiHost === '127.0.0.1' || apiHost === '::1';
    return isLocalApi ? '/api-backend' : configuredUrl;
  } catch {
    return configuredUrl;
  }
}
