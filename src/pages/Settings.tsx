import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const mockStaff = [
  { id: 1, name: "Admin User", username: "admin", role: "Admin", status: "Active" },
  { id: 2, name: "Staff Member", username: "staff1", role: "Staff", status: "Active" },
  { id: 3, name: "New Hire", username: "newhire", role: "Staff", status: "Inactive" },
];

const Settings = () => {
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    upi: true,
    card: true,
    split: false,
  });

  const handleSave = () => {
    toast({
      title: "Settings saved!",
      description: "Your changes have been saved (mock).",
    });
  };

  return (
    <AdminLayout title="Settings">
      <div className="space-y-8 max-w-3xl">
        {/* Shop Information */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Shop Information</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Shop Name</label>
              <Input defaultValue="Bb's Bright Buttons" className="rounded-xl" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                <Input defaultValue="+91 99526 55555" className="rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <Input defaultValue="hello@brightbuttons.com" className="rounded-xl" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
              <Textarea defaultValue="Chennai, Tamil Nadu, India" className="rounded-xl resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Business Hours</label>
              <Input defaultValue="Mon-Sat: 10:00 AM - 7:00 PM" className="rounded-xl" />
            </div>
          </div>
        </section>

        {/* WhatsApp Settings */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">WhatsApp Settings</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Business Number</label>
              <Input defaultValue="+91 99526 55555" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Order Confirmation Message</label>
              <Textarea 
                defaultValue="Thank you for your order! Your order #{order_id} has been confirmed. We'll update you when it's ready." 
                className="rounded-xl resize-none" 
                rows={3} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Order Ready Message</label>
              <Textarea 
                defaultValue="Great news! Your order #{order_id} is ready for pickup/dispatch. 🎉" 
                className="rounded-xl resize-none" 
                rows={3} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Order Delivered Message</label>
              <Textarea 
                defaultValue="Your order #{order_id} has been delivered! We hope you love your new Bright Buttons piece. 💚" 
                className="rounded-xl resize-none" 
                rows={3} 
              />
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h2>
          <div className="space-y-4">
            {Object.entries(paymentMethods).map(([method, enabled]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-foreground capitalize">{method}</span>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => 
                    setPaymentMethods({ ...paymentMethods, [method]: checked })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* User Management */}
        <section className="bg-card rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">User Management</h2>
            <Button size="sm" className="rounded-full">Add Staff</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-muted-foreground pb-3">Name</th>
                  <th className="text-left text-sm font-medium text-muted-foreground pb-3">Username</th>
                  <th className="text-left text-sm font-medium text-muted-foreground pb-3">Role</th>
                  <th className="text-left text-sm font-medium text-muted-foreground pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockStaff.map((staff) => (
                  <tr key={staff.id} className="border-b border-border/50">
                    <td className="py-3 text-sm text-foreground">{staff.name}</td>
                    <td className="py-3 text-sm text-muted-foreground">{staff.username}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        staff.role === "Admin" 
                          ? "bg-primary/10 text-primary" 
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        staff.status === "Active" 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" className="rounded-full px-8" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
