export interface User {
  user_id: number;
  username: string;
  email: string;
  role: 'Donor' | 'Recipient' | 'Admin';
  is_verified: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  created_at: string;
}

export interface Listing {
  id: number;
  food: string;
  quantity: string;
  lat: number;
  lon: number;
  expiry_time: string;
  image_url?: string;
}

export interface ListingDetail {
  listing_id: number;
  food_type: string;
  quantity: string;
  status: 'available' | 'claimed' | 'expired';
  address_text: string;
  expiry_time: string;
  image_url?: string;
}

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
  is_read: boolean;
  sent_at: string;
}

export interface ApiResponse<T = unknown> {
  status?: string;
  error?: string;
  message?: string;
  [key: string]: T | string | undefined;
}

export interface ClaimDispute {
  dispute_id: number;
  claim_id: number;
  reporter_id: number;
  reporter_email: string | null;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewed' | 'resolved' | 'rejected';
  resolution_note: string | null;
  reviewed_by: number | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface SuspiciousActivity {
  activity_id: number;
  user_id: number | null;
  user_email: string | null;
  claim_id: number | null;
  activity_type: string;
  severity: 'low' | 'medium' | 'high';
  details: string | null;
  status: 'open' | 'reviewed' | 'dismissed';
  reviewed_by: number | null;
  review_note: string | null;
  detected_at: string;
  reviewed_at: string | null;
}
