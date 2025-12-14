-- COMPLETE FIX - Run this ENTIRE script in Supabase SQL Editor
-- This creates ALL required functions for customer signup

-- STEP 1: Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- STEP 2: Create create_customer function (if it doesn't exist)
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

-- STEP 3: Create delete_customer function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.delete_customer(
  _customer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.customers
  WHERE id = _customer_id;

  RETURN FOUND;
END;
$$;

-- STEP 4: Create create_customer_auth function (THE CRITICAL ONE - THIS IS MISSING!)
CREATE OR REPLACE FUNCTION public.create_customer_auth(
  _customer_id UUID,
  _email TEXT,
  _password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_id UUID;
  _password_hash TEXT;
  _verification_token TEXT;
BEGIN
  -- Generate password hash using pgcrypto
  _password_hash := crypt(_password, gen_salt('bf'));

  -- Generate verification token
  _verification_token := encode(gen_random_bytes(32), 'hex');

  -- Insert auth record
  INSERT INTO public.customer_auth (
    customer_id,
    email,
    password_hash,
    verification_token
  )
  VALUES (
    _customer_id,
    _email,
    _password_hash,
    _verification_token
  )
  RETURNING id INTO _auth_id;

  RETURN _auth_id;
END;
$$;

-- STEP 5: Create verify_customer_password function (for login)
CREATE OR REPLACE FUNCTION public.verify_customer_password(
  _email TEXT,
  _password TEXT
)
RETURNS TABLE (
  customer_id UUID,
  email TEXT,
  email_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_record RECORD;
BEGIN
  SELECT * INTO _auth_record
  FROM public.customer_auth
  WHERE email = _email;

  IF _auth_record IS NULL THEN
    RETURN;
  END IF;

  IF crypt(_password, _auth_record.password_hash) = _auth_record.password_hash THEN
    UPDATE public.customer_auth
    SET last_login_at = NOW()
    WHERE id = _auth_record.id;

    RETURN QUERY
    SELECT 
      _auth_record.customer_id,
      _auth_record.email,
      _auth_record.email_verified;
  END IF;

  RETURN;
END;
$$;

-- STEP 6: Grant execute permissions to make functions accessible via RPC
GRANT EXECUTE ON FUNCTION public.create_customer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_customer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_customer_password TO anon, authenticated;

-- Verify functions were created
DO $$
BEGIN
  RAISE NOTICE 'All functions created successfully!';
  RAISE NOTICE 'You can now test customer signup.';
END $$;

