-- Fabric and Technique options for product dropdowns (managed from Manage page)
-- These options appear in Add Product / Edit Product Fabric and Technique dropdowns.

CREATE TABLE IF NOT EXISTS public.fabric_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.technique_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fabric_options_display_order ON public.fabric_options(display_order);
CREATE INDEX IF NOT EXISTS idx_technique_options_display_order ON public.technique_options(display_order);

ALTER TABLE public.fabric_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_options ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read options for shop/product forms
CREATE POLICY "Anyone can read fabric options"
  ON public.fabric_options FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read technique options"
  ON public.technique_options FOR SELECT
  TO public
  USING (true);

-- Only staff/admin can manage
CREATE POLICY "Staff can manage fabric options"
  ON public.fabric_options FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'staff')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Staff can manage technique options"
  ON public.technique_options FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'staff')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'staff')
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_fabric_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_technique_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_fabric_options_updated_at
  BEFORE UPDATE ON public.fabric_options
  FOR EACH ROW
  EXECUTE FUNCTION update_fabric_options_updated_at();

CREATE TRIGGER set_technique_options_updated_at
  BEFORE UPDATE ON public.technique_options
  FOR EACH ROW
  EXECUTE FUNCTION update_technique_options_updated_at();

-- Seed with current hardcoded values so existing products still match
INSERT INTO public.fabric_options (name, display_order) VALUES
  ('Silk', 1),
  ('Cotton', 2),
  ('Linen', 3),
  ('Grape', 4),
  ('Georgette', 5),
  ('Tussar', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.technique_options (name, display_order) VALUES
  ('Eco printing', 1),
  ('Tie & Dye', 2),
  ('Shibori', 3),
  ('Batik', 4),
  ('Kalamkari', 5)
ON CONFLICT (name) DO NOTHING;
