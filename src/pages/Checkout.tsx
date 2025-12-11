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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { LocationSelector } from "@/components/LocationSelector";

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
  const { user } = useAuth();
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
    if (!user) {
      navigate("/customer/login");
      return;
    }
    if (items.length === 0 && !cartLoading) {
      navigate("/shop");
      return;
    }
    fetchAddresses();
  }, [user, items, cartLoading]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", user.id)
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
    if (!user) return;

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
            user_id: user.id,
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
            user_id: user.id,
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
    if (!user || !selectedAddress) {
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get customer record
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const customerId = customer?.id || null;

      // Generate order number
      const { data: orderNumberData } = await supabase.rpc("generate_order_number");
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      const selectedAddr = addresses.find((a) => a.id === selectedAddress);
      if (!selectedAddr) throw new Error("Address not found");

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
          customer_email: user.email || null,
          shipping_address: `${selectedAddr.address_line1}, ${selectedAddr.address_line2 ? selectedAddr.address_line2 + ", " : ""}${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}`,
          shipping_address_id: selectedAddress,
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
            user_id: user.id,
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

  if (cartLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>

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

                {addresses.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No addresses saved</p>
                    <Button
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
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
              <div className="bg-card rounded-xl p-6 border border-border sticky top-20">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary-50 to-earth-50 flex-shrink-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × ₹{item.product?.price.toLocaleString() || 0}
                        </p>
                        {item.size && (
                          <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                        )}
                      </div>
                      <p className="font-semibold text-sm">
                        ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (GST 18%)</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {shippingAmount === 0 ? (
                        <span className="text-primary font-semibold">FREE</span>
                      ) : (
                        `₹${shippingAmount}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-6 rounded-full h-12"
                  onClick={handlePlaceOrder}
                  disabled={!selectedAddress || isProcessing || items.length === 0}
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

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Your personal information is secure and encrypted
                </p>
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
