import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Package,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CustomOrder {
  id: string;
  order_number: string;
  product_type: string;
  status: string;
  budget_range: string;
  estimated_price: number | null;
  final_price: number | null;
  submitted_at: string;
  estimated_completion_date: string | null;
  images?: Array<{ image_url: string }>;
}

const statusOptions = [
  { value: "all", label: "All Orders" },
  { value: "submitted", label: "Submitted" },
  { value: "in_discussion", label: "In Discussion" },
  { value: "quote_sent", label: "Quote Sent" },
  { value: "quote_accepted", label: "Quote Accepted" },
  { value: "in_production", label: "In Production" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "in_discussion":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "quote_sent":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "quote_accepted":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "in_production":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "ready":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

const getStatusLabel = (status: string) => {
  return statusOptions.find((opt) => opt.value === status)?.label || status;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatBudgetRange = (range: string) => {
  const ranges: Record<string, string> = {
    "under-5000": "Under ₹5,000",
    "5000-10000": "₹5,000 - ₹10,000",
    "10000-20000": "₹10,000 - ₹20,000",
    "20000-50000": "₹20,000 - ₹50,000",
    "above-50000": "Above ₹50,000",
    flexible: "Flexible",
  };
  return ranges[range] || range;
};

const CustomOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_orders")
        .select(
          `
          id,
          order_number,
          product_type,
          status,
          budget_range,
          estimated_price,
          final_price,
          submitted_at,
          estimated_completion_date,
          images:custom_order_images(image_url)
        `
        )
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      setOrders((data as CustomOrder[]) || []);
    } catch (error: any) {
      console.error("Error fetching custom orders:", error);
      toast({
        title: "Error",
        description: "Failed to load custom orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.product_type.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  if (loading) {
    return (
      <CustomerLayout title="My Custom Orders">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="My Custom Orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Custom Orders</h2>
            <p className="text-muted-foreground">
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} found
            </p>
          </div>
          <Button
            onClick={() => navigate("/customer/custom-orders/new")}
            className="rounded-full"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Custom Order
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by order number or product type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-full"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] rounded-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <AnimatePresence mode="wait">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-16 px-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="mb-6"
              >
                <Sparkles className="w-24 h-24 text-muted-foreground/30" />
              </motion.div>
              <h3 className="text-2xl font-semibold mb-2">
                {orders.length === 0 ? "No Custom Orders Yet" : "No Orders Found"}
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {orders.length === 0
                  ? "Start your custom design journey! Create your first made-to-order piece tailored to your vision."
                  : "Try adjusting your filters to find what you're looking for."}
              </p>
              {orders.length === 0 && (
                <Button
                  onClick={() => navigate("/customer/custom-orders/new")}
                  size="lg"
                  className="rounded-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Custom Order
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <Link to={`/customer/custom-orders/${order.id}`}>
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            {order.images && order.images.length > 0 ? (
                              <div className="relative w-full md:w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50">
                                <img
                                  src={order.images[0].image_url}
                                  alt={order.product_type}
                                  className="w-full h-full object-cover"
                                />
                                {order.images.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    {order.images.length}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full md:w-32 h-32 rounded-lg bg-gradient-to-br from-primary-50 to-earth-50 flex items-center justify-center">
                                <Package className="w-12 h-12 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                    {order.order_number}
                                  </h3>
                                  <Badge className={getStatusColor(order.status)}>
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground">{order.product_type}</p>
                              </div>
                              <div className="text-right">
                                {order.final_price ? (
                                  <p className="text-lg font-bold text-primary">
                                    ₹{order.final_price.toLocaleString()}
                                  </p>
                                ) : order.estimated_price ? (
                                  <p className="text-sm text-muted-foreground">
                                    Est. ₹{order.estimated_price.toLocaleString()}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {formatBudgetRange(order.budget_range)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Submitted {formatDate(order.submitted_at)}</span>
                              </div>
                              {order.estimated_completion_date && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    Est. completion: {formatDate(order.estimated_completion_date)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/customer/custom-orders/${order.id}`);
                                }}
                              >
                                View Details
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
};

export default CustomOrders;

