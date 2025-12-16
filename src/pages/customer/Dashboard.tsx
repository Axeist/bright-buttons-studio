import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, ShoppingBag, Star, Gift, Award, Clock, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/components/ecommerce/ProductGrid";
import { toast } from "@/hooks/use-toast";
import { 
  PieChart as RechartsPieChart, 
  Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

interface CustomerStats {
  totalOrders: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: string;
    created_at: string;
  }>;
  orderStatusDistribution: Array<{ status: string; count: number }>;
  daysSinceLastOrder: number | null;
  pointsToNextTier: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  tagline?: string;
  inStock?: boolean;
  isNew?: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const CustomerDashboard = () => {
  const { customer, loading: customerLoading } = useCustomerAuth();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    loyaltyPoints: 0,
    loyaltyTier: "bronze",
    recentOrders: [],
    orderStatusDistribution: [],
    daysSinceLastOrder: null,
    pointsToNextTier: 0,
  });
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!customerLoading && !customer) {
      navigate("/customer/login");
      return;
    }
    if (customer) {
      fetchData();
      fetchLatestProducts();
      fetchFeaturedProducts();
      if (user) {
        fetchWishlistIds();
      }
    }
  }, [customer, customerLoading, user]);

  const fetchData = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      // Fetch all orders (no date filtering needed)
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, status, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      // Order status distribution
      const statusMap = new Map<string, number>();
      orders?.forEach(order => {
        statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
      });

      const orderStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count
      }));

      // Days since last order
      const now = new Date();
      const lastOrder = orders?.[0];
      const daysSinceLastOrder = lastOrder 
        ? Math.floor((now.getTime() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Points to next tier
      const tierThresholds: Record<string, number> = { bronze: 0, silver: 1000, gold: 5000, platinum: 10000 };
      const currentTierPoints = customer.loyalty_points || 0;
      const currentTier = customer.loyalty_tier || "bronze";
      const nextTier = currentTier === 'bronze' ? 'silver' : 
                      currentTier === 'silver' ? 'gold' : 
                      currentTier === 'gold' ? 'platinum' : null;
      const pointsToNextTier = nextTier ? Math.max(0, tierThresholds[nextTier] - currentTierPoints) : 0;

      setStats({
        totalOrders: orders?.length || 0,
        loyaltyPoints: customer.loyalty_points || 0,
        loyaltyTier: customer.loyalty_tier || "bronze",
        recentOrders: orders?.slice(0, 5) || [],
        orderStatusDistribution,
        daysSinceLastOrder,
        pointsToNextTier,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          category,
          tagline,
          product_photos (
            image_url,
            is_primary
          ),
          inventory (
            quantity,
            reserved_quantity
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;

      const products = (data || []).map((product: any) => {
        const inventory = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
        const availableStock = (inventory?.quantity || 0) - (inventory?.reserved_quantity || 0);
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          tagline: product.tagline,
          image: product.product_photos?.find((p: any) => p.is_primary)?.image_url || 
                 product.product_photos?.[0]?.image_url || 
                 null,
          inStock: availableStock > 0,
          isNew: true, // Mark as new for latest products
        };
      });

      setLatestProducts(products);
    } catch (error) {
      console.error("Error fetching latest products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          category,
          tagline,
          product_photos (
            image_url,
            is_primary
          ),
          inventory (
            quantity,
            reserved_quantity
          )
        `)
        .eq("status", "active")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;

      const products = (data || []).map((product: any) => {
        const inventory = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
        const availableStock = (inventory?.quantity || 0) - (inventory?.reserved_quantity || 0);
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          tagline: product.tagline,
          image: product.product_photos?.find((p: any) => p.is_primary)?.image_url || 
                 product.product_photos?.[0]?.image_url || 
                 null,
          inStock: availableStock > 0,
        };
      });

      setFeaturedProducts(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
  };

  const fetchWishlistIds = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id);

      if (data) {
        setWishlistIds(new Set(data.map(item => item.product_id)));
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "from-purple-500 to-purple-700";
      case "gold":
        return "from-yellow-500 to-yellow-700";
      case "silver":
        return "from-gray-400 to-gray-600";
      default:
        return "from-orange-500 to-orange-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-primary/10 text-primary border-primary/20";
      case "processing":
        return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400";
      case "confirmed":
        return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

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

  const handleWishlistToggle = async (product: Product) => {
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

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome Home
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {customer?.email?.split("@")[0] || customer?.name || "Customer"}!
          </p>
        </div>

        {/* Stats Grid - No Money Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.loyaltyPoints}</div>
              <p className="text-xs text-muted-foreground">Available points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Tier</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stats.loyaltyTier}</div>
              <p className="text-xs text-muted-foreground">Current membership</p>
            </CardContent>
          </Card>

          {stats.daysSinceLastOrder !== null && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Order</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.daysSinceLastOrder}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.daysSinceLastOrder === 0 ? "Today" : `${stats.daysSinceLastOrder} days ago`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Latest Products Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Latest Products
                </CardTitle>
                <CardDescription>Discover our newest arrivals</CardDescription>
              </div>
              <Link to="/shop">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : latestProducts.length > 0 ? (
              <ProductGrid
                products={latestProducts}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
                onWishlistToggle={handleWishlistToggle}
                wishlistedIds={wishlistIds}
                columns={4}
              />
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    Featured Products
                  </CardTitle>
                  <CardDescription>Handpicked favorites for you</CardDescription>
                </div>
                <Link to="/shop">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <ProductGrid
                products={featuredProducts}
                onProductClick={handleProductClick}
                onAddToCart={handleAddToCart}
                onWishlistToggle={handleWishlistToggle}
                wishlistedIds={wishlistIds}
                columns={4}
              />
            </CardContent>
          </Card>
        )}

        {/* Loyalty Progress & Order Status */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Loyalty Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Loyalty Progress
              </CardTitle>
              <CardDescription>Your tier status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg bg-gradient-to-br ${getTierColor(stats.loyaltyTier)} text-white`}>
                <div className="text-sm opacity-90">Current Tier</div>
                <div className="text-2xl font-bold capitalize">{stats.loyaltyTier}</div>
                <div className="text-sm mt-2 opacity-90">{stats.loyaltyPoints} points</div>
              </div>
              
              {stats.pointsToNextTier > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Points to {stats.loyaltyTier === 'bronze' ? 'Silver' : 
                           stats.loyaltyTier === 'silver' ? 'Gold' : 'Platinum'}</span>
                    <span>{stats.pointsToNextTier} points</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (stats.loyaltyPoints / (stats.loyaltyPoints + stats.pointsToNextTier)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {stats.daysSinceLastOrder !== null && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Order</span>
                    <span className="font-semibold">
                      {stats.daysSinceLastOrder === 0 
                        ? "Today" 
                        : `${stats.daysSinceLastOrder} day${stats.daysSinceLastOrder !== 1 ? 's' : ''} ago`}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Status Overview
              </CardTitle>
              <CardDescription>Distribution of your orders</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.orderStatusDistribution.length > 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={stats.orderStatusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.orderStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No order data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest purchases</CardDescription>
              </div>
              <Link to="/customer/orders">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/customer/orders/${order.id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Link to="/shop">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
