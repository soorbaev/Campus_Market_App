import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type UniversityCode = 'KNU' | 'AUCA' | 'Manas University' | 'KRSU';

export type CategoryKey = 'All' | 'Textbooks' | 'Electronics' | 'Dorm/Living' | 'Clothing';

export type ConditionKey = 'mint' | 'great' | 'good' | 'used';

export interface Profile {
  id: string;
  email: string;
  nickname: string;
  university: UniversityCode | string;
  major: string;
  manner_temp: number;
  created_at?: string;
}

export interface Product {
  id: string;
  seller_id?: string | null;
  title: string;
  title_en?: string;
  price: number;
  retail_price?: number | null;
  category: Exclude<CategoryKey, 'All'> | string;
  university?: UniversityCode | string;
  condition?: ConditionKey | string;
  safe_zone: string;
  safe_zone_en?: string;
  description: string;
  description_en?: string;
  subtitle?: string;
  subtitle_en?: string;
  badge?: string;
  badge_en?: string;
  image_url: string;
  seller_name: string;
  seller_major: string;
  students_only?: boolean;
  likes: number;
  views: number;
  created_at?: string;
  is_seed?: boolean;
}

export interface MeetupRequest {
  id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  buyer_id: string;
  buyer_name: string;
  seller_id?: string | null;
  seller_name: string;
  safe_zone: string;
  proposed_time: string;
  payment_method: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at?: string;
}
