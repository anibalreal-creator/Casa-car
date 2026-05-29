export type UserRole = 'admin' | 'empresa' | 'vendedor' | 'user';
export type SubscriptionPlan = 'FREE' | 'PRO' | 'BUSINESS' | 'INMOBILIARIA' | 'CONCESIONARIA';
export type ListingStatus = 'draft' | 'active' | 'paused' | 'expired' | 'sold' | 'review';

export interface ListingImage {
  url: string;
  alt?: string;
}

export interface ListingEntity {
  id?: string;
  user_id: string;
  title: string;
  category: string;
  subtype?: string;
  listing_type: string;
  price: number;
  currency: string;
  country?: string;
  state?: string;
  city?: string;
  description?: string;
  images: string[];
  status: ListingStatus;
  is_premium?: boolean;
  highlighted?: boolean;
  premium_until?: string | null;
  seo_slug?: string;
}

export interface ApiListResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
