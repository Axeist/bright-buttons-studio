import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { orders, orderStatuses, type Order } from "@/data/orders";

const Orders = () => {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter((o) => o.status === activeTab);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "delivered": return "bg-primary/10 text-primary";
      case "ready": return "bg-earth-100 text-earth-800";
      case "processing": return "bg-blush-100 text-foreground";
      case "confirmed": return "bg-primary-100 text-primary-700";
      case "pending": return "bg-earth-200 text-earth-800";
      case "cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentColor = (status: Order["paymentStatus"]) => {
    switch (status) {
      case "paid": return "text-primary";
      case "pending": return "text-earth-600";
      case "partial": return "text-blush-200";
      default: return "text-muted-foreground";
    }
  };

  return (
    <AdminLayout title="Orders">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {orderStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${
              activeTab === status
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Order ID</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Customer</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4 hidden md:table-cell">Date & Time</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4 hidden lg:table-cell">Items</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Total</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Status</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4 hidden sm:table-cell">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                  <td className="p-4">
                    <span className="font-medium text-foreground">{order.id}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">{order.phone}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{order.date}</td>
                  <td className="p-4 text-sm text-foreground hidden lg:table-cell">{order.items} items</td>
                  <td className="p-4 text-sm font-semibold text-foreground">{order.total}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className={`text-sm font-medium capitalize ${getPaymentColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No orders found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Orders;
