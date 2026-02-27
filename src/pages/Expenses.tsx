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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  { value: "Stock and supplies", label: "Stock and supplies", color: "bg-orange-500" },
  { value: "Staff payroll and bonuses", label: "Staff payroll and bonuses", color: "bg-purple-500" },
  { value: "Utilities and bills", label: "Utilities and bills", color: "bg-green-500" },
  { value: "Rent and deposits", label: "Rent and deposits", color: "bg-blue-500" },
  { value: "Marketing and printing", label: "Marketing and printing", color: "bg-pink-500" },
  { value: "Repairs and maintenance", label: "Repairs and maintenance", color: "bg-emerald-500" },
  { value: "Transport and delivery", label: "Transport and delivery", color: "bg-orange-500" },
  { value: "Software and subscriptions", label: "Software and subscriptions", color: "bg-purple-500" },
  { value: "Events and prizes", label: "Events and prizes", color: "bg-blue-500" },
  { value: "Finance and bank fees", label: "Finance and bank fees", color: "bg-slate-500" },
  { value: "Partner withdrawals", label: "Partner withdrawals", color: "bg-red-500" },
  { value: "Miscellaneous", label: "Miscellaneous", color: "bg-gray-500" },
] as const;

const getCategoryColor = (category: string) => {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found?.color ?? "bg-gray-500";
};

