-- Create review_helpful_votes table to track which users have marked reviews as helpful
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON public.review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON public.review_helpful_votes(user_id);

-- Enable RLS
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view helpful votes" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Authenticated users can vote on reviews" ON public.review_helpful_votes;
DROP POLICY IF EXISTS "Users can remove their own votes" ON public.review_helpful_votes;

CREATE POLICY "Anyone can view helpful votes"
ON public.review_helpful_votes FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can vote on reviews"
ON public.review_helpful_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes"
ON public.review_helpful_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to update helpful_count when votes are added/removed
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.product_reviews
    SET helpful_count = GREATEST(0, helpful_count - 1)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update helpful_count
DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON public.review_helpful_votes;
CREATE TRIGGER trigger_update_review_helpful_count
AFTER INSERT OR DELETE ON public.review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

