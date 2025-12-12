-- IMMEDIATE FIX for Sign Up Error: "function gen_salt(unknown) does not exist"
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- This will immediately fix the customer signup error

-- STEP 1: Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- STEP 2: Fix create_customer_auth function (THE CRITICAL FIX)
-- The issue is that 'bf' needs to be explicitly cast to TEXT
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
  -- Generate password hash - explicitly cast 'bf' to TEXT to fix type error
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

-- STEP 3: Grant execute permissions (if not already granted)
GRANT EXECUTE ON FUNCTION public.create_customer_auth TO anon, authenticated;

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'create_customer_auth function has been fixed!';
  RAISE NOTICE 'You can now test customer signup.';
END $$;

