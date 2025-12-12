import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
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

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
  }, [category]);

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
        .eq("category", decodeURIComponent(category || ""))
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
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
      return;
    }
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
        <div className="bg-gradient-to-br from-primary-50 to-earth-50 dark:from-primary-900/20 dark:to-card border-b border-border">
          <div className="container-custom py-8">
            <Link to="/shop">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-script text-gradient capitalize">
              {category?.replace(/-/g, " ")}
            </h1>
          </div>
        </div>

        <div className="container-custom py-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? "product" : "products"} found
            </p>
            <div className="flex items-center gap-3">
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
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

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
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
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
              <p className="text-muted-foreground">No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Category;
