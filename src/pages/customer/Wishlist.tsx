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
import { ProductGrid, EmptyState, LoadingState } from "@/components/ecommerce";
import { getProductImageUrl } from "@/lib/utils";

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
        <LoadingState variant="grid" count={4} />
      </CustomerLayout>
    );
  }

  // Convert wishlist items to ProductGrid format
  const productGridItems = wishlistItems.map(item => ({
    id: item.product.id,
    name: item.product.name,
    price: item.product.price,
    image: item.product.image_url || undefined,
    inStock: getAvailableStock(item) > 0,
    category: item.product.category,
    tags: [item.product.fabric].filter(Boolean) as string[],
  }));

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
        {wishlistItems.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your Wishlist is Empty"
            description="Start saving products you love! Click the heart icon on any product to add it to your wishlist."
            action={{
              label: "Start Shopping",
              onClick: () => navigate("/shop"),
            }}
          />
        ) : (
          <>
            {/* Product Grid View */}
            <ProductGrid
              products={productGridItems}
              columns={4}
              onProductClick={(product) => navigate(`/product/${product.id}`)}
              onAddToCart={(product) => {
                const item = wishlistItems.find(i => i.product.id === product.id);
                if (item) handleMoveToCart(item);
              }}
              onWishlistToggle={(product) => {
                const item = wishlistItems.find(i => i.product.id === product.id);
                if (item) handleRemoveFromWishlist(item.id, item.product.id);
              }}
              wishlistedIds={new Set(wishlistItems.map(i => i.product.id))}
            />
          </>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerWishlist;

