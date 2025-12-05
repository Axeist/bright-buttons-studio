import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { TrendingUp, Package, Users, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";

const dateRanges = ["Today", "Week", "Month", "Custom"];

const topProducts = [
  { name: "Monsoon Leaf Silk Saree", sales: 24, revenue: "₹2,04,000" },
  { name: "Jade Garden Kurtha", sales: 18, revenue: "₹99,000" },
  { name: "Autumn Maple Shawl", sales: 15, revenue: "₹72,000" },
  { name: "Forest Fern Kurtha Set", sales: 12, revenue: "₹50,400" },
  { name: "Ocean Wave Shibori Shawl", sales: 10, revenue: "₹28,000" },
];

const topCustomers = [
  { name: "Meera Patel", orders: 12, spent: "₹89,200" },
  { name: "Priya Sharma", orders: 8, spent: "₹62,400" },
  { name: "Lakshmi Iyer", orders: 6, spent: "₹52,100" },
  { name: "Anjali Krishnan", orders: 5, spent: "₹38,500" },
  { name: "Arun Menon", orders: 3, spent: "₹15,800" },
];

const paymentMethods = [
  { method: "UPI", percentage: 45, color: "bg-primary" },
  { method: "Cash", percentage: 30, color: "bg-earth-400" },
  { method: "Card", percentage: 20, color: "bg-blush-200" },
  { method: "Split", percentage: 5, color: "bg-muted-foreground" },
];

const Reports = () => {
  const [dateRange, setDateRange] = useState("Month");

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
              Total: ₹4,85,600 | Orders: 87 | Avg: ₹5,582
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
            {topProducts.map((item, index) => (
              <div key={item.name} className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-primary w-5">{index + 1}.</span>
                  <div>
                    <p className="text-sm text-foreground line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sales} sold</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{item.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Top Customers</h3>
          </div>
          <div className="space-y-3">
            {topCustomers.map((item, index) => (
              <div key={item.name} className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-primary w-5">{index + 1}.</span>
                  <div>
                    <p className="text-sm text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{item.spent}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Payment Methods</h3>
          </div>
          <div className="space-y-4">
            {paymentMethods.map((item) => (
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
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;
