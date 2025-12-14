-- Allow Anonymous Access to Products and Inventory
-- This migration adds RLS policies to allow unauthenticated users to view products and inventory

-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inventory table if not already enabled
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Public can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated can view all products" ON public.products;
DROP POLICY IF EXISTS "Authenticated can view all inventory" ON public.inventory;

-- Allow anyone (including anonymous users) to view active products
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
TO public
USING (status = 'active');

-- Allow authenticated users to view all products (for admin/staff)
CREATE POLICY "Authenticated can view all products"
ON public.products FOR SELECT
TO authenticated
USING (true);

-- Allow anyone (including anonymous users) to view inventory for active products
CREATE POLICY "Public can view inventory"
ON public.inventory FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = inventory.product_id
    AND products.status = 'active'
  )
);

-- Allow authenticated users to view all inventory
CREATE POLICY "Authenticated can view all inventory"
ON public.inventory FOR SELECT
TO authenticated
USING (true);

