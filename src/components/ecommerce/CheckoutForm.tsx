import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, MapPin, User, Mail, Phone, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CheckoutFormProps {
  onComplete: (data: CheckoutData) => void;
  className?: string;
}

export interface CheckoutData {
  email: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: "card" | "cod" | "upi";
  sameAsShipping: boolean;
  saveAddress?: boolean;
}

export const CheckoutForm = ({ onComplete, className }: CheckoutFormProps) => {
  const [formData, setFormData] = useState<CheckoutData>({
    email: "",
    shippingAddress: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      phone: "",
    },
    paymentMethod: "card",
    sameAsShipping: true,
    saveAddress: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.shippingAddress.firstName)
      newErrors["shippingAddress.firstName"] = "First name is required";
    if (!formData.shippingAddress.lastName)
      newErrors["shippingAddress.lastName"] = "Last name is required";
    if (!formData.shippingAddress.address)
      newErrors["shippingAddress.address"] = "Address is required";
    if (!formData.shippingAddress.city)
      newErrors["shippingAddress.city"] = "City is required";
    if (!formData.shippingAddress.state)
      newErrors["shippingAddress.state"] = "State is required";
    if (!formData.shippingAddress.zipCode)
      newErrors["shippingAddress.zipCode"] = "Zip code is required";
    if (!formData.shippingAddress.phone)
      newErrors["shippingAddress.phone"] = "Phone is required";

    if (!formData.sameAsShipping) {
      if (!formData.billingAddress?.firstName)
        newErrors["billingAddress.firstName"] = "First name is required";
      if (!formData.billingAddress?.lastName)
        newErrors["billingAddress.lastName"] = "Last name is required";
      if (!formData.billingAddress?.address)
        newErrors["billingAddress.address"] = "Address is required";
      if (!formData.billingAddress?.city)
        newErrors["billingAddress.city"] = "City is required";
      if (!formData.billingAddress?.state)
        newErrors["billingAddress.state"] = "State is required";
      if (!formData.billingAddress?.zipCode)
        newErrors["billingAddress.zipCode"] = "Zip code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onComplete(formData);
    }
  };

  const updateShippingAddress = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [field]: value },
    }));
  };

  const updateBillingAddress = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: {
        ...(prev.billingAddress || {
          firstName: "",
          lastName: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "India",
        }),
        [field]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.shippingAddress.firstName}
                onChange={(e) => updateShippingAddress("firstName", e.target.value)}
                className={cn(errors["shippingAddress.firstName"] && "border-destructive")}
              />
              {errors["shippingAddress.firstName"] && (
                <p className="text-sm text-destructive mt-1">
                  {errors["shippingAddress.firstName"]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.shippingAddress.lastName}
                onChange={(e) => updateShippingAddress("lastName", e.target.value)}
                className={cn(errors["shippingAddress.lastName"] && "border-destructive")}
              />
              {errors["shippingAddress.lastName"] && (
                <p className="text-sm text-destructive mt-1">
                  {errors["shippingAddress.lastName"]}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.shippingAddress.address}
              onChange={(e) => updateShippingAddress("address", e.target.value)}
              className={cn(errors["shippingAddress.address"] && "border-destructive")}
            />
            {errors["shippingAddress.address"] && (
              <p className="text-sm text-destructive mt-1">
                {errors["shippingAddress.address"]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.shippingAddress.city}
                onChange={(e) => updateShippingAddress("city", e.target.value)}
                className={cn(errors["shippingAddress.city"] && "border-destructive")}
              />
              {errors["shippingAddress.city"] && (
                <p className="text-sm text-destructive mt-1">
                  {errors["shippingAddress.city"]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.shippingAddress.state}
                onChange={(e) => updateShippingAddress("state", e.target.value)}
                className={cn(errors["shippingAddress.state"] && "border-destructive")}
              />
              {errors["shippingAddress.state"] && (
                <p className="text-sm text-destructive mt-1">
                  {errors["shippingAddress.state"]}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.shippingAddress.zipCode}
                onChange={(e) => updateShippingAddress("zipCode", e.target.value)}
                className={cn(errors["shippingAddress.zipCode"] && "border-destructive")}
              />
              {errors["shippingAddress.zipCode"] && (
                <p className="text-sm text-destructive mt-1">
                  {errors["shippingAddress.zipCode"]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.shippingAddress.phone}
                onChange={(e) => updateShippingAddress("phone", e.target.value)}
                className={cn(errors["shippingAddress.phone"] && "border-destructive")}
              />
              {errors["shippingAddress.phone"] && (
                <p className="text-sm text-destructive mt-1">
                  {errors["shippingAddress.phone"]}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveAddress"
              checked={formData.saveAddress}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, saveAddress: checked as boolean })
              }
            />
            <Label htmlFor="saveAddress" className="text-sm font-normal cursor-pointer">
              Save this address for future orders
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsShipping"
              checked={formData.sameAsShipping}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sameAsShipping: checked as boolean })
              }
            />
            <Label htmlFor="sameAsShipping" className="text-sm font-normal cursor-pointer">
              Same as shipping address
            </Label>
          </div>

          {!formData.sameAsShipping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingFirstName">First Name</Label>
                  <Input
                    id="billingFirstName"
                    value={formData.billingAddress?.firstName || ""}
                    onChange={(e) => updateBillingAddress("firstName", e.target.value)}
                    className={cn(errors["billingAddress.firstName"] && "border-destructive")}
                  />
                  {errors["billingAddress.firstName"] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors["billingAddress.firstName"]}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingLastName">Last Name</Label>
                  <Input
                    id="billingLastName"
                    value={formData.billingAddress?.lastName || ""}
                    onChange={(e) => updateBillingAddress("lastName", e.target.value)}
                    className={cn(errors["billingAddress.lastName"] && "border-destructive")}
                  />
                  {errors["billingAddress.lastName"] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors["billingAddress.lastName"]}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="billingAddress">Address</Label>
                <Input
                  id="billingAddress"
                  value={formData.billingAddress?.address || ""}
                  onChange={(e) => updateBillingAddress("address", e.target.value)}
                  className={cn(errors["billingAddress.address"] && "border-destructive")}
                />
                {errors["billingAddress.address"] && (
                  <p className="text-sm text-destructive mt-1">
                    {errors["billingAddress.address"]}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingCity">City</Label>
                  <Input
                    id="billingCity"
                    value={formData.billingAddress?.city || ""}
                    onChange={(e) => updateBillingAddress("city", e.target.value)}
                    className={cn(errors["billingAddress.city"] && "border-destructive")}
                  />
                  {errors["billingAddress.city"] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors["billingAddress.city"]}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billingState">State</Label>
                  <Input
                    id="billingState"
                    value={formData.billingAddress?.state || ""}
                    onChange={(e) => updateBillingAddress("state", e.target.value)}
                    className={cn(errors["billingAddress.state"] && "border-destructive")}
                  />
                  {errors["billingAddress.state"] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors["billingAddress.state"]}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="billingZipCode">Zip Code</Label>
                <Input
                  id="billingZipCode"
                  value={formData.billingAddress?.zipCode || ""}
                  onChange={(e) => updateBillingAddress("zipCode", e.target.value)}
                  className={cn(errors["billingAddress.zipCode"] && "border-destructive")}
                />
                {errors["billingAddress.zipCode"] && (
                  <p className="text-sm text-destructive mt-1">
                    {errors["billingAddress.zipCode"]}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) =>
              setFormData({ ...formData, paymentMethod: value as "card" | "cod" | "upi" })
            }
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Credit/Debit Card</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  <span>UPI</span>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span>Cash on Delivery</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button type="submit" className="w-full rounded-full h-12" size="lg">
        Complete Order
      </Button>
    </form>
  );
};

