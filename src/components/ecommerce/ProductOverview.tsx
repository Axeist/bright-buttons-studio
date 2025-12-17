import { useState, MouseEvent, TouchEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Share2, ShoppingCart, Minus, Plus, Star, Check, Leaf, Package, Truck, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductOverviewProps {
  product: {
    id: string;
    name: string;
    price: number;
    description?: string;
    images: string[];
    rating?: number;
    reviewCount?: number;
    inStock?: boolean;
    sku?: string;
    category?: string;
    tags?: string[];
  };
  onAddToCart?: (quantity: number, size?: string) => void;
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
  sizeOptions?: string[];
  selectedSize?: string;
  onSizeChange?: (size: string) => void;
  requireSize?: boolean;
}

export const ProductOverview = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isWishlisted = false,
  sizeOptions = [],
  selectedSize: externalSelectedSize,
  onSizeChange,
  requireSize = false,
}: ProductOverviewProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [internalSelectedSize, setInternalSelectedSize] = useState<string>("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const selectedSize = externalSelectedSize !== undefined ? externalSelectedSize : internalSelectedSize;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const updateZoomPosition = (clientX: number, clientY: number, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setZoomPosition({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const handleZoomMove = (event: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if ("touches" in event) {
      const touch = event.touches[0];
      if (touch) {
        updateZoomPosition(touch.clientX, touch.clientY, target);
      }
      return;
    }
    updateZoomPosition(event.clientX, event.clientY, target);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Product Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-earth-50 dark:to-card border border-border shadow-soft">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              src={product.images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {product.inStock && (
              <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                In Stock
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="destructive" className="backdrop-blur-sm">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          {onWishlistToggle && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onWishlistToggle}
              className={cn(
                "absolute top-4 right-4 z-10 p-3 rounded-full backdrop-blur-sm transition-all duration-300",
                isWishlisted
                  ? "bg-destructive/90 text-white shadow-lg"
                  : "bg-background/80 text-foreground hover:bg-background"
              )}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
            </motion.button>
          )}

          {/* Zoom Button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full shadow-lg"
            onClick={() => {
              setZoomPosition({ x: 50, y: 50 });
              setIsZoomOpen(true);
            }}
            aria-label="Zoom product image"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Thumbnail Gallery */}
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300",
                  selectedImage === index
                    ? "border-primary shadow-md scale-105"
                    : "border-border hover:border-primary/50"
                )}
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Zoom Dialog */}
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-5xl w-[92vw] border-none bg-black/95 p-4 sm:p-6 text-white">
            <div
              className="relative w-full overflow-hidden rounded-xl shadow-2xl border border-white/10 aspect-[4/5] cursor-zoom-out"
              onMouseMove={handleZoomMove}
              onTouchMove={handleZoomMove}
              onClick={() => setIsZoomOpen(false)}
              role="presentation"
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${product.images[selectedImage] || "/placeholder.svg"})`,
                  backgroundSize: "225%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transition: "background-position 60ms ease-out",
                }}
              />
            </div>
            <p className="text-sm text-white/70 mt-3 text-center">
              Move your cursor or finger to explore details. Tap/click to close.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          {product.category && (
            <Badge variant="secondary" className="mb-3">
              {product.category}
            </Badge>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            {product.name}
          </h1>
          {product.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < Math.floor(product.rating!) 
                        ? "fill-primary text-primary" 
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount || 0} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-primary">
            ₹{product.price.toLocaleString()}
          </span>
        </div>

        <Separator />

        {/* Description */}
        {product.description && (
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {sizeOptions.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Size {requireSize && <span className="text-destructive">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => {
                const handleSizeClick = () => {
                  if (onSizeChange) {
                    onSizeChange(size);
                  } else {
                    setInternalSelectedSize(size);
                  }
                };
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={handleSizeClick}
                    className={cn(
                      "px-6 py-3 rounded-lg font-medium transition-all min-w-[60px]",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quantity</label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!product.inStock ? (
            <Button
              size="lg"
              variant="destructive"
              className="flex-1 rounded-full h-12"
              disabled
            >
              Out of Stock
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1 rounded-full h-12"
              onClick={() => {
                if (requireSize && sizeOptions.length > 0 && !selectedSize) {
                  return;
                }
                if (onAddToCart) {
                  onAddToCart(quantity, selectedSize || undefined);
                }
              }}
              disabled={requireSize && sizeOptions.length > 0 && !selectedSize}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {requireSize && sizeOptions.length > 0 && !selectedSize 
                ? "Select Size" 
                : "Add to Cart"}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-12"
            onClick={onWishlistToggle}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Features */}
        <Card className="bg-accent/50 border-accent">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day return policy</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">100% secure checkout</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SKU */}
        {product.sku && (
          <p className="text-sm text-muted-foreground">
            SKU: <span className="font-mono">{product.sku}</span>
          </p>
        )}
      </div>
    </div>
  );
};

