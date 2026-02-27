-- Add tax_percent to products for per-product tax (0, 5, 12, 18)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS tax_percent integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.products.tax_percent IS 'Tax rate applied to this product: 0, 5, 12, or 18 (percent).';
