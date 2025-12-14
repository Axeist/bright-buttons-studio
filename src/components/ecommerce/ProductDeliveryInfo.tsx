import { Truck, Calendar, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductDeliveryInfoProps {
  estimatedDays?: number;
  freeShippingThreshold?: number;
  currentTotal?: number;
  className?: string;
}

export const ProductDeliveryInfo = ({
  estimatedDays = 5,
  freeShippingThreshold = 500,
  currentTotal = 0,
  className,
}: ProductDeliveryInfoProps) => {
  const isFreeShipping = currentTotal >= freeShippingThreshold;
  const shippingRemaining = Math.max(0, freeShippingThreshold - currentTotal);

  // Calculate estimated delivery date
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

  return (
    <Card className={cn("bg-accent/30 border-accent", className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Delivery Time */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Estimated Delivery</p>
              <p className="text-xs text-muted-foreground">
                {estimatedDate.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ({estimatedDays} business days)
              </p>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Shipping</p>
              {isFreeShipping ? (
                <Badge variant="secondary" className="mt-1">
                  Free Shipping
                </Badge>
              ) : (
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground">
                    Add ₹{shippingRemaining.toLocaleString()} more for free shipping
                  </p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (currentTotal / freeShippingThreshold) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Processing Time */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Processing Time</p>
              <p className="text-xs text-muted-foreground">
                1-2 business days (handmade items)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

