-- Create a function to set up the initial admin (to be called after creating the user in Auth dashboard)
-- This function allows service role to assign admin role
CREATE OR REPLACE FUNCTION public.setup_initial_admin(admin_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the user ID from profiles
  SELECT id INTO admin_user_id FROM public.profiles WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Insert admin role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;