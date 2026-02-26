-- Category options for product dropdown (managed from Manage > Fabric and Technique)
-- Categories appear in Add Product / Edit Product Category dropdown.

CREATE TABLE IF NOT EXISTS public.category_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_options_display_order ON public.category_options(display_order);

ALTER TABLE public.category_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read category options"
  ON public.category_options FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage category options"
  ON public.category_options FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'staff')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'staff')
  );

CREATE OR REPLACE FUNCTION update_category_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_category_options_updated_at
  BEFORE UPDATE ON public.category_options
  FOR EACH ROW
  EXECUTE FUNCTION update_category_options_updated_at();

INSERT INTO public.category_options (name, display_order) VALUES
  ('Kurthas & Co-ords', 1),
  ('Sarees', 2),
  ('Shawls', 3),
  ('Men''s Shirts', 4),
  ('T-Shirts', 5),
  ('Kidswear', 6)
ON CONFLICT (name) DO NOTHING;
