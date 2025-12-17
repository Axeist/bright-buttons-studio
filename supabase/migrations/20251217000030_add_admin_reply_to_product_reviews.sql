-- Add admin reply fields to product reviews
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ;

-- Backfill existing rows with null (no-op for clarity)
UPDATE public.product_reviews
SET admin_reply = admin_reply,
    admin_reply_by = admin_reply_by,
    admin_reply_at = admin_reply_at;

