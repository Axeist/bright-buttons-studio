-- QUICK FIX - Run this in Supabase SQL Editor RIGHT NOW
-- This will immediately fix the signup error

-- Enable pgcrypto extension (if not already enabled)
-- If this fails, go to Supabase Dashboard > Database > Extensions and enable "pgcrypto" manually
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix the create_customer_auth function (THE CRITICAL FIX)
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
  -- Generate password hash - gen_salt and crypt are from pgcrypto extension
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

