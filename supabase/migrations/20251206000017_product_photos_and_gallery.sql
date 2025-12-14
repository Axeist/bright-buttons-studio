-- Product Photos and Gallery Migration
-- This migration creates tables for multiple product photos and gallery management

-- 1. Create product_photos table (multiple photos per product)
CREATE TABLE IF NOT EXISTS public.product_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_photos_product_id ON public.product_photos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_photos_display_order ON public.product_photos(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_photos_is_primary ON public.product_photos(product_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.product_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_photos
DROP POLICY IF EXISTS "Public can view product photos" ON public.product_photos;
DROP POLICY IF EXISTS "Authenticated users can manage product photos" ON public.product_photos;

CREATE POLICY "Public can view product photos"
ON public.product_photos FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage product photos"
ON public.product_photos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Create gallery_photos table (gallery management)
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  image_path TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_photos_display_order ON public.gallery_photos(display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_is_featured ON public.gallery_photos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_gallery_photos_category ON public.gallery_photos(category);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_created_at ON public.gallery_photos(created_at DESC);

-- Enable RLS
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_photos
DROP POLICY IF EXISTS "Public can view gallery photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Authenticated users can manage gallery photos" ON public.gallery_photos;

CREATE POLICY "Public can view gallery photos"
ON public.gallery_photos FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage gallery photos"
ON public.gallery_photos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_product_photos_updated_at ON public.product_photos;
CREATE TRIGGER update_product_photos_updated_at
    BEFORE UPDATE ON public.product_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gallery_photos_updated_at ON public.gallery_photos;
CREATE TRIGGER update_gallery_photos_updated_at
    BEFORE UPDATE ON public.gallery_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

