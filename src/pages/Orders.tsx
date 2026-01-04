import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ClipboardList, Sparkles, Loader2, ChevronDown, Search, Printer, Filter, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Invoice } from "@/components/ecommerce/Invoice";

const orderStatuses = ['all', 'pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'] as const;

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
type OrderSource = 'pos' | 'online' | 'phone';

interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  source: string;
  total_amount: number;
  created_at: string;
  items_count?: number;
  order_items?: any[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  
  // Advanced filters
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [allOrders, activeTab, searchQuery, paymentMethodFilter, sourceFilter, paymentStatusFilter, dateFrom, dateTo]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (id)
        `)
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query;

      if (error) throw error;

      const ordersWithCounts = (data || []).map((order: any) => ({
        ...order,
        items_count: order.order_items?.length || 0,
      }));

      setAllOrders(ordersWithCounts);
      setOrders(ordersWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "delivered": return "bg-primary/10 text-primary border-primary/20";
      case "ready": return "bg-earth-100 dark:bg-earth-900/40 text-earth-800 dark:text-earth-400 border-earth-300 dark:border-earth-700";
      case "processing": return "bg-blush-100 dark:bg-blush-900/40 text-blush-800 dark:text-blush-400 border-blush-300 dark:border-blush-700";
      case "confirmed": return "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-700";
      case "pending": return "bg-earth-200 dark:bg-earth-800/40 text-earth-800 dark:text-earth-300 border-earth-400 dark:border-earth-600";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPaymentColor = (status: PaymentStatus) => {
    switch (status) {
      case "paid": return "text-primary font-semibold";
      case "pending": return "text-earth-600 font-semibold";
      case "partial": return "text-blush-600 font-semibold";
      case "refunded": return "text-destructive font-semibold";
      default: return "text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const applyFilters = () => {
    let filtered = [...allOrders];

    // Status filter (from activeTab)
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_phone?.includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(order => order.payment_method === paymentMethodFilter);
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter(order => order.source === sourceFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(order => order.payment_status === paymentStatusFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => new Date(order.created_at) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= toDate);
    }

    setOrders(filtered);
  };

  const handlePrintInvoice = async (order: Order) => {
    try {
      // Fetch full order details with items
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("id", order.id)
        .single();

      if (error) throw error;

      setSelectedOrderForInvoice(data);
      setShowInvoice(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setPaymentMethodFilter("all");
    setSourceFilter("all");
    setPaymentStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  const hasActiveFilters = paymentMethodFilter !== "all" || 
    sourceFilter !== "all" || 
    paymentStatusFilter !== "all" || 
    dateFrom || 
    dateTo ||
    searchQuery.trim() !== "";

  if (loading) {
    return (
      <AdminLayout title="Orders">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Orders">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 space-y-4"
      >
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number, customer name, or phone..."
              className="pl-10 rounded-xl"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-primary-foreground text-primary rounded-full text-xs">
                Active
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="rounded-xl"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-xl p-4 bg-card space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Payment Status</label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex gap-2 overflow-x-auto pb-4 mb-6"
      >
        {orderStatuses.map((status, index) => (
          <motion.button
            key={status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(status)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap capitalize transition-all duration-300 ${
              activeTab === status
                ? "bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white shadow-lg shadow-primary/30"
                : "bg-secondary text-secondary-foreground hover:bg-accent border border-border"
            }`}
          >
            {status}
          </motion.button>
        ))}
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-200/50 dark:border-primary-800/30 bg-gradient-to-r from-primary-50/50 via-transparent to-earth-50/50 dark:from-primary-900/20 dark:to-transparent">
                <th className="text-left text-sm font-semibold text-foreground p-4">Order ID</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Customer</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden md:table-cell">Date & Time</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden lg:table-cell">Items</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Total</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Status</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden sm:table-cell">Payment</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden lg:table-cell">Source</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {orders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(var(--primary), 0.05)" }}
                    className="border-b border-primary-200/30 dark:border-primary-800/20 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-semibold text-foreground">{order.order_number}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{order.customer_name || "Walk-in Customer"}</p>
                        {order.customer_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3" />
                            {order.customer_phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell font-medium">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="p-4 text-sm text-foreground hidden lg:table-cell font-medium">
                      {order.items_count || 0} items
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-foreground">₹{order.total_amount.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <Select
                        value={order.status}
                        onValueChange={(value: OrderStatus) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs border-0 p-0">
                          <SelectValue>
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </motion.span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.slice(1).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={`text-sm font-medium capitalize ${getPaymentColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                        {order.source}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintInvoice(order)}
                          className="rounded-lg"
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Invoice
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ClipboardList className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No orders found</p>
          </motion.div>
        )}
      </motion.div>

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            {selectedOrderForInvoice && (
              <Invoice order={selectedOrderForInvoice} onClose={() => setShowInvoice(false)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Orders;
