import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, Plus, Edit, Trash2, Leaf, Sparkles, Package, Scan, Loader2, AlertCircle, Upload, Download, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useAuth } from "@/hooks/useAuth";
import { generateBarcode } from "@/lib/barcode";
import { parseCSV, validateCSVData, generateSampleCSV, CSVProductRow, CSVValidationError } from "@/lib/csvImport";

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<CSVValidationError[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

      // Generate barcode if not provided
      let barcodeValue = formData.barcode || null;
      
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
          barcode: barcodeValue,
          sku: formData.sku || null,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          image_url: formData.image_url || null,
          tagline: formData.tagline || null,
          status: "active",
        })
        .select()
        .single();

      if (productError) throw productError;

      // Auto-generate barcode if not provided
      if (!barcodeValue) {
        barcodeValue = generateBarcode(product.id);
        await supabase
          .from("products")
          .update({ barcode: barcodeValue })
          .eq("id", product.id);
      }

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

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Sample CSV Downloaded",
      description: "Fill in the sample CSV and import it to add products",
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    setImportErrors([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const validation = validateCSVData(rows);
      
      if (validation.errors.length > 0) {
        setImportErrors(validation.errors);
        toast({
          title: "Validation Errors Found",
          description: `Found ${validation.errors.length} error(s). Please fix them before importing.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File Validated",
          description: `Found ${validation.valid.length} valid product(s) ready to import`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Reading File",
        description: error.message || "Failed to read CSV file",
        variant: "destructive",
      });
      setCsvFile(null);
    }
  };

  const handleImportProducts = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      const validation = validateCSVData(rows);

      if (validation.errors.length > 0) {
        setImportErrors(validation.errors);
        toast({
          title: "Cannot Import",
          description: "Please fix validation errors before importing",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      if (validation.valid.length === 0) {
        toast({
          title: "No Valid Products",
          description: "No valid products found in the CSV file",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Import products one by one
      let successCount = 0;
      let errorCount = 0;

      for (const productData of validation.valid) {
        try {
          const price = parseFloat(productData.price.replace(/[₹,]/g, ''));
          
          // Insert product
          const { data: product, error: productError } = await supabase
            .from("products")
            .insert({
              name: productData.name,
              description: productData.description || null,
              category: productData.category,
              fabric: productData.fabric || null,
              technique: productData.technique || null,
              price,
              cost_price: productData.cost_price ? parseFloat(productData.cost_price.replace(/[₹,]/g, '')) : null,
              sku: productData.sku || null,
              low_stock_threshold: productData.low_stock_threshold ? parseInt(productData.low_stock_threshold) : 5,
              image_url: productData.image_url || null,
              tagline: productData.tagline || null,
              status: "active",
            })
            .select()
            .single();

          if (productError) throw productError;

          // Auto-generate barcode
          const barcodeValue = generateBarcode(product.id);
          await supabase
            .from("products")
            .update({ barcode: barcodeValue })
            .eq("id", product.id);

          // Add inventory if stock is provided
          if (productData.stock) {
            const stockQty = parseInt(productData.stock);
            if (stockQty > 0) {
              await supabase.from("inventory").insert({
                product_id: product.id,
                quantity: stockQty,
              });

              await supabase.from("stock_movements").insert({
                product_id: product.id,
                quantity_change: stockQty,
                movement_type: "purchase",
                reference_type: "purchase",
                notes: "Initial stock from CSV import",
                created_by: user?.id || null,
              });
            }
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error importing product ${productData.name}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} product(s)${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
      });

      setIsImportModalOpen(false);
      setCsvFile(null);
      setImportErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
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
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            className="rounded-full h-12"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
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
                    placeholder="Auto-generated if left empty"
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
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate a scannable barcode
                </p>
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
                    placeholder="Auto-generated if left empty"
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
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate a scannable barcode
                </p>
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

      {/* Import Products Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary" />
              Import Products from CSV
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Upload a CSV file to import multiple products at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownloadSampleCSV}
                variant="outline"
                className="rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
              <p className="text-sm text-muted-foreground">
                Download the sample file to see the required format
              </p>
            </div>

            <div className="border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <FileText className="w-12 h-12 text-muted-foreground" />
                <div className="text-center">
                  <Label htmlFor="csv-file" className="cursor-pointer">
                    <span className="text-primary font-semibold hover:underline">
                      Click to select CSV file
                    </span>
                    <input
                      ref={fileInputRef}
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    or drag and drop
                  </p>
                </div>
                {csvFile && (
                  <div className="flex items-center gap-2 mt-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{csvFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCsvFile(null);
                        setImportErrors([]);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="border border-destructive/50 rounded-xl p-4 bg-destructive/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <h4 className="font-semibold text-destructive">
                    Validation Errors ({importErrors.length})
                  </h4>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {importErrors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive">
                      <span className="font-medium">Row {error.row}</span>: {error.field} - {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4">
              <h4 className="font-semibold mb-2">Required Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>name</strong> - Product name (required)</li>
                <li><strong>category</strong> - Product category (required)</li>
                <li><strong>price</strong> - Product price in ₹ (required)</li>
                <li><strong>description</strong> - Product description (optional)</li>
                <li><strong>fabric</strong> - Fabric type (optional)</li>
                <li><strong>technique</strong> - Printing technique (optional)</li>
                <li><strong>tagline</strong> - Product tagline (optional)</li>
                <li><strong>cost_price</strong> - Cost price in ₹ (optional)</li>
                <li><strong>stock</strong> - Initial stock quantity (optional)</li>
                <li><strong>sku</strong> - Stock keeping unit (optional)</li>
                <li><strong>low_stock_threshold</strong> - Low stock alert threshold (optional, default: 5)</li>
                <li><strong>image_url</strong> - Product image URL (optional)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Barcodes will be automatically generated for all imported products.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl" 
              onClick={() => {
                setIsImportModalOpen(false);
                setCsvFile(null);
                setImportErrors([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
              onClick={handleImportProducts}
              disabled={!csvFile || isImporting || importErrors.length > 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Products
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Products;
