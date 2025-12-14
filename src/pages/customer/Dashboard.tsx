import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ShoppingBag, Star, Gift, User, MapPin, CreditCard, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
  }>;
}

const CustomerDashboard = () => {
  const { customer, loading: customerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    loyaltyTier: "bronze",
    recentOrders: [],
  });

  useEffect(() => {
    if (!customerLoading && !customer) {
      navigate("/customer/login");
      return;
    }
    if (customer) {
      fetchData();
    }
  }, [customer, customerLoading]);

  const fetchData = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      if (customer) {
        // Fetch orders
        const { data: orders } = await supabase
          .from("orders")
          .select("id, order_number, status, total_amount, created_at")
          .eq("customer_id", customer.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setStats({
          totalOrders: customer.total_orders || 0,
          totalSpent: customer.total_spent || 0,
          loyaltyPoints: customer.loyalty_points || 0,
          loyaltyTier: customer.loyalty_tier || "bronze",
          recentOrders: orders || [],
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
        <div className="mb-6">
          <p className="text-muted-foreground">
            Welcome back, {customer?.email?.split("@")[0] || customer?.name || "Customer"}!
          </p>
        </div>

          {/* Stats Grid */}
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
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">?{stats.totalSpent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Lifetime value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.loyaltyPoints}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.loyaltyTier.charAt(0).toUpperCase() + stats.loyaltyTier.slice(1)} Tier
                </p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${getTierColor(stats.loyaltyTier)} text-white`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Loyalty Tier</CardTitle>
                <Star className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{stats.loyaltyTier}</div>
                <p className="text-xs text-white/80">Member status</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
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
                            <div className="text-right">
                              <p className="font-semibold">?{order.total_amount.toLocaleString()}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
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

          </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
