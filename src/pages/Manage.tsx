import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Edit, Trash2, Gift, Search, X } from "lucide-react";

interface RedeemableItem {
  id: string;
  name: string;
  description: string | null;
  category: 'discount' | 'coupon' | 'product' | 'wallet_credit' | 'other';
  points_required: number;
  value: number | null;
  value_type: 'percentage' | 'fixed' | 'wallet_credit' | null;
  max_redemptions: number | null;
  current_redemptions: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
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

  useEffect(() => {
    fetchItems();
  }, []);

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
      case 'wallet_credit':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
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

  return (
    <AdminLayout>
      <div className="space-y-6">
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
                  <SelectItem value="wallet_credit">Wallet Credit</SelectItem>
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
                            : item.value_type === 'wallet_credit'
                            ? `₹${item.value}`
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
                      <SelectItem value="wallet_credit">Wallet Credit</SelectItem>
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
                      <SelectItem value="wallet_credit">Wallet Credit</SelectItem>
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
      </div>
    </AdminLayout>
  );
};

export default Manage;

