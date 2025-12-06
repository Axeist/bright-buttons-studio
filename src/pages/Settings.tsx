import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    </AdminLayout>
  );
};

export default Settings;
