import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Search, Plus, Minus, CreditCard, Banknote, Smartphone, Shuffle, WifiOff, Leaf, Scan, Loader2, X, User, Wifi, Phone, ShoppingCart } from "lucide-react";
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
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState<{ id: string; name: string; phone: string; email?: string | null; address?: string | null; city?: string | null; total_orders?: number; total_spent?: number; last_purchase_at?: string | null }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customer, setCustomer] = useState<{ id: string; name: string; phone: string; email?: string | null } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "upi" | "card" | "split" | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState("");
  const [splitOtherAmount, setSplitOtherAmount] = useState("");
  const [splitOtherMethod, setSplitOtherMethod] = useState<"upi" | "card">("upi");
  const [discountType, setDiscountType] = useState<"percentage" | "rupees">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_type: "percentage" | "rupees"; discount_value: number } | null>(null);
  const [isScannerConnected, setIsScannerConnected] = useState(false);
  const [showScannerConnectedPopup, setShowScannerConnectedPopup] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Set up realtime communication with scanner
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pos-scanner-sync')
      .on(
        'broadcast',
        { event: 'request-customer' },
        () => {
          // Send current customer to scanner
          if (customer) {
            channel.send({
              type: 'broadcast',
              event: 'customer-selected',
              payload: { customer }
            });
          }
        }
      )
      .on(
        'broadcast',
        { event: 'scanner-ready' },
        () => {
          // Scanner page just opened - send customer if available and show connection
          if (customer) {
            // Send customer to scanner immediately
            channel.send({
              type: 'broadcast',
              event: 'customer-selected',
              payload: { customer }
            });
            // Show connection in POS
            setIsScannerConnected(true);
            setShowScannerConnectedPopup(true);
            toast({
              title: "Scanner Connected!",
              description: "Barcode scanner is ready. Scanned items will be added to cart.",
            });
            // Auto-hide popup after 5 seconds
            setTimeout(() => {
              setShowScannerConnectedPopup(false);
            }, 5000);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'scanner-connected' },
        (payload) => {
          setIsScannerConnected(true);
          setShowScannerConnectedPopup(true);
          toast({
            title: "Scanner Connected!",
            description: "Barcode scanner is now connected. Scanned items will be added to cart.",
          });
          // Auto-hide popup after 5 seconds
          setTimeout(() => {
            setShowScannerConnectedPopup(false);
          }, 5000);
        }
      )
      .on(
        'broadcast',
        { event: 'scanner-disconnected' },
        () => {
          setIsScannerConnected(false);
          toast({
            title: "Scanner Disconnected",
            description: "Barcode scanner has been disconnected.",
          });
        }
      )
      .on(
        'broadcast',
        { event: 'scanner-customer-selected' },
        async (payload) => {
          // Scanner selected a customer - update POS customer
          const scannerCustomer = payload.payload.customer;
          setCustomer({
            id: scannerCustomer.id,
            name: scannerCustomer.name,
            phone: scannerCustomer.phone,
          });
          setCustomerPhone(scannerCustomer.phone);
          setCustomerName(scannerCustomer.name);
          
          // Notify scanner that customer is set
          channel.send({
            type: 'broadcast',
            event: 'customer-selected',
            payload: { customer: scannerCustomer }
          });
        }
      )
      .on(
        'broadcast',
        { event: 'barcode-scanned' },
        async (payload) => {
          const barcode = payload.payload.barcode;
          handleBarcodeScan(barcode, false); // Don't close scanner when called from realtime
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast current customer if exists
          if (customer) {
            channel.send({
              type: 'broadcast',
              event: 'customer-selected',
              payload: { customer }
            });
          }
        }
      });

    // Store channel reference
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, customer]);

  // Broadcast customer changes
  useEffect(() => {
    if (!channelRef.current) return;

    if (customer) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'customer-selected',
        payload: { customer }
      });
    } else {
      channelRef.current.send({
        type: 'broadcast',
        event: 'customer-cleared',
        payload: {}
      });
    }
  }, [customer]);

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

  const handleBarcodeScan = async (barcode: string, closeScanner = true) => {
    if (closeScanner) {
      setIsScannerOpen(false);
    }
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

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Coupon",
          description: "The coupon code is invalid or expired",
          variant: "destructive",
        });
        return;
      }

      // Check if coupon is redeemable in POS
      if (!data.redeemable_in_pos) {
        toast({
          title: "Coupon Not Valid",
          description: "This coupon cannot be used in POS",
          variant: "destructive",
        });
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: "Coupon Expired",
          description: "This coupon has expired",
          variant: "destructive",
        });
        return;
      }

      setAppliedCoupon({
        id: data.id,
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
      });
      setCouponCode("");
      toast({
        title: "Coupon Applied!",
        description: `Discount: ${data.discount_type === "percentage" ? `${data.discount_value}%` : `₹${data.discount_value}`}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply coupon",
        variant: "destructive",
      });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const fetchAllCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, address, city, total_orders, total_spent, last_purchase_at")
        .order("name", { ascending: true });

      if (error) throw error;
      setAllCustomers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const lookupCustomer = async (phone: string) => {
    if (!phone) {
      setCustomer(null);
      return;
    }

    const { data } = await supabase
      .from("customers")
      .select("id, name, phone, email")
      .eq("phone", phone)
      .single();

    if (data) {
      setCustomer(data);
      setCustomerName(data.name);
      setCustomerEmail(data.email || "");
    } else {
      setCustomer(null);
    }
  };

  const handleSelectCustomer = (selectedCustomer: { id: string; name: string; phone: string; email?: string | null }) => {
    setCustomer(selectedCustomer);
    setCustomerPhone(selectedCustomer.phone);
    setCustomerName(selectedCustomer.name);
    setCustomerEmail(selectedCustomer.email || "");
    setIsCustomerSelectModalOpen(false);
    setCustomerSearchQuery("");
    toast({
      title: "Customer Selected",
      description: `${selectedCustomer.name} has been selected for this sale`,
    });
  };

  const filteredCustomers = allCustomers.filter((cust) => {
    const query = customerSearchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(query) ||
      cust.phone.includes(query) ||
      cust.email?.toLowerCase().includes(query) ||
      cust.address?.toLowerCase().includes(query) ||
      cust.city?.toLowerCase().includes(query)
    );
  });

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
        email: customerEmail || null,
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
        // Update customer if email is provided
        if (customerEmail && existing.email !== customerEmail) {
          await supabase
            .from("customers")
            .update({ email: customerEmail, name: customerName || existing.name })
            .eq("id", existing.id);
        }
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
      
      // Calculate discount (from coupon or manual discount)
      let discountAmount = 0;
      if (appliedCoupon) {
        if (appliedCoupon.discount_type === "percentage") {
          discountAmount = (subtotal * appliedCoupon.discount_value) / 100;
        } else {
          discountAmount = appliedCoupon.discount_value;
        }
      } else if (discountType === "percentage") {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
      
      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
      
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

      // Create payment record(s)
      if (method === "split") {
        const cashAmount = splitCashAmount ? parseFloat(splitCashAmount) : 0;
        const otherAmount = splitOtherAmount ? parseFloat(splitOtherAmount) : 0;
        
        // Cash payment
        if (cashAmount > 0) {
          await supabase.from("payments").insert({
            order_id: order.id,
            amount: cashAmount,
            payment_method: "cash",
            status: "paid",
            created_by: user?.id || null,
          });
        }
        
        // Other payment method
        if (otherAmount > 0) {
          await supabase.from("payments").insert({
            order_id: order.id,
            amount: otherAmount,
            payment_method: splitOtherMethod,
            status: "paid",
            created_by: user?.id || null,
          });
        }
      } else {
        await supabase.from("payments").insert({
          order_id: order.id,
          amount: total,
          payment_method: method,
          status: "paid",
          created_by: user?.id || null,
        });
      }
      
      // Record coupon usage if applied
      if (appliedCoupon) {
        try {
          await supabase.from("coupon_redemptions").insert({
            coupon_id: appliedCoupon.id,
            order_id: order.id,
            discount_amount: discountAmount,
            redeemed_by: user?.id || null,
          });
        } catch (couponError) {
          // Log but don't fail the sale if coupon redemption fails
          console.error("Failed to record coupon redemption:", couponError);
        }
      }

      toast({
        title: "Sale Completed!",
        description: `Order ${orderNumber} created. Total: ₹${total.toLocaleString()}`,
      });

      // Reset
      setCart([]);
      setDiscountValue(0);
      setDiscountType("percentage");
      setCustomer(null);
      setCustomerPhone("");
      setCustomerName("");
      setCustomerEmail("");
      setSelectedPaymentMethod(null);
      setCouponCode("");
      setAppliedCoupon(null);
      setSplitCashAmount("");
      setSplitOtherAmount("");
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
  
  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discountAmount = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  } else if (discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = discountValue;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  
  const tax = (subtotal - discountAmount) * 0.18;
  const total = subtotal - discountAmount + tax;
  
  // Calculate split payment amounts
  const splitCash = splitCashAmount ? parseFloat(splitCashAmount) : 0;
  const splitOther = splitOtherAmount ? parseFloat(splitOtherAmount) : 0;

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
      {/* Scanner Connection Popup */}
      <Dialog open={showScannerConnectedPopup} onOpenChange={setShowScannerConnectedPopup}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary" />
              Scanner Connection Established
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Scan className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Barcode Scanner Connected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Scanned barcodes will be automatically added to the cart
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowScannerConnectedPopup(false)}
              className="w-full rounded-xl"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Selection */}
      <div className="mb-6">
        {customer ? (
          <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary-900/30 dark:via-primary-900/20 dark:to-primary-900/30 rounded-xl border border-primary/20 dark:border-primary-800/40 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary-900/40 dark:to-primary-900/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomer(null);
                  setCustomerPhone("");
                  setCustomerName("");
                  setCustomerEmail("");
                }}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={async () => {
                setIsCustomerSelectModalOpen(true);
                await fetchAllCustomers();
              }}
              variant="outline"
              size="sm"
              className="w-full rounded-lg border-primary/30 hover:border-primary hover:bg-primary/5"
            >
              Change Customer
            </Button>
          </div>
        ) : (
          <Button
            onClick={async () => {
              setIsCustomerSelectModalOpen(true);
              await fetchAllCustomers();
            }}
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 font-medium"
          >
            <User className="w-4 h-4 mr-2" />
            Select Customer
          </Button>
        )}
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
            {/* Coupon Section */}
            {!appliedCoupon ? (
              <div className="flex items-center gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 h-8 text-sm rounded-lg"
                  onKeyPress={(e) => e.key === "Enter" && applyCoupon()}
                />
                <Button
                  size="sm"
                  onClick={applyCoupon}
                  className="h-8 rounded-lg"
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">{appliedCoupon.code}</span>
                  <span className="text-xs text-muted-foreground">
                    ({appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `₹${appliedCoupon.discount_value}`})
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            
            {/* Manual Discount */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Discount</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDiscountType("percentage")}
                    className={`px-2 py-1 text-xs rounded ${
                      discountType === "percentage"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType("rupees")}
                    className={`px-2 py-1 text-xs rounded ${
                      discountType === "rupees"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    ₹
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-20 h-8 text-sm rounded-lg"
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  disabled={!!appliedCoupon}
                />
                <span className="text-sm text-foreground ml-auto">-₹{discountAmount.toLocaleString()}</span>
              </div>
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
                onClick={() => setSelectedPaymentMethod("cash")}
                disabled={cart.length === 0}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors disabled:opacity-50 ${
                  selectedPaymentMethod === "cash"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Cash</span>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod("upi")}
                disabled={cart.length === 0}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors disabled:opacity-50 ${
                  selectedPaymentMethod === "upi"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">UPI</span>
              </button>
              <button
                onClick={() => setSelectedPaymentMethod("card")}
                disabled={cart.length === 0}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors disabled:opacity-50 ${
                  selectedPaymentMethod === "card"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>
              <button
                onClick={() => {
                  setSelectedPaymentMethod("split");
                  setIsSplitModalOpen(true);
                }}
                disabled={cart.length === 0}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors disabled:opacity-50 ${
                  selectedPaymentMethod === "split"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <Shuffle className="w-5 h-5" />
                <span className="text-xs">Split</span>
              </button>
            </div>

            <Button
              onClick={() => {
                if (!selectedPaymentMethod) {
                  toast({
                    title: "Select Payment Method",
                    description: "Please select a payment method",
                    variant: "destructive",
                  });
                  return;
                }
                if (selectedPaymentMethod === "split") {
                  setIsSplitModalOpen(true);
                } else {
                  completeSale(selectedPaymentMethod);
                }
              }}
              disabled={cart.length === 0 || isProcessing || !selectedPaymentMethod}
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

      {/* Customer Selection Modal - Beautiful Design with Search */}
      <Dialog open={isCustomerSelectModalOpen} onOpenChange={(open) => {
        setIsCustomerSelectModalOpen(open);
        if (!open) setCustomerSearchQuery("");
      }}>
        <DialogContent className="sm:max-w-3xl rounded-2xl bg-card/95 backdrop-blur-xl border border-white/20 dark:border-border/50 shadow-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary-900/40 dark:to-primary-900/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              Select Customer
            </DialogTitle>
          </DialogHeader>
          
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by name, phone, email, address, or city..."
                className="pl-12 pr-4 h-12 rounded-xl bg-background/80 dark:bg-background/60 border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Customers List */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {loadingCustomers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-base font-medium text-muted-foreground mb-1">
                  {customerSearchQuery ? "No customers found" : "No customers available"}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {customerSearchQuery ? "Try a different search term" : "Add a customer to get started"}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left group ${
                      customer?.id === cust.id
                        ? "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 dark:from-primary-900/40 dark:via-primary-900/20 dark:to-primary-900/40 border-primary shadow-md shadow-primary/10"
                        : "bg-gradient-to-r from-accent/50 to-accent/30 dark:from-accent/30 dark:to-accent/20 border-border/30 hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${
                        customer?.id === cust.id
                          ? "bg-gradient-to-br from-primary/30 to-primary/20 dark:from-primary-800/50 dark:to-primary-900/30"
                          : "bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary-900/40 dark:to-primary-900/20"
                      }`}>
                        <User className={`w-7 h-7 ${customer?.id === cust.id ? "text-primary" : "text-primary/70"}`} />
                      </div>
                      
                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-base font-bold text-foreground truncate">{cust.name}</p>
                          {customer?.id === cust.id && (
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{cust.phone}</span>
                          </div>
                          
                          {cust.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">@</span>
                              <span className="truncate">{cust.email}</span>
                            </div>
                          )}
                          
                          {(cust.address || cust.city) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">📍</span>
                              <span className="truncate">
                                {[cust.address, cust.city].filter(Boolean).join(", ") || "No address"}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Stats */}
                        {(cust.total_orders !== undefined || cust.total_spent !== undefined) && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
                            {cust.total_orders !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {cust.total_orders} {cust.total_orders === 1 ? "order" : "orders"}
                                </span>
                              </div>
                            )}
                            {cust.total_spent !== undefined && cust.total_spent > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-primary">
                                  ₹{cust.total_spent.toLocaleString()} spent
                                </span>
                              </div>
                            )}
                            {cust.last_purchase_at && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">
                                  Last: {new Date(cust.last_purchase_at).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Selection Indicator */}
                      {customer?.id === cust.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Add Customer Button */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              onClick={() => {
                setIsCustomerSelectModalOpen(false);
                setCustomerSearchQuery("");
                setIsCustomerModalOpen(true);
              }}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <div>
              <Label>Email ID (Optional)</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
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

      {/* Split Payment Modal */}
      <Dialog open={isSplitModalOpen} onOpenChange={setIsSplitModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Split Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Cash Amount (₹)</Label>
              <Input
                type="number"
                value={splitCashAmount}
                onChange={(e) => {
                  const cash = e.target.value;
                  setSplitCashAmount(cash);
                  if (cash) {
                    const cashNum = parseFloat(cash);
                    const remaining = total - cashNum;
                    setSplitOtherAmount(remaining > 0 ? remaining.toFixed(2) : "");
                  }
                }}
                placeholder="0.00"
                className="rounded-xl h-12"
                min="0"
                max={total}
              />
            </div>
            <div>
              <Label>Other Payment Method</Label>
              <select
                value={splitOtherMethod}
                onChange={(e) => setSplitOtherMethod(e.target.value as "upi" | "card")}
                className="w-full px-4 py-2 h-12 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-background text-foreground focus:ring-2 focus:ring-primary mb-2"
              >
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <Label>Other Amount (₹)</Label>
              <Input
                type="number"
                value={splitOtherAmount}
                onChange={(e) => {
                  const other = e.target.value;
                  setSplitOtherAmount(other);
                  if (other) {
                    const otherNum = parseFloat(other);
                    const remaining = total - otherNum;
                    setSplitCashAmount(remaining > 0 ? remaining.toFixed(2) : "");
                  }
                }}
                placeholder="0.00"
                className="rounded-xl h-12"
                min="0"
                max={total}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Cash:</span>
                <span>₹{splitCashAmount ? parseFloat(splitCashAmount).toLocaleString() : "0.00"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{splitOtherMethod.toUpperCase()}:</span>
                <span>₹{splitOtherAmount ? parseFloat(splitOtherAmount).toLocaleString() : "0.00"}</span>
              </div>
              {splitCashAmount && splitOtherAmount && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sum:</span>
                    <span className={`font-semibold ${
                      (parseFloat(splitCashAmount) + parseFloat(splitOtherAmount)).toFixed(2) === total.toFixed(2)
                        ? "text-primary"
                        : "text-destructive"
                    }`}>
                      ₹{(parseFloat(splitCashAmount) + parseFloat(splitOtherAmount)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSplitModalOpen(false);
                  setSplitCashAmount("");
                  setSplitOtherAmount("");
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const cash = parseFloat(splitCashAmount) || 0;
                  const other = parseFloat(splitOtherAmount) || 0;
                  if (Math.abs((cash + other) - total) > 0.01) {
                    toast({
                      title: "Invalid Amount",
                      description: `The sum must equal ₹${total.toLocaleString()}`,
                      variant: "destructive",
                    });
                    return;
                  }
                  setIsSplitModalOpen(false);
                  completeSale("split");
                }}
                disabled={!splitCashAmount || !splitOtherAmount}
                className="flex-1 rounded-xl"
              >
                Confirm & Complete Sale
              </Button>
            </div>
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
