import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tag, Truck, Shield, Leaf } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  total: number;
  onApplyCoupon?: (code: string) => void;
  couponCode?: string;
  className?: string;
  showCouponInput?: boolean;
}

export const OrderSummary = ({
  items,
  subtotal,
  shipping = 0,
  tax = 0,
  discount = 0,
  total,
  onApplyCoupon,
  couponCode: initialCouponCode,
  className,
  showCouponInput = true,
}: OrderSummaryProps) => {
  const [couponCode, setCouponCode] = useState(initialCouponCode || "");
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !onApplyCoupon) return;
    setIsApplying(true);
    try {
      await onApplyCoupon(couponCode);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Items List */}
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {items.map((item) => {
            const hasImage = item.image && item.image !== "/placeholder.svg";
            
            return (
              <div key={item.id} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50 flex-shrink-0 relative flex items-center justify-center">
                  {hasImage ? (
                    <>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                        <Leaf className="w-6 h-6 text-primary-400 dark:text-primary-500" />
                      </div>
                    </>
                  ) : (
                    <Leaf className="w-6 h-6 text-primary-400 dark:text-primary-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">{item.variant}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </span>
                    <span className="font-semibold text-sm">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Coupon Input */}
        {showCouponInput && (
          <div className="space-y-2">
            <Label htmlFor="coupon">Coupon Code</Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                placeholder="Enter code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || isApplying}
                className="rounded-full"
              >
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            {initialCouponCode && (
              <Badge variant="secondary" className="w-fit">
                Coupon applied: {initialCouponCode}
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">₹{subtotal.toLocaleString()}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Discount</span>
              <span className="font-medium">-₹{discount.toLocaleString()}</span>
            </div>
          )}

          {shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">₹{shipping.toLocaleString()}</span>
            </div>
          )}

          {shipping === 0 && subtotal >= 500 && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Truck className="w-4 h-4" />
              <span>Free Shipping Applied</span>
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

        {/* Security Badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Shield className="w-4 h-4" />
          <span>Secure checkout with SSL encryption</span>
        </div>
      </CardContent>
    </Card>
  );
};

