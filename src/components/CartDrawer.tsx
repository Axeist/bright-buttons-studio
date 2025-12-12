import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onOpenChange(false);
    if (!user) {
      navigate("/customer/login");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart ({getTotalItems()})
          </SheetTitle>
          <SheetDescription>
            {items.length > 0
              ? "Review your items before checkout"
              : "Your cart is empty"}
          </SheetDescription>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Link
                    to={`/product/${item.product_id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_id}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <h4 className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                        {item.product?.name || "Product"}
                      </h4>
                    </Link>
                    {item.size && (
                      <p className="text-xs text-muted-foreground mt-1">Size: {item.size}</p>
                    )}
                    <p className="text-sm font-semibold text-primary mt-2">
                      ₹{item.product?.price.toLocaleString() || 0}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 border rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              removeFromCart(item.id);
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">
                  ₹{getTotalPrice().toLocaleString()}
                </span>
              </div>
              <Button
                className="w-full rounded-full h-12"
                onClick={handleCheckout}
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link to="/shop" onClick={() => onOpenChange(false)}>
                <Button variant="outline" className="w-full rounded-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Link to="/shop" onClick={() => onOpenChange(false)}>
              <Button className="rounded-full">
                Start Shopping
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
