import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { ArrowLeft, GitCompare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductReviews } from "@/components/ProductReviews";
import {
  ProductOverview,
  RelatedProducts,
  LoadingState,
  EmptyState,
  ProductBreadcrumbs,
  ProductShareModal,
  ProductSizeGuide,
  ProductStockCounter,
  ProductRating,
  ProductDeliveryInfo,
  RecentlyViewed,
  addToRecentlyViewed,
} from "@/components/ecommerce";
import { getProductImageUrl } from "@/lib/utils";
import { Check } from "lucide-react";

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
  product_photos?: ProductPhoto[];
}

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, refreshCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      fetchProduct();
      if (user) {
        checkWishlist();
        fetchWishlistIds();
      }
      // Track recently viewed
      addToRecentlyViewed(id);
    }
  }, [id, user]);

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

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

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
          ),
          product_photos (
            id,
            product_id,
            image_url,
            display_order,
            is_primary
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

  const fetchRelatedProducts = async () => {
    if (!product) return;
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
        .eq("category", product.category)
        .neq("id", product.id)
        .limit(4)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRelatedProducts(data || []);
    } catch (error) {
      console.error("Error fetching related products:", error);
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

  const handleAddToCart = async (qty: number, size?: string) => {
    if (!product) return;

    // Check stock availability first
    const availableStock = getAvailableStock();
    if (availableStock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please login",
        description: "You need to login to add items to cart",
        variant: "destructive",
      });
      navigate("/customer/login");
      return;
    }

    if (!size && sizes.length > 0) {
      toast({
        title: "Select size",
        description: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    if (qty > availableStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${availableStock} available`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Add all items at once instead of looping
      await addToCart(product.id, qty, size);
      
      // Refresh cart to get updated state
      await refreshCart();
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      // Error toast is already shown by addToCart in useCart hook
    }
  };

  const getAvailableStock = () => {
    if (!product?.inventory) return 0;
    const inventory = Array.isArray(product.inventory) 
      ? product.inventory[0] 
      : product.inventory;
    if (!inventory) return 0;
    return inventory.quantity - (inventory.reserved_quantity || 0);
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (loading) {
    return (
      <PublicLayout>
        <div className="container-custom py-6">
          <LoadingState variant="detail" />
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="container-custom py-6">
          <EmptyState
            title="Product not found"
            description="The product you're looking for doesn't exist or has been removed."
            action={{
              label: "Continue Shopping",
              onClick: () => navigate("/shop"),
            }}
          />
        </div>
      </PublicLayout>
    );
  }

  // Get product images from product_photos, fallback to image_url
  const productImages = (() => {
    if (product.product_photos && product.product_photos.length > 0) {
      const sortedPhotos = [...product.product_photos].sort((a, b) => a.display_order - b.display_order);
      return sortedPhotos.map(photo => photo.image_url);
    }
    return product.image_url ? [product.image_url] : [];
  })();

  // Prepare product data for ProductOverview
  const productOverviewData = {
    id: product.id,
    name: product.name,
    price: product.price,
    description: product.description || undefined,
    images: productImages,
    rating: 4.5, // You can fetch actual rating from reviews
    reviewCount: 0, // You can fetch actual count
    inStock: getAvailableStock() > 0,
    category: product.category,
    tags: [product.fabric, product.technique].filter(Boolean) as string[],
  };

  const inventory = Array.isArray(product.inventory) 
    ? product.inventory[0] 
    : product.inventory;

  // Prepare related products for RelatedProducts component
  const relatedProductsData = relatedProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: getProductImageUrl(p) || undefined,
    inStock: (() => {
      const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
      return (inv?.quantity || 0) - (inv?.reserved_quantity || 0) > 0;
    })(),
    category: p.category,
    tags: [p.fabric, p.technique].filter(Boolean) as string[],
  }));

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        <div className="container-custom py-6">
          {/* Breadcrumbs */}
          <ProductBreadcrumbs
            items={[
              { label: "Shop", href: "/shop" },
              { label: product.category, href: `/shop?category=${encodeURIComponent(product.category)}` },
              { label: product.name },
            ]}
            className="mb-6"
          />

          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Product Overview */}
          <div className="space-y-6">
            <ProductOverview
              product={productOverviewData}
              onAddToCart={handleAddToCart}
              onWishlistToggle={toggleWishlist}
              isWishlisted={isWishlisted}
              sizeOptions={sizes}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              requireSize={sizes.length > 0}
            />

            {/* Stock Counter and Rating */}
            <div className="flex flex-wrap items-center gap-4">
              {inventory && (
                <ProductStockCounter
                  quantity={inventory.quantity}
                  reserved={inventory.reserved_quantity}
                  lowStockThreshold={5}
                />
              )}
              <ProductRating
                rating={4.5}
                reviewCount={0}
                size="md"
                showCount={true}
              />
            </div>

            {/* Delivery Info */}
            <ProductDeliveryInfo
              estimatedDays={5}
              freeShippingThreshold={500}
              currentTotal={product.price}
            />
          </div>

          {/* Additional Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full flex-1"
              onClick={() => {
                const currentIds = new URLSearchParams(window.location.search).get("compare")?.split(",") || [];
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
            >
              <GitCompare className="w-5 h-5 mr-2" />
              Compare
            </Button>
            <ProductShareModal
              productName={product.name}
              productUrl={window.location.href}
              productImage={productImages[0]}
              description={product.tagline || product.description || undefined}
              trigger={
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full flex-1"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              }
            />
            <WhatsAppButton
              variant="inline"
              className="flex-1 rounded-full"
              message={`Hi! I'm interested in ${product.name} (${product.category}) from Bright Buttons. Can you share more details?`}
            >
              Enquire on WhatsApp
            </WhatsAppButton>
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
                  <ProductSizeGuide
                    sizes={[
                      { size: "XS", chest: "34-36", length: "26" },
                      { size: "S", chest: "36-38", length: "27" },
                      { size: "M", chest: "38-40", length: "28" },
                      { size: "L", chest: "40-42", length: "29" },
                      { size: "XL", chest: "42-44", length: "30" },
                      { size: "XXL", chest: "44-46", length: "31" },
                    ]}
                    title="Size Guide"
                    description="Find your perfect fit. Measurements are in inches."
                    trigger={
                      <Button variant="outline" className="rounded-full">
                        View Size Guide
                      </Button>
                    }
                  />
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

          {/* Related Products */}
          {relatedProductsData.length > 0 && (
            <div className="mt-16">
              <RelatedProducts
                products={relatedProductsData}
                title="You May Also Like"
                onProductClick={(product) => navigate(`/product/${product.id}`)}
                onAddToCart={(product) => {
                  const originalProduct = relatedProducts.find(p => p.id === product.id);
                  if (originalProduct) {
                    addToCart(originalProduct.id, 1);
                  }
                }}
                onViewAll={() => navigate(`/category/${encodeURIComponent(product.category)}`)}
              />
            </div>
          )}

          {/* Recently Viewed */}
          <div className="mt-16">
            <RecentlyViewed
              onProductClick={(product) => navigate(`/product/${product.id}`)}
              onAddToCart={(product) => {
                addToCart(product.id, 1);
              }}
              wishlistedIds={wishlistIds}
              onWishlistToggle={(product) => {
                const originalProduct = relatedProducts.find(p => p.id === product.id);
                if (originalProduct) {
                  toggleWishlist();
                }
              }}
              maxItems={4}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ProductDetail;
