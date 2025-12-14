-- Customers RLS Policies Migration
-- This migration adds Row Level Security policies for the customers table
-- to allow public signup while maintaining security

-- Enable RLS on customers table (if not already enabled)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can insert customers for signup" ON public.customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can view their own data" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own data" ON public.customers;

-- Allow public and authenticated users to insert new customers (for signup)
-- This is needed for the signup flow where unauthenticated users create accounts
-- Also allows authenticated users (admins/staff) to create customers via POS
-- Removing TO public allows both authenticated and unauthenticated users
CREATE POLICY "Public can insert customers for signup"
ON public.customers FOR INSERT
WITH CHECK (true);

-- Admins can view all customers
CREATE POLICY "Admins can view all customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all customers
CREATE POLICY "Admins can update all customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete customers
CREATE POLICY "Admins can delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Note: For customer self-service (viewing/updating their own data),
-- we would need a way to identify the customer. Since we're using
-- localStorage-based sessions, we'll handle this in the application layer.
-- If you want to add customer self-service policies, you would need to:
-- 1. Create a function that maps customer_id to the current session
-- 2. Use that function in RLS policies
-- For now, admins have full access and public can insert (signup)

