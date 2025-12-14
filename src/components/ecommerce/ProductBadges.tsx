import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductBadgesProps {
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
  discount?: number;
  inStock?: boolean;
  className?: string;
}

export const ProductBadges = ({
  isNew,
  isSale,
  isFeatured,
  discount,
  inStock,
  className,
}: ProductBadgesProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {isNew && (
        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
          New
        </Badge>
      )}
      {isSale && (
        <Badge variant="destructive" className="backdrop-blur-sm">
          {discount ? `-${discount}%` : "Sale"}
        </Badge>
      )}
      {isFeatured && (
        <Badge className="bg-earth-400 text-white backdrop-blur-sm">
          Featured
        </Badge>
      )}
      {inStock === false && (
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          Out of Stock
        </Badge>
      )}
    </div>
  );
};

