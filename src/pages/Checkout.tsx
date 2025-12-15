import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { MapPin, Plus, Edit, Trash2, CreditCard, Lock, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
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
    }
  }, [customer, customerLoading, items, cartLoading]);

  const fetchAddresses = async () => {
    if (!customer) return;

    try {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customer.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      if (data && data.length > 0) {
        const defaultAddress = data.find((a) => a.is_default) || data[0];
        setSelectedAddress(defaultAddress.id);
      }
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
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
      if (editingAddress) {
        const { error } = await supabase
          .from("customer_addresses")
          .update({
            ...addressForm,
            customer_id: customer.id,
          })
          .eq("id", editingAddress.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Address updated",
        });
      } else {
        const { error } = await supabase
          .from("customer_addresses")
          .insert({
            ...addressForm,
            customer_id: customer.id,
          });

        if (error) throw error;
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
      fetchAddresses();
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

    const isServiceable = await checkPincodeServiceable(pincodeToCheck);
    if (!isServiceable) {
      toast({
        title: "Delivery Not Available",
        description: "We are coming soon to your area to serve. Please check back later!",
        variant: "destructive",
      });
      return;
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
            pincode: addressForm.pincode,
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
      const taxRate = 0.18; // 18% GST
      const taxAmount = subtotal * taxRate;
      const shippingAmount = subtotal >= 2000 ? 0 : 150;
      const totalAmount = subtotal + taxAmount + shippingAmount;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          customer_name: selectedAddr.full_name,
          customer_phone: selectedAddr.phone,
          customer_email: customer.email || null,
          shipping_address: `${selectedAddr.address_line1}, ${selectedAddr.address_line2 ? selectedAddr.address_line2 + ", " : ""}${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}`,
          shipping_address_id: selectedAddr.id,
          status: paymentMethod === "cod" ? "pending" : "confirmed",
          payment_status: paymentMethod === "cod" ? "pending" : "paid",
          payment_method: paymentMethod === "cod" ? "cash" : "online",
          source: "online",
          subtotal,
          discount_amount: 0,
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

      // Create payment record if online
      if (paymentMethod === "online") {
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
  const taxAmount = subtotal * 0.18;
  const shippingAmount = subtotal >= 2000 ? 0 : 150;
  const totalAmount = subtotal + taxAmount + shippingAmount;

  // Determine current step
  const currentStep = selectedAddress || (!customer && addressForm.full_name) ? 2 : 1;

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
              {/* Delivery Address */}
              <div className="bg-card rounded-xl p-6 border border-border">
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

                {/* Show address form if no addresses or for guest users */}
                {(showAddressForm || (!customer && addresses.length === 0)) && (
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
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Method
                </h2>
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "online" | "cod")}>
                  <div className="space-y-3">
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
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary
                items={orderItems}
                subtotal={subtotal}
                shipping={shippingAmount}
                tax={taxAmount}
                discount={0}
                total={totalAmount}
                showCouponInput={false}
              />
              <Button
                size="lg"
                className="w-full mt-6 rounded-full h-12"
                onClick={handlePlaceOrder}
                disabled={(!selectedAddress && (!customer || addresses.length === 0)) || isProcessing || items.length === 0}
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
