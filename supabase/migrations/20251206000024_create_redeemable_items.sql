-- Create Redeemable Items
-- This migration creates tables for managing items that customers can redeem using loyalty points

-- 1. Create redeemable_items table
CREATE TABLE IF NOT EXISTS public.redeemable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('discount', 'coupon', 'product', 'other')),
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  value DECIMAL(10, 2), -- Value of the item (discount amount, wallet credit, etc.)
  value_type TEXT CHECK (value_type IN ('percentage', 'fixed')),
  max_redemptions INTEGER, -- Maximum number of times this item can be redeemed (null = unlimited)
  current_redemptions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redeemable_items_active ON public.redeemable_items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_redeemable_items_category ON public.redeemable_items(category);
CREATE INDEX IF NOT EXISTS idx_redeemable_items_points ON public.redeemable_items(points_required);

-- 2. Create redeemable_items_redemptions table to track customer redemptions
CREATE TABLE IF NOT EXISTS public.redeemable_items_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redeemable_item_id UUID NOT NULL REFERENCES public.redeemable_items(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL CHECK (points_used > 0),
  redemption_code TEXT UNIQUE, -- Unique code for the redeemed item (for coupons/discounts)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- If used in an order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redemptions_customer_id ON public.redeemable_items_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_item_id ON public.redeemable_items_redemptions(redeemable_item_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.redeemable_items_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON public.redeemable_items_redemptions(redemption_code);

-- Enable RLS
ALTER TABLE public.redeemable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemable_items_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for redeemable_items
DROP POLICY IF EXISTS "Anyone can view active redeemable items" ON public.redeemable_items;
DROP POLICY IF EXISTS "Staff can manage redeemable items" ON public.redeemable_items;

CREATE POLICY "Anyone can view active redeemable items"
ON public.redeemable_items FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Staff can manage redeemable items"
ON public.redeemable_items FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- RLS Policies for redeemable_items_redemptions
DROP POLICY IF EXISTS "Customers can view their own redemptions" ON public.redeemable_items_redemptions;
DROP POLICY IF EXISTS "Staff can view all redemptions" ON public.redeemable_items_redemptions;

CREATE POLICY "Customers can view their own redemptions"
ON public.redeemable_items_redemptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = redeemable_items_redemptions.customer_id
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all redemptions"
ON public.redeemable_items_redemptions FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'staff')
);

-- Function to generate unique redemption code
CREATE OR REPLACE FUNCTION generate_redemption_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.redeemable_items_redemptions WHERE redemption_code = code) INTO exists;
    
    -- Exit loop if code doesn't exist
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem an item
CREATE OR REPLACE FUNCTION redeem_item(
  _customer_id UUID,
  _redeemable_item_id UUID
)
RETURNS UUID AS $$
DECLARE
  item_record RECORD;
  customer_points INTEGER;
  redemption_id UUID;
  redemption_code TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get redeemable item details
  SELECT * INTO item_record
  FROM public.redeemable_items
  WHERE id = _redeemable_item_id
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Redeemable item not found or not available';
  END IF;
  
  -- Check max redemptions
  IF item_record.max_redemptions IS NOT NULL 
     AND item_record.current_redemptions >= item_record.max_redemptions THEN
    RAISE EXCEPTION 'Maximum redemptions reached for this item';
  END IF;
  
  -- Get customer points
  SELECT loyalty_points INTO customer_points
  FROM public.customers
  WHERE id = _customer_id;
  
  IF customer_points IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;
  
  IF customer_points < item_record.points_required THEN
    RAISE EXCEPTION 'Insufficient loyalty points';
  END IF;
  
  -- Generate redemption code
  redemption_code := generate_redemption_code();
  
  -- Calculate expiration (30 days from now by default)
  expires_at := NOW() + INTERVAL '30 days';
  
  -- Deduct points from customer
  UPDATE public.customers
  SET loyalty_points = loyalty_points - item_record.points_required
  WHERE id = _customer_id;
  
  -- Record loyalty points transaction
  INSERT INTO public.loyalty_points_transactions (
    customer_id,
    points,
    transaction_type,
    description
  ) VALUES (
    _customer_id,
    -item_record.points_required,
    'redeemed',
    'Redeemed: ' || item_record.name
  );
  
  -- Create redemption record
  INSERT INTO public.redeemable_items_redemptions (
    redeemable_item_id,
    customer_id,
    points_used,
    redemption_code,
    expires_at
  ) VALUES (
    _redeemable_item_id,
    _customer_id,
    item_record.points_required,
    redemption_code,
    expires_at
  ) RETURNING id INTO redemption_id;
  
  -- Update redemption count
  UPDATE public.redeemable_items
  SET current_redemptions = current_redemptions + 1
  WHERE id = _redeemable_item_id;
  
  RETURN redemption_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_redeemable_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_redeemable_items_updated_at
BEFORE UPDATE ON public.redeemable_items
FOR EACH ROW
EXECUTE FUNCTION update_redeemable_items_updated_at();

-- Add comments
COMMENT ON TABLE public.redeemable_items IS 'Items that customers can redeem using loyalty points';
COMMENT ON TABLE public.redeemable_items_redemptions IS 'Tracks customer redemptions of redeemable items';

