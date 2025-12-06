import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, Plus, Edit, Trash2, Leaf, Sparkles, Package, Scan, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useAuth } from "@/hooks/useAuth";

const categories = [
  'Kurthas & Co-ords',
  'Sarees',
  'Shawls',
  "Men's Shirts",
  'T-Shirts',
  'Kidswear'
];

const techniques = [
  'Eco printing',
  'Tie & Dye',
  'Shibori',
  'Batik',
  'Kalamkari'
];

const fabrics = [
  'Silk',
  'Cotton',
  'Linen',
  'Grape',
  'Georgette',
  'Tussar'
];

interface Product {
  id: string;
  name: string;
  category: string;
  fabric: string | null;
  technique: string | null;
  price: number;
  barcode: string | null;
  sku: string | null;
  status: 'active' | 'inactive' | 'archived';
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  };
}

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: categories[0],
    fabric: "",
    technique: "",
    price: "",
    cost_price: "",
    barcode: "",
    sku: "",
    stock: "",
    low_stock_threshold: "5",
    image_url: "",
    tagline: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          inventory (
            quantity,
            reserved_quantity
          )
        `)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      setProducts(productsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsScannerOpen(false);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (data) {
      setEditingProduct(data as Product);
      setFormData({
        name: data.name,
        description: data.description || "",
        category: data.category,
        fabric: data.fabric || "",
        technique: data.technique || "",
        price: data.price.toString(),
        cost_price: data.cost_price?.toString() || "",
        barcode: data.barcode || "",
        sku: data.sku || "",
        stock: "",
        low_stock_threshold: data.low_stock_threshold.toString(),
        image_url: data.image_url || "",
        tagline: data.tagline || "",
      });
      setIsEditModalOpen(true);
    } else {
      // New product with barcode
      setFormData({
        ...formData,
        barcode,
      });
      setIsAddModalOpen(true);
    }
  };

  const handleAddProduct = async () => {
    try {
      const price = parseFloat(formData.price);
      if (!price || price <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          fabric: formData.fabric || null,
          technique: formData.technique || null,
          price,
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          barcode: formData.barcode || null,
          sku: formData.sku || null,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          image_url: formData.image_url || null,
          tagline: formData.tagline || null,
          status: "active",
        })
        .select()
        .single();

      if (productError) throw productError;

      // Add inventory if stock is provided
      if (formData.stock) {
        const stockQty = parseInt(formData.stock);
        if (stockQty > 0) {
          await supabase.from("inventory").insert({
            product_id: product.id,
            quantity: stockQty,
          });

          // Record stock movement
          await supabase.from("stock_movements").insert({
            product_id: product.id,
            quantity_change: stockQty,
            movement_type: "purchase",
            reference_type: "purchase",
            notes: "Initial stock",
            created_by: user?.id || null,
          });
        }
      }

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      setIsAddModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const price = parseFloat(formData.price);
      if (!price || price <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      const { error: productError } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          fabric: formData.fabric || null,
          technique: formData.technique || null,
          price,
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          barcode: formData.barcode || null,
          sku: formData.sku || null,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          image_url: formData.image_url || null,
          tagline: formData.tagline || null,
        })
        .eq("id", editingProduct.id);

      if (productError) throw productError;

      // Update inventory if stock is provided
      if (formData.stock) {
        const stockQty = parseInt(formData.stock);
        const { data: inventory } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("product_id", editingProduct.id)
          .single();

        if (inventory) {
          const quantityChange = stockQty - inventory.quantity;
          if (quantityChange !== 0) {
            await supabase.from("stock_movements").insert({
              product_id: editingProduct.id,
              quantity_change,
              movement_type: quantityChange > 0 ? "purchase" : "adjustment",
              reference_type: "adjustment",
              notes: "Stock update",
              created_by: user?.id || null,
            });
          }
        } else if (stockQty > 0) {
          await supabase.from("inventory").insert({
            product_id: editingProduct.id,
            quantity: stockQty,
          });
        }
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      setIsEditModalOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ status: "archived" })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product archived successfully",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: categories[0],
      fabric: "",
      technique: "",
      price: "",
      cost_price: "",
      barcode: "",
      sku: "",
      stock: "",
      low_stock_threshold: "5",
      image_url: "",
      tagline: "",
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: "",
      category: product.category,
      fabric: product.fabric || "",
      technique: product.technique || "",
      price: product.price.toString(),
      cost_price: "",
      barcode: product.barcode || "",
      sku: product.sku || "",
      stock: product.inventory?.quantity.toString() || "",
      low_stock_threshold: "5",
      image_url: "",
      tagline: "",
    });
    setIsEditModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory && p.status !== "archived";
  });

  if (loading) {
    return (
      <AdminLayout title="Products">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Products">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, barcode, or SKU..."
            className="pl-12 h-12 rounded-xl border-primary-200/50 dark:border-primary-800/30 focus-visible:ring-primary"
          />
        </div>
        <motion.select
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary transition-all"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </motion.select>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsScannerOpen(true)}
            variant="outline"
            className="rounded-full h-12"
          >
            <Scan className="w-5 h-5 mr-2" />
            Scan
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }} 
            className="rounded-full h-12 bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </motion.div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-200/50 dark:border-primary-800/30 bg-gradient-to-r from-primary-50/50 via-transparent to-earth-50/50 dark:from-primary-900/20 dark:to-transparent">
                <th className="text-left text-sm font-semibold text-foreground p-4">Product</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden md:table-cell">Category</th>
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden lg:table-cell">Stock</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Price</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Status</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProducts.map((product, index) => {
                  const stock = product.inventory?.quantity || 0;
                  const isLowStock = stock <= (product.low_stock_threshold || 5);
                  
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ x: 4, backgroundColor: "rgba(var(--primary), 0.05)" }}
                      className="border-b border-primary-200/30 dark:border-primary-800/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-earth-100 dark:from-primary-900/40 dark:to-earth-900/40 flex items-center justify-center flex-shrink-0 shadow-md"
                          >
                            <Leaf className="w-6 h-6 text-primary" />
                          </motion.div>
                          <div>
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.technique && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {product.technique}
                                </p>
                              )}
                              {product.barcode && (
                                <p className="text-xs text-muted-foreground">• {product.barcode}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 rounded-full text-xs font-semibold text-primary border border-primary/20 dark:border-primary-800/40">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isLowStock ? "text-destructive" : "text-foreground"
                          }`}>
                            {stock}
                          </span>
                          {isLowStock && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-foreground">₹{product.price.toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            product.status === "active"
                              ? "bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 text-primary border-primary/20 dark:border-primary-800/40"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {product.status}
                        </motion.span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(product)}
                            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No products found</p>
          </motion.div>
        )}
      </motion.div>

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Add New Product
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Create a new product for your store
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fabric</Label>
                <select
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select fabric</option>
                  {fabrics.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Technique</Label>
                <select
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select technique</option>
                  {techniques.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Short tagline"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter"
                    className="rounded-xl h-12"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                    className="rounded-xl h-12"
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Stock keeping unit"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  placeholder="5"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="rounded-xl h-12"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
              setIsAddModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Edit Product
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Update product information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fabric</Label>
                <select
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select fabric</option>
                  {fabrics.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Technique</Label>
                <select
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select technique</option>
                  {techniques.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Short tagline"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Update Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="Current stock"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter"
                    className="rounded-xl h-12"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                    className="rounded-xl h-12"
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Stock keeping unit"
                  className="rounded-xl h-12"
                />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  placeholder="5"
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="rounded-xl h-12"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
              setIsEditModalOpen(false);
              setEditingProduct(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
              onClick={handleUpdateProduct}
            >
              Update Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onScan={handleBarcodeScan}
        onClose={() => setIsScannerOpen(false)}
      />
    </AdminLayout>
  );
};

export default Products;
