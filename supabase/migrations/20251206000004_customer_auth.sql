-- Customer Authentication Migration
-- This migration creates a separate authentication system for customers
-- Management users (admin/staff) continue to use auth.users
-- Customers use the customer_auth table

-- 1. Create customer_auth table for customer authentication
CREATE TABLE IF NOT EXISTS public.customer_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_auth_email ON public.customer_auth(email);
CREATE INDEX IF NOT EXISTS idx_customer_auth_customer_id ON public.customer_auth(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_auth_verification_token ON public.customer_auth(verification_token);
CREATE INDEX IF NOT EXISTS idx_customer_auth_reset_token ON public.customer_auth(reset_token);

-- Enable RLS
ALTER TABLE public.customer_auth ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_auth
-- Note: Customer auth is separate from Supabase auth.users
-- We'll use session-based authentication stored in localStorage on the client side
-- For now, allow public access to customer_auth (we'll handle auth in application layer)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their own auth" ON public.customer_auth;
DROP POLICY IF EXISTS "Public can insert customer auth for new customers" ON public.customer_auth;
DROP POLICY IF EXISTS "Customers can update their own auth" ON public.customer_auth;
DROP POLICY IF EXISTS "Admins can view all customer auth" ON public.customer_auth;

-- Admins can view all customer auth
CREATE POLICY "Admins can view all customer auth"
ON public.customer_auth FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow public signup (for new customer registration)
CREATE POLICY "Public can insert customer auth for new customers"
ON public.customer_auth FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to verify password (for login)
-- This is handled by the verify_customer_password function which is SECURITY DEFINER

-- Function to hash password (using pgcrypto extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to verify customer password
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

  -- Verify password
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

-- Function to create customer auth (for signup)
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
  -- Generate password hash
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

-- Function to update customer password
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

-- Function to reset customer password
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

-- Function to generate password reset token
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

-- Function to verify email
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

-- Trigger to update updated_at
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_customer_auth_updated_at ON public.customer_auth;

CREATE TRIGGER update_customer_auth_updated_at
BEFORE UPDATE ON public.customer_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove user_id from customers table for new customer signups
-- Keep it for backward compatibility with existing customers
-- New customers will only use customer_auth, not auth.users
