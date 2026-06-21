import { NextRequest, NextResponse } from 'next/server';
import { isApiSuccessEnvelope } from '@/features/hr/lib/api/types';
import type { PaginatedResult } from '@/features/hr/lib/api/client';
import type { RecruitmentJob } from '@/features/hr/recruitment/lib/api/types';

function backendBaseUrl(): string {
  return (process.env.BACKEND_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
}

function tenantId(): string | null {
  return process.env.NEXT_PUBLIC_RECRUITMENT_TENANT_ID?.trim() || null;
}

function tenantSlug(): string {
  return process.env.NEXT_PUBLIC_RECRUITMENT_TENANT_SLUG?.trim() || 'demo-recruitment';
}

function bearerFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }

  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  const serverToken = process.env.RECRUITMENT_PUBLIC_LIST_TOKEN?.trim();
  return serverToken || null;
}

async function tryPublicList(search: string, limit: string): Promise<Response | null> {
  const base = backendBaseUrl();
  const slug = tenantSlug();
  const id = tenantId();
  const urls = [
    `${base}/public/recruitment/jobs?tenantSlug=${encodeURIComponent(slug)}&limit=${limit}&search=${encodeURIComponent(search)}`,
    id
      ? `${base}/public/recruitment/jobs?tenantId=${encodeURIComponent(id)}&limit=${limit}&search=${encodeURIComponent(search)}`
      : null,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 404) continue;
    return res;
  }
  return null;
}

async function fetchAuthenticatedList(
  bearer: string,
  search: string,
  limit: string,
): Promise<Response> {
  const id = tenantId();
  if (!id) {
    return new Response(
      JSON.stringify({
        status: 500,
        message: 'NEXT_PUBLIC_RECRUITMENT_TENANT_ID is not configured',
        data: null,
        error: { statusCode: 500 },
      }),
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    tenantId: id,
    isActive: 'true',
    limit,
  });
  if (search) params.set('search', search);

  return fetch(`${backendBaseUrl()}/recruitment/jobs?${params}`, {
    headers: {
      Authorization: `Bearer ${bearer}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
}

function filterActiveItems(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;

  const envelope = payload as Record<string, unknown>;
  const data = isApiSuccessEnvelope(payload) ? envelope.data : payload;

  if (!data || typeof data !== 'object') return payload;

  const record = data as PaginatedResult<RecruitmentJob>;
  if (!Array.isArray(record.items)) return payload;

  const items = record.items.filter((job) => job.isActive);
  const normalized: PaginatedResult<RecruitmentJob> = {
    items,
    pagination: record.pagination ?? {
      page: 1,
      limit: items.length,
      total: items.length,
      totalPages: 1,
    },
  };

  if (isApiSuccessEnvelope(payload)) {
    return { ...envelope, data: normalized };
  }
  return normalized;
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')?.trim() ?? '';
  const limit = request.nextUrl.searchParams.get('limit')?.trim() ?? '100';

  let backendRes = await tryPublicList(search, limit);

  if (!backendRes) {
    const bearer = bearerFromRequest(request);
    if (!bearer) {
      return NextResponse.json(
        {
          status: 503,
          message:
            'لا يمكن جلب الوظائف العامة. أضف GET /public/recruitment/jobs في الباكند، أو عيّن RECRUITMENT_PUBLIC_LIST_TOKEN في .env، أو سجّل الدخول.',
          data: null,
          error: { statusCode: 503 },
        },
        { status: 503 },
      );
    }
    backendRes = await fetchAuthenticatedList(bearer, search, limit);
  }

  let payload: unknown = null;
  try {
    payload = await backendRes.json();
  } catch {
    payload = null;
  }

  if (!backendRes.ok) {
    return NextResponse.json(payload ?? { status: backendRes.status, message: 'Backend error', data: null }, {
      status: backendRes.status,
    });
  }

  return NextResponse.json(filterActiveItems(payload));
}
