import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  inStock?: boolean;
}

interface EnhancedShoppingCartProps {
  items: CartItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  onContinueShopping?: () => void;
  subtotal: number;
  shipping?: number;
  tax?: number;
  total: number;
  freeShippingThreshold?: number;
}

export const EnhancedShoppingCart = ({
  items,
  isOpen,
  onOpenChange,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
  subtotal,
  shipping = 0,
  tax = 0,
  total,
  freeShippingThreshold = 500,
}: EnhancedShoppingCartProps) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    // Small delay for animation
    setTimeout(() => {
      onRemoveItem(itemId);
      setRemovingId(null);
    }, 200);
  };

  const shippingRemaining = freeShippingThreshold - subtotal;
  const isFreeShipping = subtotal >= freeShippingThreshold;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart ({items.length})
          </SheetTitle>
          <SheetDescription>
            {items.length > 0
              ? "Review your items before checkout"
              : "Your cart is empty"}
          </SheetDescription>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "relative flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                      removingId === item.id && "opacity-50"
                    )}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.variant}
                        </p>
                      )}
                      {!item.inStock && (
                        <Badge variant="destructive" className="text-xs mb-2">
                          Out of Stock
                        </Badge>
                      )}
                      <p className="text-sm font-semibold text-primary mb-3">
                        ₹{item.price.toLocaleString()}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => {
                              if (item.quantity > 1) {
                                onUpdateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={!item.inStock}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="border-t bg-accent/30 px-6 py-4 space-y-4">
              {/* Free Shipping Progress */}
              {!isFreeShipping && shippingRemaining > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Add ₹{shippingRemaining.toLocaleString()} for free shipping
                        </span>
                        <span className="font-medium text-primary">
                          {Math.round((subtotal / freeShippingThreshold) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(subtotal / freeShippingThreshold) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">₹{shipping.toLocaleString()}</span>
                  </div>
                )}
                {isFreeShipping && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <span>✓ Free Shipping Applied</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">₹{tax.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className="w-full rounded-full h-12"
                  onClick={onCheckout}
                  size="lg"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {onContinueShopping && (
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={onContinueShopping}
                  >
                    Continue Shopping
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Start adding items to your cart to see them here
            </p>
            {onContinueShopping && (
              <Button onClick={onContinueShopping} className="rounded-full">
                Start Shopping
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

