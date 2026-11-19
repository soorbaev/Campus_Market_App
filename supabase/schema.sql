-- CampusMarket KG — Supabase PostgreSQL Schema & Storage Setup
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  university TEXT NOT NULL,
  major TEXT NOT NULL,
  manner_temp NUMERIC(4,1) NOT NULL DEFAULT 98.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  retail_price INTEGER,
  category TEXT NOT NULL,
  university TEXT DEFAULT 'KNU',
  condition TEXT DEFAULT 'mint',
  safe_zone TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  seller_major TEXT NOT NULL,
  students_only BOOLEAN NOT NULL DEFAULT true,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update product likes/views or own products"
  ON public.products FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- 3. Meetup Requests table
CREATE TABLE IF NOT EXISTS public.meetup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name TEXT NOT NULL,
  safe_zone TEXT NOT NULL,
  proposed_time TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'MBank',
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.meetup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meetup requests"
  ON public.meetup_requests FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create meetup requests"
  ON public.meetup_requests FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Involved users can update meetup request status"
  ON public.meetup_requests FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 4. Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
