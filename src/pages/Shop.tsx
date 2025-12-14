import { useState, useEffect } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Grid, List } from "lucide-react";
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
const fabrics = ['All', 'Silk', 'Cotton', 'Linen', 'Grape', 'Georgette', 'Tussar'];
const techniques = ['All', 'Eco printing', 'Tie & Dye', 'Shibori', 'Batik', 'Kalamkari'];

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFabric, setSelectedFabric] = useState("All");
  const [selectedTechnique, setSelectedTechnique] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlistIds();
    }
  }, [user]);

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
  const productGridItems = sortedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: getProductImageUrl(product) || undefined,
    inStock: getAvailableStock(product) > 0,
    category: product.category,
    tags: [product.fabric, product.technique].filter(Boolean) as string[],
  }));

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
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-50 to-earth-50 dark:from-primary-900/20 dark:to-card border-b border-border">
          <div className="container-custom py-8 md:py-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl lg:text-5xl font-script text-gradient mb-4"
            >
              Shop Our Collection
            </motion.h1>
            <p className="text-muted-foreground max-w-2xl">
              Discover unique, handcrafted eco-printed clothing. Each piece is one-of-a-kind.
            </p>
          </div>
        </div>

        <div className="container-custom py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
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

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Search and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-full"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 px-4 rounded-full border border-input bg-background text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>

                  <div className="flex gap-2 border rounded-full p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

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
                <ProductGrid
                  products={productGridItems}
                  columns={viewMode === "grid" ? 3 : 1}
                  onProductClick={(product) => navigate(`/product/${product.id}`)}
                  onAddToCart={(product) => {
                    const originalProduct = products.find(p => p.id === product.id);
                    if (originalProduct) handleAddToCart(originalProduct);
                  }}
                  onWishlistToggle={(product) => {
                    const originalProduct = products.find(p => p.id === product.id);
                    if (originalProduct) toggleWishlist(originalProduct);
                  }}
                  wishlistedIds={wishlistIds}
                />
              )}

              {/* Results Count */}
              {!loading && sortedProducts.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  Showing {sortedProducts.length} of {products.length} products
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Shop;
