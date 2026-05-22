import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'leave'
  | 'discipline'
  | 'payroll'
  | 'contract'
  | 'attendance'
  | 'advance'
  | 'announcement'
  | 'system';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export type InboxItemResponseDto = {
  recipientId: string;
  notificationId: string;
  companyId: string;
  employeeId: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  titleAr: string;
  bodyAr: string | null;
  titleEn: string | null;
  bodyEn: string | null;
  sourceKind: string | null;
  sourceTable: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  actionLabelAr: string | null;
  requiresAcknowledgment: boolean;
  expiresAt: string | null;
  triggeredByNameAr: string | null;
  deliveryChannel: string;
  deliveredAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const notificationsApi = {
  inbox: (
    employeeId: string,
    params?: {
      companyId?: string;
      unreadOnly?: boolean;
      includeDismissed?: boolean;
      includeArchived?: boolean;
      page?: number;
      limit?: number;
    },
  ) =>
    apiRequest<PaginatedResult<InboxItemResponseDto>>(
      `/notifications/${employeeId}/inbox`,
      { query: params },
    ),

  markRead: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/${employeeId}/inbox/${recipientId}/read`,
      { method: 'PATCH' },
    ),

  markUnread: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/${employeeId}/inbox/${recipientId}/unread`,
      { method: 'PATCH' },
    ),

  dismiss: (employeeId: string, recipientId: string) =>
    apiRequest<InboxItemResponseDto>(
      `/notifications/${employeeId}/inbox/${recipientId}/dismiss`,
      { method: 'PATCH' },
    ),

  markAllRead: (employeeId: string, companyId?: string) =>
    apiRequest<{ updated: number }>(
      `/notifications/${employeeId}/inbox/read-all`,
      { method: 'PATCH', query: companyId ? { companyId } : undefined },
    ),

  unreadCount: (employeeId: string, companyId?: string) =>
    apiRequest<{ unread: number }>(
      `/notifications/${employeeId}/unread-count`,
      { query: companyId ? { companyId } : undefined },
    ),
};
