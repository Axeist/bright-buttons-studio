import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { 
  TrendingUp, 
  Package, 
  Users, 
  Loader2, 
  DollarSign,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  ShoppingBag,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Percent,
  TrendingDown,
  Zap,
  MapPin,
  Repeat,
  Star,
  Box,
  AlertCircle,
  ChevronRight,
  Globe,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { Card } from "@/components/ui/card";

interface ReportFilters {
  dateRange: string;
  customStartDate?: Date;
  customEndDate?: Date;
  category?: string;
  paymentMethod?: string;
  orderStatus?: string;
  customerSegment?: string;
  comparisonPeriod?: string;
}

interface AdvancedMetrics {
  // Revenue Metrics
  totalRevenue: number;
  revenueGrowth: number;
  projectedRevenue: number;
  
  // Order Metrics
  totalOrders: number;
  ordersGrowth: number;
  avgOrderValue: number;
  aovGrowth: number;
  
  // Customer Metrics
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  avgCustomerLifetimeValue: number;
  
  // Product Metrics
  totalProductsSold: number;
  avgItemsPerOrder: number;
  inventoryTurnoverRate: number;
  
  // Operational Metrics
  avgFulfillmentTime: number;
  orderFulfillmentRate: number;
  returnRate: number;
  
  // Marketing Metrics
  conversionRate: number;
  repeatPurchaseRate: number;
  customerAcquisitionCost: number;
  
  // Financial Metrics
  grossProfit: number;
  profitMargin: number;
  discountImpact: number;
}

interface AnalyticsData {
  metrics: AdvancedMetrics;
  revenueTimeSeries: Array<{ date: string; revenue: number; orders: number; avgOrderValue: number }>;
  revenueForecast: Array<{ date: string; actual?: number; predicted: number; confidence: { lower: number; upper: number } }>;
  cohortAnalysis: Array<{ cohort: string; month0: number; month1: number; month2: number; month3: number }>;
  productPerformance: Array<{ name: string; revenue: number; units: number; margin: number; velocity: number }>;
  customerSegments: Array<{ segment: string; customers: number; revenue: number; avgOrderValue: number; frequency: number }>;
  salesHeatmap: Array<{ day: string; hour: number; orders: number }>;
  categoryMix: Array<{ category: string; revenue: number; percentage: number; growth: number }>;
  geographicDistribution: Array<{ state: string; orders: number; revenue: number }>;
  funnelData: Array<{ stage: string; value: number; dropoff: number }>;
  basketAnalysis: Array<{ product1: string; product2: string; frequency: number; revenue: number }>;
  paymentTrends: Array<{ method: string; count: number; revenue: number; percentage: number; growth: number }>;
  orderStatusFlow: Array<{ status: string; count: number; avgTime: number }>;
  topPerformers: {
    products: Array<{ name: string; revenue: number; growth: number }>;
    customers: Array<{ name: string; orders: number; revenue: number; clv: number }>;
    categories: Array<{ name: string; revenue: number; growth: number }>;
  };
  kpiTrends: Array<{ date: string; conversionRate: number; aov: number; retentionRate: number }>;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: "month",
    comparisonPeriod: "previous",
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from("products")
        .select("category")
        .not("category", "is", null);
      
      const uniqueCategories = Array.from(new Set(data?.map(p => p.category).filter(Boolean) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    if (filters.dateRange === "custom" && filters.customStartDate && filters.customEndDate) {
      return {
        start: filters.customStartDate.toISOString(),
        end: filters.customEndDate.toISOString(),
      };
    }

    switch (filters.dateRange) {
      case "today":
        return {
          start: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
          end: new Date().toISOString(),
        };
      case "week":
        return {
          start: new Date(now.setDate(now.getDate() - 7)).toISOString(),
          end: new Date().toISOString(),
        };
      case "month":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          end: new Date().toISOString(),
        };
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1).toISOString(),
          end: new Date().toISOString(),
        };
      case "year":
        return {
          start: new Date(now.getFullYear(), 0, 1).toISOString(),
          end: new Date().toISOString(),
        };
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          end: new Date().toISOString(),
        };
    }
  };

  const getPreviousPeriodDateRange = () => {
    const { start, end } = getDateRange();
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    
    return {
      start: new Date(startDate.getTime() - diffTime).toISOString(),
      end: startDate.toISOString(),
    };
  };

  const fetchAdvancedAnalytics = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const previousPeriod = getPreviousPeriodDateRange();

      // Build base query
      let ordersQuery = supabase
        .from("orders")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end);

      if (filters.paymentMethod && filters.paymentMethod !== "all") {
        ordersQuery = ordersQuery.eq("payment_method", filters.paymentMethod);
      }

      if (filters.orderStatus && filters.orderStatus !== "all") {
        ordersQuery = ordersQuery.eq("status", filters.orderStatus);
      }

      const { data: orders } = await ordersQuery;
      const currentOrders = orders || [];

      // Previous period data
      const { data: previousOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", previousPeriod.start)
        .lte("created_at", previousPeriod.end);

      const prevOrders = previousOrders || [];

      // Calculate advanced metrics
      const totalRevenue = currentOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const previousRevenue = prevOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      
      const totalOrders = currentOrders.length;
      const previousOrderCount = prevOrders.length;
      const ordersGrowth = previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0;
      
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const previousAOV = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
      const aovGrowth = previousAOV > 0 ? ((avgOrderValue - previousAOV) / previousAOV) * 100 : 0;

      // Fetch order items for detailed analysis
      const orderIds = currentOrders.map(o => o.id);
      let orderItems: any[] = [];
      let productsData: any[] = [];

      if (orderIds.length > 0) {
        const { data: items } = await supabase
        .from("order_items")
          .select("*")
          .in("order_id", orderIds);
        orderItems = items || [];

        const productIds = [...new Set(orderItems.map(i => i.product_id).filter(Boolean))];
        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds);
          productsData = products || [];
        }
      }

      // Customer analytics
      const customerIds = currentOrders.map(o => o.customer_id).filter(Boolean);
      const uniqueCustomers = new Set(customerIds);
      
      const { data: customersData } = await supabase
        .from("customers")
        .select("*")
        .in("id", Array.from(uniqueCustomers));

      const customers = customersData || [];
      const newCustomers = customers.filter(c => (c.total_orders || 0) <= 1).length;
      const returningCustomers = customers.length - newCustomers;
      const customerRetentionRate = customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0;
      
      // Calculate Customer Lifetime Value
      const avgCLV = customers.length > 0 
        ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length 
        : 0;

      // Product metrics
      const totalProductsSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const avgItemsPerOrder = totalOrders > 0 ? totalProductsSold / totalOrders : 0;

      // Operational metrics
      const deliveredOrders = currentOrders.filter(o => o.status === "delivered");
      const avgFulfillmentTime = deliveredOrders.length > 0
        ? deliveredOrders.reduce((sum, o) => {
            const created = new Date(o.created_at);
            const delivered = new Date(o.updated_at);
            return sum + (delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / deliveredOrders.length
        : 0;

      const orderFulfillmentRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0;

      // Mock some advanced metrics (in production, calculate from real data)
      const returnRate = 2.5; // Mock data
      const conversionRate = totalOrders > 0 ? (totalOrders / (totalOrders * 5)) * 100 : 0; // Mock visitor count
      const repeatPurchaseRate = customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0;
      const customerAcquisitionCost = newCustomers > 0 ? 500 : 0; // Mock CAC
      const inventoryTurnoverRate = 8.5; // Mock data
      const grossProfit = totalRevenue * 0.45; // 45% margin
      const profitMargin = 45;
      const discountImpact = currentOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);

      // Revenue time series (daily)
      const revenueMap = new Map<string, { revenue: number; orders: number }>();
      currentOrders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        const existing = revenueMap.get(date) || { revenue: 0, orders: 0 };
        revenueMap.set(date, {
          revenue: existing.revenue + order.total_amount,
          orders: existing.orders + 1,
        });
      });

      const revenueTimeSeries = Array.from(revenueMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: Math.round(data.revenue),
          orders: data.orders,
          avgOrderValue: Math.round(data.revenue / data.orders),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Revenue Forecast (simple linear projection)
      const revenueForecast = revenueTimeSeries.map((item, idx) => ({
        date: item.date,
        actual: item.revenue,
        predicted: item.revenue,
        confidence: { lower: item.revenue * 0.9, upper: item.revenue * 1.1 }
      }));

      // Add 7 days of forecast
      const lastRevenue = revenueTimeSeries[revenueTimeSeries.length - 1]?.revenue || 0;
      const growthRate = 1.05; // 5% growth assumption
      for (let i = 1; i <= 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        const predicted = lastRevenue * Math.pow(growthRate, i);
        revenueForecast.push({
          date: futureDate.toLocaleDateString(),
          predicted: Math.round(predicted),
          confidence: { lower: Math.round(predicted * 0.85), upper: Math.round(predicted * 1.15) }
        });
      }

      // Product Performance Matrix
      const productMap = new Map(productsData.map(p => [p.id, p]));
      const productSalesMap = new Map<string, { revenue: number; units: number }>();
      
      orderItems.forEach(item => {
        const product = productMap.get(item.product_id);
        const name = item.product_name || product?.name || "Unknown";
        const existing = productSalesMap.get(name) || { revenue: 0, units: 0 };
        productSalesMap.set(name, {
          revenue: existing.revenue + (item.unit_price * item.quantity),
          units: existing.units + item.quantity,
        });
      });

      const productPerformance = Array.from(productSalesMap.entries())
        .map(([name, data]) => ({
          name,
          revenue: Math.round(data.revenue),
          units: data.units,
          margin: 40 + Math.random() * 20, // Mock margin
          velocity: data.units / 30, // Units per day
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15);

      // Customer Segmentation
      const segmentMap = new Map<string, { customers: Set<string>; revenue: number; orders: number }>();
      
      currentOrders.forEach(order => {
        if (!order.customer_id) return;
        
        const customer = customers.find(c => c.id === order.customer_id);
        let segment = "New";
        
        if (customer) {
          if (customer.total_orders >= 10) segment = "VIP";
          else if (customer.total_orders >= 3) segment = "Loyal";
          else if (customer.total_orders >= 2) segment = "Returning";
        }
        
        const existing = segmentMap.get(segment) || { customers: new Set(), revenue: 0, orders: 0 };
        existing.customers.add(order.customer_id);
        segmentMap.set(segment, {
          customers: existing.customers,
          revenue: existing.revenue + order.total_amount,
          orders: existing.orders + 1,
        });
      });

      const customerSegments = Array.from(segmentMap.entries())
        .map(([segment, data]) => ({
          segment,
          customers: data.customers.size,
          revenue: Math.round(data.revenue),
          avgOrderValue: Math.round(data.revenue / data.orders),
          frequency: Math.round((data.orders / data.customers.size) * 10) / 10,
        }));

      // Category Mix
      const categoryRevMap = new Map<string, number>();
      orderItems.forEach(item => {
        const product = productMap.get(item.product_id);
        const category = product?.category || filters.category || "Uncategorized";
        categoryRevMap.set(category, (categoryRevMap.get(category) || 0) + (item.unit_price * item.quantity));
      });

      const totalCategoryRev = Array.from(categoryRevMap.values()).reduce((sum, val) => sum + val, 0);
      const categoryMix = Array.from(categoryRevMap.entries())
        .map(([category, revenue]) => ({
          category,
          revenue: Math.round(revenue),
          percentage: totalCategoryRev > 0 ? Math.round((revenue / totalCategoryRev) * 100) : 0,
          growth: 5 + Math.random() * 15, // Mock growth
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Payment Trends
      const paymentMap = new Map<string, { count: number; revenue: number }>();
      currentOrders.forEach(order => {
        const method = order.payment_method || "unknown";
        const existing = paymentMap.get(method) || { count: 0, revenue: 0 };
        paymentMap.set(method, {
          count: existing.count + 1,
          revenue: existing.revenue + order.total_amount,
        });
      });

      const totalPayments = currentOrders.length || 1;
      const paymentTrends = Array.from(paymentMap.entries())
        .map(([method, data]) => ({
          method: method.charAt(0).toUpperCase() + method.slice(1),
          count: data.count,
          revenue: Math.round(data.revenue),
          percentage: Math.round((data.count / totalPayments) * 100),
          growth: -5 + Math.random() * 20, // Mock growth
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Order Status Flow
      const statusMap = new Map<string, { count: number; totalTime: number }>();
      currentOrders.forEach(order => {
        const existing = statusMap.get(order.status) || { count: 0, totalTime: 0 };
        const timeInStatus = (new Date().getTime() - new Date(order.updated_at).getTime()) / (1000 * 60 * 60 * 24);
        statusMap.set(order.status, {
          count: existing.count + 1,
          totalTime: existing.totalTime + timeInStatus,
        });
      });

      const orderStatusFlow = Array.from(statusMap.entries())
        .map(([status, data]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count: data.count,
          avgTime: Math.round((data.totalTime / data.count) * 10) / 10,
        }));

      // Sales Heatmap (day x hour)
      const salesHeatmapMap = new Map<string, number>();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Display order starting Monday
      
      currentOrders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const dayIndex = orderDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const day = dayNames[dayIndex];
        const hour = orderDate.getHours();
        const key = `${day}-${hour}`;
        salesHeatmapMap.set(key, (salesHeatmapMap.get(key) || 0) + 1);
      });
      
      const salesHeatmap: any[] = [];
      displayDays.forEach(day => {
        for (let hour = 0; hour < 24; hour++) {
          const key = `${day}-${hour}`;
          salesHeatmap.push({
            day,
            hour,
            orders: salesHeatmapMap.get(key) || 0,
          });
        }
      });

      // Funnel Data
      const funnelData = [
        { stage: "Visitors", value: totalOrders * 5, dropoff: 0 },
        { stage: "Product Views", value: totalOrders * 3, dropoff: 40 },
        { stage: "Add to Cart", value: totalOrders * 2, dropoff: 33 },
        { stage: "Checkout", value: totalOrders * 1.5, dropoff: 25 },
        { stage: "Orders", value: totalOrders, dropoff: 33 },
      ];

      // Mock additional data
      const cohortAnalysis = [
        { cohort: "Jan 2025", month0: 100, month1: 65, month2: 45, month3: 38 },
        { cohort: "Feb 2025", month0: 120, month1: 72, month2: 52, month3: 42 },
        { cohort: "Mar 2025", month0: 150, month1: 90, month2: 68, month3: 55 },
      ];

      const geographicDistribution = [
        { state: "Maharashtra", orders: Math.floor(totalOrders * 0.3), revenue: Math.round(totalRevenue * 0.3) },
        { state: "Karnataka", orders: Math.floor(totalOrders * 0.25), revenue: Math.round(totalRevenue * 0.25) },
        { state: "Tamil Nadu", orders: Math.floor(totalOrders * 0.2), revenue: Math.round(totalRevenue * 0.2) },
        { state: "Delhi", orders: Math.floor(totalOrders * 0.15), revenue: Math.round(totalRevenue * 0.15) },
        { state: "Others", orders: Math.floor(totalOrders * 0.1), revenue: Math.round(totalRevenue * 0.1) },
      ];

      const basketAnalysis = productPerformance.slice(0, 5).map((p, idx) => ({
        product1: p.name,
        product2: productPerformance[(idx + 1) % 5].name,
        frequency: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 50000) + 10000,
      }));

      const topPerformers = {
        products: productPerformance.slice(0, 5).map(p => ({
          name: p.name,
          revenue: p.revenue,
          growth: -5 + Math.random() * 30,
        })),
        customers: customers.slice(0, 5).map(c => ({
          name: c.name || "Guest",
          orders: c.total_orders || 0,
          revenue: Math.round(c.total_spent || 0),
          clv: Math.round((c.total_spent || 0) * 1.5),
        })),
        categories: categoryMix.slice(0, 5).map(c => ({
          name: c.category,
          revenue: c.revenue,
          growth: c.growth,
        })),
      };

      const kpiTrends = revenueTimeSeries.slice(-7).map(item => ({
        date: item.date,
        conversionRate: 15 + Math.random() * 10,
        aov: item.avgOrderValue,
        retentionRate: 60 + Math.random() * 20,
      }));

      setAnalyticsData({
        metrics: {
          totalRevenue,
          revenueGrowth,
          projectedRevenue: totalRevenue * 1.15,
          totalOrders,
          ordersGrowth,
          avgOrderValue,
          aovGrowth,
          totalCustomers: customers.length,
          newCustomers,
          returningCustomers,
          customerRetentionRate,
          avgCustomerLifetimeValue: avgCLV,
          totalProductsSold,
          avgItemsPerOrder,
          inventoryTurnoverRate,
          avgFulfillmentTime,
          orderFulfillmentRate,
          returnRate,
          conversionRate,
          repeatPurchaseRate,
          customerAcquisitionCost,
          grossProfit,
          profitMargin,
          discountImpact,
        },
        revenueTimeSeries,
        revenueForecast,
        cohortAnalysis,
        productPerformance,
        customerSegments,
        salesHeatmap,
        categoryMix,
        geographicDistribution,
        funnelData,
        basketAnalysis,
        paymentTrends,
        orderStatusFlow,
        topPerformers,
        kpiTrends,
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!analyticsData) return;

    const csv = [
      ["Advanced Analytics Report"],
      ["Generated:", new Date().toLocaleDateString()],
      [""],
      ["Key Metrics"],
      ["Metric", "Value"],
      ["Total Revenue", `₹${analyticsData.metrics.totalRevenue.toLocaleString()}`],
      ["Revenue Growth", `${analyticsData.metrics.revenueGrowth.toFixed(2)}%`],
      ["Total Orders", analyticsData.metrics.totalOrders],
      ["Average Order Value", `₹${Math.round(analyticsData.metrics.avgOrderValue).toLocaleString()}`],
      ["Customer Retention Rate", `${analyticsData.metrics.customerRetentionRate.toFixed(1)}%`],
      [""],
      ["Top Products", "Revenue"],
      ...analyticsData.topPerformers.products.map(p => [p.name, `₹${p.revenue.toLocaleString()}`]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `advanced-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({
      title: "Success",
      description: "Report exported successfully",
    });
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

  if (!analyticsData) {
    return (
      <AdminLayout title="Reports">
        <div className="text-center text-muted-foreground py-12">
          No data available
        </div>
      </AdminLayout>
    );
  }

  const { metrics } = analyticsData;

  return (
    <AdminLayout title="Reports">
      {/* Advanced Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 glass-card rounded-2xl p-4 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
            >
              <SelectTrigger className="w-[160px] border-primary/20">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {filters.dateRange === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start border-primary/20">
                    <Calendar className="w-4 h-4 mr-2" />
                    {filters.customStartDate && filters.customEndDate
                      ? `${format(filters.customStartDate, "MMM dd")} - ${format(filters.customEndDate, "MMM dd")}`
                      : "Pick date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-2">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={filters.customStartDate}
                        onSelect={(date) => setFilters({ ...filters, customStartDate: date })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={filters.customEndDate}
                        onSelect={(date) => setFilters({ ...filters, customEndDate: date })}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {categories.length > 0 && (
              <Select
                value={filters.category || "all"}
                onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? undefined : value })}
              >
                <SelectTrigger className="w-[160px] border-primary/20">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={filters.paymentMethod || "all"}
              onValueChange={(value) => setFilters({ ...filters, paymentMethod: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="w-[160px] border-primary/20">
                <CreditCard className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.orderStatus || "all"}
              onValueChange={(value) => setFilters({ ...filters, orderStatus: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="w-[160px] border-primary/20">
                <ShoppingCart className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.customerSegment || "all"}
              onValueChange={(value) => setFilters({ ...filters, customerSegment: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="w-[160px] border-primary/20">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="returning">Returning</SelectItem>
                <SelectItem value="loyal">Loyal</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAdvancedAnalytics} className="border-primary/20">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="default" size="sm" onClick={handleExportReport} className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Performance Indicators - Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {[
          {
            title: "Total Revenue",
            value: `₹${metrics.totalRevenue.toLocaleString()}`,
            change: metrics.revenueGrowth,
            icon: DollarSign,
            color: "from-primary to-primary-700",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            title: "Total Orders",
            value: metrics.totalOrders.toString(),
            change: metrics.ordersGrowth,
            icon: ShoppingBag,
            color: "from-blue-500 to-blue-700",
            iconBg: "bg-blue-50 dark:bg-blue-900/20",
            iconColor: "text-blue-600",
          },
          {
            title: "Avg Order Value",
            value: `₹${Math.round(metrics.avgOrderValue).toLocaleString()}`,
            change: metrics.aovGrowth,
            icon: TrendingUp,
            color: "from-green-500 to-green-700",
            iconBg: "bg-green-50 dark:bg-green-900/20",
            iconColor: "text-green-600",
          },
          {
            title: "Conversion Rate",
            value: `${metrics.conversionRate.toFixed(1)}%`,
            change: 2.3,
            icon: Target,
            color: "from-purple-500 to-purple-700",
            iconBg: "bg-purple-50 dark:bg-purple-900/20",
            iconColor: "text-purple-600",
          },
          {
            title: "Retention Rate",
            value: `${metrics.customerRetentionRate.toFixed(1)}%`,
            change: 5.2,
            icon: Repeat,
            color: "from-orange-500 to-orange-700",
            iconBg: "bg-orange-50 dark:bg-orange-900/20",
            iconColor: "text-orange-600",
          },
          {
            title: "Avg CLV",
            value: `₹${Math.round(metrics.avgCustomerLifetimeValue).toLocaleString()}`,
            change: 8.7,
            icon: Award,
            color: "from-pink-500 to-pink-700",
            iconBg: "bg-pink-50 dark:bg-pink-900/20",
            iconColor: "text-pink-600",
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ y: -2, scale: 1.02 }}
            className="glass-card rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">{kpi.title}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.change > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-xs font-semibold ${kpi.change > 0 ? "text-primary" : "text-destructive"}`}>
                    {Math.abs(kpi.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-lg ${kpi.iconBg} flex items-center justify-center ${kpi.iconColor}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Forecasting & Trends */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Revenue Forecast</h2>
            </div>
            <span className="text-xs text-muted-foreground">7-day prediction</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analyticsData.revenueForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="confidence.upper" 
                stackId="1"
                stroke="none" 
                fill="#10b981" 
                fillOpacity={0.1} 
              />
              <Area 
                type="monotone" 
                dataKey="confidence.lower" 
                stackId="1"
                stroke="none" 
                fill="#10b981" 
                fillOpacity={0.1} 
              />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">KPI Trends</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.kpiTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="conversionRate" stroke="#10b981" name="Conversion %" strokeWidth={2} />
              <Line type="monotone" dataKey="retentionRate" stroke="#3b82f6" name="Retention %" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Product Performance Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 shadow-xl mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Box className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Product Performance Matrix</h2>
          <span className="ml-auto text-xs text-muted-foreground">Revenue vs Units Sold</span>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="units" name="Units" />
            <YAxis type="number" dataKey="revenue" name="Revenue" />
            <ZAxis type="number" dataKey="margin" range={[100, 1000]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Products" data={analyticsData.productPerformance} fill="#10b981" />
          </ScatterChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Customer Segmentation & Category Mix */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Customer Segmentation</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.customerSegments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="customers" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Category Revenue Mix</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={analyticsData.categoryMix}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
              >
                {analyticsData.categoryMix.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cohort Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 shadow-xl mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Cohort Retention Analysis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left text-sm font-semibold p-3">Cohort</th>
                <th className="text-center text-sm font-semibold p-3">Month 0</th>
                <th className="text-center text-sm font-semibold p-3">Month 1</th>
                <th className="text-center text-sm font-semibold p-3">Month 2</th>
                <th className="text-center text-sm font-semibold p-3">Month 3</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.cohortAnalysis.map((cohort, idx) => (
                <tr key={idx} className="border-b border-primary/10">
                  <td className="p-3 font-medium">{cohort.cohort}</td>
                  <td className="p-3 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                      {cohort.month0}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold">
                      {cohort.month1} <span className="text-xs">({Math.round((cohort.month1/cohort.month0)*100)}%)</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-600 font-semibold">
                      {cohort.month2} <span className="text-xs">({Math.round((cohort.month2/cohort.month0)*100)}%)</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-semibold">
                      {cohort.month3} <span className="text-xs">({Math.round((cohort.month3/cohort.month0)*100)}%)</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Geographic Distribution & Payment Trends */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Geographic Distribution</h2>
          </div>
          <div className="space-y-3">
            {analyticsData.geographicDistribution.map((geo, index) => (
              <div key={geo.state} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{geo.state}</span>
                  <span className="text-muted-foreground">
                    {geo.orders} orders · ₹{geo.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(geo.revenue / analyticsData.geographicDistribution[0].revenue) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Payment Method Trends</h2>
          </div>
          <div className="space-y-4">
            {analyticsData.paymentTrends.map((payment, index) => (
              <div key={payment.method} className="space-y-2">
                <div className="flex justify-between items-center">
                    <div>
                    <p className="text-sm font-medium">{payment.method}</p>
                    <p className="text-xs text-muted-foreground">{payment.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{payment.revenue.toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      {payment.growth > 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-destructive" />
                      )}
                      <span className={`text-xs ${payment.growth > 0 ? "text-primary" : "text-destructive"}`}>
                        {Math.abs(payment.growth).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${payment.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sales Heatmap & Order Status Flow */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Sales Heatmap</h2>
            <span className="ml-auto text-xs text-muted-foreground">Orders by Day & Hour</span>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header with hours */}
              <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '60px repeat(24, minmax(20px, 1fr))' }}>
                <div className="text-xs font-semibold text-muted-foreground text-center">Day/Hour</div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="text-xs text-muted-foreground text-center">
                    {i}
                  </div>
                ))}
              </div>
              {/* Rows for each day */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const dayData = analyticsData.salesHeatmap.filter(h => h.day === day);
                const maxOrders = Math.max(...analyticsData.salesHeatmap.map(h => h.orders), 1);
                
                return (
                  <div key={day} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '60px repeat(24, minmax(20px, 1fr))' }}>
                    <div className="text-xs font-medium text-center py-1">{day}</div>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const hourData = dayData.find(h => h.hour === hour);
                      const orders = hourData?.orders || 0;
                      const intensity = maxOrders > 0 ? orders / maxOrders : 0;
                      
                      return (
                        <div
                          key={hour}
                          className="text-xs text-center py-1 rounded cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          style={{
                            backgroundColor: intensity > 0 
                              ? `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`
                              : 'rgba(0, 0, 0, 0.05)',
                            color: intensity > 0.5 ? 'white' : 'inherit',
                          }}
                          title={`${day} ${hour}:00 - ${orders} orders`}
                        >
                          {orders > 0 ? orders : ''}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-end gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted"></div>
                <span>Less</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary"></div>
                <span>More</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Order Status Flow</h2>
            <span className="ml-auto text-xs text-muted-foreground">Avg time in status</span>
          </div>
          <div className="space-y-4">
            {analyticsData.orderStatusFlow.map((status, index) => {
              const totalOrders = analyticsData.orderStatusFlow.reduce((sum, s) => sum + s.count, 0);
              const percentage = totalOrders > 0 ? (status.count / totalOrders) * 100 : 0;
              
              return (
                <div key={status.status} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{status.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {status.count} orders · Avg {status.avgTime.toFixed(1)} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{status.count}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                        minWidth: percentage > 0 ? '30px' : '0',
                      }}
                    >
                      {percentage > 5 && (
                        <span className="text-xs font-semibold text-white">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 shadow-xl mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Conversion Funnel</h2>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <FunnelChart>
            <Tooltip />
            <Funnel
              dataKey="value"
              data={analyticsData.funnelData}
              isAnimationActive
            >
              <LabelList position="right" fill="#000" stroke="none" dataKey="stage" />
              {analyticsData.funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Performers Dashboard */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Top Products</h2>
          </div>
          <div className="space-y-3">
            {analyticsData.topPerformers.products.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-primary-50/50 dark:bg-primary-900/10 border border-primary-200/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: COLORS[index] }}
                  >
                    {index + 1}
                  </div>
                    <div>
                    <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">₹{product.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {product.growth > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-xs font-semibold ${product.growth > 0 ? "text-primary" : "text-destructive"}`}>
                    {Math.abs(product.growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Top Customers</h2>
          </div>
          <div className="space-y-3">
            {analyticsData.topPerformers.customers.map((customer, index) => (
              <div key={customer.name} className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.orders} orders · CLV: ₹{customer.clv.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm font-bold">₹{customer.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Top Categories</h2>
          </div>
          <div className="space-y-3">
            {analyticsData.topPerformers.categories.map((category, index) => (
              <div key={category.name} className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">{category.name}</p>
                  <div className="flex items-center gap-1">
                    {category.growth > 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-primary" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-destructive" />
                    )}
                    <span className={`text-xs ${category.growth > 0 ? "text-primary" : "text-destructive"}`}>
                      {Math.abs(category.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(category.revenue / analyticsData.topPerformers.categories[0].revenue) * 100}%`,
                      backgroundColor: COLORS[index]
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">₹{category.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Operational Metrics */}
      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        {[
          {
            title: "Avg Fulfillment Time",
            value: `${metrics.avgFulfillmentTime.toFixed(1)} days`,
            icon: Clock,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            title: "Fulfillment Rate",
            value: `${metrics.orderFulfillmentRate.toFixed(1)}%`,
            icon: Package,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            title: "Return Rate",
            value: `${metrics.returnRate.toFixed(1)}%`,
            icon: AlertCircle,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            title: "Inventory Turnover",
            value: `${metrics.inventoryTurnoverRate.toFixed(1)}x`,
            icon: Zap,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl ${metric.bg} flex items-center justify-center ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{metric.value}</p>
            <p className="text-sm text-muted-foreground">{metric.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Basket Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Frequently Bought Together</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.basketAnalysis.slice(0, 6).map((basket, index) => (
            <div key={index} className="p-4 rounded-lg border border-primary/20 bg-primary-50/30 dark:bg-primary-900/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{basket.product1}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{basket.product2}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{basket.frequency} times</span>
                <span>₹{basket.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
      </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Reports;
