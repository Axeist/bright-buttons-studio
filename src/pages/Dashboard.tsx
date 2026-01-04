import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ClipboardList,
  Loader2,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  PieChart,
  Activity,
  Award
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  whatsappOrders: number;
  onlineOrders: number;
  lowStockItems: Array<{ name: string; stock: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string | null;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  // New analytics
  monthlyRevenue: Array<{ period: string; revenue: number; orders: number }>;
  orderStatusDistribution: Array<{ status: string; count: number }>;
  paymentMethodDistribution: Array<{ method: string; count: number; revenue: number }>;
  categoryPerformance: Array<{ category: string; revenue: number; orders: number }>;
  newVsReturningCustomers: { new: number; returning: number };
  thisPeriodRevenue: number;
  lastPeriodRevenue: number;
  thisPeriodOrders: number;
  lastPeriodOrders: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "month" | "3months" | "year">("month");
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    whatsappOrders: 0,
    onlineOrders: 0,
    lowStockItems: [],
    topProducts: [],
    recentOrders: [],
    monthlyRevenue: [],
    orderStatusDistribution: [],
    paymentMethodDistribution: [],
    categoryPerformance: [],
    newVsReturningCustomers: { new: 0, returning: 0 },
    thisPeriodRevenue: 0,
    lastPeriodRevenue: 0,
    thisPeriodOrders: 0,
    lastPeriodOrders: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const now = new Date();
      
      // Fetch all orders in date range
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, total_amount, status, source, payment_method, created_at, customer_id, discount_amount")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });

      const orders = ordersData || [];
      const todayRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const todayOrdersCount = orders.length;
      const avgOrderValue = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;
      const onlineOrdersCount = orders.filter(o => o.source === "online").length;

      // Low stock items
      const { data: lowStockData } = await supabase
        .from("products")
        .select("name, low_stock_threshold, inventory(quantity)")
        .eq("status", "active");

      const lowStockItems = (lowStockData || [])
        .filter(p => (p.inventory?.[0]?.quantity || 0) <= (p.low_stock_threshold || 5))
        .map(p => ({
          name: p.name,
          stock: p.inventory?.[0]?.quantity || 0,
        }))
        .slice(0, 3);

      // Calculate monthly/daily revenue based on date range
      const revenueData = new Map<string, { revenue: number; orders: number }>();
      let periodsToShow = 6;
      let periodType: "day" | "month" = "month";
      
      if (dateRange === "today") {
        periodsToShow = 24; // Hours
        periodType = "day";
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now);
          hour.setHours(now.getHours() - i, 0, 0, 0);
          const hourKey = hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          revenueData.set(hourKey, { revenue: 0, orders: 0 });
        }
      } else if (dateRange === "month") {
        periodsToShow = 30; // Days
        periodType = "day";
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          revenueData.set(dateKey, { revenue: 0, orders: 0 });
        }
      } else if (dateRange === "3months") {
        periodsToShow = 3; // Months
        periodType = "month";
        for (let i = 2; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          revenueData.set(monthKey, { revenue: 0, orders: 0 });
        }
      } else { // year
        periodsToShow = 12; // Months
        periodType = "month";
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          revenueData.set(monthKey, { revenue: 0, orders: 0 });
        }
      }

      orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        let periodKey: string;
        
        if (dateRange === "today") {
          periodKey = orderDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        } else if (dateRange === "month") {
          periodKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          periodKey = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        if (revenueData.has(periodKey)) {
          const existing = revenueData.get(periodKey)!;
          revenueData.set(periodKey, {
            revenue: existing.revenue + order.total_amount,
            orders: existing.orders + 1,
          });
        }
      });

      const monthlyRevenue = Array.from(revenueData.entries()).map(([period, data]) => ({
        period,
        revenue: Math.round(data.revenue),
        orders: data.orders,
      }));

      // Order status distribution
      const statusMap = new Map<string, number>();
      orders.forEach(order => {
        statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
      });
      const orderStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      // Payment method distribution
      const paymentMap = new Map<string, { count: number; revenue: number }>();
      orders.forEach(order => {
        const method = order.payment_method || "unknown";
        const existing = paymentMap.get(method) || { count: 0, revenue: 0 };
        paymentMap.set(method, {
          count: existing.count + 1,
          revenue: existing.revenue + order.total_amount,
        });
      });
      const paymentMethodDistribution = Array.from(paymentMap.entries()).map(([method, data]) => ({
        method: method === "cash" ? "Cash" : method === "online" ? "Online" : method.charAt(0).toUpperCase() + method.slice(1),
        ...data,
      }));

      // Category performance and Top products
      const orderIds = orders.map(o => o.id);
      let orderItems: any[] = [];
      let categoryPerformance: Array<{ category: string; revenue: number; orders: number }> = [];
      let topProducts: Array<{ name: string; sales: number; revenue: number }> = [];
      
      if (orderIds.length > 0) {
        try {
          const { data: orderItemsData, error: orderItemsError } = await supabase
            .from("order_items")
            .select("product_id, quantity, unit_price, order_id, product_name")
            .in("order_id", orderIds);
          
          if (orderItemsError) {
            console.error("Error fetching order items:", orderItemsError);
          } else {
            orderItems = orderItemsData || [];
          }

          // Fetch product categories separately
          const productIds = orderItems.map((item: any) => item.product_id).filter(Boolean);
          let productsData: any[] = [];
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from("products")
              .select("id, category, name")
              .in("id", productIds);
            productsData = products || [];
          }

          const productMap = new Map<string, { category: string; name: string }>();
          productsData.forEach((p: any) => {
            productMap.set(p.id, { category: p.category, name: p.name });
          });

          // Category performance
          const categoryMap = new Map<string, { revenue: number; orders: Set<string> }>();
          orderItems.forEach((item: any) => {
            const productInfo = productMap.get(item.product_id) || { category: "Uncategorized", name: item.product_name };
            const category = productInfo.category || "Uncategorized";
            const existing = categoryMap.get(category) || { revenue: 0, orders: new Set<string>() };
            existing.orders.add(item.order_id);
            categoryMap.set(category, {
              revenue: existing.revenue + (item.unit_price * item.quantity),
              orders: existing.orders,
            });
          });
          categoryPerformance = Array.from(categoryMap.entries())
            .map(([category, data]) => ({
              category,
              revenue: Math.round(data.revenue),
              orders: data.orders.size,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

          // Top products
          const productSales = new Map<string, { sales: number; revenue: number }>();
          orderItems.forEach((item: any) => {
            const productInfo = productMap.get(item.product_id);
            const productName = item.product_name || productInfo?.name || "Unknown Product";
            const existing = productSales.get(productName) || { sales: 0, revenue: 0 };
            productSales.set(productName, {
              sales: existing.sales + item.quantity,
              revenue: existing.revenue + (item.unit_price * item.quantity),
            });
          });
          topProducts = Array.from(productSales.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        } catch (err) {
          console.error("Error processing order items:", err);
        }
      }

      // New vs Returning customers
      const customerIds = orders.map(o => o.customer_id).filter(Boolean) as string[];
      let customersData: any[] = [];
      if (customerIds.length > 0) {
        const { data: customersDataResult } = await supabase
          .from("customers")
          .select("id, total_orders")
          .in("id", customerIds);
        customersData = customersDataResult || [];
      }

      const newCustomers = customersData.filter(c => (c.total_orders || 0) <= 1).length;
      const returningCustomers = customersData.length - newCustomers;

      // Comparison with previous period
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
      } else {
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      }

      const { data: previousOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", previousPeriodStart.toISOString())
        .lte("created_at", previousPeriodEnd.toISOString());

      const lastPeriodRevenue = previousOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const lastPeriodOrders = previousOrders?.length || 0;

      // Recent orders
      const { data: recentOrdersData } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, total_amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        todayRevenue,
        todayOrders: todayOrdersCount,
        avgOrderValue,
        whatsappOrders: 0,
        onlineOrders: onlineOrdersCount,
        lowStockItems,
        topProducts,
        recentOrders: recentOrdersData || [],
        monthlyRevenue,
        orderStatusDistribution,
        paymentMethodDistribution,
        categoryPerformance,
        newVsReturningCustomers: { new: newCustomers, returning: returningCustomers },
        thisPeriodRevenue: todayRevenue,
        lastPeriodRevenue,
        thisPeriodOrders: todayOrdersCount,
        lastPeriodOrders,
      });
    } catch (error: any) {
      console.error("Dashboard data fetch error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
      // Set default values on error to prevent blank screen
      setStats({
        todayRevenue: 0,
        todayOrders: 0,
        avgOrderValue: 0,
        whatsappOrders: 0,
        onlineOrders: 0,
        lowStockItems: [],
        topProducts: [],
        recentOrders: [],
        monthlyRevenue: [],
        orderStatusDistribution: [],
        paymentMethodDistribution: [],
        categoryPerformance: [],
        newVsReturningCustomers: { new: 0, returning: 0 },
        thisPeriodRevenue: 0,
        lastPeriodRevenue: 0,
        thisPeriodOrders: 0,
        lastPeriodOrders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-primary/10 text-primary border-primary/20";
      case "ready": return "bg-earth-100 dark:bg-earth-900/40 text-earth-800 dark:text-earth-400 border-earth-300 dark:border-earth-700";
      case "processing": return "bg-blush-100 dark:bg-blush-900/40 text-blush-800 dark:text-blush-400 border-blush-300 dark:border-blush-700";
      case "confirmed": return "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-700";
      case "pending": return "bg-earth-200 dark:bg-earth-800/40 text-earth-800 dark:text-earth-300 border-earth-400 dark:border-earth-600";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const revenueChange = stats.lastPeriodRevenue > 0 
    ? ((stats.thisPeriodRevenue - stats.lastPeriodRevenue) / stats.lastPeriodRevenue * 100).toFixed(1)
    : "0";
  const ordersChange = stats.lastPeriodOrders > 0
    ? ((stats.thisPeriodOrders - stats.lastPeriodOrders) / stats.lastPeriodOrders * 100).toFixed(1)
    : "0";

  const displayStats = [
    { 
      title: dateRange === "today" ? "Today's Revenue" : dateRange === "month" ? "This Month Revenue" : dateRange === "3months" ? "Last 3 Months Revenue" : "This Year Revenue", 
      value: `₹${stats.thisPeriodRevenue.toLocaleString()}`, 
      change: `${parseFloat(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`,
      icon: DollarSign,
      color: "from-primary to-primary-700",
      iconBg: "bg-primary/20",
      iconColor: "text-primary"
    },
    { 
      title: dateRange === "today" ? "Orders Today" : dateRange === "month" ? "Orders This Month" : dateRange === "3months" ? "Orders (3M)" : "Orders This Year", 
      value: stats.thisPeriodOrders.toString(), 
      change: `${parseFloat(ordersChange) >= 0 ? '+' : ''}${ordersChange}%`,
      icon: ShoppingBag,
      color: "from-earth-400 to-earth-600",
      iconBg: "bg-earth-100 dark:bg-earth-900/40",
      iconColor: "text-earth-600 dark:text-earth-400"
    },
    { 
      title: "Avg Order Value", 
      value: `₹${Math.round(stats.avgOrderValue).toLocaleString()}`, 
      change: `${stats.onlineOrders} online`,
      icon: TrendingUp,
      color: "from-primary-500 to-primary-700",
      iconBg: "bg-primary/20",
      iconColor: "text-primary"
    },
    { 
      title: "Total Customers", 
      value: (stats.newVsReturningCustomers.new + stats.newVsReturningCustomers.returning).toString(), 
      change: `${stats.newVsReturningCustomers.new} new`,
      icon: Users,
      color: "from-blue-500 to-blue-700",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Header with Date Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Key insights and analytics at a glance</p>
        </div>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as typeof dateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="glass-card rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          >
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <motion.p
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="text-3xl font-bold text-foreground mb-2"
                  >
                    {stat.value}
                  </motion.p>
                  <div className="flex items-center gap-1">
                    {stat.change.includes("+") ? (
                      <ArrowUpRight className="w-4 h-4 text-primary" />
                    ) : stat.change.includes("-") ? (
                      <ArrowDownRight className="w-4 h-4 text-destructive" />
                    ) : null}
                    <span className={`text-sm font-semibold ${
                      stat.change.includes("+") ? "text-primary" : 
                      stat.change.includes("-") ? "text-destructive" : 
                      "text-muted-foreground"
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-14 h-14 rounded-2xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} shadow-lg`}
                >
                  <stat.icon className="w-7 h-7" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Revenue Trend</h2>
          </div>
          {stats.monthlyRevenue.length > 0 && stats.monthlyRevenue.some(m => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No revenue data available
            </div>
          )}
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Order Status</h2>
          </div>
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
        </motion.div>
      </div>

      {/* Payment Methods & Category Performance */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Method Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Payment Methods</h2>
          </div>
          {stats.paymentMethodDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.paymentMethodDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No payment data available
            </div>
          )}
        </motion.div>

        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Top Categories</h2>
          </div>
          {stats.categoryPerformance.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryPerformance.map((cat, index) => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">₹{cat.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(cat.revenue / stats.categoryPerformance[0].revenue) * 100}%`,
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
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-4">
        {/* Top Products Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold">Top Products</h2>
          </div>
          {stats.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No product data available
            </div>
          )}
        </motion.div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Customer Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-lg">Customer Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-800/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">New Customers</span>
                  <span className="text-lg font-bold text-primary">{stats.newVsReturningCustomers.new}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ 
                      width: `${((stats.newVsReturningCustomers.new / (stats.newVsReturningCustomers.new + stats.newVsReturningCustomers.returning || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Returning Customers</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.newVsReturningCustomers.returning}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${((stats.newVsReturningCustomers.returning / (stats.newVsReturningCustomers.new + stats.newVsReturningCustomers.returning || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-5">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertTriangle className="w-5 h-5 text-earth-400" />
              </motion.div>
              <h3 className="font-semibold text-foreground text-lg">Low Stock Alerts</h3>
            </div>
            <div className="space-y-3">
              {stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-earth-50/50 dark:bg-earth-900/20 border border-earth-200/50 dark:border-earth-800/30 hover:border-earth-400 dark:hover:border-earth-600 transition-colors"
                  >
                    <span className="text-sm text-foreground truncate pr-2 font-medium">{item.name}</span>
                    <span className="text-sm font-bold text-earth-600 dark:text-earth-400 flex-shrink-0 px-2 py-1 bg-earth-100 dark:bg-earth-900/40 rounded-full">
                      {item.stock} left
                    </span>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No low stock items</p>
              )}
            </div>
          </motion.div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-5">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Package className="w-5 h-5 text-primary" />
              </motion.div>
              <h3 className="font-semibold text-foreground text-lg">Top Products</h3>
            </div>
            <div className="space-y-3">
              {stats.topProducts.length > 0 ? (
                stats.topProducts.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="flex items-start justify-between p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-800/30 hover:border-primary-400 dark:hover:border-primary-600 transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center text-white text-sm font-bold shadow-md"
                      >
                        {index + 1}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.sales} sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary flex-shrink-0 ml-2">
                      ₹{item.revenue.toLocaleString()}
                    </span>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="glass-card rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-script text-gradient">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-200/50 dark:border-primary-800/30">
                <th className="text-left text-sm font-semibold text-muted-foreground pb-4">Order ID</th>
                <th className="text-left text-sm font-semibold text-muted-foreground pb-4">Customer</th>
                <th className="text-left text-sm font-semibold text-muted-foreground pb-4 hidden md:table-cell">Date</th>
                <th className="text-left text-sm font-semibold text-muted-foreground pb-4">Total</th>
                <th className="text-left text-sm font-semibold text-muted-foreground pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(var(--primary), 0.05)" }}
                    className="border-b border-primary-200/30 dark:border-primary-800/20 transition-colors"
                  >
                    <td className="py-4 text-sm font-semibold text-foreground">{order.order_number}</td>
                    <td className="py-4 text-sm text-foreground">{order.customer_name || "Walk-in"}</td>
                    <td className="py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-sm font-bold text-foreground">₹{order.total_amount.toLocaleString()}</td>
                    <td className="py-4">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </motion.span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No recent orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Dashboard;
