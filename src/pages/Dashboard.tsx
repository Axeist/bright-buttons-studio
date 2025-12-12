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
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    whatsappOrders: 0,
    onlineOrders: 0,
    lowStockItems: [],
    topProducts: [],
    recentOrders: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // Today's orders
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("total_amount, status, source")
        .gte("created_at", todayStart);

      const todayRevenue = todayOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const todayOrdersCount = todayOrders?.length || 0;
      const avgOrderValue = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;
      const onlineOrdersCount = todayOrders?.filter(o => o.source === "online").length || 0;

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

      // Top products (from order items)
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, order_id, orders(created_at)")
        .gte("orders.created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const productSales = new Map<string, { sales: number; revenue: number }>();
      orderItems?.forEach(item => {
        const existing = productSales.get(item.product_name) || { sales: 0, revenue: 0 };
        productSales.set(item.product_name, {
          sales: existing.sales + item.quantity,
          revenue: existing.revenue + (item.unit_price * item.quantity),
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

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
        whatsappOrders: 0, // Deprecated, kept for compatibility
        onlineOrders: onlineOrdersCount,
        lowStockItems,
        topProducts,
        recentOrders: recentOrdersData || [],
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayStats = [
    { 
      title: "Today's Revenue", 
      value: `₹${stats.todayRevenue.toLocaleString()}`, 
      change: "+12%",
      icon: DollarSign,
      color: "from-primary to-primary-700",
      iconBg: "bg-primary/20",
      iconColor: "text-primary"
    },
    { 
      title: "Orders Today", 
      value: stats.todayOrders.toString(), 
      change: "+3",
      icon: ShoppingBag,
      color: "from-earth-400 to-earth-600",
      iconBg: "bg-earth-100 dark:bg-earth-900/40",
      iconColor: "text-earth-600 dark:text-earth-400"
    },
    { 
      title: "Avg Order Value", 
      value: `₹${Math.round(stats.avgOrderValue).toLocaleString()}`, 
      change: "+5%",
      icon: TrendingUp,
      color: "from-primary-500 to-primary-700",
      iconBg: "bg-primary/20",
      iconColor: "text-primary"
    },
    { 
      title: "Online Orders", 
      value: stats.onlineOrders.toString(), 
      change: "Today",
      icon: Package,
      color: "from-blue-500 to-blue-700",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
  ];

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

  return (
    <AdminLayout title="Dashboard">
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

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-script text-gradient">Sales Overview</h2>
          </div>
          <div className="h-64 bg-gradient-to-br from-primary-50 via-earth-50 to-blush-50 dark:from-primary-900/20 dark:via-earth-900/20 dark:to-blush-900/20 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/20 dark:border-primary-800/30 relative overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"
            />
            <div className="text-center relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <TrendingUp className="w-16 h-16 text-primary/40 mx-auto mb-4" />
              </motion.div>
              <p className="text-muted-foreground font-medium">Sales chart will be displayed here</p>
              <p className="text-sm text-muted-foreground/70 mt-2">Integration with charting library pending</p>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Low Stock */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
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
