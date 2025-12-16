-- Add DELETE policies for product_reviews
-- This migration adds RLS policies to allow admins/staff and users to delete reviews

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins and staff can delete all reviews" ON public.product_reviews;

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.product_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.customers WHERE id = product_reviews.customer_id AND user_id = auth.uid()
));

-- Admins and staff can delete all reviews
CREATE POLICY "Admins and staff can delete all reviews"
ON public.product_reviews FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

