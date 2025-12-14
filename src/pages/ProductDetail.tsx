import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, Share2, Check, Leaf, Star, ArrowLeft, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductReviews } from "@/components/ProductReviews";

interface Product {
  id: string;
  name: string;
  description: string | null;
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
}

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
      if (user) {
        checkWishlist();
      }
    }
  }, [id, user]);

  const fetchProduct = async () => {
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
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      navigate("/shop");
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!user || !id) return;
    try {
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .single();

      setIsWishlisted(!!data);
    } catch (error) {
      // Not in wishlist
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to save designs to your wishlist",
        variant: "destructive",
      });
      navigate("/customer/login");
      return;
    }

    if (!id) return;

    setIsToggling(true);
    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);

        if (error) throw error;
        setIsWishlisted(false);
        toast({
          title: "Removed from wishlist",
          description: `${product?.name} has been removed from your saved designs`,
        });
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert({
            user_id: user.id,
            product_id: id,
          });

        if (error) throw error;
        setIsWishlisted(true);
        toast({
          title: "Saved to wishlist",
          description: `${product?.name} has been saved to your wishlist`,
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

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedSize && sizes.length > 0) {
      toast({
        title: "Select size",
        description: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    const availableStock = getAvailableStock();
    if (quantity > availableStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${availableStock} available`,
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < quantity; i++) {
      await addToCart(product.id, 1, selectedSize);
    }
  };

  const getAvailableStock = () => {
    if (!product?.inventory) return 0;
    // Handle both array and object formats from Supabase
    const inventory = Array.isArray(product.inventory) 
      ? product.inventory[0] 
      : product.inventory;
    if (!inventory) return 0;
    return inventory.quantity - (inventory.reserved_quantity || 0);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.tagline || "",
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Copied",
        description: "Link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Product not found</h2>
            <Link to="/shop" className="text-primary hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const productImages = [
    product.image_url,
    product.image_url, // In real app, you'd have multiple images
  ].filter(Boolean);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        <div className="container-custom py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-earth-50 rounded-xl overflow-hidden">
                {productImages[currentImageIndex] ? (
                  <img
                    src={productImages[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-earth-50 ${productImages[currentImageIndex] ? 'hidden' : ''}`}
                >
                  <div className="text-center p-8">
                    <Leaf className="w-20 h-20 text-primary-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-2">{product.name}</p>
                    {product.category && (
                      <p className="text-muted-foreground">{product.category}</p>
                    )}
                  </div>
                </div>
                {getAvailableStock() === 0 && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>

              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        currentImageIndex === index
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-earth-50 ${img ? 'hidden' : ''}`}
                      >
                        <Leaf className="w-6 h-6 text-primary-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-3">
                  {product.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-script text-gradient mb-3">
                  {product.name}
                </h1>
                {product.tagline && (
                  <p className="text-lg text-muted-foreground mb-4">
                    {product.tagline}
                  </p>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <p className="text-3xl font-bold text-primary">
                    ₹{product.price.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 fill-earth-400 text-earth-400"
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      (4.5)
                    </span>
                  </div>
                </div>
              </div>

              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Size Selection */}
              {sizes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Size <span className="text-destructive">*</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all min-w-[60px] ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-secondary text-secondary-foreground hover:bg-accent"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-semibold mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(getAvailableStock(), quantity + 1))}
                      disabled={quantity >= getAvailableStock()}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getAvailableStock()} available
                  </p>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-2 border-t border-b border-border py-4">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Handmade with care</span>
                </div>
                {product.technique && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">Technique: {product.technique}</span>
                  </div>
                )}
                {product.fabric && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">Fabric: {product.fabric}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">Each piece is unique</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full rounded-full h-14 text-lg"
                  onClick={handleAddToCart}
                  disabled={getAvailableStock() === 0 || (sizes.length > 0 && !selectedSize)}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className={`rounded-full w-full ${
                        isWishlisted
                          ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          : ""
                      }`}
                      onClick={toggleWishlist}
                      disabled={isToggling}
                    >
                      <motion.div
                        animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart
                          className={`w-5 h-5 mr-2 ${
                            isWishlisted ? "fill-destructive text-destructive" : ""
                          }`}
                        />
                      </motion.div>
                      <AnimatePresence mode="wait">
                        {isWishlisted ? (
                          <motion.span
                            key="saved"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                          >
                            Saved
                          </motion.span>
                        ) : (
                          <motion.span
                            key="save"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                          >
                            Save Design
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full w-full"
                      onClick={handleShare}
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Share
                    </Button>
                  </motion.div>
                </div>

                <WhatsAppButton
                  variant="inline"
                  className="w-full"
                  message={`Hi! I'm interested in ${product.name} (${product.category}) from Bright Buttons. Can you share more details?`}
                >
                  Enquire on WhatsApp
                </WhatsAppButton>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="size-guide">Size Guide</TabsTrigger>
                <TabsTrigger value="care">Care</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  {product.description ? (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      {product.tagline || "A beautiful handcrafted piece made with care and attention to detail."}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="size-guide" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Size Guide</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Size</th>
                          <th className="text-left p-2">Chest (inches)</th>
                          <th className="text-left p-2">Length (inches)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { size: "XS", chest: "34-36", length: "26" },
                          { size: "S", chest: "36-38", length: "27" },
                          { size: "M", chest: "38-40", length: "28" },
                          { size: "L", chest: "40-42", length: "29" },
                          { size: "XL", chest: "42-44", length: "30" },
                          { size: "XXL", chest: "44-46", length: "31" },
                        ].map((row) => (
                          <tr key={row.size} className="border-b">
                            <td className="p-2 font-medium">{row.size}</td>
                            <td className="p-2">{row.chest}</td>
                            <td className="p-2">{row.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    * Measurements are approximate. For custom sizing, please contact us.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="care" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Care Instructions</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Hand wash or cold machine wash with mild detergent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Air dry in shade - avoid direct sunlight</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Iron on reverse side at medium heat</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Do not bleach or use harsh chemicals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Store away from direct light to preserve colors</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <ProductReviews productId={product.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ProductDetail;
