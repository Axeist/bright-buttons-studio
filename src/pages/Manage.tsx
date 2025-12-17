import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { validatePincodeCSVData, generateSamplePincodeCSV, type CSVPincodeRow } from "@/lib/pincodeCsvImport";
import { parseCSV } from "@/lib/csvImport";
import { Loader2, Plus, Edit, Trash2, Gift, Search, X, MapPin, Upload, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface RedeemableItem {
  id: string;
  name: string;
  description: string | null;
  category: 'discount' | 'coupon' | 'product' | 'other';
  points_required: number;
  value: number | null;
  value_type: 'percentage' | 'fixed' | null;
  max_redemptions: number | null;
  current_redemptions: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceablePincode {
  id: string;
  pincode: string;
  city: string;
  state: string;
  is_active: boolean;
}

interface Coupon {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: "percentage" | "rupees";
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  redeemable_in_pos: boolean;
  redeemable_in_online: boolean;
  starts_at: string | null;
  expires_at: string | null;
}

interface ReviewItem {
  id: string;
  products?: { name?: string };
  customers?: { name?: string; email?: string };
  review_text: string;
  rating: number;
  created_at: string;
  is_approved: boolean | null;
  admin_reply?: string | null;
  admin_reply_at?: string | null;
  admin_reply_by?: string | null;
}

const Manage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RedeemableItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RedeemableItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "discount" as RedeemableItem['category'],
    points_required: "",
    value: "",
    value_type: "fixed" as RedeemableItem['value_type'],
    max_redemptions: "",
    is_active: true,
    valid_from: "",
    valid_until: "",
    image_url: "",
  });

  // Delivery (pincodes)
  const [serviceablePincodes, setServiceablePincodes] = useState<ServiceablePincode[]>([]);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [editingPincode, setEditingPincode] = useState<ServiceablePincode | null>(null);
  const [pincodeForm, setPincodeForm] = useState({
    pincode: "",
    city: "",
    state: "",
    is_active: true,
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPincodePage, setCurrentPincodePage] = useState(1);
  const PINCODES_PER_PAGE = 10;

  // Promotions (coupons)
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage" as "percentage" | "rupees",
    discount_value: "",
    min_purchase_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    is_active: true,
    redeemable_in_pos: true,
    redeemable_in_online: true,
    starts_at: "",
    expires_at: "",
  });

  // Reviews
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSearch, setReviewSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySaving, setReplySaving] = useState<Record<string, boolean>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchItems();
    fetchPincodes();
    fetchCoupons();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, reviewSearch]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("redeemable_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load redeemable items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: RedeemableItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        category: item.category,
        points_required: item.points_required.toString(),
        value: item.value?.toString() || "",
        value_type: item.value_type || "fixed",
        max_redemptions: item.max_redemptions?.toString() || "",
        is_active: item.is_active,
        valid_from: item.valid_from ? new Date(item.valid_from).toISOString().slice(0, 16) : "",
        valid_until: item.valid_until ? new Date(item.valid_until).toISOString().slice(0, 16) : "",
        image_url: item.image_url || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        category: "discount",
        points_required: "",
        value: "",
        value_type: "fixed",
        max_redemptions: "",
        is_active: true,
        valid_from: "",
        valid_until: "",
        image_url: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  // -------- Delivery (Pincodes) handlers --------
  const resetPincodeForm = () => {
    setPincodeForm({
      pincode: "",
      city: "",
      state: "",
      is_active: true,
    });
    setEditingPincode(null);
    setImportErrors([]);
    setCsvFile(null);
  };

  const fetchPincodes = async () => {
    try {
      const { data, error } = await supabase
        .from("serviceable_pincodes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServiceablePincodes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load pincodes",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSampleCSV = () => {
    const csv = generateSamplePincodeCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pincodes_sample.csv";
    link.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleImportPincodes = async () => {
    if (!csvFile) return;
    setIsImporting(true);
    setImportErrors([]);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text) as CSVPincodeRow[];
      const validationErrors = validatePincodeCSVData(rows);
      if (validationErrors.length > 0) {
        setImportErrors(validationErrors);
        return;
      }

      const payload = rows.map((row) => ({
        pincode: row.pincode,
        city: row.city,
        state: row.state,
        is_active: row.is_active ?? true,
      }));

      const { error } = await supabase.from("serviceable_pincodes").insert(payload);
      if (error) throw error;

      toast({ title: "Imported", description: "Pincodes imported successfully" });
      setCsvFile(null);
      await fetchPincodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import pincodes",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const openEditPincode = (pin: ServiceablePincode) => {
    setEditingPincode(pin);
    setPincodeForm({
      pincode: pin.pincode,
      city: pin.city,
      state: pin.state,
      is_active: pin.is_active,
    });
    setIsPincodeModalOpen(true);
  };

  const handleSavePincode = async () => {
    if (!pincodeForm.pincode.trim() || !pincodeForm.city.trim() || !pincodeForm.state.trim()) {
      toast({
        title: "Validation error",
        description: "Pincode, city and state are required",
        variant: "destructive",
      });
      return;
    }

    if (editingPincode) {
      const { error } = await supabase
        .from("serviceable_pincodes")
        .update(pincodeForm)
        .eq("id", editingPincode.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Updated", description: "Pincode updated" });
    } else {
      const { error } = await supabase.from("serviceable_pincodes").insert(pincodeForm);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Added", description: "Pincode added" });
    }

    setIsPincodeModalOpen(false);
    resetPincodeForm();
    fetchPincodes();
  };

  const handleTogglePincode = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("serviceable_pincodes")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchPincodes();
  };

  const handleDeletePincode = async (id: string) => {
    if (!confirm("Delete this pincode?")) return;
    const { error } = await supabase.from("serviceable_pincodes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchPincodes();
  };

  const totalPincodePages = Math.max(1, Math.ceil(serviceablePincodes.length / PINCODES_PER_PAGE));
  const currentPincodePageData = serviceablePincodes.slice(
    (currentPincodePage - 1) * PINCODES_PER_PAGE,
    currentPincodePage * PINCODES_PER_PAGE
  );

  // -------- Coupons handlers --------
  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load coupons", variant: "destructive" });
    }
  };

  const handleToggleCoupon = async (id: string, current: boolean) => {
    const { error } = await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchCoupons();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchCoupons();
  };

  const openEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsCouponModalOpen(true);
    setCouponForm({
      code: coupon.code,
      name: coupon.name || "",
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase_amount: coupon.min_purchase_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || "",
      usage_limit: coupon.usage_limit?.toString() || "",
      is_active: coupon.is_active,
      redeemable_in_pos: coupon.redeemable_in_pos,
      redeemable_in_online: coupon.redeemable_in_online,
      starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : "",
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "",
    });
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) {
      toast({ title: "Error", description: "Coupon code is required", variant: "destructive" });
      return;
    }
    if (!couponForm.discount_value || parseFloat(couponForm.discount_value) <= 0) {
      toast({ title: "Error", description: "Discount value must be greater than 0", variant: "destructive" });
      return;
    }

    setIsSavingCoupon(true);
    try {
      const couponData = {
        code: couponForm.code.toUpperCase().trim(),
        name: couponForm.name || null,
        description: couponForm.description || null,
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value),
        min_purchase_amount: parseFloat(couponForm.min_purchase_amount) || 0,
        max_discount_amount: couponForm.max_discount_amount ? parseFloat(couponForm.max_discount_amount) : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        is_active: couponForm.is_active,
        redeemable_in_pos: couponForm.redeemable_in_pos,
        redeemable_in_online: couponForm.redeemable_in_online,
        starts_at: couponForm.starts_at || null,
        expires_at: couponForm.expires_at || null,
        created_by: user?.id || null,
      };

      if (editingCoupon) {
        const { error } = await supabase.from("coupons").update(couponData).eq("id", editingCoupon.id);
        if (error) throw error;
        toast({ title: "Success", description: "Coupon updated successfully" });
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);
        if (error) throw error;
        toast({ title: "Success", description: "Coupon created successfully" });
      }

      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save coupon", variant: "destructive" });
    } finally {
      setIsSavingCoupon(false);
    }
  };

  // -------- Reviews handlers --------
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      let query = supabase
        .from("product_reviews")
        .select(`
          *,
          products!inner (name),
          customers!inner (name, email)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("is_approved", statusFilter === "approved");
      }

      const { data, error } = await query;
      if (error) throw error;

      const filtered = (data || []).filter((review: any) => {
        const name = review.products?.name?.toLowerCase() || "";
        const email = review.customers?.email?.toLowerCase() || "";
        return (
          name.includes(reviewSearch.toLowerCase()) ||
          email.includes(reviewSearch.toLowerCase())
        );
      });

      setReviews(filtered as ReviewItem[]);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        (filtered as ReviewItem[]).forEach((review) => {
          if (review.admin_reply && !next[review.id]) {
            next[review.id] = review.admin_reply;
          }
          if (!next[review.id]) {
            next[review.id] = "";
          }
        });
        return next;
      });
      setReplyOpen((prev) => {
        const next = { ...prev };
        (filtered as ReviewItem[]).forEach((review) => {
          if (review.admin_reply && next[review.id] === undefined) {
            next[review.id] = true;
          }
          if (next[review.id] === undefined) next[review.id] = false;
        });
        return next;
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load reviews", variant: "destructive" });
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleApproveReview = async (id: string) => {
    const { error } = await supabase.from("product_reviews").update({ is_approved: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchReviews();
  };

  const handleRejectReview = async (id: string) => {
    const { error } = await supabase.from("product_reviews").update({ is_approved: false }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchReviews();
  };

  const handleDeleteReview = async (id: string) => {
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchReviews();
  };

  const handleSaveReply = async (review: ReviewItem) => {
    const draft = replyDrafts[review.id] ?? "";
    const text = draft.trim();

    if (!text) {
      toast({
        title: "Reply required",
        description: "Please enter a reply before saving.",
        variant: "destructive",
      });
      return;
    }

    setReplySaving((prev) => ({ ...prev, [review.id]: true }));
    try {
      const { error } = await supabase
        .from("product_reviews")
        .update({
          admin_reply: text,
          admin_reply_at: new Date().toISOString(),
          admin_reply_by: user?.id || null,
        })
        .eq("id", review.id);

      if (error) throw error;
      toast({ title: "Reply saved", description: "Your reply has been added." });
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save reply",
        variant: "destructive",
      });
    } finally {
      setReplySaving((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  const handleClearReply = async (review: ReviewItem) => {
    setReplySaving((prev) => ({ ...prev, [review.id]: true }));
    try {
      const { error } = await supabase
        .from("product_reviews")
        .update({
          admin_reply: null,
          admin_reply_at: null,
          admin_reply_by: null,
        })
        .eq("id", review.id);

      if (error) throw error;
      setReplyDrafts((prev) => {
        const next = { ...prev };
        next[review.id] = "";
        return next;
      });
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear reply",
        variant: "destructive",
      });
    } finally {
      setReplySaving((prev) => ({ ...prev, [review.id]: false }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.points_required || parseInt(formData.points_required) <= 0) {
      toast({
        title: "Validation Error",
        description: "Points required must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        points_required: parseInt(formData.points_required),
        value: formData.value ? parseFloat(formData.value) : null,
        value_type: formData.value_type,
        max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
        is_active: formData.is_active,
        image_url: formData.image_url.trim() || null,
        created_by: user?.id,
      };

      if (formData.valid_from) {
        itemData.valid_from = new Date(formData.valid_from).toISOString();
      }
      if (formData.valid_until) {
        itemData.valid_until = new Date(formData.valid_until).toISOString();
      }

      if (editingItem) {
        const { error } = await supabase
          .from("redeemable_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Redeemable item updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("redeemable_items")
          .insert([itemData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Redeemable item created successfully",
        });
      }

      handleCloseDialog();
      fetchItems();
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save redeemable item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this redeemable item?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("redeemable_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Redeemable item deleted successfully",
      });
      fetchItems();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete redeemable item",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (item: RedeemableItem) => {
    try {
      const { error } = await supabase
        .from("redeemable_items")
        .update({ is_active: !item.is_active })
        .eq("id", item.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: `Item ${!item.is_active ? 'activated' : 'deactivated'} successfully`,
      });
      fetchItems();
    } catch (error: any) {
      console.error("Error toggling item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'discount':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'coupon':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'product':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const DeliveriesTab = () => (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle>Serviceable Pincodes</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSampleCSV}
              className="rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample CSV
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => {
                resetPincodeForm();
                setIsPincodeModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pincode
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Manage the list of pincodes where delivery is available.
            </div>
            <label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {csvFile ? csvFile.name : "Choose CSV File"}
                </span>
              </Button>
            </label>
            <Button
              onClick={handleImportPincodes}
              disabled={!csvFile || isImporting || importErrors.length > 0}
              className="rounded-xl"
              size="sm"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>

          {importErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-semibold text-destructive mb-2">
                Validation Errors ({importErrors.length}):
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {importErrors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-xs text-destructive">
                    Row {error.row}, {error.field}: {error.message}
                  </p>
                ))}
                {importErrors.length > 10 && (
                  <p className="text-xs text-destructive">
                    ... and {importErrors.length - 10} more errors
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {serviceablePincodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No serviceable pincodes added yet</p>
                <p className="text-sm mt-1">Use the import option or add manually to get started</p>
              </div>
            ) : (
              currentPincodePageData.map((pincode) => (
                <div
                  key={pincode.id}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border"
                >
                  <div>
                    <p className="font-semibold text-foreground">{pincode.pincode}</p>
                    <p className="text-sm text-muted-foreground">{pincode.city}, {pincode.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pincode.is_active}
                      onCheckedChange={() => handleTogglePincode(pincode.id, pincode.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditPincode(pincode)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePincode(pincode.id)}
                      className="rounded-xl text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPincodePages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPincodePage((prev) => Math.max(1, prev - 1))}
                disabled={currentPincodePage === 1}
                className="rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPincodePage} of {totalPincodePages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPincodePage((prev) => Math.min(totalPincodePages, prev + 1))}
                disabled={currentPincodePage === totalPincodePages}
                className="rounded-xl"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Pincode Dialog */}
      <Dialog open={isPincodeModalOpen} onOpenChange={setIsPincodeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPincode ? "Edit Pincode" : "Add Pincode"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Pincode *</Label>
                <Input
                  value={pincodeForm.pincode}
                  onChange={(e) => setPincodeForm({ ...pincodeForm, pincode: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>City *</Label>
                <Input
                  value={pincodeForm.city}
                  onChange={(e) => setPincodeForm({ ...pincodeForm, city: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>State *</Label>
                <Input
                  value={pincodeForm.state}
                  onChange={(e) => setPincodeForm({ ...pincodeForm, state: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={pincodeForm.is_active}
                  onCheckedChange={(checked) => setPincodeForm({ ...pincodeForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPincodeModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSavePincode} className="rounded-xl">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );

  const PromotionsTab = () => (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Coupons</h2>
            <p className="text-sm text-muted-foreground">Create and manage discount coupons</p>
          </div>
          <Button
            onClick={() => {
              setEditingCoupon(null);
              setIsCouponModalOpen(true);
              setCouponForm({
                code: "",
                name: "",
                description: "",
                discount_type: "percentage",
                discount_value: "",
                min_purchase_amount: "",
                max_discount_amount: "",
                usage_limit: "",
                is_active: true,
                redeemable_in_pos: true,
                redeemable_in_online: true,
                starts_at: "",
                expires_at: "",
              });
            }}
            className="rounded-xl"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Coupon
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No coupons created yet</p>
              <p className="text-sm mt-1">Click "Add Coupon" to create your first coupon</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{coupon.code}</span>
                      {!coupon.is_active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    {coupon.name && (
                      <p className="text-sm text-muted-foreground mt-0.5">{coupon.name}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}% off`
                          : `₹${coupon.discount_value} off`}
                      </span>
                      {coupon.usage_limit && (
                        <span>
                          {coupon.used_count} / {coupon.usage_limit} used
                        </span>
                      )}
                      <span>
                        {coupon.redeemable_in_pos && coupon.redeemable_in_online
                          ? "POS & Online"
                          : coupon.redeemable_in_pos
                          ? "POS only"
                          : "Online only"}
                      </span>
                      {coupon.starts_at && (
                        <span>Starts: {new Date(coupon.starts_at).toLocaleDateString()}</span>
                      )}
                      {coupon.expires_at && (
                        <span>Expires: {new Date(coupon.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={() => handleToggleCoupon(coupon.id, coupon.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditCoupon(coupon)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="rounded-xl text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Modal */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coupon Code *</Label>
              <Input
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                className="rounded-xl h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={couponForm.name}
                onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                placeholder="Summer Sale"
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                placeholder="Describe the coupon"
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Discount Type *</Label>
              <select
                value={couponForm.discount_type}
                onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as "percentage" | "rupees" })}
                className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="percentage">Percentage</option>
                <option value="rupees">Fixed Amount</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Discount Value *</Label>
              <Input
                type="number"
                value={couponForm.discount_value}
                onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                placeholder={couponForm.discount_type === "percentage" ? "20" : "500"}
                className="rounded-xl h-12"
                min="0"
                step={couponForm.discount_type === "percentage" ? "1" : "0.01"}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Purchase Amount</Label>
              <Input
                type="number"
                value={couponForm.min_purchase_amount}
                onChange={(e) => setCouponForm({ ...couponForm, min_purchase_amount: e.target.value })}
                placeholder="0"
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Discount Amount</Label>
              <Input
                type="number"
                value={couponForm.max_discount_amount}
                onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                placeholder="Leave empty for no limit"
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Usage Limit</Label>
              <Input
                type="number"
                value={couponForm.usage_limit}
                onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                placeholder="Leave empty for unlimited"
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Starts At</Label>
              <Input
                type="datetime-local"
                value={couponForm.starts_at}
                onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })}
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Expires At</Label>
              <Input
                type="datetime-local"
                value={couponForm.expires_at}
                onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                className="rounded-xl h-12"
              />
            </div>

            <div className="flex items-center gap-4 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pos"
                  checked={couponForm.redeemable_in_pos}
                  onCheckedChange={(checked) => setCouponForm({ ...couponForm, redeemable_in_pos: !!checked })}
                />
                <Label htmlFor="pos" className="cursor-pointer">Redeemable in POS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online"
                  checked={couponForm.redeemable_in_online}
                  onCheckedChange={(checked) => setCouponForm({ ...couponForm, redeemable_in_online: !!checked })}
                />
                <Label htmlFor="online" className="cursor-pointer">Redeemable Online</Label>
              </div>
            </div>

            <div className="flex justify-end md:col-span-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCouponModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCoupon}
                className="rounded-xl"
                disabled={isSavingCoupon}
              >
                {isSavingCoupon ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );

  const ReviewsTab = () => (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Manage Reviews</h2>
            <p className="text-sm text-muted-foreground">Approve or reject customer reviews</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by product or customer"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="w-[160px] rounded-xl">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reviewsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No reviews found</p>
              <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border rounded-xl bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.products?.name}</span>
                        <Badge variant={review.is_approved ? "default" : "secondary"}>
                          {review.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.customers?.name || review.customers?.email}
                      </p>
                      <p className="text-sm text-foreground">{review.review_text}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Rating: {review.rating}/5</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReplyOpen((prev) => ({
                            ...prev,
                            [review.id]: !(prev[review.id] ?? false),
                          }))
                        }
                        className="rounded-xl"
                      >
                        {replyOpen[review.id] ? "Hide reply" : "Reply"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewToDelete(review)}
                        className="rounded-xl text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {(replyOpen[review.id] ?? false) && (
                    <div className="mt-4 space-y-3">
                      {review.admin_reply && (
                        <div className="rounded-lg border bg-background/70 px-3 py-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Reply</span>
                            {review.admin_reply_at && (
                              <span>{new Date(review.admin_reply_at).toLocaleString()}</span>
                            )}
                          </div>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-line">
                            {review.admin_reply}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Add / edit reply</Label>
                        <Textarea
                          placeholder="Write a response to this review..."
                          value={replyDrafts[review.id] ?? ""}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                          }
                          rows={3}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveReply(review)}
                            disabled={replySaving[review.id]}
                            className="rounded-xl"
                          >
                            {replySaving[review.id] && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Save reply
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleClearReply(review)}
                            disabled={replySaving[review.id] || (!review.admin_reply && !(replyDrafts[review.id]?.trim()))}
                            className="rounded-xl"
                          >
                            Clear reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!reviewToDelete} onOpenChange={() => setReviewToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this review? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setReviewToDelete(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (reviewToDelete) handleDeleteReview(reviewToDelete.id);
                setReviewToDelete(null);
              }}
              className="rounded-xl"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );

  const RedeemTab = () => (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Redeemable Items</h1>
          <p className="text-muted-foreground mt-1">
            Configure items that customers can redeem using loyalty points
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
                <SelectItem value="coupon">Coupon</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No redeemable items found</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{item.name}</CardTitle>
                      <Badge className={getCategoryBadgeColor(item.category)}>
                        {item.category}
                      </Badge>
                      {!item.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {item.description && (
                      <CardDescription className="mt-1">{item.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => handleToggleActive(item)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Points Required</p>
                    <p className="font-semibold">{item.points_required}</p>
                  </div>
                  {item.value && (
                    <div>
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-semibold">
                        {item.value_type === 'percentage' 
                          ? `${item.value}%`
                          : `₹${item.value}`}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Redemptions</p>
                    <p className="font-semibold">
                      {item.current_redemptions}
                      {item.max_redemptions && ` / ${item.max_redemptions}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold">
                      {item.valid_until && new Date(item.valid_until) < new Date()
                        ? "Expired"
                        : item.is_active
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Redeemable Item" : "Create Redeemable Item"}
            </DialogTitle>
            <DialogDescription>
              Configure the details of the redeemable item
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as RedeemableItem['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="coupon">Coupon</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="points_required">Points Required *</Label>
                <Input
                  id="points_required"
                  type="number"
                  min="1"
                  value={formData.points_required}
                  onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="value_type">Value Type</Label>
                <Select
                  value={formData.value_type || "fixed"}
                  onValueChange={(value) => setFormData({ ...formData, value_type: value as RedeemableItem['value_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="max_redemptions">Max Redemptions (leave empty for unlimited)</Label>
                <Input
                  id="max_redemptions"
                  type="number"
                  min="1"
                  value={formData.max_redemptions}
                  onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );

  return (
    <AdminLayout>
      <Tabs defaultValue="redeem" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 rounded-xl">
          <TabsTrigger value="redeem" className="rounded-xl">Redeem Items</TabsTrigger>
          <TabsTrigger value="delivery" className="rounded-xl">Delivery</TabsTrigger>
          <TabsTrigger value="promotions" className="rounded-xl">Promotions</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl">Manage Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="redeem" className="space-y-6">
          <RedeemTab />
        </TabsContent>
        <TabsContent value="delivery" className="space-y-6">
          <DeliveriesTab />
        </TabsContent>
        <TabsContent value="promotions" className="space-y-6">
          <PromotionsTab />
        </TabsContent>
        <TabsContent value="reviews" className="space-y-6">
          <ReviewsTab />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default Manage;

