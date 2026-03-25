import type { User, Listing, ListingDetail, Claim, Notification } from '../types';

const BASE = '/api';

function toQuery(params: Record<string, string | number>): string {
  return new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
}

async function request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = params ? `${BASE}${path}?${toQuery(params)}` : `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  auth: {
    register: (email: string, password: string, role: string) =>
      request<{ status: string; user_id: number }>('/auth/register', { email, password, role }),

    login: (email: string, password: string) =>
      request<{ status: string; user: User }>('/auth/login', { email, password }),

    logout: () => request<{ status: string }>('/auth/logout'),

    checkStatus: () =>
      request<{ logged_in: boolean; user_id?: number; user_role?: string }>('/auth/check_status'),
  },

  users: {
    me: () => request<User>('/users/me'),
    myListings: () => request<{ listings: ListingDetail[] }>('/users/my_listings'),
  },

  listings: {
    nearby: (lat: number, lon: number, radius = 5, foodType?: string) => {
      const params: Record<string, string | number> = { lat, lon, radius };
      if (foodType) params.food_type = foodType;
      return request<{ listings: Listing[] }>('/listings/nearby', params);
    },

    create: (data: {
      food_type: string;
      quantity: string;
      address_text: string;
      hours_until_expiry: number;
    }) => request<{ status: string; listing_id: number; expires_at: string }>('/listings/create', {
      food_type: data.food_type,
      quantity: data.quantity,
      address_text: data.address_text,
      hours_until_expiry: data.hours_until_expiry,
    }),

    claim: (listingId: number, logisticsType: string) =>
      request<{
        status: string;
        coordination_id: string;
        logistics_packet: { address: string; lat: number; lon: number; logistics_type: string };
      }>('/listings/claim', { listing_id: listingId, logistics_type: logisticsType }),
  },

  claims: {
    mine: () => request<{ claims: Claim[] }>('/claims/mine'),
    view: (claimId: number) => request<Claim>('/claims/view', { claim_id: claimId }),
    acknowledge: (claimId: number) =>
      request<{ status: string; message: string }>('/claims/acknowledge', { claim_id: claimId }),
    cancel: (claimId: number) =>
      request<{ status: string; message: string }>('/claims/cancel', { claim_id: claimId }),
  },

  notifications: {
    mine: () => request<{ notifications: Notification[] }>('/notifications/mine'),
  },

  system: {
    cleanup: () => request<{ expired_items_removed: number }>('/system/cleanup'),
  },
};
