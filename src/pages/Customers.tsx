import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, User, Loader2, Plus, Gift, MessageCircle, Pencil, Trash2, Copy, Phone, Mail, CalendarClock, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  whatsapp_number?: string | null;
  customer_type: string;
  total_orders: number;
  total_spent: number;
  last_purchase_at: string | null;
  loyalty_points?: number;
  loyalty_tier?: string;
  user_id?: string;
  created_at?: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "new" | "returning">("all");
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("total_spent", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "?";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const normalizeWhatsAppPhone = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return null;
    // If it's a 10-digit Indian number, assume +91
    if (digits.length === 10) return `91${digits}`;
    // If it already includes country code (common 12 digits for India), keep as-is
    return digits;
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: `${label} copied to clipboard` });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const handleSendWhatsApp = (customer: Customer) => {
    const phoneToUse = customer.whatsapp_number || customer.phone;
    const phone = normalizeWhatsAppPhone(phoneToUse);
    if (!phone) {
      toast({ title: "Invalid phone", description: "Customer phone number is missing/invalid", variant: "destructive" });
      return;
    }
    const message = `Hi ${customer.name},`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAddCustomer = async () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("customers")
        .insert({
          name: customerForm.name.trim(),
          phone: customerForm.phone.trim(),
          email: customerForm.email.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer added successfully",
      });

      setIsAddCustomerModalOpen(false);
      setCustomerForm({ name: "", phone: "", email: "" });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add customer",
        variant: "destructive",
      });
    }
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setEditCustomerForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
    });
    setIsEditCustomerModalOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomerId) return;
    if (!editCustomerForm.name.trim() || !editCustomerForm.phone.trim()) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: editCustomerForm.name.trim(),
          phone: editCustomerForm.phone.trim(),
          email: editCustomerForm.email.trim() || null,
        })
        .eq("id", editingCustomerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      setIsEditCustomerModalOpen(false);
      setEditingCustomerId(null);
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", customerId);
      if (error) throw error;

      toast({ title: "Deleted", description: "Customer deleted successfully" });
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Customers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Customers">
      {/* Header with Add Customer Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "new", "returning"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                  typeFilter === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={() => setIsAddCustomerModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Customers Tiles */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-card rounded-xl shadow-soft p-10 text-center text-muted-foreground">
          <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredCustomers.map((customer) => {
            const isMember = (customer.total_orders ?? 0) > 0 || (customer.total_spent ?? 0) > 0;
            const loyaltyPoints = customer.loyalty_points ?? 0;
            const loyaltyTier = (customer.loyalty_tier || "Bronze").toLowerCase();

            return (
              <div
                key={customer.id}
                className="relative rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden"
              >
                {/* subtle gradient edge (dark friendly) */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20" />

                <div className="relative p-5">
                  {/* top id pill */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="tracking-wide">{customer.id.slice(0, 10).toUpperCase()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(customer.id, "Customer ID")}
                      className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-background/40 hover:bg-background/70 transition-colors w-9 h-9"
                      aria-label="Copy customer id"
                      title="Copy ID"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* header */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
                      {getInitials(customer.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{customer.name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            customer.customer_type === "new"
                              ? "bg-earth-100 text-earth-800"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {customer.customer_type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isMember ? "Member" : "Non-Member"}
                      </p>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-foreground/90">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{customer.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground/90">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{customer.email || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* metrics */}
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Gift className="w-4 h-4 text-primary" />
                        <span>Loyalty</span>
                      </div>
                      <div className="flex items-end justify-between mt-1">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{loyaltyPoints}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {loyaltyTier}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-primary/15 text-primary text-[10px] font-bold">
                          ₹
                        </span>
                        <span>Spent</span>
                      </div>
                      <div className="mt-1">
                        <p className="text-lg font-semibold text-foreground">₹{(customer.total_spent ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{customer.total_orders ?? 0} orders</p>
                      </div>
                    </div>
                  </div>

                  {/* dates */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last purchase</span>
                      <span className="text-foreground/90">{formatDate(customer.last_purchase_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground inline-flex items-center gap-2">
                        <CalendarClock className="w-4 h-4" />
                        Member since
                      </span>
                      <span className="text-foreground/90">{formatDate(customer.created_at || null)}</span>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="mt-6 space-y-3">
                    <Button
                      type="button"
                      onClick={() => handleSendWhatsApp(customer)}
                      className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send WhatsApp Message
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openEditCustomer(customer)}
                        className="rounded-xl"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setCustomerToDelete(customer)}
                        className="rounded-xl"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      <Dialog open={isAddCustomerModalOpen} onOpenChange={setIsAddCustomerModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Customer name"
                className="rounded-xl h-12 mt-1.5"
              />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="rounded-xl h-12 mt-1.5"
              />
            </div>
            <div>
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="customer@example.com"
                className="rounded-xl h-12 mt-1.5"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddCustomerModalOpen(false);
                  setCustomerForm({ name: "", phone: "", email: "" });
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomer}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white"
              >
                Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog
        open={isEditCustomerModalOpen}
        onOpenChange={(open) => {
          setIsEditCustomerModalOpen(open);
          if (!open) setEditingCustomerId(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={editCustomerForm.name}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                placeholder="Customer name"
                className="rounded-xl h-12 mt-1.5"
              />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={editCustomerForm.phone}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="rounded-xl h-12 mt-1.5"
              />
            </div>
            <div>
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={editCustomerForm.email}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                placeholder="customer@example.com"
                className="rounded-xl h-12 mt-1.5"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditCustomerModalOpen(false);
                  setEditingCustomerId(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCustomer}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{customerToDelete?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => customerToDelete && handleDeleteCustomer(customerToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Customers;
