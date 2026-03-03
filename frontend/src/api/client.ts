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
      request<{ status: string; user: { id: number; email: string; role: string } }>('/auth/login', { email, password }),

    logout: () => request<{ status: string }>('/auth/logout'),

    checkStatus: () =>
      request<{ logged_in: boolean; user_id?: number }>('/auth/check_status'),
  },

  listings: {
    nearby: (lat: number, lon: number) =>
      request<{ listings: Array<{ id: number; food: string; lat: number; lon: number }> }>('/listings/nearby', { lat, lon }),

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
      request<{ status: string; logistics_packet: { address: string } }>('/listings/claim', {
        listing_id: listingId,
        logistics_type: logisticsType,
      }),
  },

  system: {
    status: () => request<{ version: string; status: string }>(''),
  },
};
