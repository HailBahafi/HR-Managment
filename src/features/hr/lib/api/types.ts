/** Matches backend `ApiSuccessEnvelope` / `ApiErrorEnvelope` (see backend API_CONTRACT.md). */

export type ApiSuccessEnvelope<T = unknown> = {
  status: number;
  message: string;
  data: T;
  error: null;
};

export type ApiErrorEnvelope = {
  status: number;
  message: string;
  data: null;
  error: unknown;
};

export function isApiErrorEnvelope(payload: unknown): payload is ApiErrorEnvelope {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as Record<string, unknown>;
  return record.data === null && 'status' in record && 'message' in record;
}

export function isApiSuccessEnvelope(payload: unknown): payload is ApiSuccessEnvelope {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as Record<string, unknown>;
  return record.error === null && 'status' in record && 'data' in record;
}
