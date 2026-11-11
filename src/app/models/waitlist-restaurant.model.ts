export type GuestStatus = 'waiting' | 'table-ready' | 'notified' | 'overdue';
export type SeatingPreference = 'No preference' | 'Indoor' | 'Outdoor' | 'Patio preferred' | 'Bar seating OK' | 'Quiet section';
export type SpecialTag = 'Birthday' | 'Anniversary' | 'VIP' | 'High chair' | 'Wheelchair' | 'Large party';

export interface Guest {
  id: number;
  position: number;
  name: string;
  partySize: number;
  phone: string;
  status: GuestStatus;
  preference: SeatingPreference;
  tags: SpecialTag[];
  notes: string;
  waitMinutes: number;
  addedAt: Date;
}

export type TableStatus = 'open' | 'occupied' | 'reserved';

export interface RestaurantTable {
  id: string;
  seats: number;
  status: TableStatus;
  info: string;
}

export type HistoryStatus = 'seated' | 'noshow' | 'left';

export interface HistoryEntry {
  id: number;
  name: string;
  partySize: number;
  addedTime: string;
  seatedTime: string;
  waitMinutes: number | null;
  tableId: string;
  status: HistoryStatus;
}

export interface AddGuestForm {
  name: string;
  phone: string;
  partySize: number;
  preference: SeatingPreference;
  tags: SpecialTag[];
  notes: string;
}