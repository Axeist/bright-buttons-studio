-- Customer Data Access Functions Migration
-- This migration creates SECURITY DEFINER functions to allow customers
-- to access their own data and check for existing customers during signup
-- These functions bypass RLS since they run with elevated privileges

-- Function to get customer by ID (for fetching customer data after login/signup)
CREATE OR REPLACE FUNCTION public.get_customer_by_id(_customer_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  loyalty_points INTEGER,
  loyalty_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.loyalty_points,
    c.loyalty_tier
  FROM public.customers c
  WHERE c.id = _customer_id;
END;
$$;

-- Function to check if customer exists by email or phone (for signup validation)
CREATE OR REPLACE FUNCTION public.check_customer_exists(
  _email TEXT,
  _phone TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.email,
    c.phone
  FROM public.customers c
  WHERE c.email = _email OR c.phone = _phone
  LIMIT 1;
END;
$$;

