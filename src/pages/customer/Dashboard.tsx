import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Package, ShoppingBag, Star, Gift, User, MapPin, CreditCard, TrendingUp, ArrowRight,
  Calendar, Award, Target, BarChart3, PieChart, Activity, Clock, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

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
  // Analytics data
  monthlySpending: Array<{ month: string; amount: number }>;
  categorySpending: Array<{ category: string; amount: number; count: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  orderStatusDistribution: Array<{ status: string; count: number }>;
  thisMonthSpent: number;
  lastMonthSpent: number;
  avgOrderValue: number;
  daysSinceLastOrder: number | null;
  pointsToNextTier: number;
  totalDiscounts: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const CustomerDashboard = () => {
  const { customer, loading: customerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "month" | "3months" | "year">("month");
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    loyaltyTier: "bronze",
    recentOrders: [],
    monthlySpending: [],
    categorySpending: [],
    topProducts: [],
    orderStatusDistribution: [],
    thisMonthSpent: 0,
    lastMonthSpent: 0,
    avgOrderValue: 0,
    daysSinceLastOrder: null,
    pointsToNextTier: 0,
    totalDiscounts: 0,
  });

  useEffect(() => {
    if (!customerLoading && !customer) {
      navigate("/customer/login");
      return;
    }
    if (customer) {
      fetchData();
    }
  }, [customer, customerLoading, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today": {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        return { start: todayStart.toISOString(), end: new Date().toISOString() };
      }
      case "month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart.toISOString(), end: new Date().toISOString() };
      }
      case "3months": {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start: threeMonthsAgo.toISOString(), end: new Date().toISOString() };
      }
      case "year": {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart.toISOString(), end: new Date().toISOString() };
      }
      default: {
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: defaultStart.toISOString(), end: new Date().toISOString() };
      }
    }
  };

  const fetchData = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Fetch orders filtered by date range
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, status, total_amount, created_at, discount_amount")
        .eq("customer_id", customer.id)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });

      // Fetch order items
      const orderIds = orders?.map(o => o.id) || [];
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          product_name,
          quantity,
          unit_price,
          order_id,
          product_id,
          orders!inner(created_at)
        `)
        .in("order_id", orderIds);

      // Fetch product categories separately for items that have product_id
      const productIds = orderItems?.filter((item: any) => item.product_id).map((item: any) => item.product_id) || [];
      let products: any[] = [];
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, category")
          .in("id", productIds);
        products = productsData || [];
      }
      
      const productCategoryMap = new Map<string, string>();
      products.forEach((p: any) => {
        productCategoryMap.set(p.id, p.category);
      });

      // Calculate monthly spending based on date range
      const monthlyData = new Map<string, number>();
      const now = new Date();
      const { start: rangeStart } = getDateRange();
      const startDate = new Date(rangeStart);
      
      // Determine number of months to show based on date range
      let monthsToShow = 6;
      if (dateRange === "today") {
        monthsToShow = 1; // Show just today
      } else if (dateRange === "month") {
        monthsToShow = 1;
      } else if (dateRange === "3months") {
        monthsToShow = 3;
      } else if (dateRange === "year") {
        monthsToShow = 12;
      }

      // Generate month keys
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData.set(monthKey, 0);
      }

      // For "today", show hourly data instead
      if (dateRange === "today") {
        monthlyData.clear(); // Clear month data
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        for (let i = 0; i < 24; i++) {
          const hour = new Date(todayStart.getTime() + i * 60 * 60 * 1000);
          const hourKey = hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          monthlyData.set(hourKey, 0);
        }
        
        orders?.forEach(order => {
          const orderDate = new Date(order.created_at);
          const hourKey = orderDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          if (monthlyData.has(hourKey)) {
            monthlyData.set(hourKey, (monthlyData.get(hourKey) || 0) + order.total_amount);
          }
        });
      } else {
        orders?.forEach(order => {
          const date = new Date(order.created_at);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + order.total_amount);
          }
        });
      }

      const monthlySpending = Array.from(monthlyData.entries()).map(([month, amount]) => ({
        month,
        amount: Math.round(amount)
      }));

      // Calculate category spending
      const categoryMap = new Map<string, { amount: number; count: number }>();
      orderItems?.forEach((item: any) => {
        const category = item.product_id ? (productCategoryMap.get(item.product_id) || "Uncategorized") : "Uncategorized";
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        categoryMap.set(category, {
          amount: existing.amount + (item.unit_price * item.quantity),
          count: existing.count + item.quantity
        });
      });

      const categorySpending = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount);

      // Top products
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      orderItems?.forEach((item: any) => {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.unit_price * item.quantity)
        });
      });

      const topProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Order status distribution
      const statusMap = new Map<string, number>();
      orders?.forEach(order => {
        statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
      });

      const orderStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count
      }));

      // Calculate current period vs previous period for comparison
      const { start: currentStart } = getDateRange();
      const currentPeriodStart = new Date(currentStart);
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;

      if (dateRange === "today") {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        previousPeriodStart = yesterday;
        previousPeriodEnd = new Date(yesterday);
        previousPeriodEnd.setHours(23, 59, 59, 999);
      } else if (dateRange === "month") {
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      } else if (dateRange === "3months") {
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59, 999);
      } else { // year
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      }

      const thisMonthSpent = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      
      // Fetch previous period data for comparison
      const { data: previousOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("customer_id", customer.id)
        .gte("created_at", previousPeriodStart.toISOString())
        .lte("created_at", previousPeriodEnd.toISOString());

      const lastMonthSpent = previousOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

      // Average order value
      const avgOrderValue = orders && orders.length > 0 
        ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length 
        : 0;

      // Days since last order
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

      // Total discounts
      const totalDiscounts = orders?.reduce((sum, o) => sum + (o.discount_amount || 0), 0) || 0;

      // Calculate stats for the filtered period
      const totalOrdersInPeriod = orders?.length || 0;
      const totalSpentInPeriod = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

      setStats({
        totalOrders: totalOrdersInPeriod,
        totalSpent: totalSpentInPeriod,
        loyaltyPoints: customer.loyalty_points || 0,
        loyaltyTier: customer.loyalty_tier || "bronze",
        recentOrders: orders?.slice(0, 5) || [],
        monthlySpending,
        categorySpending,
        topProducts,
        orderStatusDistribution,
        thisMonthSpent: Math.round(thisMonthSpent),
        lastMonthSpent: Math.round(lastMonthSpent),
        avgOrderValue: Math.round(avgOrderValue),
        daysSinceLastOrder,
        pointsToNextTier,
        totalDiscounts: Math.round(totalDiscounts),
      });
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

  const spendingChange = stats.lastMonthSpent > 0 
    ? ((stats.thisMonthSpent - stats.lastMonthSpent) / stats.lastMonthSpent * 100).toFixed(1)
    : "0";

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
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Welcome back, {customer?.email?.split("@")[0] || customer?.name || "Customer"}!
          </p>
          {/* Date Range Selector */}
          <div className="flex gap-2">
            {[
              { key: "today", label: "Today" },
              { key: "month", label: "Month" },
              { key: "3months", label: "3 Months" },
              { key: "year", label: "Year" }
            ].map((range) => (
              <Button
                key={range.key}
                variant={dateRange === range.key ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range.key as typeof dateRange)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Stats Grid */}
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
              <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.avgOrderValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per order average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.thisMonthSpent.toLocaleString()}</div>
              <p className={`text-xs flex items-center gap-1 ${
                parseFloat(spendingChange) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(spendingChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(spendingChange))}% vs last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Spending Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Spending Trend
              </CardTitle>
              <CardDescription>
                {dateRange === "today" 
                  ? "Your spending today by hour" 
                  : dateRange === "month"
                  ? "Your spending this month"
                  : dateRange === "3months"
                  ? "Your spending over the last 3 months"
                  : "Your spending this year"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.monthlySpending.length > 0 && stats.monthlySpending.some(m => m.amount > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.monthlySpending}>
                    <defs>
                      <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spending']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10b981" 
                      fillOpacity={1}
                      fill="url(#colorSpending)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No spending data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Order Status
              </CardTitle>
              <CardDescription>Distribution of your orders</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.orderStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={stats.orderStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No order data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Category Spending */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Top Products */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Products
              </CardTitle>
              <CardDescription>Your most purchased items</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip 
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No product data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Spending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Category Spending
              </CardTitle>
              <CardDescription>By category</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.categorySpending.length > 0 ? (
                <div className="space-y-4">
                  {stats.categorySpending.slice(0, 5).map((cat, index) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-muted-foreground">₹{cat.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(cat.amount / stats.categorySpending[0].amount) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Progress & Insights */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Loyalty Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
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

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Discounts</span>
                  <span className="font-semibold">₹{stats.totalDiscounts.toLocaleString()}</span>
                </div>
                {stats.daysSinceLastOrder !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Order</span>
                    <span className="font-semibold">{stats.daysSinceLastOrder} days ago</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Quick Insights
              </CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalOrders}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Orders</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">₹{stats.avgOrderValue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg Order</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.loyaltyPoints}</div>
                  <div className="text-xs text-muted-foreground mt-1">Loyalty Points</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.categorySpending.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Categories</div>
                </div>
              </div>
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
                      <div className="text-right">
                        <p className="font-semibold">₹{order.total_amount.toLocaleString()}</p>
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
    </CustomerLayout>
  );
};

export default CustomerDashboard;
