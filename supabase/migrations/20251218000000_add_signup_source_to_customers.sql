-- Add signup_source field to customers table
-- This field tracks whether a customer signed up online (via website) or offline (via POS)

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS signup_source TEXT CHECK (signup_source IN ('online', 'offline')) DEFAULT 'online';

-- Create index for signup_source
CREATE INDEX IF NOT EXISTS idx_customers_signup_source ON public.customers(signup_source);

-- Update existing customers to be marked as 'online' (they signed up via website)
UPDATE public.customers 
SET signup_source = 'online' 
WHERE signup_source IS NULL;

