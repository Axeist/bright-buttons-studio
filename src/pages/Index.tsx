import { PublicLayout } from "@/layouts/PublicLayout";
import { Hero } from "@/components/landing/Hero";
import { StorySection } from "@/components/landing/StorySection";
import { CollectionsSection } from "@/components/landing/CollectionsSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FounderSection } from "@/components/landing/FounderSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { RecentlyViewed } from "@/components/ecommerce";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchWishlistIds();
    }
  }, [user]);

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

  const handleAddToCart = async (product: any) => {
    if (!user) {
      navigate("/customer/login");
      return;
    }
    await addToCart(product.id, 1);
  };

  const handleWishlistToggle = async (product: any) => {
    if (!user) {
      navigate("/customer/login");
      return;
    }
    const isWishlisted = wishlistIds.has(product.id);
    try {
      if (isWishlisted) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
      } else {
        await supabase
          .from("wishlist")
          .insert({
            user_id: user.id,
            product_id: product.id,
          });
        setWishlistIds((prev) => new Set(prev).add(product.id));
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  return (
    <PublicLayout>
      <Hero />
      <StorySection />
      <CollectionsSection />
      <ProcessSection />
      <TestimonialsSection />
      <FounderSection />
      <div className="container-custom py-16">
        <RecentlyViewed
          onProductClick={(product) => navigate(`/product/${product.id}`)}
          onAddToCart={handleAddToCart}
          onWishlistToggle={handleWishlistToggle}
          wishlistedIds={wishlistIds}
          maxItems={4}
        />
      </div>
      <FAQSection />
      <ContactSection />
    </PublicLayout>
  );
};

export default Index;
