import { X, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  rating?: number;
  inStock?: boolean;
  features?: Record<string, string | boolean>;
}

interface ProductComparisonProps {
  products: Product[];
  onRemove?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export const ProductComparison = ({
  products,
  onRemove,
  onAddToCart,
  className,
}: ProductComparisonProps) => {
  if (products.length === 0) return null;

  // Get all unique feature keys
  const allFeatures = new Set<string>();
  products.forEach((product) => {
    if (product.features) {
      Object.keys(product.features).forEach((key) => allFeatures.add(key));
    }
  });

  const features = Array.from(allFeatures);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Compare Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-w-[800px]">
            {/* Products Header */}
            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}>
              <div className="font-semibold text-sm text-muted-foreground">Product</div>
              {products.map((product) => (
                <div key={product.id} className="relative">
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => onRemove(product.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  <div className="space-y-3">
                    {product.image && (
                      <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-primary">
                        ₹{product.price.toLocaleString()}
                      </p>
                      {product.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-xs text-muted-foreground">★</span>
                        </div>
                      )}
                      <Badge
                        variant={product.inStock ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    {onAddToCart && product.inStock && (
                      <Button
                        size="sm"
                        className="w-full rounded-full"
                        onClick={() => onAddToCart(product.id)}
                      >
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="mb-6" />

            {/* Features Comparison */}
            {features.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Features</h4>
                <div className="space-y-2">
                  {features.map((feature) => (
                    <div
                      key={feature}
                      className="grid gap-4 py-2 border-b last:border-0"
                      style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}
                    >
                      <div className="text-sm font-medium text-muted-foreground">
                        {feature}
                      </div>
                      {products.map((product) => {
                        const value = product.features?.[feature];
                        return (
                          <div key={product.id} className="flex items-center">
                            {typeof value === "boolean" ? (
                              value ? (
                                <Check className="w-5 h-5 text-primary" />
                              ) : (
                                <XCircle className="w-5 h-5 text-muted-foreground" />
                              )
                            ) : (
                              <span className="text-sm">{value || "-"}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

