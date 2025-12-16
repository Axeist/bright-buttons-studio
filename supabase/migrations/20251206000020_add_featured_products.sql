-- Add Featured Products Feature
-- This migration adds the ability to mark products as featured for display on the landing page

-- Add is_featured column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for better query performance when filtering featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;

-- Add comment to document the column
COMMENT ON COLUMN public.products.is_featured IS 'Indicates if the product should be displayed on the landing page';

