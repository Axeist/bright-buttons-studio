import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Palette,
  Ruler,
  FileText,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Package,
  User,
  UserPlus,
  Send,
  Save,
  TrendingUp,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  preferred_fabrics: string[];
  intended_occasion: string | null;
  color_preferences: string | null;
  size_requirements: string | null;
  design_instructions: string;
  special_requirements: string | null;
  budget_range: string;
  expected_delivery_timeline: string;
  status: string;
  estimated_price: number | null;
  final_price: number | null;
  payment_status: string;
  submitted_at: string;
  discussion_started_at: string | null;
  production_started_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  estimated_completion_date: string | null;
  assigned_to: string | null;
  user_id: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  assigned_staff: {
    id: string;
    email: string;
    profiles: {
      full_name: string | null;
    } | null;
  } | null;
  images?: Array<{ id: string; image_url: string; caption: string | null }>;
  status_history?: Array<{
    id: string;
    status: string;
    notes: string | null;
    created_at: string;
    changed_by: string | null;
  }>;
  messages?: Array<{
    id: string;
    message: string;
    created_at: string;
    user_id: string;
    is_internal: boolean;
    user: {
      email: string;
      profiles: {
        full_name: string | null;
      } | null;
    } | null;
  }>;
}

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
  const labels: Record<string, string> = {
    submitted: "Submitted",
    in_discussion: "In Discussion",
    quote_sent: "Quote Sent",
    quote_accepted: "Quote Accepted",
    in_production: "In Production",
    ready: "Ready",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const formatTimeline = (timeline: string) => {
  const timelines: Record<string, string> = {
    "1-2-weeks": "1-2 Weeks",
    "2-4-weeks": "2-4 Weeks",
    "1-2-months": "1-2 Months",
    "2-3-months": "2-3 Months",
    flexible: "Flexible",
  };
  return timelines[timeline] || timeline;
};

const CustomOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; email: string; full_name: string | null }>>([]);

  // Form state
  const [status, setStatus] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isInternalMessage, setIsInternalMessage] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchStaffMembers();
    }
  }, [id]);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setEstimatedPrice(order.estimated_price?.toString() || "");
      setFinalPrice(order.final_price?.toString() || "");
      setEstimatedCompletionDate(
        order.estimated_completion_date
          ? new Date(order.estimated_completion_date).toISOString().split("T")[0]
          : ""
      );
      setAssignedTo(order.assigned_to || "");
    }
  }, [order]);

  const fetchOrder = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: orderData, error } = await supabase
        .from("custom_orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch related data separately
      let customerData: any = { data: null };
      if (orderData.customer_id) {
        const result = await supabase
          .from("customers")
          .select("id, name, email, phone")
          .eq("id", orderData.customer_id)
          .single();
        customerData = result;
      } else if (orderData.user_id) {
        // Try to find customer by user_id
        const result = await supabase
          .from("customers")
          .select("id, name, email, phone")
          .eq("user_id", orderData.user_id)
          .maybeSingle();
        customerData = result;
      }
      
      // If still no customer, try profiles
      if (!customerData.data && orderData.user_id) {
        const profileResult = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", orderData.user_id)
          .single();
        if (profileResult.data) {
          customerData = {
            data: {
              id: profileResult.data.id,
              name: profileResult.data.full_name,
              email: profileResult.data.email,
              phone: null,
            },
          };
        }
      }

      const [assignedStaffData, imagesData, statusHistoryData, messagesData] = await Promise.all([
        orderData.assigned_to
          ? supabase
              .from("profiles")
              .select("id, email, full_name")
              .eq("id", orderData.assigned_to)
              .single()
              .then((result) => ({
                data: result.data
                  ? {
                      id: result.data.id,
                      email: result.data.email,
                      profiles: { full_name: result.data.full_name },
                    }
                  : null,
              }))
          : Promise.resolve({ data: null }),
        supabase
          .from("custom_order_images")
          .select("id, image_url, caption")
          .eq("custom_order_id", id),
        supabase
          .from("custom_order_status_history")
          .select("id, status, notes, created_at, changed_by")
          .eq("custom_order_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("custom_order_messages")
          .select("id, message, created_at, user_id, is_internal")
          .eq("custom_order_id", id)
          .order("created_at", { ascending: false }),
      ]);

      // Fetch user profiles for messages
      const messageUserIds = [
        ...new Set((messagesData.data || []).map((m: any) => m.user_id).filter(Boolean)),
      ];
      let messageUsersMap: Record<string, any> = {};

      if (messageUserIds.length > 0) {
        const { data: messageProfiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", messageUserIds);

        messageProfiles?.forEach((p: any) => {
          messageUsersMap[p.id] = {
            email: p.email,
            profiles: { full_name: p.full_name },
          };
        });
      }

      // Combine all data
      const order: CustomOrder = {
        ...orderData,
        customer: customerData.data,
        assigned_staff: assignedStaffData.data,
        images: imagesData.data || [],
        status_history: statusHistoryData.data || [],
        messages: (messagesData.data || []).map((m: any) => ({
          ...m,
          user: messageUsersMap[m.user_id] || null,
        })),
      };

      setOrder(order);
    } catch (error: any) {
      console.error("Error fetching custom order:", error);
      toast({
        title: "Error",
        description: "Failed to load custom order details",
        variant: "destructive",
      });
      navigate("/custom-orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(
          `
          user_id,
          user:auth.users!user_roles_user_id_fkey(id, email, profiles(full_name))
        `
        )
        .in("role", ["admin", "staff"]);

      if (error) throw error;

      const staff = (data || []).map((item: any) => ({
        id: item.user_id,
        email: item.user.email,
        full_name: item.user.profiles?.full_name || null,
      }));

      setStaffMembers(staff);
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };

  const updateOrder = async () => {
    if (!order || !id) return;

    setIsUpdating(true);
    try {
      const updateData: any = {
        status,
        assigned_to: assignedTo || null,
        estimated_completion_date: estimatedCompletionDate || null,
      };

      if (estimatedPrice) {
        updateData.estimated_price = parseFloat(estimatedPrice);
      }

      if (finalPrice) {
        updateData.final_price = parseFloat(finalPrice);
      }

      const { error } = await supabase
        .from("custom_orders")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      fetchOrder();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !order || !user) return;

    try {
      const { error } = await supabase.from("custom_order_messages").insert({
        custom_order_id: order.id,
        user_id: user.id,
        message: newMessage,
        is_internal: isInternalMessage,
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent",
      });

      setNewMessage("");
      setIsInternalMessage(false);
      fetchOrder();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Custom Order Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Custom Order Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => navigate("/custom-orders")} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const statusSteps = [
    { key: "submitted", label: "Submitted", icon: Package },
    { key: "in_discussion", label: "In Discussion", icon: MessageSquare },
    { key: "quote_sent", label: "Quote Sent", icon: DollarSign },
    { key: "in_production", label: "In Production", icon: Sparkles },
    { key: "ready", label: "Ready", icon: CheckCircle2 },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentStatusIndex = statusSteps.findIndex((step) => step.key === order.status);
  const isCompleted = (stepKey: string) => {
    const stepIndex = statusSteps.findIndex((step) => step.key === stepKey);
    return stepIndex <= currentStatusIndex;
  };

  return (
    <AdminLayout title="Custom Order Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/custom-orders")}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Order Number & Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold font-mono mb-2">{order.order_number}</h2>
                <p className="text-muted-foreground">{order.product_type}</p>
                {order.customer && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {order.customer.name || order.customer.email || "Customer"}
                    </span>
                    {order.customer.phone && (
                      <span className="text-muted-foreground">• {order.customer.phone}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                {order.final_price ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Final Price</p>
                    <p className="text-3xl font-bold text-primary">
                      ₹{order.final_price.toLocaleString()}
                    </p>
                  </div>
                ) : order.estimated_price ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Price</p>
                    <p className="text-2xl font-bold text-primary">
                      ₹{order.estimated_price.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Budget Range</p>
                    <p className="text-xl font-semibold">{formatBudgetRange(order.budget_range)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="relative">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-10">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const completed = isCompleted(step.key);
                  const isCurrent = step.key === order.status;

                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          completed
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-muted text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <p
                        className={`text-xs mt-2 text-center max-w-[80px] ${
                          completed ? "font-semibold" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Manage Order
            </CardTitle>
            <CardDescription>Update status, pricing, and assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_discussion">In Discussion</SelectItem>
                    <SelectItem value="quote_sent">Quote Sent</SelectItem>
                    <SelectItem value="quote_accepted">Quote Accepted</SelectItem>
                    <SelectItem value="in_production">In Production</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name || staff.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estimated Price (₹)</Label>
                <Input
                  type="number"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  placeholder="Enter estimated price"
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label>Final Price (₹)</Label>
                <Input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="Enter final price"
                  className="rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Estimated Completion Date</Label>
                <Input
                  type="date"
                  value={estimatedCompletionDate}
                  onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>

            <Button
              onClick={updateOrder}
              disabled={isUpdating}
              className="w-full rounded-full"
              size="lg"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-full">
            <TabsTrigger value="details" className="rounded-full">Details</TabsTrigger>
            <TabsTrigger value="images" className="rounded-full">
              Images ({order.images?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-full">
              Messages ({order.messages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-full">Progress</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Product Type</p>
                    <p className="font-semibold">{order.product_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Preferred Fabrics</p>
                    <div className="flex flex-wrap gap-2">
                      {order.preferred_fabrics.map((fabric) => (
                        <Badge key={fabric} variant="outline">
                          {fabric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {order.intended_occasion && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Occasion</p>
                      <p className="font-semibold">{order.intended_occasion}</p>
                    </div>
                  )}
                  {order.color_preferences && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Color Preferences</p>
                      <p>{order.color_preferences}</p>
                    </div>
                  )}
                  {order.size_requirements && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                        Size Requirements
                      </p>
                      <p className="whitespace-pre-line">{order.size_requirements}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Timeline & Budget
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Budget Range</p>
                    <p className="font-semibold">{formatBudgetRange(order.budget_range)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expected Timeline</p>
                    <p className="font-semibold">{formatTimeline(order.expected_delivery_timeline)}</p>
                  </div>
                  {order.estimated_completion_date && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Completion</p>
                      <p className="font-semibold">
                        {new Date(order.estimated_completion_date).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Submitted On</p>
                    <p className="font-semibold">{formatDate(order.submitted_at)}</p>
                  </div>
                  {order.discussion_started_at && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Discussion Started</p>
                      <p className="font-semibold">{formatDate(order.discussion_started_at)}</p>
                    </div>
                  )}
                  {order.production_started_at && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Production Started</p>
                      <p className="font-semibold">{formatDate(order.production_started_at)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Design Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{order.design_instructions}</p>
              </CardContent>
            </Card>

            {order.special_requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Special Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{order.special_requirements}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-6">
            {order.images && order.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {order.images.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50">
                      <img
                        src={image.image_url}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {image.caption && (
                      <p className="text-sm text-muted-foreground mt-2">{image.caption}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No reference images uploaded</p>
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-6 space-y-4">
            {/* Send Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Send Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="rounded-lg min-h-[100px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internalMessage"
                    checked={isInternalMessage}
                    onChange={(e) => setIsInternalMessage(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="internalMessage" className="text-sm">
                    Internal note (visible only to staff)
                  </Label>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-full rounded-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Messages List */}
            {order.messages && order.messages.length > 0 ? (
              <div className="space-y-4">
                {order.messages
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .map((message) => (
                    <Card
                      key={message.id}
                      className={message.is_internal ? "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">
                              {message.user?.profiles?.full_name || message.user?.email || "User"}
                            </p>
                            {message.is_internal && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Internal Note
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-line">{message.message}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="mt-6 space-y-4">
            {order.status_history && order.status_history.length > 0 ? (
              <div className="space-y-4">
                {order.status_history
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .map((history, index) => (
                    <motion.div
                      key={history.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(
                                history.status
                              )}`}
                            >
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getStatusColor(history.status)}>
                                  {getStatusLabel(history.status)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(history.created_at)}
                                </span>
                              </div>
                              {history.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {history.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No progress updates yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default CustomOrderDetail;

