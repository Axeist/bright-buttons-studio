import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Save, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const CustomerProfile = () => {
  const { customer, signOut, loading: customerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
  });
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
    if (!customerLoading && !customer) {
      navigate("/customer/login");
      return;
    }
    if (customer) {
      fetchData();
    }
  }, [customer, customerLoading]);

  const fetchData = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      setCustomer(customer);
      setProfileForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        date_of_birth: (customer as any).date_of_birth || "",
        gender: (customer as any).gender || "",
      });

      const { data: addressesData } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customer.id)
        .order("is_default", { ascending: false });

      setAddresses(addressesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!customer) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          date_of_birth: profileForm.date_of_birth || null,
          gender: profileForm.gender || null,
        })
        .eq("id", customer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
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
        <div className="container-custom py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-script text-gradient mb-2">
              My Profile
            </h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="your@email.com"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 99999 99999"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={profileForm.date_of_birth}
                        onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Saved Addresses</CardTitle>
                      <CardDescription>Manage your delivery addresses</CardDescription>
                    </div>
                    <Button
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
                      Add Address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="p-4 border rounded-lg flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{address.full_name}</span>
                              <Badge variant="outline">{address.type}</Badge>
                              {address.is_default && (
                                <Badge>Default</Badge>
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
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
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
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No addresses saved</p>
                      <Button onClick={() => setShowAddressForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Change Password</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use the password reset link sent to your email to change your password
                    </p>
                    <Button variant="outline">Request Password Reset</Button>
                  </div>

                  <div className="border-t pt-4">
                    <Label>Account Actions</Label>
                    <div className="mt-4 space-y-2">
                      <Button variant="destructive" onClick={handleLogout} className="w-full">
                        Logout
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

export default CustomerProfile;
