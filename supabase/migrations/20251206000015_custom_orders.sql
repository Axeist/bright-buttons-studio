-- Custom Orders Migration
-- This migration creates tables for custom made-to-order requests in the handcrafted fashion platform

-- 1. Create custom_orders table
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Product Details
  product_type TEXT NOT NULL,
  preferred_fabrics TEXT[],
  intended_occasion TEXT,
  color_preferences TEXT,
  size_requirements TEXT,
  
  -- Design & Requirements
  design_instructions TEXT NOT NULL,
  special_requirements TEXT,
  
  -- Budget & Timeline
  budget_range TEXT NOT NULL CHECK (budget_range IN ('under-5000', '5000-10000', '10000-20000', '20000-50000', 'above-50000', 'flexible')),
  expected_delivery_timeline TEXT NOT NULL CHECK (expected_delivery_timeline IN ('1-2-weeks', '2-4-weeks', '1-2-months', '2-3-months', 'flexible')),
  
  -- Status & Workflow
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_discussion', 'quote_sent', 'quote_accepted', 'quote_rejected', 'in_production', 'ready', 'delivered', 'cancelled')),
  
  -- Pricing & Payment
  estimated_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  
  -- Timeline Tracking
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discussion_started_at TIMESTAMP WITH TIME ZONE,
  production_started_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_completion_date DATE,
  
  -- Admin Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_orders_user_id ON public.custom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_id ON public.custom_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_order_number ON public.custom_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_custom_orders_assigned_to ON public.custom_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_custom_orders_created_at ON public.custom_orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_orders
DROP POLICY IF EXISTS "Users can view their own custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users can create their own custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users can update their own custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Admins can view all custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Admins can update all custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Assigned staff can view assigned custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Assigned staff can update assigned custom orders" ON public.custom_orders;

CREATE POLICY "Users can view their own custom orders"
ON public.custom_orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom orders"
ON public.custom_orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom orders"
ON public.custom_orders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'submitted'); -- Only allow updates when status is submitted

CREATE POLICY "Admins can view all custom orders"
ON public.custom_orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all custom orders"
ON public.custom_orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned staff can view assigned custom orders"
ON public.custom_orders FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Assigned staff can update assigned custom orders"
ON public.custom_orders FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

-- 2. Create custom_order_images table for reference images
CREATE TABLE IF NOT EXISTS public.custom_order_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_order_images_order_id ON public.custom_order_images(custom_order_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_images_display_order ON public.custom_order_images(custom_order_id, display_order);

-- Enable RLS
ALTER TABLE public.custom_order_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_order_images
DROP POLICY IF EXISTS "Users can view images of their custom orders" ON public.custom_order_images;
DROP POLICY IF EXISTS "Users can add images to their custom orders" ON public.custom_order_images;
DROP POLICY IF EXISTS "Admins can view all custom order images" ON public.custom_order_images;
DROP POLICY IF EXISTS "Assigned staff can view assigned custom order images" ON public.custom_order_images;

CREATE POLICY "Users can view images of their custom orders"
ON public.custom_order_images FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.custom_orders 
  WHERE custom_orders.id = custom_order_images.custom_order_id 
  AND custom_orders.user_id = auth.uid()
));

CREATE POLICY "Users can add images to their custom orders"
ON public.custom_order_images FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.custom_orders 
  WHERE custom_orders.id = custom_order_images.custom_order_id 
  AND custom_orders.user_id = auth.uid()
  AND custom_orders.status = 'submitted'
));

CREATE POLICY "Admins can view all custom order images"
ON public.custom_order_images FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned staff can view assigned custom order images"
ON public.custom_order_images FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.custom_orders 
  WHERE custom_orders.id = custom_order_images.custom_order_id 
  AND custom_orders.assigned_to = auth.uid()
));

-- 3. Create custom_order_messages table for communication
CREATE TABLE IF NOT EXISTS public.custom_order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes visible only to staff
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_order_messages_order_id ON public.custom_order_messages(custom_order_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_messages_created_at ON public.custom_order_messages(custom_order_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.custom_order_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_order_messages
DROP POLICY IF EXISTS "Users can view messages for their custom orders" ON public.custom_order_messages;
DROP POLICY IF EXISTS "Users can send messages for their custom orders" ON public.custom_order_messages;
DROP POLICY IF EXISTS "Admins can view all custom order messages" ON public.custom_order_messages;
DROP POLICY IF EXISTS "Admins can send messages for any custom order" ON public.custom_order_messages;
DROP POLICY IF EXISTS "Assigned staff can view messages for assigned custom orders" ON public.custom_order_messages;
DROP POLICY IF EXISTS "Assigned staff can send messages for assigned custom orders" ON public.custom_order_messages;

CREATE POLICY "Users can view messages for their custom orders"
ON public.custom_order_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders 
    WHERE custom_orders.id = custom_order_messages.custom_order_id 
    AND custom_orders.user_id = auth.uid()
  )
  AND (is_internal = false OR EXISTS (
    SELECT 1 FROM public.custom_orders 
    WHERE custom_orders.id = custom_order_messages.custom_order_id 
    AND custom_orders.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can send messages for their custom orders"
ON public.custom_order_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.custom_orders 
    WHERE custom_orders.id = custom_order_messages.custom_order_id 
    AND custom_orders.user_id = auth.uid()
  )
  AND is_internal = false
);

CREATE POLICY "Admins can view all custom order messages"
ON public.custom_order_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can send messages for any custom order"
ON public.custom_order_messages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned staff can view messages for assigned custom orders"
ON public.custom_order_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.custom_orders 
    WHERE custom_orders.id = custom_order_messages.custom_order_id 
    AND custom_orders.assigned_to = auth.uid()
  )
);

