export interface User {
  user_id: number;
  email: string;
  role: 'Donor' | 'Recipient';
  created_at: string;
}

// Shape returned by GET /api/listings/nearby (ListingMapSchema)
export interface Listing {
  id: number;
  food: string;
  quantity: string;
  lat: number;
  lon: number;
  expiry_time: string;
}

// Shape returned by GET /api/users/my_listings (ListingSchema)
export interface ListingDetail {
  listing_id: number;
  food_type: string;
  quantity: string;
  status: 'available' | 'claimed' | 'expired';
  address_text: string;
  expiry_time: string;
}

// Shape returned by GET /api/claims/* (ClaimSchema)
export interface Claim {
  claim_id: number;
  coordination_id: string;
  listing_id: number;
  food_type: string;
  quantity: string;
  address: string;
  logistics_type: string;
  external_ref_id: string | null;
  safety_ack_received: boolean;
  claimed_at: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  sent_at: string;
}

export interface ApiResponse<T = unknown> {
  status?: string;
  error?: string;
  message?: string;
  [key: string]: T | string | undefined;
}
