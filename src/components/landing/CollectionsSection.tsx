import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { ProductQuickView } from "./ProductQuickView";
import { Button } from "@/components/ui/button";
import { getProductImageUrl } from "@/lib/utils";

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
  product_photos?: ProductPhoto[];
}

const categories = ['All', 'Kurthas & Co-ords', 'Sarees', 'Shawls', "Men's Shirts", 'T-Shirts', 'Kidswear'];

export const CollectionsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          category,
          fabric,
          technique,
          image_url,
          tagline,
          price,
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

  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <section id="collections" className="section-padding bg-background" ref={ref}>
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-script text-gradient mb-3 sm:mb-4">
            Handcrafted Collections
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Each piece tells a story through natural dyes, textures, and prints. 
            Discover your unique statement piece.
          </p>
          <Link to="/shop">
            <Button size="lg" className="rounded-full">
              View All Products
            </Button>
          </Link>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard
                  product={{
                    id: product.id as any,
                    name: product.name,
                    category: product.category as any,
                    fabric: product.fabric as any,
                    technique: product.technique as any,
                    image: getProductImageUrl(product) || "",
                    tagline: product.tagline || "",
                    price: `₹${product.price.toLocaleString()}`,
                  }}
                  onQuickView={() => setSelectedProduct(product)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}

        {/* Quick View Modal */}
        {selectedProduct && (
          <ProductQuickView
            product={{
              id: selectedProduct.id as any,
              name: selectedProduct.name,
              category: selectedProduct.category as any,
              fabric: selectedProduct.fabric as any,
              technique: selectedProduct.technique as any,
              image: getProductImageUrl(selectedProduct) || "",
              tagline: selectedProduct.tagline || "",
              price: `₹${selectedProduct.price.toLocaleString()}`,
            }}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </section>
  );
};
