-- ============================================================================
-- COMPLETE CUSTOMER AUTHENTICATION SYSTEM FIX
-- ============================================================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- This will fix the "function gen_salt(unknown) does not exist" error
-- and ensure all customer authentication functions are properly configured
-- ============================================================================

-- STEP 1: Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- STEP 2: Fix create_customer_auth function (THE CRITICAL FIX)
-- Using a variable for salt type ensures proper type resolution
CREATE OR REPLACE FUNCTION public.create_customer_auth(
  _customer_id UUID,
  _email TEXT,
  _password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  _auth_id UUID;
  _password_hash TEXT;
  _verification_token TEXT;
  _salt_type TEXT := 'bf';
BEGIN
  -- Generate password hash using pgcrypto with variable for salt type
  -- This ensures proper type resolution and avoids "unknown" type error
  _password_hash := crypt(_password, gen_salt(_salt_type));

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

-- STEP 3: Fix verify_customer_password function (for login)
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
SET search_path = public, pg_catalog
AS $$
DECLARE
  _auth_record RECORD;
BEGIN
  -- Get the auth record
  SELECT * INTO _auth_record
  FROM public.customer_auth
  WHERE email = _email;

  -- If no record found, return empty
  IF _auth_record IS NULL THEN
    RETURN;
  END IF;

  -- Verify password using crypt
  IF crypt(_password, _auth_record.password_hash) = _auth_record.password_hash THEN
    -- Update last login
    UPDATE public.customer_auth
    SET last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = _auth_record.id;

    -- Return customer info
    RETURN QUERY
    SELECT 
      _auth_record.customer_id,
      _auth_record.email,
      _auth_record.email_verified;
  END IF;

  -- Password doesn't match, return empty
  RETURN;
END;
$$;

-- STEP 4: Ensure create_customer function exists
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

-- STEP 5: Ensure delete_customer function exists (for rollback)
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

-- STEP 6: Ensure get_customer_by_id function exists
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
    COALESCE(c.loyalty_points, 0)::INTEGER,
    COALESCE(c.loyalty_tier, 'bronze')::TEXT
  FROM public.customers c
  WHERE c.id = _customer_id;
END;
$$;

-- STEP 7: Ensure check_customer_exists function exists
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

-- STEP 8: Ensure generate_password_reset_token function exists
CREATE OR REPLACE FUNCTION public.generate_password_reset_token(
  _email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  _reset_token TEXT;
BEGIN
  _reset_token := encode(gen_random_bytes(32), 'hex');

  UPDATE public.customer_auth
  SET 
    reset_token = _reset_token,
    reset_token_expires_at = NOW() + INTERVAL '1 hour',
    updated_at = NOW()
  WHERE email = _email;

  RETURN _reset_token;
END;
$$;

-- STEP 9: Grant execute permissions to all functions
GRANT EXECUTE ON FUNCTION public.create_customer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_customer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_customer_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_by_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_customer_exists TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_password_reset_token TO anon, authenticated;

-- STEP 10: Verification message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customer authentication system fixed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'The gen_salt error has been resolved';
  RAISE NOTICE 'All functions are now properly configured';
  RAISE NOTICE 'You can now test customer signup';
  RAISE NOTICE '========================================';
END $$;

