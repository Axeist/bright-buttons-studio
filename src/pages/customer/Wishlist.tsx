import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Share2,
  Copy,
  Bell,
  BellOff,
  Package,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    category: string;
    fabric: string | null;
    image_url: string | null;
    price: number;
    tagline: string | null;
    inventory?: {
      quantity: number;
      reserved_quantity: number;
    };
  };
  stock_notification?: {
    id: string;
    notified: boolean;
  };
}

const CustomerWishlist = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [addingToCartIds, setAddingToCartIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlist")
        .select(
          `
          id,
          product_id,
          created_at,
          product:products!inner (
            id,
            name,
            category,
            fabric,
            image_url,
            price,
            tagline,
            inventory (
              quantity,
              reserved_quantity
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (wishlistError) throw wishlistError;

      // Fetch stock notifications for each item
      const productIds = wishlistData?.map((item) => item.product_id) || [];
      const { data: notificationsData } = await supabase
        .from("stock_notifications")
        .select("id, product_id, notified")
        .eq("user_id", user.id)
        .in("product_id", productIds);

      // Merge notifications with wishlist items
      const itemsWithNotifications = (wishlistData || []).map((item) => {
        const notification = notificationsData?.find(
          (n) => n.product_id === item.product_id
        );
        return {
          ...item,
          stock_notification: notification,
        };
      });

      setWishlistItems(itemsWithNotifications as WishlistItem[]);
    } catch (error: any) {
      console.error("Error fetching wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to load wishlist items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStock = (item: WishlistItem) => {
    const qty = item.product.inventory?.quantity || 0;
    const reserved = item.product.inventory?.reserved_quantity || 0;
    return qty - reserved;
  };

  const isOutOfStock = (item: WishlistItem) => {
    return getAvailableStock(item) === 0;
  };

  const handleRemoveFromWishlist = async (itemId: string, productId: string) => {
    if (!user) return;

    setRemovingIds((prev) => new Set(prev).add(itemId));
    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;

      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
      toast({
        title: "Removed",
        description: "Item removed from your wishlist",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item",
        variant: "destructive",
      });
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    if (!user) {
      navigate("/customer/login");
      return;
    }

    if (isOutOfStock(item)) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    setAddingToCartIds((prev) => new Set(prev).add(item.id));
    try {
      await addToCart(item.product.id, 1);
      toast({
        title: "Added to Cart",
        description: `${item.product.name} has been added to your cart`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive",
      });
    } finally {
      setAddingToCartIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleShare = async (item: WishlistItem) => {
    const productUrl = `${window.location.origin}/product/${item.product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.product.name,
          text: item.product.tagline || "",
          url: productUrl,
        });
        toast({
          title: "Shared",
          description: "Product link shared successfully",
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(productUrl);
      toast({
        title: "Link Copied",
        description: "Product link copied to clipboard",
      });
    }
  };

  const handleCopyLink = async (item: WishlistItem) => {
    const productUrl = `${window.location.origin}/product/${item.product.id}`;
    navigator.clipboard.writeText(productUrl);
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard",
    });
  };

  const toggleStockNotification = async (item: WishlistItem) => {
    if (!user) return;

    const hasNotification = !!item.stock_notification;
    const isNotified = item.stock_notification?.notified || false;

    try {
      if (hasNotification && !isNotified) {
        // Remove notification
        const { error } = await supabase
          .from("stock_notifications")
          .delete()
          .eq("id", item.stock_notification!.id);

        if (error) throw error;

        toast({
          title: "Notification Disabled",
          description: "You will not be notified when this product is back in stock",
        });
      } else {
        // Add or update notification
        const { error } = await supabase
          .from("stock_notifications")
          .upsert({
            user_id: user.id,
            product_id: item.product.id,
            notified: false,
          }, {
            onConflict: "user_id,product_id",
          });

        if (error) throw error;

        toast({
          title: "Notification Enabled",
          description: "You will be notified when this product is back in stock",
        });
      }

      // Refresh wishlist to update notification status
      fetchWishlist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <CustomerLayout title="My Wishlist">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="My Wishlist">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Saved Designs</h2>
            <p className="text-muted-foreground">
              {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          <Link to="/shop">
            <Button variant="outline" className="rounded-full">
              Continue Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Wishlist Items */}
        <AnimatePresence mode="wait">
          {wishlistItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-16 px-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="mb-6"
              >
                <Heart className="w-24 h-24 text-muted-foreground/30" />
              </motion.div>
              <h3 className="text-2xl font-semibold mb-2">Your Wishlist is Empty</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start saving products you love! Click the heart icon on any product to add it to your wishlist.
              </p>
              <Link to="/shop">
                <Button size="lg" className="rounded-full">
                  <Package className="w-5 h-5 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item, index) => {
                const availableStock = getAvailableStock(item);
                const outOfStock = isOutOfStock(item);
                const hasNotification = !!item.stock_notification && !item.stock_notification.notified;
                const isRemoving = removingIds.has(item.id);
                const isAddingToCart = addingToCartIds.has(item.id);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <CardContent className="p-0 flex flex-col h-full">
                        {/* Image */}
                        <Link to={`/product/${item.product.id}`} className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50 rounded-t-lg">
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-16 h-16 text-muted-foreground" />
                            </div>
                          )}
                          {outOfStock && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <Badge variant="destructive" className="text-sm">
                                Out of Stock
                              </Badge>
                            </div>
                          )}
                          {availableStock > 0 && availableStock <= 5 && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-xs">
                                Only {availableStock} left
                              </Badge>
                            </div>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col">
                          <Link to={`/product/${item.product.id}`}>
                            <h3 className="font-semibold text-foreground mb-1 line-clamp-1 hover:text-primary transition-colors">
                              {item.product.name}
                            </h3>
                          </Link>
                          
                          {item.product.tagline && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {item.product.tagline}
                            </p>
                          )}

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {item.product.category}
                            </Badge>
                            {item.product.fabric && (
                              <Badge variant="outline" className="text-xs">
                                {item.product.fabric}
                              </Badge>
                            )}
                          </div>

                          {/* Price */}
                          <p className="text-lg font-bold text-primary mb-4">
                            ₹{item.product.price.toLocaleString()}
                          </p>

                          {/* Stock Status */}
                          {outOfStock ? (
                            <div className="mb-3">
                              <Badge variant="destructive" className="w-full justify-center py-1.5">
                                Out of Stock
                              </Badge>
                            </div>
                          ) : (
                            <div className="mb-3">
                              <Badge variant="secondary" className="w-full justify-center py-1.5">
                                {availableStock} in stock
                              </Badge>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="space-y-2 mt-auto">
                            {outOfStock ? (
                              <Button
                                variant={hasNotification ? "default" : "outline"}
                                size="sm"
                                className="w-full rounded-full"
                                onClick={() => toggleStockNotification(item)}
                              >
                                {hasNotification ? (
                                  <>
                                    <BellOff className="w-4 h-4 mr-2" />
                                    Notification On
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-4 h-4 mr-2" />
                                    Notify Me When Available
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full rounded-full bg-primary hover:bg-primary-700"
                                onClick={() => handleMoveToCart(item)}
                                disabled={isAddingToCart}
                              >
                                {isAddingToCart ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Move to Cart
                                  </>
                                )}
                              </Button>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleRemoveFromWishlist(item.id, item.product.id)}
                                disabled={isRemoving}
                              >
                                {isRemoving ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleShare(item)}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleCopyLink(item)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>

                            <WhatsAppButton
                              variant="inline"
                              className="w-full rounded-full text-sm h-9"
                              message={`Hi! I'm interested in ${item.product.name} (${item.product.category}) from Bright Buttons. Can you share more details?`}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </WhatsAppButton>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
};

export default CustomerWishlist;

