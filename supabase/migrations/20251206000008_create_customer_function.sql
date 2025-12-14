-- Create Customer Function Migration
-- This migration creates SECURITY DEFINER functions to create and delete customer records
-- These bypass RLS and allow public signup regardless of current session state

-- Function to create a new customer (for signup)
CREATE OR REPLACE FUNCTION public.create_customer(
  _name TEXT,
  _email TEXT,
  _phone TEXT,
  _customer_type TEXT DEFAULT 'new'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id UUID;
BEGIN
  -- Insert customer record
  INSERT INTO public.customers (
    name,
    email,
    phone,
    customer_type
  )
  VALUES (
    _name,
    _email,
    _phone,
    _customer_type
  )
  RETURNING id INTO _customer_id;

  RETURN _customer_id;
END;
$$;

-- Function to delete a customer (for rollback during signup if auth creation fails)
CREATE OR REPLACE FUNCTION public.delete_customer(
  _customer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete customer record (cascade will handle customer_auth deletion)
  DELETE FROM public.customers
  WHERE id = _customer_id;

  RETURN FOUND;
END;
$$;

