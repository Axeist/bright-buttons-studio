import { useState, useEffect } from "react";
import { Leaf, Eye, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Product } from "@/types/product";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  onQuickView: () => void;
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const productId = typeof product.id === 'string' ? product.id : product.id.toString();

  useEffect(() => {
    if (user) {
      checkWishlist();
    }
  }, [user, productId]);

  const checkWishlist = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single();
      setIsWishlisted(!!data);
    } catch (error) {
      // Not in wishlist
      setIsWishlisted(false);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to save designs to your wishlist",
        variant: "destructive",
      });
      navigate("/customer/login");
      return;
    }

    setIsToggling(true);
    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) throw error;
        setIsWishlisted(false);
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your saved designs`,
        });
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert({
            user_id: user.id,
            product_id: productId,
          });

        if (error) throw error;
        setIsWishlisted(true);
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
    } finally {
      setIsToggling(false);
    }
  };
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-earth-50 dark:to-card">
        {product.image && product.image !== "/placeholder.svg" ? (
          <>
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
              <div className="text-center p-6">
                <Leaf className="w-12 h-12 text-primary-400 dark:text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">{product.technique}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6">
              <Leaf className="w-12 h-12 text-primary-400 dark:text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">{product.technique}</p>
            </div>
          </div>
        )}
        
        {/* Unique Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full backdrop-blur-sm">
            One of a Kind
          </span>
        </div>

        {/* Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleWishlist}
          disabled={isToggling}
          className={`absolute top-4 right-4 z-20 p-2.5 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isWishlisted
              ? "bg-destructive/90 text-white shadow-lg"
              : "bg-background/80 text-foreground hover:bg-background"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <motion.div
            animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart
              className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
            />
          </motion.div>
        </motion.button>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 z-10" />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.tagline}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
            {product.category}
          </span>
          <span className="px-2 py-1 bg-earth-100 dark:bg-earth-800/40 text-earth-800 dark:text-earth-300 text-xs rounded-full">
            {product.fabric}
          </span>
        </div>

        {/* Price */}
        {product.price && (
          <p className="text-lg font-semibold text-primary mb-4">{product.price}</p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-2 mt-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-full w-full sm:w-auto min-h-[44px]"
            onClick={onQuickView}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            className="flex-1 rounded-full bg-primary hover:bg-primary-700 text-white w-full sm:w-auto min-h-[44px]"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};
