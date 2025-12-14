-- Stock Notifications Migration
-- This migration adds a table for customers to get notified when out-of-stock products become available

-- Create stock_notifications table
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_notifications_user_id ON public.stock_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_product_id ON public.stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_notified ON public.stock_notifications(notified) WHERE notified = false;

-- Enable RLS
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_notifications
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.stock_notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.stock_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.stock_notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.stock_notifications;

CREATE POLICY "Users can view their own notifications"
ON public.stock_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
ON public.stock_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.stock_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.stock_notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

