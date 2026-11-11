export interface ServerApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ServerAssignedTable {
  waitlistId: number;
  tableId: number;
  tableName: string;
  guestName: string;
  partySize: number;
  notes: string | null;
  preference: string | null;
  seatedAt: string | null;
  orderNotes: string | null;
  orderNotesUpdatedAt: string | null;
}

export interface ServerNotification {
  id: number;
  waitlistId: number | null;
  tableId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ServerNotificationPage {
  content: ServerNotification[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ServerUnreadCount {
  unreadCount: number;
}
