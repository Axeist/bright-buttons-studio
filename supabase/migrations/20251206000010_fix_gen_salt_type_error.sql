-- Fix gen_salt Type Error Migration
-- This migration fixes the "function gen_salt(unknown) does not exist" error
-- by explicitly casting the parameter to TEXT type

-- Ensure pgcrypto extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- Fix create_customer_auth function with explicit type casting
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
  -- The 'bf' parameter must be explicitly cast to TEXT to avoid "unknown" type error
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

-- Fix update_customer_password function with explicit type casting
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

-- Fix reset_customer_password function with explicit type casting
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_customer_auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_customer_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_customer_password TO anon, authenticated;

