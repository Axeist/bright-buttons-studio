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
import { Loader2, Plus, Edit, Trash2, Tag } from "lucide-react";

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

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
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
    whatsapp_order_confirmation: "",
    whatsapp_order_ready: "",
    whatsapp_order_delivered: "",
    payment_methods: { cash: true, upi: true, card: true, split: false },
    tax_rate: "18",
  });

  useEffect(() => {
    fetchSettings();
    fetchCoupons();
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
        settingsMap[item.key] = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
      });

      setSettings({
        shop_name: settingsMap.shop_name || "",
        shop_phone: settingsMap.shop_phone || "",
        shop_email: settingsMap.shop_email || "",
        shop_address: settingsMap.shop_address || "",
        business_hours: settingsMap.business_hours || "",
        whatsapp_number: settingsMap.whatsapp_number || "",
        whatsapp_order_confirmation: settingsMap.whatsapp_order_confirmation || "",
        whatsapp_order_ready: settingsMap.whatsapp_order_ready || "",
        whatsapp_order_delivered: settingsMap.whatsapp_order_delivered || "",
        payment_methods: settingsMap.payment_methods || { cash: true, upi: true, card: true, split: false },
        tax_rate: settingsMap.tax_rate?.toString() || "18",
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
        { key: "whatsapp_order_confirmation", value: JSON.stringify(settings.whatsapp_order_confirmation) },
        { key: "whatsapp_order_ready", value: JSON.stringify(settings.whatsapp_order_ready) },
        { key: "whatsapp_order_delivered", value: JSON.stringify(settings.whatsapp_order_delivered) },
        { key: "payment_methods", value: JSON.stringify(settings.payment_methods) },
        { key: "tax_rate", value: JSON.stringify(settings.tax_rate) },
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
          <div className="grid gap-4">
            <div>
              <Label>Business Number</Label>
              <Input
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="rounded-xl mt-1.5"
              />
            </div>
            <div>
              <Label>Order Confirmation Message</Label>
              <Textarea
                value={settings.whatsapp_order_confirmation}
                onChange={(e) => setSettings({ ...settings, whatsapp_order_confirmation: e.target.value })}
                className="rounded-xl resize-none mt-1.5"
                rows={3}
                placeholder="Use {order_id} as placeholder"
              />
            </div>
            <div>
              <Label>Order Ready Message</Label>
              <Textarea
                value={settings.whatsapp_order_ready}
                onChange={(e) => setSettings({ ...settings, whatsapp_order_ready: e.target.value })}
                className="rounded-xl resize-none mt-1.5"
                rows={3}
                placeholder="Use {order_id} as placeholder"
              />
            </div>
            <div>
              <Label>Order Delivered Message</Label>
              <Textarea
                value={settings.whatsapp_order_delivered}
                onChange={(e) => setSettings({ ...settings, whatsapp_order_delivered: e.target.value })}
                className="rounded-xl resize-none mt-1.5"
                rows={3}
                placeholder="Use {order_id} as placeholder"
              />
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
    </AdminLayout>
  );
};

export default Settings;
