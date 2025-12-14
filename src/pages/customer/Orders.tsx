import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  tracking?: Array<{
    status: string;
    message: string;
    created_at: string;
  }>;
}

const CustomerOrders = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { customer, loading: customerLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!customerLoading && !customer) {
      navigate("/customer/login");
      return;
    }
    if (customer) {
      fetchOrders();
    }
  }, [customer, customerLoading, activeTab]);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const fetchOrders = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      if (!customer) return;

      let query = supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      const { data: tracking } = await supabase
        .from("order_tracking")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      setSelectedOrder({
        ...order,
        items: items || [],
        tracking: tracking || [],
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "processing":
      case "confirmed":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Package className="w-5 h-5 text-muted-foreground" />;
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
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (id && selectedOrder) {
    return (
      <CustomerLayout title="Order Details">
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/customer/orders")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order {selectedOrder.order_number}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ₹{item.unit_price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">₹{item.total_price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Tracking */}
                {selectedOrder.tracking && selectedOrder.tracking.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Order Tracking</h3>
                    <div className="space-y-4">
                      {selectedOrder.tracking.map((track, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            {getStatusIcon(track.status)}
                            {index < selectedOrder.tracking!.length - 1 && (
                              <div className="w-0.5 h-8 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium capitalize">{track.status}</p>
                            <p className="text-sm text-muted-foreground">{track.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(track.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount</span>
                    <span>₹{selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Payment Status: <Badge variant="outline">{selectedOrder.payment_status}</Badge>
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="font-semibold">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">₹{order.total_amount.toLocaleString()}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <Link to={`/customer/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground mb-6">
                    {activeTab === "all"
                      ? "You haven't placed any orders yet"
                      : `No ${activeTab} orders`}
                  </p>
                  <Link to="/shop">
                    <Button>Start Shopping</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </Tabs>
      </div>
    </CustomerLayout>
  );
};

export default CustomerOrders;