CREATE POLICY "Assigned staff can send messages for assigned custom orders"
ON public.custom_order_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_orders 
    WHERE custom_orders.id = custom_order_messages.custom_order_id 
    AND custom_orders.assigned_to = auth.uid()
  )
);

-- 4. Create custom_order_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS public.custom_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_order_status_history_order_id ON public.custom_order_status_history(custom_order_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_status_history_created_at ON public.custom_order_status_history(custom_order_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.custom_order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_order_status_history
DROP POLICY IF EXISTS "Users can view status history for their custom orders" ON public.custom_order_status_history;
DROP POLICY IF EXISTS "Admins can view all status history" ON public.custom_order_status_history;
DROP POLICY IF EXISTS "Admins can insert status history" ON public.custom_order_status_history;
DROP POLICY IF EXISTS "Assigned staff can view status history for assigned custom orders" ON public.custom_order_status_history;

CREATE POLICY "Users can view status history for their custom orders"
ON public.custom_order_status_history FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.custom_orders 
  WHERE custom_orders.id = custom_order_status_history.custom_order_id 
  AND custom_orders.user_id = auth.uid()
));

CREATE POLICY "Admins can view all status history"
ON public.custom_order_status_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert status history"
ON public.custom_order_status_history FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned staff can view status history for assigned custom orders"
ON public.custom_order_status_history FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.custom_orders 
  WHERE custom_orders.id = custom_order_status_history.custom_order_id 
  AND custom_orders.assigned_to = auth.uid()
));

-- 5. Function to generate custom order number
CREATE OR REPLACE FUNCTION public.generate_custom_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: CUSTOM-YYYYMMDD-XXXX (e.g., CUSTOM-20241206-1234)
    new_number := 'CUSTOM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.custom_orders WHERE order_number = new_number) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to automatically create status history entry
CREATE OR REPLACE FUNCTION public.create_custom_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.custom_order_status_history (custom_order_id, status, notes, changed_by)
    VALUES (NEW.id, NEW.status, 'Custom order created', NEW.user_id);
  ELSIF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.custom_order_status_history (custom_order_id, status, notes, changed_by)
    VALUES (NEW.id, NEW.status, 'Status updated', COALESCE(NEW.assigned_to, auth.uid()));
    
    -- Update timeline tracking fields
    IF NEW.status = 'in_discussion' AND OLD.status != 'in_discussion' THEN
      NEW.discussion_started_at := NOW();
    ELSIF NEW.status = 'in_production' AND OLD.status != 'in_production' THEN
      NEW.production_started_at := NOW();
    ELSIF NEW.status = 'ready' AND OLD.status != 'ready' THEN
      NEW.ready_at := NOW();
    ELSIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
      NEW.delivered_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create status history
DROP TRIGGER IF EXISTS create_custom_order_status_history_trigger ON public.custom_orders;
CREATE TRIGGER create_custom_order_status_history_trigger
AFTER INSERT OR UPDATE OF status ON public.custom_orders
FOR EACH ROW
EXECUTE FUNCTION public.create_custom_order_status_history();

-- 7. Trigger to update updated_at
DROP TRIGGER IF EXISTS update_custom_orders_updated_at ON public.custom_orders;
CREATE TRIGGER update_custom_orders_updated_at
BEFORE UPDATE ON public.custom_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create storage bucket for custom order images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-order-images',
  'custom-order-images',
  true,
  10485760, -- 10MB limit for reference images
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for custom order images
DROP POLICY IF EXISTS "Users can upload custom order images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their custom order images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all custom order images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their custom order images" ON storage.objects;

CREATE POLICY "Users can upload custom order images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'custom-order-images');

CREATE POLICY "Users can view their custom order images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'custom-order-images');

CREATE POLICY "Admins can view all custom order images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'custom-order-images');

CREATE POLICY "Users can delete their custom order images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'custom-order-images');

