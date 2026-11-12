export interface JoinWaitlistRequest {
  restaurantId: number;
  name: string;
  phone: string;
  partySize: number;
  preference: string;
  notes: string;
  marketingSmsConsent: boolean;
}

export interface addGuestToWaitlistRequest {
  name: string,
  phone: string,
  partySize: number,
  preference: string,
  notes: string,
  position: number,
  estimatedWaitTime: number
}

export interface PendingGuest {
  id: number,
  guestName: string,
  guestPhone: string,
  partySize: number,
  preference: string,
  notes: string,
  status: string;
  joinedAt: string;
}

export interface CancelledGuest {
  id: number,
  guestName: string,
  guestPhone: string,
  partySize: number,
  preference: string,
  notes: string,
  status: string;
  joinedAt: string;
}

export interface PendingGuestResponse {
  success: boolean;
  message: string;
  data: PendingGuest[];
}

export interface CancelledGuestResponse {
  success: boolean;
  message: string;
  data: CancelledGuest[];
}


export interface getGuestWaitingStatus {
  restaurantId: number,
  phone: string
}

export interface WaitingGuest {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  preference: string;
  notes: string;
  status: string;
  position: number;
  estimatedWaitTime: number;
  joinedAt: string;
  approvedAt: string;
}


export interface WaitingGuestResponse {
  success: boolean;
  message: string;
  data: WaitingGuest[];
}

export interface NotifiedGuest {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  preference: string;
  notes: string;
  status: string;
  position: number;
  estimatedWaitTime: number;

  joinedAt: string;
  approvedAt?: string;
  notifiedAt?: string;

  smsStatus?: string;
  smsMessage?: string;
  smsError?: string;

  latestCustomerReply?: string;
  customerReplyDescription?: string;
  customerReplyReceivedAt?: string;
  customerReplySid?: string;

  latestVoiceReply?: string;
  callStatus?: string;
  callResponse?: string;
  voiceReplyReceivedAt?: string;
  voiceReplyDigits?: string;

  tableName?: string;
}

export interface NotifiedGuestResponse {
  success: boolean;
  message: string;
  data: NotifiedGuest[];
}

export interface SeatedGuest {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  preference: string;
  notes: string;
  status: string;
  seatedAt: string;
  tableName: string;
  assignedServerId?: number | null;
}

export interface SeatedGuestResponse {
  success: boolean;
  message: string;
  data: SeatedGuest[];
}

export interface getDashboardData {
  averageWaitTime: number,
  noShowsToday: number,
  occupiedTables: number,
  openTables: number,
  reservedTables: number,
  seatedToday: number,
  tablesNeedingCleaning: number,
  totalNotified: number,
  totalWaiting: number
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: getDashboardData;
}

export interface DashboardStatus {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  preference: string;
  notes: string;
  status: string;
  position?: number;
  estimatedWaitTime?: number;
}

export interface DashboardWaitlistResponse {
  success: boolean;
  message: string;
  data: DashboardStatus[];
}

export interface ApproveWaitlistRequest {
  estimatedWaitTime: number;
}

export interface notifiyguestcallRequest {
  estimatedWaitTime: number,
  position: number
}

export interface seatedGuestcallRequest {
  tableName: string
}

export interface updateSeatedGuestcallRequest {
  partySize: number
  tableName: string
}


export interface tableList {
  id: number,
  tableNumber: string,
  capacity: number,
  status: string
  mergedTableId?: number | null;
}

export interface TablelistResponse {
  success: boolean;
  message: string;
  data: tableList[];
}
export interface mergerTableRequest {

  tableId: number,
  mergedTableId: number

}

export interface unMergerTableRequest {

  tableId: number,
  mergedTableId: number

}


export interface guestReportsPage {
  averageWaitTime: number,
  todayGuestsCount: number,
  todaySeatedCount: number,
  totalCancelled: number,
  totalGuests: number,
  totalNotified: number,
  totalSeated: number,
  totalWaiting: number
}
export interface guestReportsResponse {
  success: boolean;
  message: string;
  data: guestReportsPage;
}

export interface addTabletoRestaurantRequest {
  tableNumber: string,
  capacity: number
}

export interface GetGuestHistory {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;

  preference: string;
  notes: string;
  status: string;

  joinedAt: string | null;
  approvedAt: string | null;
  notifiedAt: string | null;
  seatedAt: string | null;

  smsStatus?: string | null;
  smsMessage?: string | null;

  latestCustomerReply?: string | null;
  customerReplyDescription?: string | null;
  customerReplyReceivedAt?: string | null;
  customerReplySid?: string | null;

  latestVoiceReply?: string | null;
  callStatus?: string | null;
  callResponse?: string | null;
  voiceReplyReceivedAt?: string | null;
  voiceReplyDigits?: string | null;

  tableName?: string | null;
}

export interface GuestHistoryPage {
  content: GetGuestHistory[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GuestHistoryResponse {
  success: boolean;
  message: string;
  data: GuestHistoryPage;
}

export interface Restaurant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalTables: number;
  acceptOnlineJoin?: boolean;
  walkInsOnly?: boolean;
  openTime?: string;
  closeTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantResponse {
  success: boolean;
  message: string;
  data: Restaurant[];
}

export interface PortalOffer {
  id: number;
  name: string;
  description?: string;
  discountLabel?: string;
  discountValue?: number;
  endDate: string;
  restaurantId: number;
  restaurantName: string;
  startDate: string;
  status: string;
  photoUrl?: string;
  redeemable: boolean;
  userRedemptionsTotal: number;
}

export interface OffersPage {
  content: PortalOffer[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface OffersResponse {
  success: boolean;
  message: string;
  data: OffersPage;
}

export interface OfferRedemption {
  expiresAt: string;
  message: string;
  offerName: string;
  redemptionCode: string;
  redemptionId: number;
  qrCodeDataUri: string;
}

export interface RedeemOfferResponse {
  success: boolean;
  message: string;
  data: OfferRedemption;
}


export interface Restaurant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalTables: number;
  acceptOnlineJoin?: boolean;
  walkInsOnly?: boolean;
  openTime?: string;
  closeTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantResponse {
  success: boolean;
  message: string;
  data: Restaurant[];
}

export interface RestaurantFloorServer {
  staffId: number;
  name: string;
  onFloor: boolean;
  seatedCount: number;
  rotationOrder: number;
  nextUp: boolean;
  currentTableCount: number;
  maxTables: number;
  atCapacity: boolean;
  assignedTableNames: string[];
  currentTableIds?: number[];
  currentWaitlistIds?: number[];
}

export interface RestaurantFloorRoster {
  serverAssignmentMode: string;
  servers: RestaurantFloorServer[];
}

export interface RestaurantFloorResponse {
  success: boolean;
  message: string;
  data: RestaurantFloorRoster;
}

export interface RestaurantFloorServersResponse {
  success: boolean;
  message: string;
  data: RestaurantFloorServer[];
}

export interface SetServerFloorRequest {
  onFloor: boolean;
  maxTables?: number;
}

export interface RestaurantStaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  status: string;
}

export interface RestaurantStaffResponse {
  success: boolean;
  message: string;
  data: RestaurantStaffMember[];
}

export interface TableServerAssignment {
  id: number;
  tableId: number;
  tableName: string;
  assignedServerId: number;
  serverName: string;
  sectionName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableServerAssignmentsResponse {
  success: boolean;
  message: string;
  data: TableServerAssignment[];
}

export interface AssignRestaurantServerRequest {
  serverId: number;
  sectionName?: string;
}