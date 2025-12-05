import { AdminLayout } from "@/layouts/AdminLayout";
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  MessageCircle,
  Package,
  AlertTriangle
} from "lucide-react";
import { orders } from "@/data/orders";

const stats = [
  { 
    title: "Today's Revenue", 
    value: "₹28,400", 
    change: "+12%",
    icon: DollarSign,
    color: "text-primary"
  },
  { 
    title: "Orders Today", 
    value: "12", 
    change: "+3",
    icon: ShoppingBag,
    color: "text-earth-600"
  },
  { 
    title: "Avg Order Value", 
    value: "₹2,367", 
    change: "+5%",
    icon: TrendingUp,
    color: "text-primary"
  },
  { 
    title: "WhatsApp Orders", 
    value: "8", 
    change: "Pending",
    icon: MessageCircle,
    color: "text-[#25D366]"
  },
];

const lowStockItems = [
  { name: "Monsoon Leaf Silk Saree", stock: 2 },
  { name: "Forest Fern Kurtha Set", stock: 1 },
  { name: "Ocean Wave Shibori Shawl", stock: 3 },
];

const topProducts = [
  { name: "Monsoon Leaf Silk Saree", sales: 24, revenue: "₹2,04,000" },
  { name: "Jade Garden Kurtha", sales: 18, revenue: "₹99,000" },
  { name: "Autumn Maple Shawl", sales: 15, revenue: "₹72,000" },
];

const Dashboard = () => {
  const recentOrders = orders.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-primary/10 text-primary";
      case "ready": return "bg-earth-100 text-earth-800";
      case "processing": return "bg-blush-100 text-blush-200";
      case "confirmed": return "bg-primary-100 text-primary-700";
      case "pending": return "bg-earth-200 text-earth-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-card rounded-xl p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-sm text-primary mt-1">{stat.change}</p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-accent flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Chart Placeholder */}
        <div className="lg:col-span-2 bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sales Overview</h2>
          <div className="h-64 bg-gradient-to-br from-primary-50 to-earth-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary-400 mx-auto mb-2" />
              <p className="text-muted-foreground">Sales chart will be displayed here</p>
              <p className="text-sm text-muted-foreground mt-1">Integration with charting library pending</p>
            </div>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Low Stock */}
          <div className="bg-card rounded-xl p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-earth-400" />
              <h3 className="font-semibold text-foreground">Low Stock Alerts</h3>
            </div>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate pr-2">{item.name}</span>
                  <span className="text-sm font-medium text-earth-600 flex-shrink-0">
                    {item.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>

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
                    <span className="text-sm font-medium text-primary">{index + 1}.</span>
                    <div>
                      <p className="text-sm text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sales} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground flex-shrink-0">
                    {item.revenue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6 bg-card rounded-xl p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-sm font-medium text-muted-foreground pb-3">Order ID</th>
                <th className="text-left text-sm font-medium text-muted-foreground pb-3">Customer</th>
                <th className="text-left text-sm font-medium text-muted-foreground pb-3 hidden md:table-cell">Date</th>
                <th className="text-left text-sm font-medium text-muted-foreground pb-3">Total</th>
                <th className="text-left text-sm font-medium text-muted-foreground pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="py-3 text-sm font-medium text-foreground">{order.id}</td>
                  <td className="py-3 text-sm text-foreground">{order.customer}</td>
                  <td className="py-3 text-sm text-muted-foreground hidden md:table-cell">{order.date}</td>
                  <td className="py-3 text-sm font-medium text-foreground">{order.total}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
