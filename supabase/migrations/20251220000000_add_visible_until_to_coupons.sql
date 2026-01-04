-- Add visible_until field to coupons table
-- This field determines until when the coupon should be visible to customers
-- The coupon expires on expires_at, but may be hidden earlier via visible_until

ALTER TABLE public.coupons
ADD COLUMN IF NOT EXISTS visible_until TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.coupons.visible_until IS 'Date until when the coupon should be visible to customers. The coupon expires on expires_at.';

