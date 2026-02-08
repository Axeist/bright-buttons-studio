import { useState, useEffect } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/lib/utils";
import {
  ProductGrid,
  ProductFilters,
  LoadingState,
  EmptyState,
  FilterChips,
  ProductSortDropdown,
  ProductViewToggle,
  ProductQuickViewModal,
} from "@/components/ecommerce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductPhoto {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  fabric: string | null;
  technique: string | null;
  image_url: string | null;
  tagline: string | null;
  price: number;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  } | Array<{
    quantity: number;
    reserved_quantity: number;
  }>;
  product_photos?: ProductPhoto[];
}

const categories = ['All', 'Kurthas & Co-ords', 'Sarees', 'Shawls', "Men's Shirts", 'T-Shirts', 'Kidswear'];

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFabric, setSelectedFabric] = useState("All");
  const [selectedTechnique, setSelectedTechnique] = useState("All");
  const [fabricOptions, setFabricOptions] = useState<string[]>([]);
  const [techniqueOptions, setTechniqueOptions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [productRatings, setProductRatings] = useState<Map<string, { rating: number; reviewCount: number }>>(new Map());
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const load = async () => {
      const [fRes, tRes] = await Promise.all([
        supabase.from("fabric_options").select("name").order("display_order", { ascending: true }),
        supabase.from("technique_options").select("name").order("display_order", { ascending: true }),
      ]);
      if (!fRes.error) setFabricOptions((fRes.data || []).map((r) => r.name));
      if (!tRes.error) setTechniqueOptions((tRes.data || []).map((r) => r.name));
    };
    load();
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlistIds();
    }
  }, [user]);

  const fabrics = ['All', ...fabricOptions];
  const techniques = ['All', ...techniqueOptions];

  const fetchProducts = async () => {
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
            id,
            product_id,
            image_url,
            display_order,
            is_primary
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);

      // Fetch review ratings for all products
      if (data && data.length > 0) {
        const productIds = data.map(p => p.id);
        const { data: reviewsData } = await supabase
          .from("product_reviews")
          .select("product_id, rating")
          .in("product_id", productIds)
          .eq("is_approved", true);

        // Calculate average ratings
        const ratingsMap = new Map<string, { total: number; count: number }>();
        reviewsData?.forEach(review => {
          const existing = ratingsMap.get(review.product_id) || { total: 0, count: 0 };
          ratingsMap.set(review.product_id, {
            total: existing.total + review.rating,
            count: existing.count + 1
          });
        });

        // Store ratings in a way we can access later
        setProductRatings(new Map(
          Array.from(ratingsMap.entries()).map(([id, { total, count }]) => [
            id,
            { rating: total / count, reviewCount: count }
          ])
        ));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tagline?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesFabric = selectedFabric === "All" || product.fabric === selectedFabric;
    const matchesTechnique = selectedTechnique === "All" || product.technique === selectedTechnique;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesFabric && matchesTechnique && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to cart",
        variant: "destructive",
      });
      navigate("/customer/login");
      return;
    }
    await addToCart(product.id, 1);
  };

  const fetchWishlistIds = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id);
      
      if (data) {
        setWishlistIds(new Set(data.map((item) => item.product_id)));
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  const toggleWishlist = async (product: Product) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to save designs to your wishlist",
        variant: "destructive",
      });
      navigate("/customer/login");
      return;
    }

    const isWishlisted = wishlistIds.has(product.id);

    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (error) throw error;
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your saved designs`,
        });
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (error) throw error;
        setWishlistIds((prev) => new Set(prev).add(product.id));
        toast({
          title: "Saved to wishlist",
          description: `${product.name} has been saved to your wishlist`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update wishlist",
        variant: "destructive",
      });
    }
  };

  const getAvailableStock = (product: Product) => {
    const inventory = Array.isArray(product.inventory) 
      ? product.inventory[0] 
      : product.inventory;
    
    const qty = inventory?.quantity || 0;
    const reserved = inventory?.reserved_quantity || 0;
    return qty - reserved;
  };

  // Convert products to ProductGrid format
  const productGridItems = sortedProducts.map((product) => {
    const ratingData = productRatings.get(product.id);
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImageUrl(product) || undefined,
      inStock: getAvailableStock(product) > 0,
      category: product.category,
      tags: [product.fabric, product.technique].filter(Boolean) as string[],
      rating: ratingData?.rating,
      reviewCount: ratingData?.reviewCount,
    };
  });

  // Prepare filter options
  const categoryOptions = categories
    .filter(cat => cat !== "All")
    .map(cat => ({
      id: cat,
      label: cat,
      count: products.filter(p => p.category === cat).length,
    }));

  const fabricOptions = fabrics
    .filter(f => f !== "All")
    .map(f => ({
      id: f,
      label: f,
      count: products.filter(p => p.fabric === f).length,
    }));

  const handleCategoryChange = (categories: string[]) => {
    if (categories.length === 0 || categories.includes("All")) {
      setSelectedCategory("All");
    } else {
      setSelectedCategory(categories[0]);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSelectedFabric("All");
    setSelectedTechnique("All");
    setPriceRange([0, 10000]);
    setSearchQuery("");
  };

  // Build filter chips
  const filterChips = [
    ...(selectedCategory !== "All" ? [{ id: "cat", label: selectedCategory, type: "category" as const }] : []),
    ...(selectedFabric !== "All" ? [{ id: "fabric", label: selectedFabric, type: "fabric" as const }] : []),
    ...(selectedTechnique !== "All" ? [{ id: "technique", label: selectedTechnique, type: "technique" as const }] : []),
    ...(priceRange[0] > 0 || priceRange[1] < 10000 ? [{ id: "price", label: `₹${priceRange[0]} - ₹${priceRange[1]}`, type: "price" as const }] : []),
  ];

  const handleRemoveFilter = (chipId: string) => {
    switch (chipId) {
      case "cat":
        setSelectedCategory("All");
        break;
      case "fabric":
        setSelectedFabric("All");
        break;
      case "technique":
        setSelectedTechnique("All");
        break;
      case "price":
        setPriceRange([0, 10000]);
        break;
    }
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-emerald-50/40 dark:from-background dark:via-background dark:to-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-50/80 via-emerald-50/60 to-earth-50/60 dark:from-primary-900/25 dark:via-card dark:to-primary-900/25 border-b border-border/60">
          <div className="container-custom py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-script text-gradient mb-4">
                Shop Our Collection
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Discover unique, handcrafted eco-printed clothing. Each piece is one-of-a-kind, 
                carefully made with sustainable practices and traditional techniques.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-full bg-white/70 dark:bg-card/60 border border-primary/10 shadow-sm text-sm">
                  Slow fashion • Earth-friendly inks
                </span>
                <span className="px-4 py-2 rounded-full bg-white/70 dark:bg-card/60 border border-primary/10 shadow-sm text-sm">
                  Curated drops weekly
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <ProductFilters
                  categories={categoryOptions}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  selectedCategories={selectedCategory !== "All" ? [selectedCategory] : []}
                  onCategoryChange={handleCategoryChange}
                  onClearFilters={handleClearFilters}
                  isMobile={isMobile}
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-6">
              {/* Search and Sort Controls */}
              <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl p-4 border border-primary/10 shadow-lg shadow-primary/5">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 w-full sm:max-w-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emerald/5 rounded-full pointer-events-none" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-full h-11 border-primary/20 bg-white/90 dark:bg-card/80"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <ProductSortDropdown
                      value={sortBy}
                      onValueChange={setSortBy}
                    />
                    <ProductViewToggle
                      viewMode={viewMode}
                      onViewChange={setViewMode}
                    />
                  </div>
                </div>
              </div>

              {/* Filter Chips */}
              {filterChips.length > 0 && (
                <FilterChips
                  chips={filterChips}
                  onRemove={handleRemoveFilter}
                  onClearAll={handleClearFilters}
                />
              )}

              {/* Products */}
              {loading ? (
                <LoadingState variant="grid" count={8} />
              ) : productGridItems.length === 0 ? (
                <EmptyState
                  title="No products found"
                  description="Try adjusting your search terms or filters to find what you're looking for."
                  action={{
                    label: "Clear Filters",
                    onClick: handleClearFilters,
                  }}
                />
              ) : (
                <>
                  <ProductGrid
                    products={productGridItems}
                    columns={viewMode === "grid" ? 3 : 1}
                    onProductClick={(product) => navigate(`/product/${product.id}`)}
                    onQuickView={(product) => {
                      const originalProduct = products.find(p => p.id === product.id);
                      if (originalProduct) handleQuickView(originalProduct);
                    }}
                    onAddToCart={(product) => {
                      const originalProduct = products.find(p => p.id === product.id);
                      if (originalProduct) handleAddToCart(originalProduct);
                    }}
                    onWishlistToggle={(product) => {
                      const originalProduct = products.find(p => p.id === product.id);
                      if (originalProduct) toggleWishlist(originalProduct);
                    }}
                    onCompare={(product) => {
                      const currentIds = new URLSearchParams(window.location.search).get("compare")?.split(",").filter(Boolean) || [];
                      if (currentIds.length >= 4) {
                        toast({
                          title: "Limit Reached",
                          description: "You can compare up to 4 products at a time",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!currentIds.includes(product.id)) {
                        const newIds = [...currentIds, product.id];
                        navigate(`/compare?ids=${newIds.join(",")}`);
                      } else {
                        navigate("/compare");
                      }
                    }}
                    wishlistedIds={wishlistIds}
                  />
                  
                  {/* Quick View Modal */}
                  {quickViewProduct && (
                    <ProductQuickViewModal
                      product={quickViewProduct}
                      isOpen={isQuickViewOpen}
                      onClose={() => {
                        setIsQuickViewOpen(false);
                        setQuickViewProduct(null);
                      }}
                      onAddToCart={(qty, size) => {
                        handleAddToCart(quickViewProduct);
                      }}
                      onWishlistToggle={() => {
                        toggleWishlist(quickViewProduct);
                      }}
                      isWishlisted={wishlistIds.has(quickViewProduct.id)}
                      sizeOptions={["XS", "S", "M", "L", "XL", "XXL"]}
                    />
                  )}
                </>
              )}

              {/* Results Count */}
              {!loading && sortedProducts.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{sortedProducts.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{products.length}</span> products
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Shop;
