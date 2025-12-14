import { motion } from "framer-motion";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onWishlistToggle?: (product: Product) => void;
  wishlistedIds?: Set<string>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const ProductGrid = ({
  products,
  onProductClick,
  onAddToCart,
  onWishlistToggle,
  wishlistedIds = new Set(),
  columns = 4,
  className,
}: ProductGridProps) => {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {products.map((product, index) => {
        const isWishlisted = wishlistedIds.has(product.id);
        const displayPrice = product.salePrice || product.price;
        const originalPrice = product.salePrice ? product.price : null;

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-earth-50 dark:to-card">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <p className="text-muted-foreground text-sm">{product.name}</p>
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                  {product.isNew && (
                    <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                      New
                    </Badge>
                  )}
                  {product.isSale && (
                    <Badge variant="destructive" className="backdrop-blur-sm">
                      Sale
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                {/* Wishlist Button */}
                {onWishlistToggle && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onWishlistToggle(product);
                    }}
                    className={cn(
                      "absolute top-3 right-3 z-10 p-2.5 rounded-full backdrop-blur-sm transition-all duration-300",
                      isWishlisted
                        ? "bg-destructive/90 text-white shadow-lg"
                        : "bg-background/80 text-foreground hover:bg-background opacity-0 group-hover:opacity-100"
                    )}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                  </motion.button>
                )}

                {/* Hover Overlay with Actions */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    {onProductClick && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductClick(product);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Quick View
                      </Button>
                    )}
                    {onAddToCart && product.inStock && (
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-5 flex-1 flex flex-col">
                {/* Category */}
                {product.category && (
                  <Badge variant="secondary" className="mb-2 w-fit text-xs">
                    {product.category}
                  </Badge>
                )}

                {/* Title */}
                <h3
                  className="font-semibold text-foreground mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => onProductClick?.(product)}
                >
                  {product.name}
                </h3>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            i < Math.floor(product.rating!)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    {product.reviewCount && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className="text-xl font-bold text-primary">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  {originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {product.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

