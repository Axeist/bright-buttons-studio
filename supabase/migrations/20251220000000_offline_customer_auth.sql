-- Migration: Offline Customer Auth and Email
-- This migration creates a function to send sign-in email to offline customers
-- Note: Auth user creation is handled client-side via supabase.auth.signUp

-- Function to send offline customer sign-in email
-- This is a placeholder - actual email sending is handled by Supabase Auth
-- The email template should be customized in Supabase Dashboard to include default password
CREATE OR REPLACE FUNCTION public.send_offline_customer_signin_email(
  p_email TEXT,
  p_name TEXT,
  p_default_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is called after the auth user is created client-side
  -- The actual email is sent by Supabase Auth when signUp is called
  -- We can use this function to log or perform additional actions if needed
  
  -- For now, just return success
  -- The email template in Supabase Dashboard should be customized to include:
  -- - Default password: {{ .Data.default_password }}
  -- - Instructions to reset password in My Profile page
  
  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.send_offline_customer_signin_email TO authenticated;

