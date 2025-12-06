import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { TrendingUp, Package, Users, PieChart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const dateRanges = ["Today", "Week", "Month", "Custom"];

const Reports = () => {
  const [dateRange, setDateRange] = useState("Month");
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; sales: number; revenue: number }>>([]);
  const [topCustomers, setTopCustomers] = useState<Array<{ name: string; orders: number; spent: number }>>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ method: string; percentage: number; color: string }>>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "Today":
        return { start: new Date(now.setHours(0, 0, 0, 0)).toISOString(), end: new Date().toISOString() };
      case "Week":
        return { start: new Date(now.setDate(now.getDate() - 7)).toISOString(), end: new Date().toISOString() };
      case "Month":
        return { start: new Date(now.setMonth(now.getMonth() - 1)).toISOString(), end: new Date().toISOString() };
      default:
        return { start: new Date(now.setMonth(now.getMonth() - 1)).toISOString(), end: new Date().toISOString() };
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Fetch orders in date range
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, total_amount, payment_method, created_at")
        .gte("created_at", start)
        .lte("created_at", end);

      const totalRevenueValue = ordersData?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const totalOrdersValue = ordersData?.length || 0;
      setTotalRevenue(totalRevenueValue);
      setTotalOrders(totalOrdersValue);

      // Top products
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, order_id, orders(created_at)")
        .gte("orders.created_at", start)
        .lte("orders.created_at", end);

      const productSales = new Map<string, { sales: number; revenue: number }>();
      orderItems?.forEach(item => {
        const existing = productSales.get(item.product_name) || { sales: 0, revenue: 0 };
        productSales.set(item.product_name, {
          sales: existing.sales + item.quantity,
          revenue: existing.revenue + (item.unit_price * item.quantity),
        });
      });

      const topProductsData = Array.from(productSales.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(topProductsData);

      // Top customers
      const { data: customersData } = await supabase
        .from("customers")
        .select("name, total_orders, total_spent")
        .order("total_spent", { ascending: false })
        .limit(5);

      const topCustomersData = (customersData || []).map(c => ({
        name: c.name,
        orders: c.total_orders,
        spent: c.total_spent,
      }));

      setTopCustomers(topCustomersData);

      // Payment methods
      const paymentCounts = new Map<string, number>();
      ordersData?.forEach(order => {
        if (order.payment_method) {
          paymentCounts.set(order.payment_method, (paymentCounts.get(order.payment_method) || 0) + 1);
        }
      });

      const totalPayments = ordersData?.length || 1;
      const paymentMethodsData = Array.from(paymentCounts.entries())
        .map(([method, count]) => ({
          method: method.charAt(0).toUpperCase() + method.slice(1),
          percentage: Math.round((count / totalPayments) * 100),
          color: method === "cash" ? "bg-earth-400" : method === "upi" ? "bg-primary" : method === "card" ? "bg-blush-200" : "bg-muted-foreground",
        }))
        .sort((a, b) => b.percentage - a.percentage);

      setPaymentMethods(paymentMethodsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reports">
      {/* Date Range Selector */}
      <div className="flex gap-2 mb-6">
        {dateRanges.map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setDateRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Sales Overview */}
      <div className="bg-card rounded-xl p-6 shadow-soft mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Sales Overview</h2>
        <div className="h-64 bg-gradient-to-br from-primary-50 to-earth-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-primary-400 mx-auto mb-2" />
            <p className="text-muted-foreground">Sales chart will be displayed here</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total: ₹{totalRevenue.toLocaleString()} | Orders: {totalOrders} | Avg: ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Top Products</h3>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((item, index) => (
                <div key={item.name} className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-primary w-5">{index + 1}.</span>
                    <div>
                      <p className="text-sm text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sales} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">₹{item.revenue.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sales data</p>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Top Customers</h3>
          </div>
          <div className="space-y-3">
            {topCustomers.length > 0 ? (
              topCustomers.map((item, index) => (
                <div key={item.name} className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-primary w-5">{index + 1}.</span>
                    <div>
                      <p className="text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">₹{item.spent.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No customer data</p>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Payment Methods</h3>
          </div>
          <div className="space-y-4">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((item) => (
                <div key={item.method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{item.method}</span>
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payment data</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;
