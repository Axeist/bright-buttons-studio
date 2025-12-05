import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, Plus, Edit, Trash2, Leaf, Sparkles, Package } from "lucide-react";
import { products, categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
            placeholder="Search products..."
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
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </motion.select>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
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
                <th className="text-left text-sm font-semibold text-foreground p-4 hidden lg:table-cell">Fabric</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Price</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Status</th>
                <th className="text-left text-sm font-semibold text-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
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
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3" />
                            {product.technique}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 rounded-full text-xs font-semibold text-primary border border-primary/20 dark:border-primary-800/40">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground hidden lg:table-cell font-medium">{product.fabric}</td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-foreground">{product.price}</span>
                    </td>
                    <td className="p-4">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="inline-block px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 text-primary rounded-full text-xs font-semibold border border-primary/20 dark:border-primary-800/40"
                      >
                        Active
                      </motion.span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
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
        <DialogContent className="sm:max-w-md rounded-2xl">
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
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Product Name</label>
              <Input placeholder="Enter product name" className="rounded-xl h-12" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
              <select className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary">
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Price</label>
              <Input placeholder="₹0" className="rounded-xl h-12" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Stock</label>
              <Input type="number" placeholder="0" className="rounded-xl h-12" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800" onClick={() => setIsAddModalOpen(false)}>
              Add Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Products;
