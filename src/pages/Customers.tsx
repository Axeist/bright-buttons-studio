import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, User, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  customer_type: string;
  total_orders: number;
  total_spent: number;
  last_purchase_at: string | null;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "new" | "returning">("all");
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN");
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

      {/* Customers Table */}
      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Customer</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4 hidden md:table-cell">Phone</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4 hidden lg:table-cell">Email</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Orders</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Total Spent</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4 hidden sm:table-cell">Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          customer.customer_type === "new" 
                            ? "bg-earth-100 text-earth-800" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {customer.customer_type}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-foreground hidden md:table-cell">{customer.phone}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                    {customer.email || "—"}
                  </td>
                  <td className="p-4 text-sm text-foreground">{customer.total_orders}</td>
                  <td className="p-4 text-sm font-semibold text-foreground">₹{customer.total_spent.toLocaleString()}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">
                    {formatDate(customer.last_purchase_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No customers found</p>
          </div>
        )}
      </div>

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
    </AdminLayout>
  );
};

export default Customers;
