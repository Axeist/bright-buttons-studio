import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, User } from "lucide-react";
import { customers } from "@/data/customers";
import { Input } from "@/components/ui/input";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "new" | "returning">("all");

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout title="Customers">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
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
                          customer.type === "new" 
                            ? "bg-earth-100 text-earth-800" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {customer.type}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-foreground hidden md:table-cell">{customer.phone}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                    {customer.email || "—"}
                  </td>
                  <td className="p-4 text-sm text-foreground">{customer.ordersCount}</td>
                  <td className="p-4 text-sm font-semibold text-foreground">{customer.totalSpent}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">
                    {customer.lastPurchase}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No customers found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Customers;
