import { useEffect, useState } from "react";
import { ProductGrid } from "./ProductGrid";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProductImageUrl } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  category?: string;
  fabric?: string | null;
  technique?: string | null;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  };
  product_photos?: Array<{ image_url: string }>;
}

interface RecentlyViewedProps {
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onWishlistToggle?: (product: Product) => void;
  wishlistedIds?: Set<string>;
  maxItems?: number;
  className?: string;
}

const STORAGE_KEY = "bright_buttons_recently_viewed";

export const RecentlyViewed = ({
  onProductClick,
  onAddToCart,
  onWishlistToggle,
  wishlistedIds,
  maxItems = 4,
  className,
}: RecentlyViewedProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }

      const productIds: string[] = JSON.parse(stored);
      if (productIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          inventory (
            quantity,
            reserved_quantity
          ),
          product_photos (
            image_url
          )
        `)
        .eq("status", "active")
        .in("id", productIds.slice(0, maxItems))
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Sort by view order
      const sorted = productIds
        .map(id => data?.find(p => p.id === id))
        .filter(Boolean) as Product[];

      setProducts(sorted);
    } catch (error) {
      console.error("Error loading recently viewed:", error);
    } finally {
      setLoading(false);
    }
  };


  if (loading || products.length === 0) return null;

  const productGridItems = products.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: getProductImageUrl(product) || undefined,
    inStock: (() => {
      const inv = product.inventory;
      return (inv?.quantity || 0) - (inv?.reserved_quantity || 0) > 0;
    })(),
    category: product.category,
    tags: [product.fabric, product.technique].filter(Boolean) as string[],
  }));

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          Recently Viewed
        </h2>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setProducts([]);
          }}
        >
          Clear History
        </Button>
      </div>
      <ProductGrid
        products={productGridItems}
        columns={4}
        onProductClick={onProductClick}
        onAddToCart={onAddToCart}
        onWishlistToggle={onWishlistToggle}
        wishlistedIds={wishlistedIds}
      />
    </section>
  );
};

// Helper function to add product to recently viewed (call this from product pages)
export const addToRecentlyViewed = (productId: string) => {
  try {
    const STORAGE_KEY = "bright_buttons_recently_viewed";
    const stored = localStorage.getItem(STORAGE_KEY);
    const productIds: string[] = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists
    const filtered = productIds.filter(id => id !== productId);
    
    // Add to beginning
    const updated = [productId, ...filtered].slice(0, 10); // Keep last 10
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving recently viewed:", error);
  }
};

