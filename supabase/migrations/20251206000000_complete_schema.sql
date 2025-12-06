-- Complete Database Schema for Bright Buttons Studio
-- Includes: Products, Customers, Orders, Inventory, Settings, Payments
-- Future-compatible for WhatsApp and online sales

-- Create enums
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('cash', 'upi', 'card', 'split', 'online', 'whatsapp');
CREATE TYPE public.order_source AS ENUM ('pos', 'whatsapp', 'online', 'phone');
CREATE TYPE public.product_status AS ENUM ('active', 'inactive', 'archived');

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  fabric TEXT,
  technique TEXT,
  image_url TEXT,
  tagline TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2), -- For profit calculations
  barcode TEXT UNIQUE, -- Barcode for scanning
  sku TEXT UNIQUE, -- Stock Keeping Unit
  status product_status DEFAULT 'active',
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory/Stock table (separate for tracking stock movements)
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0, -- For pending orders
  location TEXT, -- Optional: warehouse/store location
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (product_id)
);

-- Stock movements/transactions for audit trail
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity_change INTEGER NOT NULL, -- Positive for additions, negative for deductions
  movement_type TEXT NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return', 'damage'
  reference_id UUID, -- Reference to order, purchase, etc.
  reference_type TEXT, -- 'order', 'purchase', 'adjustment'
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  whatsapp_number TEXT, -- For WhatsApp orders
  customer_type TEXT DEFAULT 'new', -- 'new' or 'returning'
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (phone)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- Format: BB-YYYY-XXXX
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT, -- Denormalized for quick access
  customer_phone TEXT, -- Denormalized for quick access
  customer_email TEXT,
  shipping_address TEXT,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method,
  source order_source DEFAULT 'pos', -- 'pos', 'whatsapp', 'online', 'phone'
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  whatsapp_message_id TEXT, -- For tracking WhatsApp conversations
  created_by UUID REFERENCES auth.users(id), -- Staff who created the order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- Denormalized
  product_sku TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (for tracking payment transactions)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  transaction_id TEXT, -- UPI transaction ID, card transaction ID, etc.
  status payment_status DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (for shop configuration)
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_source ON public.orders(source);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_settings_key ON public.settings(key);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Staff can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can update products"
ON public.products FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory
CREATE POLICY "Staff can view inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage inventory"
ON public.inventory FOR ALL
TO authenticated
USING (true);

-- RLS Policies for stock_movements
CREATE POLICY "Staff can view stock movements"
ON public.stock_movements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert stock movements"
ON public.stock_movements FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for customers
CREATE POLICY "Staff can view customers"
ON public.customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage customers"
ON public.customers FOR ALL
TO authenticated
USING (true);

-- RLS Policies for orders
CREATE POLICY "Staff can view orders"
ON public.orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage orders"
ON public.orders FOR ALL
TO authenticated
USING (true);

-- RLS Policies for order_items
CREATE POLICY "Staff can view order items"
ON public.order_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage order items"
ON public.order_items FOR ALL
TO authenticated
USING (true);

-- RLS Policies for payments
CREATE POLICY "Staff can view payments"
ON public.payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage payments"
ON public.payments FOR ALL
TO authenticated
USING (true);

-- RLS Policies for settings
CREATE POLICY "Staff can view settings"
ON public.settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  order_num TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get the last sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.orders
  WHERE order_number LIKE 'BB-' || year_part || '-%';
  
  order_num := 'BB-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$;

-- Function to update inventory on stock movement
CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update inventory quantity
  INSERT INTO public.inventory (product_id, quantity, updated_at)
  VALUES (NEW.product_id, NEW.quantity_change, NOW())
  ON CONFLICT (product_id) 
  DO UPDATE SET 
    quantity = inventory.quantity + NEW.quantity_change,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger to update inventory on stock movement
CREATE TRIGGER update_inventory_on_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_movement();

-- Function to update customer stats on order completion
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    UPDATE public.customers
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_amount,
      last_purchase_at = NOW(),
      customer_type = CASE 
        WHEN total_orders + 1 > 1 THEN 'returning'
        ELSE 'new'
      END,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update customer stats
CREATE TRIGGER update_customer_stats_on_order
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- Function to reserve inventory on order creation
CREATE OR REPLACE FUNCTION public.reserve_inventory_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reserve inventory when order is created
  IF NEW.status IN ('pending', 'confirmed', 'processing') THEN
    UPDATE public.inventory
    SET reserved_quantity = reserved_quantity + NEW.quantity
    WHERE product_id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to reserve inventory (called from application, not directly)
-- This will be handled in application logic for better control

-- Function to update product updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('shop_name', '"Bright Buttons"', 'Shop name'),
('shop_phone', '"+91 99526 55555"', 'Shop phone number'),
('shop_email', '"hello@brightbuttons.com"', 'Shop email'),
('shop_address', '"Chennai, Tamil Nadu, India"', 'Shop address'),
('business_hours', '"Mon-Sat: 10:00 AM - 7:00 PM"', 'Business hours'),
('whatsapp_number', '"+91 99526 55555"', 'WhatsApp business number'),
('whatsapp_order_confirmation', '"Thank you for your order! Your order #{order_id} has been confirmed. We''ll update you when it''s ready."', 'WhatsApp order confirmation message template'),
('whatsapp_order_ready', '"Great news! Your order #{order_id} is ready for pickup/dispatch. 🎉"', 'WhatsApp order ready message template'),
('whatsapp_order_delivered', '"Your order #{order_id} has been delivered! We hope you love your new Bright Buttons piece. 💚"', 'WhatsApp order delivered message template'),
('payment_methods', '{"cash": true, "upi": true, "card": true, "split": false}', 'Enabled payment methods'),
('tax_rate', '18', 'Tax rate percentage'),
('currency', '"INR"', 'Currency code'),
('currency_symbol', '"₹"', 'Currency symbol');

