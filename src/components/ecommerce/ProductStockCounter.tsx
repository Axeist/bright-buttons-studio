import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductStockCounterProps {
  quantity: number;
  reserved?: number;
  lowStockThreshold?: number;
  showBadge?: boolean;
  className?: string;
}

export const ProductStockCounter = ({
  quantity,
  reserved = 0,
  lowStockThreshold = 5,
  showBadge = true,
  className,
}: ProductStockCounterProps) => {
  const available = quantity - reserved;

  if (available <= 0) {
    return showBadge ? (
      <Badge variant="destructive" className={cn("w-fit", className)}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        Out of Stock
      </Badge>
    ) : (
      <span className={cn("text-sm text-destructive font-medium", className)}>
        Out of Stock
      </span>
    );
  }

  if (available <= lowStockThreshold) {
    return showBadge ? (
      <Badge variant="secondary" className={cn("w-fit bg-earth-400/20 text-earth-800 dark:text-earth-300", className)}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        Only {available} left
      </Badge>
    ) : (
      <span className={cn("text-sm text-earth-600 dark:text-earth-400 font-medium", className)}>
        Only {available} left
      </span>
    );
  }

  return showBadge ? (
    <Badge variant="secondary" className={cn("w-fit", className)}>
      In Stock
    </Badge>
  ) : (
    <span className={cn("text-sm text-primary font-medium", className)}>
      {available} in stock
    </span>
  );
};

