import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, Plus, Minus, CreditCard, Banknote, Smartphone, Shuffle, WifiOff, Leaf, Scan, Loader2, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useAuth } from "@/hooks/useAuth";

const categories = [
  'All',
  'Kurthas & Co-ords',
  'Sarees',
  'Shawls',
  "Men's Shirts",
  'T-Shirts',
  'Kidswear'
];

interface Product {
  id: string;
  name: string;
  category: string;
  fabric: string | null;
  price: number;
  barcode: string | null;
  sku: string | null;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  product_id: string;
  sku: string | null;
}

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customer, setCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          inventory (
            quantity,
            reserved_quantity
          )
        `)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
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
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      addToCart(product);
    } else {
      toast({
        title: "Product not found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
  };

  const addToCart = (product: Product) => {
    const availableStock = (product.inventory?.quantity || 0) - (product.inventory?.reserved_quantity || 0);
    const existingItem = cart.find((item) => item.id === product.id);
    const currentCartQty = existingItem?.quantity || 0;

    if (currentCartQty >= availableStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${availableStock} available in stock`,
        variant: "destructive",
      });
      return;
    }

    if (existingItem) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        product_id: product.id,
        sku: product.sku,
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const product = products.find((p) => p.id === id);
        const availableStock = (product?.inventory?.quantity || 0) - (product?.inventory?.reserved_quantity || 0);
        const newQuantity = item.quantity + delta;
        
        if (newQuantity > availableStock) {
          toast({
            title: "Insufficient stock",
            description: `Only ${availableStock} available`,
            variant: "destructive",
          });
          return item;
        }
        
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const lookupCustomer = async (phone: string) => {
    if (!phone) {
      setCustomer(null);
      return;
    }

    const { data } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("phone", phone)
      .single();

    if (data) {
      setCustomer(data);
      setCustomerName(data.name);
    } else {
      setCustomer(null);
    }
  };

  const createOrGetCustomer = async () => {
    if (!customerPhone) {
      toast({
        title: "Error",
        description: "Please enter customer phone number",
        variant: "destructive",
      });
      return null;
    }

    if (customer) {
      return customer.id;
    }

    // Create new customer
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: customerName || "Walk-in Customer",
        phone: customerPhone,
      })
      .select()
      .single();

    if (error) {
      // Customer might already exist
      const { data: existing } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("phone", customerPhone)
        .single();

      if (existing) {
        setCustomer(existing);
        return existing.id;
      }

      throw error;
    }

    setCustomer(data);
    return data.id;
  };

  const completeSale = async (method: "cash" | "upi" | "card" | "split") => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get or create customer
      const customerId = await createOrGetCustomer();

      // Generate order number
      const { data: orderNumberData, error: orderNumError } = await supabase
        .rpc("generate_order_number");

      if (orderNumError) throw orderNumError;

      const orderNumber = orderNumberData || `BB-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discountAmount = (subtotal * discount) / 100;
      const taxRate = 0.18;
      const tax = (subtotal - discountAmount) * taxRate;
      const total = subtotal - discountAmount + tax;

      // Get customer details
      let customerDetails = null;
      if (customerId) {
        const { data: custData } = await supabase
          .from("customers")
          .select("name, phone, email")
          .eq("id", customerId)
          .single();
        customerDetails = custData;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          customer_name: customerDetails?.name || customerName || "Walk-in Customer",
          customer_phone: customerDetails?.phone || customerPhone,
          customer_email: customerDetails?.email || null,
          status: "confirmed",
          payment_status: method === "split" ? "partial" : "paid",
          payment_method: method,
          source: "pos",
          subtotal,
          discount_amount: discountAmount,
          tax_amount: tax,
          shipping_amount: 0,
          total_amount: total,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and update inventory
      for (const item of cart) {
        // Create order item
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.name,
          product_sku: item.sku,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: 0,
          total_price: item.price * item.quantity,
        });

        // Update inventory
        const { data: inventory } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("product_id", item.product_id)
          .single();

        if (inventory) {
          await supabase
            .from("inventory")
            .update({
              quantity: inventory.quantity - item.quantity,
            })
            .eq("product_id", item.product_id);

          // Record stock movement
          await supabase.from("stock_movements").insert({
            product_id: item.product_id,
            quantity_change: -item.quantity,
            movement_type: "sale",
            reference_id: order.id,
            reference_type: "order",
            notes: `Sale - Order ${orderNumber}`,
            created_by: user?.id || null,
          });
        }
      }

      // Create payment record
      await supabase.from("payments").insert({
        order_id: order.id,
        amount: total,
        payment_method: method,
        status: "paid",
        created_by: user?.id || null,
      });

      toast({
        title: "Sale Completed!",
        description: `Order ${orderNumber} created. Total: ₹${total.toLocaleString()}`,
      });

      // Reset
      setCart([]);
      setDiscount(0);
      setCustomer(null);
      setCustomerPhone("");
      setCustomerName("");
      fetchProducts(); // Refresh inventory
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete sale",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const hasStock = (p.inventory?.quantity || 0) > 0;
    return matchesSearch && matchesCategory && hasStock;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const tax = (subtotal - discountAmount) * 0.18;
  const total = subtotal - discountAmount + tax;

  if (loading) {
    return (
      <AdminLayout title="Point of Sale">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Point of Sale">
      {/* Customer Info */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <Input
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              lookupCustomer(e.target.value);
            }}
            placeholder="Customer phone (optional)"
            className="rounded-xl h-10"
          />
          {customer && (
            <span className="text-sm text-muted-foreground">- {customer.name}</span>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setIsCustomerModalOpen(true)}
          className="rounded-xl"
        >
          {customer ? "Change" : "Add"} Customer
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,400px] gap-6">
        {/* Product Selection */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          {/* Search */}
          <div className="relative mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or scan barcode..."
                className="pl-10 rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              className="rounded-xl"
            >
              <Scan className="w-4 h-4 mr-2" />
              Scan
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-400px)] overflow-y-auto">
            {filteredProducts.map((product) => {
              const stock = (product.inventory?.quantity || 0) - (product.inventory?.reserved_quantity || 0);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={stock <= 0}
                  className="p-3 bg-accent rounded-xl text-left hover:bg-accent/80 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-primary-50 to-earth-50 rounded-lg mb-2 flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-primary-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.fabric || product.category}</p>
                  <p className="text-sm font-semibold text-primary mt-1">₹{product.price.toLocaleString()}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                    stock > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {stock > 0 ? `${stock} in stock` : "Out of stock"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-card rounded-xl p-5 shadow-soft flex flex-col">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current Sale</h2>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[300px] lg:max-h-[calc(100vh-520px)]">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in cart</p>
                <p className="text-sm">Click products or scan barcode to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground hover:bg-muted"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-foreground hover:bg-muted"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Discount (%)</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-20 h-8 text-sm rounded-lg"
                min="0"
                max="100"
              />
              <span className="text-sm text-foreground ml-auto">-₹{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (18%)</span>
              <span className="text-foreground">₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">₹{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => completeSale("cash")}
                disabled={cart.length === 0 || isProcessing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Cash</span>
              </button>
              <button
                onClick={() => completeSale("upi")}
                disabled={cart.length === 0 || isProcessing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">UPI</span>
              </button>
              <button
                onClick={() => completeSale("card")}
                disabled={cart.length === 0 || isProcessing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>
              <button
                onClick={() => completeSale("split")}
                disabled={cart.length === 0 || isProcessing}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Shuffle className="w-5 h-5" />
                <span className="text-xs">Split</span>
              </button>
            </div>

            <Button
              onClick={() => completeSale("cash")}
              disabled={cart.length === 0 || isProcessing}
              className="w-full rounded-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Sale"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Customer Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  lookupCustomer(e.target.value);
                }}
                placeholder="+91 98765 43210"
                className="rounded-xl h-12"
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="rounded-xl h-12"
              />
            </div>
            <Button
              onClick={() => {
                createOrGetCustomer();
                setIsCustomerModalOpen(false);
              }}
              className="w-full rounded-xl"
            >
              {customer ? "Update" : "Add"} Customer
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

export default POS;
