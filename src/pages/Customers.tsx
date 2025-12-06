import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
    </AdminLayout>
  );
};

export default Customers;
