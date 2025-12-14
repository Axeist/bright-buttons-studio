import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  salePrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  showOriginal?: boolean;
  className?: string;
}

export const PriceDisplay = ({
  price,
  salePrice,
  currency = "₹",
  size = "md",
  showOriginal = true,
  className,
}: PriceDisplayProps) => {
  const displayPrice = salePrice || price;
  const originalPrice = salePrice ? price : null;

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-bold text-primary",
          sizeClasses[size]
        )}
      >
        {currency}
        {displayPrice.toLocaleString()}
      </span>
      {showOriginal && originalPrice && (
        <span className="text-sm text-muted-foreground line-through">
          {currency}
          {originalPrice.toLocaleString()}
        </span>
      )}
    </div>
  );
};

