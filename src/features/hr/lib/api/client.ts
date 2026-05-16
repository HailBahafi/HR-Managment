import { publicConfig } from '@/shared/config';
import type { ApiErrorEnvelope, ApiSuccessEnvelope } from '@/features/hr/lib/api/types';
import { isApiErrorEnvelope, isApiSuccessEnvelope } from '@/features/hr/lib/api/types';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export class ApiError extends Error {
  status: number;
  /** Raw JSON body from fetch (same as Network tab). */
  payload: unknown;
  /** Parsed backend error envelope when present. */
  envelope: ApiErrorEnvelope | null;

  constructor(envelope: ApiErrorEnvelope | null, status: number, payload?: unknown) {
    super(envelope?.message ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.envelope = envelope;
    this.payload = payload ?? envelope;
  }
}

type QueryValue = string | number | boolean | null | undefined;

function buildQuery(query?: Record<string, QueryValue>) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = publicConfig.apiUrl;
  const urlBase = baseUrl ? baseUrl.replace(/\/$/, '') : '';
  return `${urlBase}${normalizedPath}${buildQuery(query)}`;
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('access_token');
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
};

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    return payload as T;
  }

  if (isApiSuccessEnvelope(payload)) {
    return (payload.data ?? ({} as T)) as T;
  }

  const record = payload as ApiSuccessEnvelope<T> & { success?: boolean };
  if ('data' in record && record.success === true) {
    return (record.data ?? ({} as T)) as T;
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options;
  const headers: HeadersInit = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const envelope = isApiErrorEnvelope(payload)
      ? payload
      : {
          status: response.status,
          message: response.statusText || 'Request failed',
          data: null,
          error: payload,
        };
    throw new ApiError(envelope, response.status, payload);
  }

  return unwrapEnvelope<T>(payload);
}
