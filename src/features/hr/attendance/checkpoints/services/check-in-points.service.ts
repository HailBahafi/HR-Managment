import {
  checkInPointsApi,
  type CheckInPointResponseDto,
  type CreateCheckInPointDto,
  type UpdateCheckInPointDto,
} from '@/features/hr/attendance/lib/api/check-in-points';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { parseCoord } from '@/features/hr/lib/map-dto';

export function mapCheckInPointResponse(dto: CheckInPointResponseDto): AttendanceCheckInPoint {
  return {
    id: dto.id,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? undefined,
    latitude: parseCoord(dto.latitude),
    longitude: parseCoord(dto.longitude),
    radiusMeters: dto.radiusMeters,
    isActive: dto.isActive,
  };
}

export async function loadCheckInPoints() {
  const scope = await resolveOrganizationScope();
  const res = await checkInPointsApi.getAll(
    scope.companyId ? { companyId: scope.companyId, limit: 200 } : { limit: 200 },
  );
  return {
    items: res.items.map(mapCheckInPointResponse),
    companyId: scope.companyId ?? res.items[0]?.companyId ?? null,
  };
}

export async function createCheckInPoint(payload: CreateCheckInPointDto) {
  return checkInPointsApi.create(payload);
}

export async function updateCheckInPoint(id: string, payload: UpdateCheckInPointDto) {
  return checkInPointsApi.update(id, payload);
}

export async function deleteCheckInPoint(id: string) {
  return checkInPointsApi.remove(id);
}
