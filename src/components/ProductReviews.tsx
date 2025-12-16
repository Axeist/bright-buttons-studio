import { useState, useEffect } from "react";
import { Star, ThumbsUp, User, CheckCircle2, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  customer_id: string | null;
  user_id: string | null;
  created_at: string;
  helpful_count: number;
  is_verified_purchase: boolean;
  customers?: {
    name: string | null;
    email: string | null;
  } | null;
}

interface ProductReviewsProps {
  productId: string;
}

type SortOption = "recent" | "helpful" | "rating-high" | "rating-low";

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    review_text: "",
  });

  useEffect(() => {
    fetchReviews();
    if (user) {
      fetchHelpfulVotes();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          customers (
            name,
            email
          )
        `)
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpfulVotes = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("review_helpful_votes")
        .select("review_id")
        .eq("user_id", user.id);

      if (data) {
        setHelpfulVotes(new Set(data.map((vote) => vote.review_id)));
      }
    } catch (error) {
      console.error("Error fetching helpful votes:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (!reviewForm.review_text.trim()) {
      toast({
        title: "Error",
        description: "Please write a review",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get customer ID
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        customer_id: customer?.id || null,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title || null,
        review_text: reviewForm.review_text,
        is_verified_purchase: true,
        is_approved: true, // Auto-approve reviews for immediate posting
      });

      if (error) throw error;

      toast({
        title: "Review Posted",
        description: "Thank you! Your review has been posted successfully.",
      });

      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", review_text: "" });
      // Refresh reviews to show the new review immediately
      await fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    const isHelpful = helpfulVotes.has(reviewId);

    try {
      if (isHelpful) {
        const { error } = await supabase
          .from("review_helpful_votes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", user.id);

        if (error) throw error;
        setHelpfulVotes((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from("review_helpful_votes")
          .insert({
            review_id: reviewId,
            user_id: user.id,
          });

        if (error) throw error;
        setHelpfulVotes((prev) => new Set(prev).add(reviewId));
      }

      // Refresh reviews to get updated helpful_count
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update helpful vote",
        variant: "destructive",
      });
    }
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
        : 0,
  }));

  const getDisplayName = (review: Review) => {
    if (review.customers?.name) {
      return review.customers.name;
    }
    if (review.customers?.email) {
      return review.customers.email.split("@")[0];
    }
    return "Customer";
  };

  const sortedAndFilteredReviews = [...reviews]
    .filter((review) => ratingFilter === null || review.rating === ratingFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "helpful":
          return b.helpful_count - a.helpful_count;
        case "rating-high":
          return b.rating - a.rating;
        case "rating-low":
          return a.rating - b.rating;
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <div className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-6 h-6",
                        star <= Math.round(averageRating)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
            {user && (
              <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                <DialogTrigger asChild>
                  <Button className="rounded-full w-full md:w-auto mt-4">
                    Write a Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Rating *</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={cn(
                                "w-8 h-8 transition-colors",
                                star <= reviewForm.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Title (Optional)</Label>
                      <Input
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                        placeholder="Brief summary of your experience"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Your Review *</Label>
                      <Textarea
                        value={reviewForm.review_text}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, review_text: e.target.value })
                        }
                        placeholder="Share your experience with this product..."
                        rows={6}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={handleSubmitReview}>
                        Submit Review
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="md:col-span-2">
          <h4 className="font-semibold mb-4">Rating Distribution</h4>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="w-4 h-4 fill-primary text-primary" />
                </div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <div className="flex items-center gap-2 w-24">
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                    {count}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 text-xs",
                    ratingFilter === rating && "bg-primary/10"
                  )}
                  onClick={() =>
                    setRatingFilter(ratingFilter === rating ? null : rating)
                  }
                >
                  Filter
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sort and Filter Controls */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {sortedAndFilteredReviews.length} review{sortedAndFilteredReviews.length !== 1 ? "s" : ""}
              {ratingFilter && ` (${ratingFilter} star${ratingFilter !== 1 ? "s" : ""})`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
                <SelectItem value="rating-high">Highest Rating</SelectItem>
                <SelectItem value="rating-low">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      ) : sortedAndFilteredReviews.length > 0 ? (
        <div className="space-y-6">
          {sortedAndFilteredReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b pb-6 last:border-0"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{getDisplayName(review)}</p>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-4 h-4",
                              star <= review.rating
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {review.title && (
                <h4 className="font-semibold mb-2 text-lg">{review.title}</h4>
              )}
              <p className="text-muted-foreground leading-relaxed mb-4">
                {review.review_text}
              </p>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-sm",
                    helpfulVotes.has(review.id) && "text-primary"
                  )}
                  onClick={() => handleHelpfulVote(review.id)}
                >
                  <ThumbsUp
                    className={cn(
                      "w-4 h-4 mr-1",
                      helpfulVotes.has(review.id) && "fill-primary"
                    )}
                  />
                  Helpful ({review.helpful_count})
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {ratingFilter
              ? `No ${ratingFilter}-star reviews yet`
              : "No reviews yet"}
          </p>
          {user && !ratingFilter && (
            <Button onClick={() => setShowReviewForm(true)} className="rounded-full">
              Be the first to review
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
