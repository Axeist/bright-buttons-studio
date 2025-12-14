import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "./ProductGrid";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  isNew?: boolean;
  isSale?: boolean;
  salePrice?: number;
  category?: string;
  tags?: string[];
}

interface RelatedProductsProps {
  products: Product[];
  title?: string;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onWishlistToggle?: (product: Product) => void;
  wishlistedIds?: Set<string>;
  onViewAll?: () => void;
  className?: string;
}

export const RelatedProducts = ({
  products,
  title = "Related Products",
  onProductClick,
  onAddToCart,
  onWishlistToggle,
  wishlistedIds,
  onViewAll,
  className,
}: RelatedProductsProps) => {
  if (products.length === 0) return null;

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          {title}
        </h2>
        {onViewAll && (
          <Button
            variant="ghost"
            onClick={onViewAll}
            className="rounded-full"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      <ProductGrid
        products={products.slice(0, 4)}
        onProductClick={onProductClick}
        onAddToCart={onAddToCart}
        onWishlistToggle={onWishlistToggle}
        wishlistedIds={wishlistedIds}
        columns={4}
      />
    </section>
  );
};

