export interface notificationSummary {
totalGuests: number,
        waiting: number,
        notified: number,
        seated: number,
        cancelled: number
}

export interface notificationSummaryResponse {
success: boolean;
  message: string;
  data: notificationSummary;
}





export interface NotificationGuest {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  preference?: string;
  notes?: string;
  status: 'WAITING' | 'NOTIFIED' | 'SEATED' | 'CANCELLED' | 'PENDING';
  position?: number;
  estimatedWaitTime?: number;
  joinedAt?: string;
  approvedAt?: string;
  notifiedAt?: string;
  seatedAt?: string;
  cancelledAt?: string;
  tableName?: string;
}

export interface NotificationPageData {
  content: NotificationGuest[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface NotificationApiResponse {
  success: boolean;
  message: string;
  data: NotificationPageData;
}

export interface sendNotificationRequest {
  message: string;
}