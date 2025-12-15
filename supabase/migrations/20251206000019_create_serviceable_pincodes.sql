-- Create serviceable_pincodes table for managing delivery locations
CREATE TABLE IF NOT EXISTS public.serviceable_pincodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_serviceable_pincodes_pincode ON public.serviceable_pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_serviceable_pincodes_active ON public.serviceable_pincodes(is_active);
CREATE INDEX IF NOT EXISTS idx_serviceable_pincodes_city_state ON public.serviceable_pincodes(city, state);

-- Enable RLS
ALTER TABLE public.serviceable_pincodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for serviceable_pincodes
-- Allow public read access to check if pincode is serviceable
CREATE POLICY "Anyone can view active serviceable pincodes"
ON public.serviceable_pincodes FOR SELECT
TO public
USING (is_active = true);

-- Allow authenticated staff/admin to view all pincodes
CREATE POLICY "Staff can view all serviceable pincodes"
ON public.serviceable_pincodes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Allow only admins to insert/update/delete
CREATE POLICY "Admins can insert serviceable pincodes"
ON public.serviceable_pincodes FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update serviceable pincodes"
ON public.serviceable_pincodes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete serviceable pincodes"
ON public.serviceable_pincodes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check if pincode is serviceable
CREATE OR REPLACE FUNCTION public.is_pincode_serviceable(p_pincode TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.serviceable_pincodes 
    WHERE pincode = p_pincode 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.is_pincode_serviceable(TEXT) TO public;

