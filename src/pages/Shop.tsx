import { useState, useEffect } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart } from "lucide-react";

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
  };
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
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

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
    return matchesSearch && matchesCategory && matchesFabric && matchesTechnique;
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
    await addToCart(product.id, 1);
  };

  const getAvailableStock = (product: Product) => {
    const qty = product.inventory?.quantity || 0;
    const reserved = product.inventory?.reserved_quantity || 0;
    return qty - reserved;
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
          {/* Search and Filters Bar */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-xl"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-4 rounded-xl border border-input bg-background text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>

              <div className="flex gap-2 ml-auto">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-xl"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-xl"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-card border border-border rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Badge
                          key={cat}
                          variant={selectedCategory === cat ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fabric</label>
                    <div className="flex flex-wrap gap-2">
                      {fabrics.map((fabric) => (
                        <Badge
                          key={fabric}
                          variant={selectedFabric === fabric ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedFabric(fabric)}
                        >
                          {fabric}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Technique</label>
                    <div className="flex flex-wrap gap-2">
                      {techniques.map((tech) => (
                        <Badge
                          key={tech}
                          variant={selectedTechnique === tech ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedTechnique(tech)}
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Active Filters */}
            {(selectedCategory !== "All" || selectedFabric !== "All" || selectedTechnique !== "All") && (
              <div className="flex flex-wrap gap-2">
                {selectedCategory !== "All" && (
                  <Badge variant="secondary" className="gap-2">
                    {selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedCategory("All")}
                    />
                  </Badge>
                )}
                {selectedFabric !== "All" && (
                  <Badge variant="secondary" className="gap-2">
                    {selectedFabric}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedFabric("All")}
                    />
                  </Badge>
                )}
                {selectedTechnique !== "All" && (
                  <Badge variant="secondary" className="gap-2">
                    {selectedTechnique}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedTechnique("All")}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Products Grid/List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : sortedProducts.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {sortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={viewMode === "grid" ? "" : "flex gap-4 bg-card rounded-xl p-4 border border-border"}
                >
                  <Link
                    to={`/product/${product.id}`}
                    className={viewMode === "grid" ? "block group" : "flex-shrink-0 w-32 h-32"}
                  >
                    <div
                      className={
                        viewMode === "grid"
                          ? "relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50 rounded-xl mb-3"
                          : "w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50"
                      }
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-muted-foreground text-sm">{product.name}</p>
                        </div>
                      )}
                      {getAvailableStock(product) === 0 && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className={viewMode === "grid" ? "" : "flex-1"}>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold text-foreground mb-1 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {product.tagline}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Link to={`/category/${encodeURIComponent(product.category)}`}>
                        <Badge variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                          {product.category}
                        </Badge>
                      </Link>
                      {product.fabric && (
                        <Badge variant="outline" className="text-xs">
                          {product.fabric}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">
                        ₹{product.price.toLocaleString()}
                      </p>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        disabled={getAvailableStock(product) === 0}
                        className="rounded-full"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}

          {/* Results Count */}
          {!loading && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {sortedProducts.length} of {products.length} products
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Shop;