/** Format amount as ₹ with 2 decimal places for KPI cards */
function formatCurrency(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  expense_date: string;
  is_recurring: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function Expenses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"month" | "3months" | "year">("month");

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "Miscellaneous",
    is_recurring: false,
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    switch (dateRange) {
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "3months":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return {
      start: start.toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    };
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("expense_date", start)
        .lte("expense_date", end)
        .order("expense_date", { ascending: false });

      if (error) throw error;
      setExpenses((data as Expense[]) || []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to load expenses",
        variant: "destructive",
      });
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      const { start, end } = getDateRange();
      const startTs = new Date(start).toISOString();
      const endTs = new Date(end + "T23:59:59.999Z").toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select("total_amount, status")
        .gte("created_at", startTs)
        .lte("created_at", endTs);

      if (error) throw error;
      const paid = (data || []).filter(
        (o) => !["cancelled", "refunded"].includes((o.status || "").toLowerCase())
      );
      const total = paid.reduce(
        (sum, o) => sum + Number(o.total_amount ?? 0),
        0
      );
      setRevenue(total);
    } catch {
      setRevenue(0);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchRevenue();
  }, [dateRange]);

  const openAddModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setForm({
        name: expense.name,
        amount: expense.amount.toString(),
        category: expense.category,
        is_recurring: expense.is_recurring,
        expense_date: expense.expense_date,
        notes: expense.notes || "",
      });
    } else {
      setEditingExpense(null);
      setForm({
        name: "",
        amount: "",
        category: "Miscellaneous",
        is_recurring: false,
        expense_date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(form.amount);
    if (!form.name.trim()) {
      toast({
        title: "Validation",
        description: "Expense name is required",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(amountNum) || amountNum < 0) {
      toast({
        title: "Validation",
        description: "Enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount: amountNum,
        category: form.category,
        is_recurring: form.is_recurring,
        expense_date: form.expense_date,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", editingExpense.id);
        if (error) throw error;
        toast({ title: "Updated", description: "Expense updated successfully" });
      } else {
        const { error } = await supabase.from("expenses").insert({
          ...payload,
          created_by: user?.id || null,
        });
        if (error) throw error;
        toast({ title: "Added", description: "Expense added successfully" });
      }
      closeModal();
      fetchExpenses();
      fetchRevenue();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to save expense",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Expense removed" });
      fetchExpenses();
      fetchRevenue();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const withdrawalsTotal = expenses
    .filter((e) => e.category === "Partner withdrawals")
    .reduce((s, e) => s + Number(e.amount), 0);
  const operatingExpenses = expenses
    .filter((e) => e.category !== "Partner withdrawals")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = revenue - operatingExpenses;
  const moneyInBank = netProfit - withdrawalsTotal;
  const profitMargin =
    revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses
      .filter((e) => e.category === cat.value)
      .reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0);

  const filteredExpenses = categoryFilter
    ? expenses.filter((e) => e.category === categoryFilter)
    : expenses;

  const summaryCards = [
    {
      title: "Gross Income",
      value: revenue,
      desc: "Revenue for selected period (paid only)",
      icon: DollarSign,
      iconClass: "text-primary",
    },
    {
      title: "Operating Expenses",
      value: operatingExpenses,
      desc: "Expenses for selected period (excl. withdrawals)",
      icon: Receipt,
      iconClass: "text-orange-500",
    },
    {
      title: "Net Profit",
      value: netProfit,
      desc: "Revenue minus operating expenses",
      icon: netProfit >= 0 ? TrendingUp : TrendingDown,
      iconClass: netProfit >= 0 ? "text-primary" : "text-red-500",
    },
    {
      title: "Profit Margin",
      value: profitMargin,
      desc: profitMargin >= 30 ? "High" : profitMargin >= 10 ? "Medium" : "Low",
      icon: PieChart,
      iconClass: "text-blue-500",
    },
    {
      title: "Withdrawals",
      value: withdrawalsTotal,
      desc: "Partner drawings (excluded from expenses)",
      icon: ArrowDownRight,
      iconClass: "text-red-500",
    },
    {
      title: "Money in Bank",
      value: moneyInBank,
      desc: "Net profit after withdrawals",
      icon: ArrowUpRight,
      iconClass: "text-blue-500",
    },
  ];

  return (
    <AdminLayout title="Expenses">
      <div className="space-y-6">
        {/* Date range */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-muted-foreground">
            Track expenses and compare with revenue for the selected period.
          </p>
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as typeof dateRange)}
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards - each card shows the correct KPI from computed values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.title} className="rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </span>
                  <card.icon className={`w-5 h-5 ${card.iconClass}`} />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {card.title === "Profit Margin"
                    ? `${Number(profitMargin).toFixed(2)}%`
                    : card.title === "Gross Income"
                    ? formatCurrency(revenue)
                    : card.title === "Operating Expenses"
                    ? formatCurrency(operatingExpenses)
                    : card.title === "Net Profit"
                    ? (netProfit < 0 ? "-" : "") + formatCurrency(Math.abs(netProfit))
                    : card.title === "Withdrawals"
                    ? formatCurrency(withdrawalsTotal)
                    : card.title === "Money in Bank"
                    ? (moneyInBank < 0 ? "-" : "") + formatCurrency(Math.abs(moneyInBank))
                    : formatCurrency(Math.abs(card.value))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Category summary */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Expense categories</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click a category to filter the list below.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {categoryTotals.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setCategoryFilter(categoryFilter === cat.value ? null : cat.value)
                  }
                  className={`rounded-xl px-4 py-3 border text-left transition-all ${
                    categoryFilter === cat.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${cat.color} mr-2`} />
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="block text-sm text-muted-foreground mt-0.5">
                    ₹{cat.total.toLocaleString("en-IN")}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategoryFilter(null)}
                className="rounded-xl px-4 py-3 border-2 border-primary bg-primary/10 text-primary font-semibold"
              >
                Total Expenses
                <span className="block text-sm font-normal text-foreground mt-0.5">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </span>
                {categoryFilter && (
                  <span className="block text-xs mt-1 underline">Clear filter</span>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses table */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Expenses for selected period ({filteredExpenses.length} items)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {categoryFilter ? `Filtered by: ${categoryFilter}` : "All categories"}
              </p>
            </div>
            <Button
              onClick={() => openAddModal()}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
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
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">
                        Recurring
                      </th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No expenses in this period. Click &quot;Add Expense&quot; to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp) => (
                        <tr
                          key={exp.id}
                          className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium text-foreground">
                            {exp.name}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(exp.category)}`}
                              />
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-semibold text-foreground">
                            ₹{exp.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-2 text-muted-foreground text-sm">
                            {new Date(exp.expense_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-2">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                              {exp.is_recurring ? "recurring" : "one-time"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => openAddModal(exp)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                              onClick={() => handleDelete(exp.id)}
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

      {/* Add / Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Update the expense details below."
                : "Fill in the details to add a new expense."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Expense Name</Label>
              <Input
                id="expense-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rent, Electricity, Snacks Restock, etc."
                className="rounded-xl border-primary/30 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Recurring Expense</Label>
                <p className="text-xs text-muted-foreground">
                  Is this a recurring expense?
                </p>
              </div>
              <Switch
                checked={form.is_recurring}
                onCheckedChange={(c) => setForm({ ...form, is_recurring: c })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notes</Label>
              <Textarea
                id="expense-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any additional notes about this expense"
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
                {editingExpense ? "Update Expense" : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
