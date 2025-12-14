-- IMMEDIATE FIX for gen_salt error
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- This will fix the create_customer_auth function that's causing the signup error

-- STEP 1: Check if pgcrypto extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE NOTICE 'pgcrypto extension not found. Attempting to create...';
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      RAISE NOTICE 'pgcrypto extension created successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not create pgcrypto extension. Error: %', SQLERRM;
      RAISE WARNING 'Please enable pgcrypto extension manually via Supabase Dashboard > Database > Extensions';
    END;
  ELSE
    RAISE NOTICE 'pgcrypto extension is already enabled';
  END IF;
END $$;

-- STEP 2: Verify gen_salt function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'gen_salt'
  ) THEN
    RAISE WARNING 'gen_salt function not found in public schema. pgcrypto extension may not be properly installed.';
  ELSE
    RAISE NOTICE 'gen_salt function found - proceeding with function fixes';
  END IF;
END $$;

-- Fix the create_customer_auth function (this is the one causing the error during signup)
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
  -- Generate password hash using pgcrypto functions
  -- These functions are in the public schema when pgcrypto extension is enabled
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

-- Also fix verify_customer_password function
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
  _password_hash TEXT;
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
    SET last_login_at = NOW()
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

-- Fix update_customer_password function
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

  -- Verify old password
  IF crypt(_old_password, _auth_record.password_hash) != _auth_record.password_hash THEN
    RETURN false;
  END IF;

  -- Generate new password hash
  _new_password_hash := crypt(_new_password, gen_salt('bf'));

  -- Update password
  UPDATE public.customer_auth
  SET 
    password_hash = _new_password_hash,
    updated_at = NOW()
  WHERE customer_id = _customer_id;

  RETURN true;
END;
$$;

-- Fix reset_customer_password function
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

  -- Generate new password hash
  _new_password_hash := crypt(_new_password, gen_salt('bf'));

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

