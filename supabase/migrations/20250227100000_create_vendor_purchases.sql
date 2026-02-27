-- Vendor purchases / stock-in records: where things were bought, date, count, cost, etc.
CREATE TABLE IF NOT EXISTS public.vendor_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  where_bought TEXT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL CHECK (count > 0),
  stock_in_at DATE NOT NULL DEFAULT CURRENT_DATE,
  cost NUMERIC(12, 2) NOT NULL CHECK (cost >= 0),
  additional_details TEXT,
  item_name TEXT,
  invoice_number TEXT,
  vendor_contact TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_purchases_purchase_date ON public.vendor_purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_purchases_where_bought ON public.vendor_purchases(where_bought);
CREATE INDEX IF NOT EXISTS idx_vendor_purchases_created_at ON public.vendor_purchases(created_at DESC);

ALTER TABLE public.vendor_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view vendor_purchases" ON public.vendor_purchases;
DROP POLICY IF EXISTS "Staff can insert vendor_purchases" ON public.vendor_purchases;
DROP POLICY IF EXISTS "Staff can update vendor_purchases" ON public.vendor_purchases;
DROP POLICY IF EXISTS "Staff can delete vendor_purchases" ON public.vendor_purchases;

CREATE POLICY "Staff can view vendor_purchases"
ON public.vendor_purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can insert vendor_purchases"
ON public.vendor_purchases FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update vendor_purchases"
ON public.vendor_purchases FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can delete vendor_purchases"
ON public.vendor_purchases FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
