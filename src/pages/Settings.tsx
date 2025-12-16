import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { parseCSV } from "@/lib/csvImport";
import { validatePincodeCSVData, generateSamplePincodeCSV, type CSVPincodeRow } from "@/lib/pincodeCsvImport";
import { Loader2, Plus, Edit, Trash2, Tag, MapPin, Upload, Download, FileText, Package, Star } from "lucide-react";

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

interface ServiceablePincode {
  id: string;
  pincode: string;
  city: string;
  state: string;
  is_active: boolean;
}

interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  is_featured: boolean;
  status: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
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
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [updatingFeatured, setUpdatingFeatured] = useState<string | null>(null);
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
  const [settings, setSettings] = useState({
    shop_name: "",
    shop_phone: "",
    shop_email: "",
    shop_address: "",
    business_hours: "",
    whatsapp_number: "",
    payment_methods: { cash: true, upi: true, card: true, split: false, online: true },
    tax_rate: "18",
    free_shipping_threshold: "2000",
    shipping_charge: "150",
  });

  useEffect(() => {
    fetchSettings();
    fetchCoupons();
    fetchServiceablePincodes();
    fetchProducts();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value");

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach((item) => {
        if (typeof item.value === "string") {
          // Try to parse as JSON, but if it fails, use the string as-is
          try {
            settingsMap[item.key] = JSON.parse(item.value);
          } catch {
            // If parsing fails, it's a plain string, use it directly
            settingsMap[item.key] = item.value;
          }
        } else {
          settingsMap[item.key] = item.value;
        }
      });

      setSettings({
        shop_name: settingsMap.shop_name || "",
        shop_phone: settingsMap.shop_phone || "",
        shop_email: settingsMap.shop_email || "",
        shop_address: settingsMap.shop_address || "",
        business_hours: settingsMap.business_hours || "",
        whatsapp_number: settingsMap.whatsapp_number || "",
        payment_methods: settingsMap.payment_methods || { cash: true, upi: true, card: true, split: false, online: true },
        tax_rate: settingsMap.tax_rate?.toString() || "18",
        free_shipping_threshold: settingsMap.free_shipping_threshold?.toString() || "2000",
        shipping_charge: settingsMap.shipping_charge?.toString() || "150",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: "shop_name", value: JSON.stringify(settings.shop_name) },
        { key: "shop_phone", value: JSON.stringify(settings.shop_phone) },
        { key: "shop_email", value: JSON.stringify(settings.shop_email) },
        { key: "shop_address", value: JSON.stringify(settings.shop_address) },
        { key: "business_hours", value: JSON.stringify(settings.business_hours) },
        { key: "whatsapp_number", value: JSON.stringify(settings.whatsapp_number) },
        { key: "payment_methods", value: JSON.stringify(settings.payment_methods) },
        { key: "tax_rate", value: JSON.stringify(settings.tax_rate) },
        { key: "free_shipping_threshold", value: JSON.stringify(settings.free_shipping_threshold) },
        { key: "shipping_charge", value: JSON.stringify(settings.shipping_charge) },
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from("settings")
          .upsert({
            key: setting.key,
            value: setting.value,
            updated_by: user?.id || null,
          }, {
            onConflict: "key",
          });
      }

      toast({
        title: "Settings saved!",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load coupons",
        variant: "destructive",
      });
    }
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) {
      toast({
        title: "Error",
        description: "Coupon code is required",
        variant: "destructive",
      });
      return;
    }

    if (!couponForm.discount_value || parseFloat(couponForm.discount_value) <= 0) {
      toast({
        title: "Error",
        description: "Discount value must be greater than 0",
        variant: "destructive",
      });
      return;
    }

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
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("coupons")
          .insert(couponData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Coupon created successfully",
        });
      }

      setIsCouponModalOpen(false);
      resetCouponForm();
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save coupon",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const openEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
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
    setIsCouponModalOpen(true);
  };

  const resetCouponForm = () => {
    setEditingCoupon(null);
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
  };

  const fetchServiceablePincodes = async () => {
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
        description: error.message || "Failed to load serviceable pincodes",
        variant: "destructive",
      });
    }
  };

  const handleSavePincode = async () => {
    if (!pincodeForm.pincode.trim() || pincodeForm.pincode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    if (!pincodeForm.city.trim() || !pincodeForm.state.trim()) {
      toast({
        title: "Error",
        description: "City and State are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const pincodeData = {
        pincode: pincodeForm.pincode.trim(),
        city: pincodeForm.city.trim(),
        state: pincodeForm.state.trim(),
        is_active: pincodeForm.is_active,
        created_by: user?.id || null,
      };

      if (editingPincode) {
        const { error } = await supabase
          .from("serviceable_pincodes")
          .update(pincodeData)
          .eq("id", editingPincode.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Serviceable pincode updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("serviceable_pincodes")
          .insert(pincodeData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Serviceable pincode added successfully",
        });
      }

      setIsPincodeModalOpen(false);
      resetPincodeForm();
      fetchServiceablePincodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save serviceable pincode",
        variant: "destructive",
      });
    }
  };

  const handleDeletePincode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this serviceable pincode?")) return;

    try {
      const { error } = await supabase
        .from("serviceable_pincodes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Serviceable pincode deleted successfully",
      });
      fetchServiceablePincodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete serviceable pincode",
        variant: "destructive",
      });
    }
  };

  const openEditPincode = (pincode: ServiceablePincode) => {
    setEditingPincode(pincode);
    setPincodeForm({
      pincode: pincode.pincode,
      city: pincode.city,
      state: pincode.state,
      is_active: pincode.is_active,
    });
    setIsPincodeModalOpen(true);
  };

  const resetPincodeForm = () => {
    setEditingPincode(null);
    setPincodeForm({
      pincode: "",
      city: "",
      state: "",
      is_active: true,
    });
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSamplePincodeCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'serviceable_pincodes_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Sample CSV Downloaded",
      description: "Sample CSV file with Tiruchirappalli pincodes has been downloaded",
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    setImportErrors([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const validation = validatePincodeCSVData(rows);
      
      if (validation.errors.length > 0) {
        setImportErrors(validation.errors);
        toast({
          title: "Validation Errors Found",
          description: `Found ${validation.errors.length} error(s). Please fix them before importing.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File Validated",
          description: `Found ${validation.valid.length} valid pincode(s) ready to import`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Reading File",
        description: error.message || "Failed to read CSV file",
        variant: "destructive",
      });
      setCsvFile(null);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, price, image_url, is_featured, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    setUpdatingFeatured(productId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: !currentFeatured })
        .eq("id", productId);

      if (error) throw error;

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_featured: !currentFeatured } : p
        )
      );

      toast({
        title: "Success",
        description: currentFeatured
          ? "Product removed from featured"
          : "Product added to featured",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setUpdatingFeatured(null);
    }
  };

  const handleImportPincodes = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      const validation = validatePincodeCSVData(rows);

      if (validation.errors.length > 0) {
        setImportErrors(validation.errors);
        toast({
          title: "Validation Errors",
          description: "Please fix the errors before importing",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Import valid pincodes
      const pincodesToImport = validation.valid.map((row: CSVPincodeRow) => ({
        pincode: row.pincode,
        city: row.city,
        state: row.state,
        is_active: row.is_active === 'true' || row.is_active === undefined,
        created_by: user?.id || null,
      }));

      // Use upsert to handle duplicates (update if exists, insert if not)
      const { error } = await supabase
        .from("serviceable_pincodes")
        .upsert(pincodesToImport, {
          onConflict: "pincode",
          ignoreDuplicates: false,
        });

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Successfully imported ${pincodesToImport.length} pincode(s)`,
      });

      setCsvFile(null);
      setImportErrors([]);
      fetchServiceablePincodes();
    } catch (error: any) {
      console.error("Error importing pincodes:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import pincodes",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="space-y-8 max-w-3xl">
        {/* Shop Information */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Shop Information</h2>
          <div className="grid gap-4">
            <div>
              <Label>Shop Name</Label>
              <Input
                value={settings.shop_name}
                onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                className="rounded-xl mt-1.5"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={settings.shop_phone}
                  onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
                  className="rounded-xl mt-1.5"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={settings.shop_email}
                  onChange={(e) => setSettings({ ...settings, shop_email: e.target.value })}
                  className="rounded-xl mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={settings.shop_address}
                onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
                className="rounded-xl resize-none mt-1.5"
                rows={2}
              />
            </div>
            <div>
              <Label>Business Hours</Label>
              <Input
                value={settings.business_hours}
                onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                className="rounded-xl mt-1.5"
              />
            </div>
          </div>
        </section>

        {/* WhatsApp Settings */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">WhatsApp Settings</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configure WhatsApp number for customer enquiries and support
          </p>
          <div className="grid gap-4">
            <div>
              <Label>Business WhatsApp Number</Label>
              <Input
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="rounded-xl mt-1.5"
                placeholder="+91 99999 99999"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                This number will be used for WhatsApp enquiry links on the website
              </p>
            </div>
          </div>
        </section>

        {/* Shipping Settings */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Shipping Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Free Shipping Threshold (₹)</Label>
              <Input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                className="rounded-xl mt-1.5"
                placeholder="2000"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Orders above this amount get free shipping
              </p>
            </div>
            <div>
              <Label>Standard Shipping Charge (₹)</Label>
              <Input
                type="number"
                value={settings.shipping_charge}
                onChange={(e) => setSettings({ ...settings, shipping_charge: e.target.value })}
                className="rounded-xl mt-1.5"
                placeholder="150"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Shipping charge for orders below threshold
              </p>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h2>
          <div className="space-y-4">
            {Object.entries(settings.payment_methods).map(([method, enabled]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-foreground capitalize">{method}</span>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      payment_methods: { ...settings.payment_methods, [method]: checked },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Tax Settings */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Tax Settings</h2>
          <div>
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              value={settings.tax_rate}
              onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
              className="rounded-xl mt-1.5"
            />
          </div>
        </section>

        {/* Featured Products Management */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Featured Products
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Select which products should be displayed on the landing page. Only featured products will appear in the "Handcrafted Collections" section.
          </p>

          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active products found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">₹{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.is_featured && (
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                        Featured
                      </span>
                    )}
                    <Switch
                      checked={product.is_featured}
                      onCheckedChange={() => handleToggleFeatured(product.id, product.is_featured)}
                      disabled={updatingFeatured === product.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Serviceable Pincodes Management */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Serviceable Pincodes
            </h2>
            <Button
              onClick={() => {
                resetPincodeForm();
                setIsPincodeModalOpen(true);
              }}
              className="rounded-xl"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pincode
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Manage the list of pincodes where delivery is available. Customers will only be able to place orders for serviceable pincodes.
          </p>

          {/* CSV Import Section */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Import from CSV
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSampleCSV}
                className="rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Upload a CSV file with columns: pincode, city, state, is_active (optional)
            </p>
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  type="button"
                  className="w-full rounded-xl"
                  asChild
                >
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
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
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
          </div>

          {serviceablePincodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No serviceable pincodes added yet</p>
              <p className="text-sm mt-1">Click "Add Pincode" to add your first serviceable pincode</p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviceablePincodes.map((pincode) => (
                <div
                  key={pincode.id}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{pincode.pincode}</span>
                      {!pincode.is_active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {pincode.city}, {pincode.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
              ))}
            </div>
          )}
        </section>

        {/* Coupon Management */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Coupon Management
            </h2>
            <Button
              onClick={() => {
                resetCouponForm();
                setIsCouponModalOpen(true);
              }}
              className="rounded-xl"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Coupon
            </Button>
          </div>
          
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Coupon Modal */}
      <Dialog open={isCouponModalOpen} onOpenChange={(open) => {
        setIsCouponModalOpen(open);
        if (!open) resetCouponForm();
      }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Coupon Code *</Label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="rounded-xl h-12"
                  disabled={!!editingCoupon}
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={couponForm.name}
                  onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                  placeholder="Summer Sale"
                  className="rounded-xl h-12"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                placeholder="Coupon description"
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Discount Type *</Label>
                <select
                  value={couponForm.discount_type}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as "percentage" | "rupees" })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="rupees">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
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
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Minimum Purchase Amount (₹)</Label>
                <Input
                  type="number"
                  value={couponForm.min_purchase_amount}
                  onChange={(e) => setCouponForm({ ...couponForm, min_purchase_amount: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                  min="0"
                />
              </div>
              <div>
                <Label>Max Discount Amount (₹) - Optional</Label>
                <Input
                  type="number"
                  value={couponForm.max_discount_amount}
                  onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: e.target.value })}
                  placeholder="Leave empty for no limit"
                  className="rounded-xl h-12"
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label>Usage Limit - Optional</Label>
              <Input
                type="number"
                value={couponForm.usage_limit}
                onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                placeholder="Leave empty for unlimited"
                className="rounded-xl h-12"
                min="1"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Starts At - Optional</Label>
                <Input
                  type="datetime-local"
                  value={couponForm.starts_at}
                  onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })}
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Expires At - Optional</Label>
                <Input
                  type="datetime-local"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                  className="rounded-xl h-12"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={couponForm.is_active}
                  onCheckedChange={(checked) => setCouponForm({ ...couponForm, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Redeemable in POS</Label>
                <Switch
                  checked={couponForm.redeemable_in_pos}
                  onCheckedChange={(checked) => setCouponForm({ ...couponForm, redeemable_in_pos: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Redeemable in Online Store</Label>
                <Switch
                  checked={couponForm.redeemable_in_online}
                  onCheckedChange={(checked) => setCouponForm({ ...couponForm, redeemable_in_online: checked })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCouponModalOpen(false);
                  resetCouponForm();
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCoupon}
                className="flex-1 rounded-xl"
              >
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Serviceable Pincode Modal */}
      <Dialog open={isPincodeModalOpen} onOpenChange={(open) => {
        setIsPincodeModalOpen(open);
        if (!open) resetPincodeForm();
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingPincode ? "Edit Serviceable Pincode" : "Add Serviceable Pincode"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Pincode *</Label>
              <Input
                value={pincodeForm.pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincodeForm({ ...pincodeForm, pincode: value });
                }}
                placeholder="110001"
                className="rounded-xl h-12"
                maxLength={6}
                disabled={!!editingPincode}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                6-digit Indian pincode
              </p>
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={pincodeForm.city}
                onChange={(e) => setPincodeForm({ ...pincodeForm, city: e.target.value })}
                placeholder="New Delhi"
                className="rounded-xl h-12"
              />
            </div>
            <div>
              <Label>State *</Label>
              <Input
                value={pincodeForm.state}
                onChange={(e) => setPincodeForm({ ...pincodeForm, state: e.target.value })}
                placeholder="Delhi"
                className="rounded-xl h-12"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={pincodeForm.is_active}
                onCheckedChange={(checked) => setPincodeForm({ ...pincodeForm, is_active: checked })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPincodeModalOpen(false);
                  resetPincodeForm();
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePincode}
                className="flex-1 rounded-xl"
              >
                {editingPincode ? "Update Pincode" : "Add Pincode"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Settings;
