import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export const ProductRating = ({
  rating,
  reviewCount,
  size = "md",
  showCount = true,
  className,
}: ProductRatingProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], "fill-primary text-primary")}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(sizeClasses[size], "text-muted-foreground")}
            />
            <Star
              className={cn(
                sizeClasses[size],
                "fill-primary text-primary absolute inset-0 overflow-hidden"
              )}
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], "text-muted-foreground")}
          />
        ))}
      </div>
      {showCount && (
        <span className={cn("text-muted-foreground ml-1", textSizeClasses[size])}>
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
};

