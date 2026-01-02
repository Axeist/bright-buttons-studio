-- Migrate Customers to Supabase Auth (Part 2)
-- This migration uses the 'customer' enum value that was added in the previous migration
-- IMPORTANT: Run migration 20251206000012_add_customer_enum_value.sql FIRST

-- STEP 1: Ensure customers table has user_id column (may already exist from previous migration)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- STEP 2: Create function to handle customer signup via Supabase Auth
-- This function creates a customer record and assigns the 'customer' role
CREATE OR REPLACE FUNCTION public.handle_customer_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id UUID;
  _full_name TEXT;
  _phone TEXT;
BEGIN
  -- Extract metadata from user signup
  _full_name := NEW.raw_user_meta_data->>'full_name';
  _phone := NEW.raw_user_meta_data->>'phone';
  
  -- Only process if this is a customer signup (has customer metadata)
  -- Staff signups won't have phone in metadata
  IF _phone IS NULL THEN
    -- This might be a staff signup, let the existing handle_new_user trigger handle it
    RETURN NEW;
  END IF;

  -- Check if customer already exists with this email
  SELECT id INTO _customer_id
  FROM public.customers
  WHERE email = NEW.email
  LIMIT 1;

  IF _customer_id IS NULL THEN
    -- Create new customer record (online signup)
    INSERT INTO public.customers (
      user_id,
      name,
      email,
      phone,
      customer_type,
      signup_source
    )
    VALUES (
      NEW.id,
      COALESCE(_full_name, NEW.email),
      NEW.email,
      _phone,
      'new',
      'online'
    )
    RETURNING id INTO _customer_id;
  ELSE
    -- Update existing customer with user_id
    UPDATE public.customers
    SET user_id = NEW.id
    WHERE id = _customer_id;
  END IF;

  -- Assign 'customer' role to the user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Also create profile entry (for consistency)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(_full_name, NEW.email))
  ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

  RETURN NEW;
END;
$$;

-- STEP 3: Create trigger for customer signup
-- This trigger runs after handle_new_user, so we need to be careful about order
DROP TRIGGER IF EXISTS on_customer_auth_user_created ON auth.users;

CREATE TRIGGER on_customer_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'phone' IS NOT NULL)
  EXECUTE FUNCTION public.handle_customer_signup();

-- STEP 4: Create function to check if user is customer
CREATE OR REPLACE FUNCTION public.is_customer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'customer'::app_role
  )
$$;

-- STEP 5: Create function to check if user is staff (admin or staff)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'staff'::app_role)
  )
$$;

-- STEP 6: Update RLS policies for customers table to allow customers to view their own data
DROP POLICY IF EXISTS "Customers can view their own data" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own data" ON public.customers;

CREATE POLICY "Customers can view their own data"
ON public.customers FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Customers can update their own data"
ON public.customers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- STEP 7: Update RLS policies for customer_auth table (deprecated but keep for migration)
-- Allow customers to view their own auth data via user_id
DROP POLICY IF EXISTS "Customers can view their own auth via user_id" ON public.customer_auth;

CREATE POLICY "Customers can view their own auth via user_id"
ON public.customer_auth FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.user_id = auth.uid()
      AND customers.id = customer_auth.customer_id
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- STEP 8: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_customer TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff TO authenticated, anon;

-- Note: The old customer_auth table and functions are kept for backward compatibility
-- but new signups will use Supabase Auth directly

