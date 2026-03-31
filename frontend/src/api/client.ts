import type { User, Listing, ListingDetail, Claim, Notification } from '../types';

const BASE = '/api';

function toQuery(params: Record<string, string | number>): string {
  return new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = params ? `${BASE}${path}?${toQuery(params)}` : `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function post<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params ? toQuery(params) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  auth: {
    register: (email: string, password: string, role: string) =>
      post<{ status: string; user_id: number }>('/auth/register', { email, password, role }),

    login: (email: string, password: string) =>
      post<{ status: string; user: User }>('/auth/login', { email, password }),

    logout: () => post<{ status: string }>('/auth/logout'),

    checkStatus: () =>
      get<{ logged_in: boolean; user_id?: number; user_role?: string }>('/auth/check_status'),
  },

  users: {
    me: () => get<User>('/users/me'),
    myListings: () => get<{ listings: ListingDetail[] }>('/users/my_listings'),
  },

  listings: {
    nearby: (lat: number, lon: number, radius = 5, foodType?: string) => {
      const params: Record<string, string | number> = { lat, lon, radius };
      if (foodType) params.food_type = foodType;
      return get<{ listings: Listing[] }>('/listings/nearby', params);
    },

    create: (data: {
      food_type: string;
      quantity: string;
      address_text: string;
      hours_until_expiry: number;
    }, imageFile?: File) => {
      const formData = new FormData();
      formData.append('food_type', data.food_type);
      formData.append('quantity', data.quantity);
      formData.append('address_text', data.address_text);
      formData.append('hours_until_expiry', String(data.hours_until_expiry));
      if (imageFile) formData.append('image', imageFile);
      return postFormData<{ status: string; listing_id: number; expires_at: string }>(
        '/listings/create', formData
      );
    },

    claim: (listingId: number, logisticsType: string) =>
      post<{
        status: string;
        coordination_id: string;
        logistics_packet: { address: string; lat: number; lon: number; logistics_type: string };
      }>('/listings/claim', { listing_id: listingId, logistics_type: logisticsType }),

    detail: (listingId: number) =>
      get<ListingDetail>('/listings/detail', { listing_id: listingId }),

    update: (data: {
      listing_id: number;
      food_type: string;
      quantity: string;
      address_text: string;
      hours_until_expiry: number;
    }, imageFile?: File) => {
      const formData = new FormData();
      formData.append('listing_id', String(data.listing_id));
      formData.append('food_type', data.food_type);
      formData.append('quantity', data.quantity);
      formData.append('address_text', data.address_text);
      formData.append('hours_until_expiry', String(data.hours_until_expiry));
      if (imageFile) formData.append('image', imageFile);
      return postFormData<{ status: string; message: string }>('/listings/update', formData);
    },

    delete: (listingId: number) =>
      post<{ status: string; message: string }>('/listings/delete', { listing_id: listingId }),
  },

  claims: {
    mine: () => get<{ claims: Claim[] }>('/claims/mine'),
    view: (claimId: number) => get<Claim>('/claims/view', { claim_id: claimId }),
    acknowledge: (claimId: number) =>
      post<{ status: string; message: string }>('/claims/acknowledge', { claim_id: claimId }),
    cancel: (claimId: number) =>
      post<{ status: string; message: string }>('/claims/cancel', { claim_id: claimId }),
  },

  notifications: {
    mine: () => get<{ notifications: Notification[] }>('/notifications/mine'),
    markRead: (notificationId: number) =>
      post<{ status: string }>('/notifications/mark_read', { notification_id: notificationId }),
    markAllRead: () =>
      post<{ status: string }>('/notifications/mark_all_read'),
    unreadCount: () =>
      get<{ unread_count: number }>('/notifications/unread_count'),
  },

  system: {
    cleanup: () => post<{ expired_items_removed: number }>('/system/cleanup'),
  },
};
