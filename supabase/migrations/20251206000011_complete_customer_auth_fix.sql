-- Complete Customer Authentication System Fix
-- This migration consolidates and fixes all customer authentication functions
-- It ensures proper type casting for gen_salt and includes all required functions

-- STEP 1: Ensure pgcrypto extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    RAISE NOTICE 'pgcrypto extension enabled';
  ELSE
    RAISE NOTICE 'pgcrypto extension already exists';
  END IF;
END $$;

-- STEP 2: Fix create_customer_auth function with explicit type casting
-- This is the critical fix for the "function gen_salt(unknown) does not exist" error
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
  -- Generate password hash using pgcrypto functions with explicit type casting
  -- The 'bf' parameter MUST be explicitly cast to TEXT to avoid "unknown" type error
  _password_hash := crypt(_password, gen_salt('bf'::text));

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
SET search_path = public
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

-- STEP 4: Fix update_customer_password function with explicit type casting
CREATE OR REPLACE FUNCTION public.update_customer_password(
  _customer_id UUID,
  _old_password TEXT,
  _new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_record RECORD;
  _new_password_hash TEXT;
BEGIN
  -- Get the auth record
  SELECT * INTO _auth_record
  FROM public.customer_auth
  WHERE customer_id = _customer_id;

  -- If no record found, return false
  IF _auth_record IS NULL THEN
    RETURN false;
  END IF;

  -- Verify old password using crypt
  IF crypt(_old_password, _auth_record.password_hash) != _auth_record.password_hash THEN
    RETURN false;
  END IF;

  -- Generate new password hash with explicit type casting
  _new_password_hash := crypt(_new_password, gen_salt('bf'::text));

  -- Update password
  UPDATE public.customer_auth
  SET 
    password_hash = _new_password_hash,
    updated_at = NOW()
  WHERE customer_id = _customer_id;

  RETURN true;
END;
$$;

-- STEP 5: Fix reset_customer_password function with explicit type casting
CREATE OR REPLACE FUNCTION public.reset_customer_password(
  _email TEXT,
  _new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_record RECORD;
  _new_password_hash TEXT;
BEGIN
  -- Get the auth record
  SELECT * INTO _auth_record
  FROM public.customer_auth
  WHERE email = _email;

  -- If no record found, return false
  IF _auth_record IS NULL THEN
    RETURN false;
  END IF;

  -- Check if reset token is valid
  IF _auth_record.reset_token IS NULL OR 
     _auth_record.reset_token_expires_at IS NULL OR
     _auth_record.reset_token_expires_at < NOW() THEN
    RETURN false;
  END IF;

  -- Generate new password hash with explicit type casting
  _new_password_hash := crypt(_new_password, gen_salt('bf'::text));

  -- Update password and clear reset token
  UPDATE public.customer_auth
  SET 
    password_hash = _new_password_hash,
    reset_token = NULL,
    reset_token_expires_at = NULL,
    updated_at = NOW()
  WHERE email = _email;

  RETURN true;
END;
$$;

-- STEP 6: Ensure create_customer function exists (for signup)
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

-- STEP 7: Ensure delete_customer function exists (for rollback)
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

-- STEP 8: Ensure get_customer_by_id function exists (for fetching customer data)
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

-- STEP 9: Ensure check_customer_exists function exists (for signup validation)
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

-- STEP 10: Ensure generate_password_reset_token function exists
CREATE OR REPLACE FUNCTION public.generate_password_reset_token(
  _email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reset_token TEXT;
BEGIN
  -- Generate reset token
  _reset_token := encode(gen_random_bytes(32), 'hex');

  -- Update auth record with reset token
  UPDATE public.customer_auth
  SET 
    reset_token = _reset_token,
    reset_token_expires_at = NOW() + INTERVAL '1 hour',
    updated_at = NOW()
  WHERE email = _email;

  RETURN _reset_token;
END;
$$;

-- STEP 11: Ensure verify_customer_email function exists
CREATE OR REPLACE FUNCTION public.verify_customer_email(
  _verification_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update email_verified and clear verification_token
  UPDATE public.customer_auth
  SET 
    email_verified = true,
    verification_token = NULL,
    updated_at = NOW()
  WHERE verification_token = _verification_token
    AND email_verified = false;

  -- Return true if any rows were updated
  RETURN FOUND;
END;
$$;

-- STEP 12: Grant execute permissions to all functions
GRANT EXECUTE ON FUNCTION public.create_customer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_customer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_customer_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_customer_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_customer_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_by_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_customer_exists TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_password_reset_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_customer_email TO anon, authenticated;

-- Verification message
DO $$
BEGIN
  RAISE NOTICE 'Customer authentication system has been completely fixed!';
  RAISE NOTICE 'All functions now use proper type casting for gen_salt';
  RAISE NOTICE 'You can now test customer signup and login.';
END $$;

