export type GuestPortalTab =
  | 'HOME'
  | 'WAITLIST'
  | 'MENU'
  | 'OFFERS'
  | 'REWARDS' 
  | 'PROFILE'
  | 'REVIEWS';

export interface GuestAccount {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  token?: string;
}

export interface PortalRestaurant {
  id: number;
  name: string;
  cuisine: string;
  distance: string;
  rating: number;
  reviewCount: number;
  waitTime: number;
  partiesAhead: number;
  tableStatus: string;
  imageClass: string;
  status: 'OPEN' | 'BUSY' | 'NO_WAIT' | 'FULL';
}

export interface PortalOffer {
  id: number;
  name: string;
  restaurantId: number;
  restaurantName: string;
  startDate: string;
  endDate: string;
  status: string;
  value: number;
  pointsCost: number;
  redeemable: boolean;
}

export interface OffersResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: PortalOffer[];
  number: number;
  numberOfElements: number;
  empty: boolean;
}

export interface PortalReward {
  id: number;
  title: string;
  description: string;
  pointsRequired: number;
  available: boolean;
  icon: string;
}