import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Truck,
  Package,
  Calendar,
  IndianRupee,
} from "lucide-react";

const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "Card", label: "Card" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Credit", label: "Credit" },
  { value: "Other", label: "Other" },
] as const;

interface VendorPurchase {
  id: string;
  where_bought: string;
  purchase_date: string;
  count: number;
  stock_in_at: string;
  cost: number;
  additional_details: string | null;
  item_name: string | null;
  invoice_number: string | null;
  vendor_contact: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

const defaultForm = {
  where_bought: "",
  purchase_date: new Date().toISOString().slice(0, 10),
  count: "1",
  stock_in_at: new Date().toISOString().slice(0, 10),
  cost: "",
  additional_details: "",
  item_name: "",
  invoice_number: "",
  vendor_contact: "",
  payment_method: "Cash",
};

export default function Vendors() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<VendorPurchase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<VendorPurchase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendor_purchases")
        .select("*")
        .order("purchase_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPurchases((data as VendorPurchase[]) || []);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to load vendor purchases",
        variant: "destructive",
      });
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const openAddModal = (purchase?: VendorPurchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setForm({
        where_bought: purchase.where_bought,
        purchase_date: purchase.purchase_date,
        count: purchase.count.toString(),
        stock_in_at: purchase.stock_in_at,
        cost: purchase.cost.toString(),
        additional_details: purchase.additional_details || "",
        item_name: purchase.item_name || "",
        invoice_number: purchase.invoice_number || "",
        vendor_contact: purchase.vendor_contact || "",
        payment_method: (purchase.payment_method as string) || "Cash",
      });
    } else {
      setEditingPurchase(null);
      setForm(defaultForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPurchase(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const countNum = parseInt(form.count, 10);
    const costNum = parseFloat(form.cost);
    if (!form.where_bought.trim()) {
      toast({
        title: "Validation",
        description: "Where things bought is required",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(countNum) || countNum < 1) {
      toast({
        title: "Validation",
        description: "Count must be at least 1",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      toast({
        title: "Validation",
        description: "Enter a valid cost",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        where_bought: form.where_bought.trim(),
        purchase_date: form.purchase_date,
        count: countNum,
        stock_in_at: form.stock_in_at,
        cost: costNum,
        additional_details: form.additional_details.trim() || null,
        item_name: form.item_name.trim() || null,
        invoice_number: form.invoice_number.trim() || null,
        vendor_contact: form.vendor_contact.trim() || null,
        payment_method: form.payment_method || null,
        updated_at: new Date().toISOString(),
      };
      if (editingPurchase) {
        const { error } = await supabase
          .from("vendor_purchases")
          .update(payload)
          .eq("id", editingPurchase.id);
        if (error) throw error;
        toast({ title: "Updated", description: "Vendor purchase updated successfully" });
      } else {
        const { error } = await supabase.from("vendor_purchases").insert({
          ...payload,
          created_by: user?.id || null,
        });
        if (error) throw error;
        toast({ title: "Added", description: "Vendor purchase added successfully" });
      }
      closeModal();
      fetchPurchases();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to save",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor purchase record?")) return;
    try {
      const { error } = await supabase.from("vendor_purchases").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Record removed" });
      fetchPurchases();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const totalCost = purchases.reduce((s, p) => s + Number(p.cost), 0);
  const totalCount = purchases.reduce((s, p) => s + Number(p.count), 0);

  return (
    <AdminLayout title="Vendor Purchases">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Record where you bought stock, dates, quantity, cost, and additional details.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Records</span>
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground">{purchases.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Vendor purchase entries</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Quantity</span>
                <Package className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xl font-bold text-foreground">{totalCount.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground mt-1">Items across all records</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Cost</span>
                <IndianRupee className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xl font-bold text-foreground">
                ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sum of all purchase costs</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Vendor purchase records ({purchases.length})</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add and edit where things were bought, date, count, stock-in date, cost, and notes.
              </p>
            </div>
            <Button
              onClick={() => openAddModal()}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add record
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Where bought</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Item</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Count</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Stock in at</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Cost</th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No records yet. Click &quot;Add record&quot; to add a vendor purchase.
                        </td>
                      </tr>
                    ) : (
                      purchases.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium text-foreground">{p.where_bought}</td>
                          <td className="py-3 px-2 text-muted-foreground">{p.item_name || "—"}</td>
                          <td className="py-3 px-2 text-muted-foreground text-sm">
                            {new Date(p.purchase_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-2 font-medium">{p.count}</td>
                          <td className="py-3 px-2 text-muted-foreground text-sm">
                            {new Date(p.stock_in_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-2 font-semibold text-foreground">
                            ₹{Number(p.cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => openAddModal(p)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? "Edit vendor purchase" : "Add vendor purchase"}
            </DialogTitle>
            <DialogDescription>
              {editingPurchase
                ? "Update the details below."
                : "Where things were bought, date, count, stock-in date, cost, and notes."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="where_bought">Where things bought *</Label>
              <Input
                id="where_bought"
                value={form.where_bought}
                onChange={(e) => setForm({ ...form, where_bought: e.target.value })}
                placeholder="Vendor name or place"
                className="rounded-xl border-primary/30 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_name">Item / product name</Label>
              <Input
                id="item_name"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                placeholder="What was bought"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date *
                </Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_in_at">Stock in at *</Label>
                <Input
                  id="stock_in_at"
                  type="date"
                  value={form.stock_in_at}
                  onChange={(e) => setForm({ ...form, stock_in_at: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Count *</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹) *</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select
                value={form.payment_method}
                onValueChange={(v) => setForm({ ...form, payment_method: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice number</Label>
              <Input
                id="invoice_number"
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                placeholder="Optional"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_contact">Vendor contact</Label>
              <Input
                id="vendor_contact"
                value={form.vendor_contact}
                onChange={(e) => setForm({ ...form, vendor_contact: e.target.value })}
                placeholder="Phone or email"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional_details">Additional details</Label>
              <Textarea
                id="additional_details"
                value={form.additional_details}
                onChange={(e) => setForm({ ...form, additional_details: e.target.value })}
                placeholder="Any extra notes"
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeModal} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPurchase ? "Update" : "Add record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
