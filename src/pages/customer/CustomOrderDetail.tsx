import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Heart,
  TrendingUp,
} from "lucide-react";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  images?: Array<{ id: string; image_url: string; caption: string | null }>;
  status_history?: Array<{
    id: string;
    status: string;
    notes: string | null;
    created_at: string;
  }>;
  messages?: Array<{
    id: string;
    message: string;
    created_at: string;
    user_id: string;
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

  useEffect(() => {
    if (id && user) {
      fetchOrder();
    }
  }, [id, user]);

  const fetchOrder = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_orders")
        .select(
          `
          *,
          images:custom_order_images(id, image_url, caption),
          status_history:custom_order_status_history(id, status, notes, created_at),
          messages:custom_order_messages(id, message, created_at, user_id)
        `
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setOrder(data as CustomOrder);
    } catch (error: any) {
      console.error("Error fetching custom order:", error);
      toast({
        title: "Error",
        description: "Failed to load custom order details",
        variant: "destructive",
      });
      navigate("/customer/custom-orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout title="Custom Order Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout title="Custom Order Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => navigate("/customer/custom-orders")} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const statusSteps = [
    { key: "submitted", label: "Submitted", icon: Package },
    { key: "in_discussion", label: "In Discussion", icon: MessageSquare },
    { key: "quote_sent", label: "Quote Sent", icon: DollarSign },
    { key: "in_production", label: "In Production", icon: Sparkles },
    { key: "ready", label: "Ready", icon: CheckCircle2 },
    { key: "delivered", label: "Delivered", icon: Heart },
  ];

  const currentStatusIndex = statusSteps.findIndex((step) => step.key === order.status);
  const isCompleted = (stepKey: string) => {
    const stepIndex = statusSteps.findIndex((step) => step.key === stepKey);
    return stepIndex <= currentStatusIndex;
  };

  return (
    <CustomerLayout title="Custom Order Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/customer/custom-orders")}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Order Number & Status Timeline */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold font-mono mb-2">{order.order_number}</h2>
                <p className="text-muted-foreground">{order.product_type}</p>
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-full">
            <TabsTrigger value="details" className="rounded-full">Details</TabsTrigger>
            <TabsTrigger value="images" className="rounded-full">
              Reference Images ({order.images?.length || 0})
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
    </CustomerLayout>
  );
};

export default CustomOrderDetail;

