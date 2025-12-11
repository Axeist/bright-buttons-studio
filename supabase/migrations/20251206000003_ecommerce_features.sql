-- E-commerce Features Migration
-- This migration adds shopping cart, customer addresses, loyalty points, order tracking, wishlist, and reviews

-- 1. Update customers table to link with auth.users
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum'));

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- 2. Remove WhatsApp fields from orders (keep for backward compatibility but mark as deprecated)
-- We'll keep whatsapp_message_id but it won't be used for new orders

-- 3. Create customer_addresses table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('home', 'work', 'other')) DEFAULT 'home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_addresses
-- Note: Customer auth is separate from Supabase auth.users
-- We allow public access and handle authorization in application layer

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can insert their own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can update their own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can delete their own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Public can manage addresses" ON public.customer_addresses;

-- Admins can view all addresses
CREATE POLICY "Admins can view all addresses"
ON public.customer_addresses FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow public to insert/update/delete (handled by application layer)
CREATE POLICY "Public can manage addresses"
ON public.customer_addresses FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Create shopping_cart table
CREATE TABLE IF NOT EXISTS public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, size)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON public.shopping_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_customer_id ON public.shopping_cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_product_id ON public.shopping_cart(product_id);

-- Enable RLS
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_cart
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cart" ON public.shopping_cart;
DROP POLICY IF EXISTS "Users can insert into their own cart" ON public.shopping_cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.shopping_cart;
DROP POLICY IF EXISTS "Users can delete from their own cart" ON public.shopping_cart;
DROP POLICY IF EXISTS "Admins can view all carts" ON public.shopping_cart;

CREATE POLICY "Users can view their own cart"
ON public.shopping_cart FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own cart"
ON public.shopping_cart FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
ON public.shopping_cart FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart"
ON public.shopping_cart FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all carts"
ON public.shopping_cart FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON public.wishlist(product_id);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.wishlist;

CREATE POLICY "Users can view their own wishlist"
ON public.wishlist FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
ON public.wishlist FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
ON public.wishlist FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Create loyalty_points_transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON public.loyalty_points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_order_id ON public.loyalty_points_transactions(order_id);

-- Enable RLS
ALTER TABLE public.loyalty_points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_points_transactions
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view their own loyalty transactions" ON public.loyalty_points_transactions;
DROP POLICY IF EXISTS "Admins can view all loyalty transactions" ON public.loyalty_points_transactions;
DROP POLICY IF EXISTS "System can insert loyalty transactions" ON public.loyalty_points_transactions;

CREATE POLICY "Customers can view their own loyalty transactions"
ON public.loyalty_points_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.customers WHERE id = loyalty_points_transactions.customer_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all loyalty transactions"
ON public.loyalty_points_transactions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert loyalty transactions"
ON public.loyalty_points_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. Create order_tracking table
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  location TEXT,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at);

-- Enable RLS
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_tracking
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view tracking for their orders" ON public.order_tracking;
DROP POLICY IF EXISTS "Admins can view all order tracking" ON public.order_tracking;
DROP POLICY IF EXISTS "Admins can insert order tracking" ON public.order_tracking;
DROP POLICY IF EXISTS "Admins can update order tracking" ON public.order_tracking;

CREATE POLICY "Customers can view tracking for their orders"
ON public.order_tracking FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_tracking.order_id 
  AND (orders.customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()))
));

CREATE POLICY "Admins can view all order tracking"
ON public.order_tracking FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert order tracking"
ON public.order_tracking FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update order tracking"
ON public.order_tracking FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON public.product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved) WHERE is_approved = true;

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_reviews
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can update all reviews" ON public.product_reviews;

CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews FOR SELECT
TO public
USING (is_approved = true);

CREATE POLICY "Users can view their own reviews"
ON public.product_reviews FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.customers WHERE id = product_reviews.customer_id AND user_id = auth.uid()
));

CREATE POLICY "Users can insert their own reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.customers WHERE id = product_reviews.customer_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their own reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.customers WHERE id = product_reviews.customer_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all reviews"
ON public.product_reviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Add triggers for updated_at
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON public.customer_addresses;
DROP TRIGGER IF EXISTS update_shopping_cart_updated_at ON public.shopping_cart;
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;

CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_cart_updated_at
BEFORE UPDATE ON public.shopping_cart
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Function to update loyalty tier based on points
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers
  SET loyalty_tier = CASE
    WHEN loyalty_points >= 10000 THEN 'platinum'
    WHEN loyalty_points >= 5000 THEN 'gold'
    WHEN loyalty_points >= 2000 THEN 'silver'
    ELSE 'bronze'
  END
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update loyalty tier
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_loyalty_tier_trigger ON public.customers;

CREATE TRIGGER update_loyalty_tier_trigger
AFTER UPDATE OF loyalty_points ON public.customers
FOR EACH ROW
WHEN (OLD.loyalty_points IS DISTINCT FROM NEW.loyalty_points)
EXECUTE FUNCTION public.update_loyalty_tier();

-- 11. Function to ensure only one default address per customer
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.customer_addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to ensure single default address
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON public.customer_addresses;

CREATE TRIGGER ensure_single_default_address_trigger
BEFORE INSERT OR UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_address();

-- 12. Add shipping_address_id to orders for better address management
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES public.customer_addresses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id ON public.orders(shipping_address_id);

-- 13. Function to auto-create order tracking entries
CREATE OR REPLACE FUNCTION public.create_order_tracking_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT operations, always create a tracking entry
  -- For UPDATE operations, only create if status changed
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_tracking (order_id, status, message, created_by)
    VALUES (
      NEW.id,
      NEW.status::TEXT,
      'Order created with status ' || NEW.status::TEXT,
      NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_tracking (order_id, status, message, created_by)
    VALUES (
      NEW.id,
      NEW.status::TEXT,
      'Order status updated to ' || NEW.status::TEXT,
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create tracking entry on order status change
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_order_tracking_trigger ON public.orders;

CREATE TRIGGER create_order_tracking_trigger
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_order_tracking_entry();
