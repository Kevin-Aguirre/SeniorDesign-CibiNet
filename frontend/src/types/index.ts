export interface User {
  id: number;
  email: string;
  role: 'Donor' | 'Recipient';
}

export interface Listing {
  id: number;
  food: string;
  quantity?: string;
  status?: 'available' | 'claimed' | 'expired';
  lat: number;
  lon: number;
  address_text?: string;
  expiry_time?: string;
}

export interface ApiResponse<T = unknown> {
  status?: string;
  error?: string;
  message?: string;
  [key: string]: T | string | undefined;
}
