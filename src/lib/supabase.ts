import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database Interface definitions matching Supabase Schema
export interface SupabaseCategory {
  id: string; // UUID
  name: string;
  image_url: string | null;
  created_at: string;
}

export interface SupabaseProduct {
  id: string; // UUID
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null; // UUID
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  categories?: SupabaseCategory | null;
}

export interface SupabaseCustomer {
  id: string; // UUID
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface SupabaseOrder {
  id: string; // UUID
  customer_id: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_address: string | null;
  created_at: string;
}

export interface SupabaseOrderItem {
  id: string; // UUID
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  products?: SupabaseProduct | null;
}

export interface SupabaseCartItem {
  id: string; // UUID
  customer_id: string | null;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: SupabaseProduct | null;
}

export interface SupabaseReview {
  id: string; // UUID
  product_id: string;
  customer_name: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface SupabaseContactMessage {
  id: string; // UUID
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

export interface SupabaseOffer {
  id: string; // UUID
  title: string;
  description: string | null;
  discount_percentage: number;
  image_url: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: SupabaseCategory;
        Insert: Omit<SupabaseCategory, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseCategory, 'id'>>;
      };
      products: {
        Row: SupabaseProduct;
        Insert: Omit<SupabaseProduct, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseProduct, 'id'>>;
      };
      customers: {
        Row: SupabaseCustomer;
        Insert: Omit<SupabaseCustomer, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseCustomer, 'id'>>;
      };
      orders: {
        Row: SupabaseOrder;
        Insert: Omit<SupabaseOrder, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseOrder, 'id'>>;
      };
      order_items: {
        Row: SupabaseOrderItem;
        Insert: Omit<SupabaseOrderItem, 'id'> & { id?: string };
        Update: Partial<Omit<SupabaseOrderItem, 'id'>>;
      };
      cart_items: {
        Row: SupabaseCartItem;
        Insert: Omit<SupabaseCartItem, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseCartItem, 'id'>>;
      };
      reviews: {
        Row: SupabaseReview;
        Insert: Omit<SupabaseReview, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseReview, 'id'>>;
      };
      contact_messages: {
        Row: SupabaseContactMessage;
        Insert: Omit<SupabaseContactMessage, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseContactMessage, 'id'>>;
      };
      offers: {
        Row: SupabaseOffer;
        Insert: Omit<SupabaseOffer, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SupabaseOffer, 'id'>>;
      };
    };
  };
}

// Fallback dummy credentials when not configured yet to prevent crash during initialization
const FALLBACK_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

// Retrieve credentials from environment variables or custom storage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const storageUrl = typeof window !== 'undefined' ? localStorage.getItem('freshsip_supabase_url') : null;
  const storageKey = typeof window !== 'undefined' ? localStorage.getItem('freshsip_supabase_anon_key') : null;

  const url = (storageUrl && storageUrl.trim() !== '') ? storageUrl.trim() : (envUrl && envUrl.trim() !== '' ? envUrl.trim() : '');
  const key = (storageKey && storageKey.trim() !== '') ? storageKey.trim() : (envKey && envKey.trim() !== '' ? envKey.trim() : '');

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('YOUR_SUPABASE_PROJECT_URL') &&
    !url.includes('placeholder-project') &&
    !key.includes('YOUR_SUPABASE_PUBLISHABLE_KEY') &&
    url.startsWith('https://')
  );

  return {
    url: isConfigured ? url : FALLBACK_URL,
    key: isConfigured ? key : FALLBACK_KEY,
    rawUrl: url,
    rawKey: key,
    isConfigured,
  };
}

const creds = getSupabaseCredentials();

// Single reusable client instance
export const supabase: SupabaseClient<any> = createClient<any>(
  creds.url,
  creds.key,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().isConfigured;
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('freshsip_supabase_url', url.trim());
    localStorage.setItem('freshsip_supabase_anon_key', key.trim());
    window.location.reload();
  }
}

export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('freshsip_supabase_url');
    localStorage.removeItem('freshsip_supabase_anon_key');
    window.location.reload();
  }
}

/**
 * Diagnostic test for Supabase connection
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  const { isConfigured, url } = getSupabaseCredentials();
  if (!isConfigured) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are not configured yet. Configure them in .env or via the Connection Manager.',
    };
  }

  try {
    const { data, error } = await supabase.from('categories').select('id, name').limit(1);
    if (error) {
      return {
        success: false,
        message: `Connected to ${url} but query failed: ${error.message} (Code: ${error.code})`,
        details: error,
      };
    }
    return {
      success: true,
      message: `Successfully connected to Supabase database! Found ${data?.length || 0} initial categories.`,
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to reach Supabase: ${err.message || 'Network error'}`,
      details: err,
    };
  }
}

/**
 * Upload an image to Supabase Storage bucket 'product-images'
 */
export async function uploadProductImage(file: File): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { url: null, error: 'Supabase storage is not configured' };
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { url: null, error: 'Only JPG, PNG, WEBP, or GIF image files are allowed.' };
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'File size must be under 5MB.' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `juice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Failed to upload image to Supabase' };
  }
}
