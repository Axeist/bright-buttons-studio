import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { MapPin, Plus, Edit, Trash2, CreditCard, Lock, ShoppingCart, ArrowLeft, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCart } from "@/hooks/useCart";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { LocationSelector } from "@/components/LocationSelector";
import { CheckoutSteps, OrderSummary, LoadingState } from "@/components/ecommerce";
import { getProductImageUrl } from "@/lib/utils";
import { checkPincodeServiceable } from "@/lib/pincodeUtils";

interface Address {
  id: string;
  type: "home" | "work" | "other";
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { customer, loading: customerLoading } = useCustomerAuth();
  const { items, loading: cartLoading, getTotalPrice, clearCart, refreshCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1); // 1: Cart, 2: Shipping, 3: Payment, 4: Review
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod" | "wallet">("online");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressForm, setAddressForm] = useState({
    type: "home" as "home" | "work" | "other",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    is_default: false,
  });

  useEffect(() => {
    // Allow checkout without login - guest checkout enabled
    if (items.length === 0 && !cartLoading) {
      navigate("/shop");
      return;
    }
    // Only fetch addresses if customer is logged in
    if (customer) {
      fetchAddresses();
      fetchWalletBalance();
    }
  }, [customer, customerLoading, items, cartLoading]);

  const fetchWalletBalance = async () => {
    if (!customer) return;

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("wallet_balance")
        .eq("id", customer.id)
        .single();

      if (error) throw error;
      setWalletBalance(data?.wallet_balance || 0);
    } catch (error: any) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  const fetchAddresses = async (skipAutoSelect = false) => {
    if (!customer) return;

    try {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customer.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      if (!skipAutoSelect && data && data.length > 0) {
        const defaultAddress = data.find((a) => a.is_default) || data[0];
        setSelectedAddress(defaultAddress.id);
      }
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch addresses",
        variant: "destructive",
      });
    }
  };

  const handleSaveAddress = async () => {
    if (!customer) return;

    if (!addressForm.full_name || !addressForm.phone || !addressForm.address_line1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      let savedAddressId: string | null = null;

      if (editingAddress) {
        const { error } = await supabase
          .from("customer_addresses")
          .update({
            ...addressForm,
            customer_id: customer.id,
          })
          .eq("id", editingAddress.id);

        if (error) throw error;
        savedAddressId = editingAddress.id;
        toast({
          title: "Success",
          description: "Address updated",
        });
      } else {
        const { data: newAddress, error } = await supabase
          .from("customer_addresses")
          .insert({
            ...addressForm,
            customer_id: customer.id,
          })
          .select()
          .single();

        if (error) throw error;
        if (!newAddress) {
          throw new Error("Failed to create address - no data returned");
        }
        savedAddressId = newAddress.id;
        toast({
          title: "Success",
          description: "Address added",
        });
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        type: "home",
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        is_default: false,
      });
      
      // Refresh addresses and auto-select the saved address
      await fetchAddresses(true); // Skip auto-select since we'll set it manually
      if (savedAddressId) {
        setSelectedAddress(savedAddressId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Address deleted",
      });
      fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress && addresses.length === 0) {
      // If no address selected and no saved addresses, check if address form is filled
      if (!addressForm.full_name || !addressForm.phone || !addressForm.address_line1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
        toast({
          title: "Error",
          description: "Please fill in all required address fields",
          variant: "destructive",
        });
        return;
      }
    } else if (!selectedAddress && addresses.length > 0) {
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    // Validate pincode is serviceable
    const pincodeToCheck = selectedAddress 
      ? addresses.find(a => a.id === selectedAddress)?.pincode 
      : addressForm.pincode;

    if (!pincodeToCheck) {
      toast({
        title: "Error",
        description: "Pincode is required",
        variant: "destructive",
      });
      return;
    }

    // Normalize pincode: trim whitespace and ensure it's 6 digits
    const normalizedPincode = pincodeToCheck.toString().trim().replace(/\D/g, "").slice(0, 6);
    
    if (normalizedPincode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    // Check if pincode is serviceable (function will normalize internally too)
    const isServiceable = await checkPincodeServiceable(normalizedPincode);
    if (!isServiceable) {
      // Check if there's a selected location that matches
      const savedLocation = localStorage.getItem("deliveryLocation");
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          const savedPincode = location.pincode?.toString().trim().replace(/\D/g, "").slice(0, 6);
          if (savedPincode === normalizedPincode && location.deliveryAvailable) {
            // Location is serviceable, proceed anyway (might be a database sync issue)
            console.warn("Pincode check failed but selected location is serviceable, proceeding...");
          } else {
            toast({
              title: "Delivery Not Available",
              description: "We are coming soon to your area to serve. Please check back later!",
              variant: "destructive",
            });
            return;
          }
        } catch (e) {
          // Invalid saved location, show error
          toast({
            title: "Delivery Not Available",
            description: "We are coming soon to your area to serve. Please check back later!",
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: "Delivery Not Available",
          description: "We are coming soon to your area to serve. Please check back later!",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      let customerId: string;
      let selectedAddr: Address;

      // Handle guest checkout - create customer if not logged in
      if (!customer) {
        // Create customer from address form
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: addressForm.full_name,
            phone: addressForm.phone,
            email: addressForm.full_name.toLowerCase().replace(/\s+/g, '') + '@guest.brightbuttons.in', // Temporary email
            customer_type: 'guest',
          })
          .select()
          .single();

        if (customerError) {
          // Customer might already exist with this phone
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("id, name, phone, email")
            .eq("phone", addressForm.phone)
            .single();

          if (existingCustomer) {
            customerId = existingCustomer.id;
            // Update customer name if different
            if (existingCustomer.name !== addressForm.full_name) {
              await supabase
                .from("customers")
                .update({ name: addressForm.full_name })
                .eq("id", customerId);
            }
          } else {
            throw customerError;
          }
        } else {
          customerId = newCustomer.id;
        }

        // Create address for guest customer
        // Normalize pincode before saving
        const normalizedPincodeForSave = addressForm.pincode.toString().trim().replace(/\D/g, "").slice(0, 6);
        const { data: newAddress, error: addressError } = await supabase
          .from("customer_addresses")
          .insert({
            customer_id: customerId,
            type: addressForm.type,
            full_name: addressForm.full_name,
            phone: addressForm.phone,
            address_line1: addressForm.address_line1,
            address_line2: addressForm.address_line2 || null,
            city: addressForm.city,
            state: addressForm.state,
            pincode: normalizedPincodeForSave,
            landmark: addressForm.landmark || null,
            is_default: true,
          })
          .select()
          .single();

        if (addressError) throw addressError;
        selectedAddr = newAddress;
      } else {
        customerId = customer.id;
        selectedAddr = addresses.find((a) => a.id === selectedAddress)!;
        if (!selectedAddr) throw new Error("Address not found");
      }

      // Generate order number
      const { data: orderNumberData } = await supabase.rpc("generate_order_number");
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      const subtotal = getTotalPrice();
      const walletDiscount = paymentMethod === "wallet" && customerId ? subtotal * 0.1 : 0;
      const discountedSubtotal = subtotal - walletDiscount;
      const taxRate = 0.18; // 18% GST
      const taxAmount = discountedSubtotal * taxRate;
      const shippingAmount = discountedSubtotal >= 2000 ? 0 : 150;
      const totalAmount = discountedSubtotal + taxAmount + shippingAmount;

      // Check wallet balance if paying with wallet
      if (paymentMethod === "wallet" && customerId) {
        // Fetch current wallet balance
        const { data: customerData } = await supabase
          .from("customers")
          .select("wallet_balance")
          .eq("id", customerId)
          .single();

        if (!customerData || (customerData.wallet_balance || 0) < totalAmount) {
          toast({
            title: "Insufficient Wallet Balance",
            description: `Your wallet balance is ₹${(customerData?.wallet_balance || 0).toLocaleString()}. Please add more money or choose a different payment method.`,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          customer_name: selectedAddr.full_name,
          customer_phone: selectedAddr.phone,
          customer_email: customer?.email || null,
          shipping_address: `${selectedAddr.address_line1}, ${selectedAddr.address_line2 ? selectedAddr.address_line2 + ", " : ""}${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}`,
          shipping_address_id: selectedAddr.id,
          status: paymentMethod === "cod" ? "pending" : "confirmed",
          payment_status: paymentMethod === "cod" ? "pending" : "paid",
          payment_method: paymentMethod === "cod" ? "cash" : paymentMethod === "wallet" ? "wallet" : "online",
          source: "online",
          subtotal,
          discount_amount: walletDiscount,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || "Product",
        product_sku: item.product?.id || null,
        quantity: item.quantity,
        unit_price: item.product?.price || 0,
        discount_amount: 0,
        total_price: (item.product?.price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Deduct from wallet if paying with wallet
      if (paymentMethod === "wallet" && customerId) {
        const { error: walletError } = await supabase.rpc("deduct_from_wallet", {
          _customer_id: customerId,
          _amount: totalAmount,
          _order_id: order.id,
          _description: `Payment for order ${orderNumber}`,
        });

        if (walletError) throw walletError;

        // Create payment record
        await supabase.from("payments").insert({
          order_id: order.id,
          amount: totalAmount,
          payment_method: "wallet",
          status: "paid",
          transaction_id: `WALLET-${Date.now()}`,
        });
      } else if (paymentMethod === "online") {
        // Create payment record if online
        await supabase.from("payments").insert({
          order_id: order.id,
          amount: totalAmount,
          payment_method: "online",
          status: "paid",
          transaction_id: `TXN-${Date.now()}`,
        });
      }

      // Award loyalty points (1 point per ₹10 spent)
      if (customerId) {
        const pointsEarned = Math.floor(totalAmount / 10);
        if (pointsEarned > 0) {
          await supabase.from("loyalty_points_transactions").insert({
            customer_id: customerId,
            user_id: null, // Customer auth is separate, no user_id needed
            points: pointsEarned,
            transaction_type: "earned",
            order_id: order.id,
            description: `Earned ${pointsEarned} points for order ${orderNumber}`,
          });

          // Update customer loyalty points
          const { data: customerData } = await supabase
            .from("customers")
            .select("loyalty_points")
            .eq("id", customerId)
            .single();

          if (customerData) {
            await supabase
              .from("customers")
              .update({
                loyalty_points: (customerData.loyalty_points || 0) + pointsEarned,
              })
              .eq("id", customerId);
          }
        }
      }

      // Clear cart
      await clearCart();

      toast({
        title: "Order Placed!",
        description: `Your order ${orderNumber} has been placed successfully`,
      });

      navigate(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getTotalPrice();
  const walletDiscount = paymentMethod === "wallet" && customer ? subtotal * 0.1 : 0;
  const discountedSubtotal = subtotal - walletDiscount;
  const taxAmount = discountedSubtotal * 0.18;
  const shippingAmount = discountedSubtotal >= 2000 ? 0 : 150;
  const totalAmount = discountedSubtotal + taxAmount + shippingAmount;

  // Validation functions
  const validateCartStep = () => {
    return items.length > 0;
  };

  const validateShippingStep = () => {
    if (customer && addresses.length > 0) {
      // For logged-in users with saved addresses, they must select one
      return !!selectedAddress;
    }
    // For guest checkout or when no saved addresses, validate the form
    return !!(
      addressForm.full_name &&
      addressForm.phone &&
      addressForm.address_line1 &&
      addressForm.city &&
      addressForm.state &&
      addressForm.pincode
    );
  };

  const validatePaymentStep = () => {
    return !!paymentMethod;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateCartStep()) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2 && !validateShippingStep()) {
      toast({
        title: "Error",
        description: "Please complete the delivery address",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 3 && !validatePaymentStep()) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Prepare order items for OrderSummary
  const orderItems = items.map(item => ({
    id: item.id,
    name: item.product?.name || "Product",
    price: item.product?.price || 0,
    quantity: item.quantity,
    image: getProductImageUrl(item.product || {}) || undefined,
    variant: item.size || undefined,
  }));

  if (cartLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingState variant="detail" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        <div className="container-custom py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/shop")}
            className="mb-6 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>

          {/* Checkout Steps */}
          <div className="mb-8">
            <CheckoutSteps
              currentStep={currentStep}
              steps={[
                { id: "cart", label: "Cart" },
                { id: "shipping", label: "Shipping" },
                { id: "payment", label: "Payment" },
                { id: "review", label: "Review" },
              ]}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Cart Review */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Review Your Cart
                  </h2>
                  <div className="space-y-4">
                    {items.map((item) => {
                      const productImageUrl = item.product ? getProductImageUrl(item.product) : null;
                      const hasImage = productImageUrl && productImageUrl !== "/placeholder.svg";
                      
                      return (
                        <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                          {item.product && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50 flex-shrink-0 relative flex items-center justify-center">
                              {hasImage ? (
                                <>
                                  <img
                                    src={productImageUrl}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                                    <Leaf className="w-8 h-8 text-primary-400 dark:text-primary-500" />
                                  </div>
                                </>
                              ) : (
                                <Leaf className="w-8 h-8 text-primary-400 dark:text-primary-500" />
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.product?.name || "Product"}</h3>
                            {item.size && (
                              <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </span>
                              <span className="font-semibold">
                                ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Delivery Address */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Delivery Address
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressForm({
                        type: "home",
                        full_name: "",
                        phone: "",
                        address_line1: "",
                        address_line2: "",
                        city: "",
                        state: "",
                        pincode: "",
                        landmark: "",
                        is_default: false,
                      });
                      setShowAddressForm(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </div>

                {!customer && (
                  <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      You're checking out as a guest. Fill in your details below. You can create an account later to track your orders.
                    </p>
                  </div>
                )}

                {addresses.length > 0 ? (
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                    <div className="space-y-3">
                      {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAddress === address.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedAddress(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <RadioGroupItem value={address.id} id={address.id} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{address.full_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {address.type}
                                </Badge>
                                {address.is_default && (
                                  <Badge className="text-xs">Default</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Phone: {address.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(address);
                                setAddressForm({
                                  type: address.type,
                                  full_name: address.full_name,
                                  phone: address.phone,
                                  address_line1: address.address_line1,
                                  address_line2: address.address_line2 || "",
                                  city: address.city,
                                  state: address.state,
                                  pincode: address.pincode,
                                  landmark: address.landmark || "",
                                  is_default: address.is_default,
                                });
                                setShowAddressForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(address.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                ) : (
                  <div className="text-center py-4">
                    {!showAddressForm && (
                      <Button
                        onClick={() => setShowAddressForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    )}
                  </div>
                )}

                {/* Show address form if no addresses or when adding new */}
                {(showAddressForm || addresses.length === 0) && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-4">
                      {editingAddress ? "Edit Address" : "Delivery Address"}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="address-type">Address Type</Label>
                          <select
                            id="address-type"
                            value={addressForm.type}
                            onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value as "home" | "work" | "other" })}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                          >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="full-name">Full Name *</Label>
                        <Input
                          id="full-name"
                          value={addressForm.full_name}
                          onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address-line1">Address Line 1 *</Label>
                        <Input
                          id="address-line1"
                          value={addressForm.address_line1}
                          onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                          placeholder="House/Flat No., Building Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address-line2">Address Line 2</Label>
                        <Input
                          id="address-line2"
                          value={addressForm.address_line2}
                          onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                          placeholder="Street, Area, Colony"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pincode">Pincode *</Label>
                          <Input
                            id="pincode"
                            value={addressForm.pincode}
                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                            placeholder="Pincode"
                          />
                        </div>
                        <div>
                          <Label htmlFor="landmark">Landmark</Label>
                          <Input
                            id="landmark"
                            value={addressForm.landmark}
                            onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                            placeholder="Nearby landmark"
                          />
                        </div>
                      </div>
                      {customer && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="is-default"
                            checked={addressForm.is_default}
                            onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="is-default" className="cursor-pointer">
                            Set as default address
                          </Label>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveAddress}
                          disabled={!customer}
                          className="flex-1"
                        >
                          {editingAddress ? "Update Address" : "Save Address"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                            setAddressForm({
                              type: "home",
                              full_name: "",
                              phone: "",
                              address_line1: "",
                              address_line2: "",
                              city: "",
                              state: "",
                              pincode: "",
                              landmark: "",
                              is_default: false,
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Method
                  </h2>
                  <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "online" | "cod" | "wallet")}>
                    <div className="space-y-3">
                      {customer && walletBalance > 0 && (
                        <div className="border-2 border-primary rounded-lg p-4 cursor-pointer transition-colors bg-primary/5">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="wallet" id="wallet" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Label htmlFor="wallet" className="font-semibold cursor-pointer">
                                  Pay with Wallet
                                </Label>
                                <Badge className="bg-green-500 text-white">10% OFF</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Balance: ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                Get 10% discount when paying with wallet!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="border rounded-lg p-4 cursor-pointer transition-colors hover:border-primary/50">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="online" id="online" />
                          <div className="flex-1">
                            <Label htmlFor="online" className="font-semibold cursor-pointer">
                              Online Payment
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Pay securely with UPI, Cards, or Net Banking
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 cursor-pointer transition-colors hover:border-primary/50">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="cod" id="cod" />
                          <div className="flex-1">
                            <Label htmlFor="cod" className="font-semibold cursor-pointer">
                              Cash on Delivery
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Pay when you receive your order
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </motion.div>
              )}

              {/* Step 4: Review & Place Order */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-card rounded-xl p-6 border border-border">
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                      <Lock className="w-5 h-5 text-primary" />
                      Review Your Order
                    </h2>

                    {/* Delivery Address Review */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Delivery Address
                      </h3>
                      {(() => {
                        const address = selectedAddress 
                          ? addresses.find(a => a.id === selectedAddress)
                          : null;
                        const displayAddress = address || {
                          full_name: addressForm.full_name,
                          phone: addressForm.phone,
                          address_line1: addressForm.address_line1,
                          address_line2: addressForm.address_line2,
                          city: addressForm.city,
                          state: addressForm.state,
                          pincode: addressForm.pincode,
                        };
                        return (
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="font-semibold">{displayAddress.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {displayAddress.address_line1}
                              {displayAddress.address_line2 && `, ${displayAddress.address_line2}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {displayAddress.city}, {displayAddress.state} - {displayAddress.pincode}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Phone: {displayAddress.phone}
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Payment Method Review */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Payment Method
                      </h3>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="font-semibold">
                          {paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentMethod === "online" 
                            ? "Pay securely with UPI, Cards, or Net Banking"
                            : "Pay when you receive your order"}
                        </p>
                      </div>
                    </div>

                    {/* Order Items Review */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Order Items
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => {
                          const productImageUrl = item.product ? getProductImageUrl(item.product) : null;
                          const hasImage = productImageUrl && productImageUrl !== "/placeholder.svg";
                          
                          return (
                            <div key={item.id} className="flex gap-4 p-3 border rounded-lg">
                              {item.product && (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50 flex-shrink-0 relative flex items-center justify-center">
                                  {hasImage ? (
                                    <>
                                      <img
                                        src={productImageUrl}
                                        alt={item.product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const fallback = target.nextElementSibling as HTMLElement;
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                                        <Leaf className="w-6 h-6 text-primary-400 dark:text-primary-500" />
                                      </div>
                                    </>
                                  ) : (
                                    <Leaf className="w-6 h-6 text-primary-400 dark:text-primary-500" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium">{item.product?.name || "Product"}</h4>
                                {item.size && (
                                  <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-sm text-muted-foreground">
                                    Qty: {item.quantity}
                                  </span>
                                  <span className="font-semibold">
                                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4 pt-4">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="rounded-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                <div className="flex-1" />
                {currentStep < 4 ? (
                  <Button
                    onClick={handleNextStep}
                    className="rounded-full"
                  >
                    Continue
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                <OrderSummary
                  items={orderItems}
                  subtotal={subtotal}
                  shipping={shippingAmount}
                  tax={taxAmount}
                  discount={walletDiscount}
                  total={totalAmount}
                  showCouponInput={false}
                />
                {currentStep === 4 && (
                  <Button
                    size="lg"
                    className="w-full rounded-full h-12"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || items.length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Dialog */}
      <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress ? "Update your delivery address details" : "Enter your delivery address details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["home", "work", "other"] as const).map((type) => (
                <Button
                  key={type}
                  variant={addressForm.type === type ? "default" : "outline"}
                  onClick={() => setAddressForm({ ...addressForm, type })}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

            <div>
              <Label>Full Name *</Label>
              <Input
                value={addressForm.full_name}
                onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label>Phone Number *</Label>
              <Input
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                placeholder="+91 99999 99999"
              />
            </div>

            <div>
              <Label>Address Line 1 *</Label>
              <Input
                value={addressForm.address_line1}
                onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                placeholder="House/Flat No., Building Name"
              />
            </div>

            <div>
              <Label>Address Line 2</Label>
              <Input
                value={addressForm.address_line2}
                onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                placeholder="Street, Area, Colony"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State *</Label>
                <Input
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pincode *</Label>
                <Input
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
              <div>
                <Label>Landmark</Label>
                <Input
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="Nearby landmark"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={addressForm.is_default}
                onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Set as default address
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddressForm(false);
                  setEditingAddress(null);
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveAddress}>
                {editingAddress ? "Update" : "Save"} Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
};

export default Checkout;
