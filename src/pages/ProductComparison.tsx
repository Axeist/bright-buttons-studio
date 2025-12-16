import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ProductComparison as ProductComparisonComponent, EmptyState, LoadingState } from "@/components/ecommerce";
import { getProductImageUrl } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  fabric: string | null;
  technique: string | null;
  description: string | null;
  tagline: string | null;
  created_at?: string;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  } | Array<{
    quantity: number;
    reserved_quantity: number;
  }>;
  product_photos?: Array<{
    image_url: string;
  }>;
}

const ProductComparisonPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [productRatings, setProductRatings] = useState<Map<string, { rating: number; reviewCount: number }>>(new Map());
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Get product IDs from URL params
  const productIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  useEffect(() => {
    if (productIds.length > 0) {
      fetchProducts(productIds);
    }
  }, [searchParams]);

  const fetchProducts = async (ids: string[]) => {
    setLoading(true);
    try {
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
        .in("id", ids);

      if (error) throw error;
      setProducts(data || []);

      // Fetch ratings for products
      if (data && data.length > 0) {
        const productIds = data.map(p => p.id);
        const { data: reviewsData } = await supabase
          .from("product_reviews")
          .select("product_id, rating")
          .in("product_id", productIds)
          .eq("is_approved", true);

        // Store ratings in a way we can access later
        if (reviewsData) {
          const ratingsMap = new Map<string, { rating: number; reviewCount: number }>();
          reviewsData.forEach(review => {
            const existing = ratingsMap.get(review.product_id) || { rating: 0, reviewCount: 0 };
            ratingsMap.set(review.product_id, {
              rating: existing.rating + review.rating,
              reviewCount: existing.reviewCount + 1
            });
          });

          // Calculate averages and store
          const finalRatings = new Map<string, { rating: number; reviewCount: number }>();
          ratingsMap.forEach((value, productId) => {
            finalRatings.set(productId, {
              rating: value.rating / value.reviewCount,
              reviewCount: value.reviewCount
            });
          });

          setProductRatings(finalRatings);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products for comparison",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
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
        .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const handleAddToComparison = (productId: string) => {
    if (products.length >= 4) {
      toast({
        title: "Limit Reached",
        description: "You can compare up to 4 products at a time",
        variant: "destructive",
      });
      return;
    }

    if (products.some(p => p.id === productId)) {
      toast({
        title: "Already Added",
        description: "This product is already in the comparison",
      });
      return;
    }

    const newIds = [...productIds, productId];
    setSearchParams({ ids: newIds.join(",") });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveFromComparison = (productId: string) => {
    const newIds = productIds.filter(id => id !== productId);
    if (newIds.length > 0) {
      setSearchParams({ ids: newIds.join(",") });
    } else {
      setSearchParams({});
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to cart",
        variant: "destructive",
      });
      navigate("/customer/login");
      return;
    }
    await addToCart(productId, 1);
  };

  // Prepare products for comparison component
  const comparisonProducts = products.map(product => {
    const inventory = Array.isArray(product.inventory) 
      ? product.inventory[0] 
      : product.inventory;
    const availableStock = (inventory?.quantity || 0) - (inventory?.reserved_quantity || 0);
    const ratingData = productRatings.get(product.id);
    const rating = ratingData?.rating || 0;
    const reviewCount = ratingData?.reviewCount || 0;

    // Calculate if product is new (less than 30 days old)
    const isNew = product.created_at 
      ? (Date.now() - new Date(product.created_at).getTime()) < (30 * 24 * 60 * 60 * 1000)
      : false;

    // Format description/tagline (truncate if too long)
    const description = product.description || product.tagline || "N/A";
    const shortDescription = description.length > 100 
      ? description.substring(0, 100) + "..." 
      : description;

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImageUrl(product) || undefined,
      rating: rating,
      inStock: availableStock > 0,
      features: {
        "Category": product.category,
        "Fabric": product.fabric || "N/A",
        "Technique": product.technique || "N/A",
        "Description": shortDescription,
        "Price": `₹${product.price.toLocaleString()}`,
        "Rating": rating > 0 ? `${rating.toFixed(1)} (${reviewCount} review${reviewCount !== 1 ? "s" : ""})` : "No ratings yet",
        "In Stock": availableStock > 0 ? "Yes" : "No",
        "Stock Quantity": availableStock.toString(),
        "Availability": availableStock > 10 ? "In Stock" : availableStock > 0 ? `Only ${availableStock} left` : "Out of Stock",
        "New Arrival": isNew ? "Yes" : "No",
        "Delivery": "5-7 business days",
        "Free Shipping": product.price >= 500 ? "Yes (Over ₹500)" : "No",
        "Returns": "30 days return policy",
        "Care": "Hand wash recommended",
        "Material": `${product.fabric || "N/A"} - ${product.technique || "N/A"}`,
      },
    };
  });

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        <div className="container-custom py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/shop")}
            className="mb-6 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-script text-gradient mb-4">
              Compare Products
            </h1>
            <p className="text-muted-foreground">
              Select up to 4 products to compare their features side by side
            </p>
          </div>

          {/* Add Products Section */}
          {products.length < 4 && (
            <div className="mb-8">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search products to add to comparison..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  className="rounded-full"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-card max-h-64 overflow-y-auto">
                  <h3 className="font-semibold mb-3">Search Results</h3>
                  <div className="space-y-2">
                    {searchResults
                      .filter(p => !products.some(comp => comp.id === p.id))
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                          onClick={() => handleAddToComparison(product.id)}
                        >
                          <div className="flex items-center gap-3">
                            {getProductImageUrl(product) && (
                              <img
                                src={getProductImageUrl(product)!}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ₹{product.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full">
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comparison */}
          {loading ? (
            <LoadingState variant="detail" />
          ) : comparisonProducts.length === 0 ? (
            <EmptyState
              title="No Products to Compare"
              description="Add products from the search above to start comparing. You can compare up to 4 products at a time."
              action={{
                label: "Browse Products",
                onClick: () => navigate("/shop"),
              }}
            />
          ) : (
            <ProductComparisonComponent
              products={comparisonProducts}
              onRemove={handleRemoveFromComparison}
              onAddToCart={handleAddToCart}
            />
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default ProductComparisonPage;

