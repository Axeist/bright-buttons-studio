-- Fix Customers RLS Insert Policy
-- The original policy only allowed TO public, which doesn't work when
-- there's an authenticated session. This migration updates the policy
-- to allow inserts from all roles (both authenticated and unauthenticated).

-- Drop the existing policy
DROP POLICY IF EXISTS "Public can insert customers for signup" ON public.customers;

-- Recreate the policy without TO public restriction
-- This allows both authenticated and unauthenticated users to insert
-- (needed for signup flow and POS customer creation)
CREATE POLICY "Public can insert customers for signup"
ON public.customers FOR INSERT
WITH CHECK (true);

