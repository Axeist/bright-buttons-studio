import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import { z } from "zod";

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "staff";
  created_at: string;
}

const staffSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["admin", "staff"]),
});

const Staff = () => {
  const { isAdmin } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "staff" as "admin" | "staff",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchStaff = async () => {
    setLoading(true);
    
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      toast({
        title: "Error",
        description: "Failed to load staff members.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
    }

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    const staffWithRoles: StaffMember[] = (profiles || [])
      .filter(p => roleMap.has(p.id))
      .map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: roleMap.get(p.id) as "admin" | "staff",
        created_at: p.created_at,
      }));

    setStaffMembers(staffWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async () => {
    setErrors({});
    
    const result = staffSchema.safeParse(newStaff);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newStaff.email,
      password: newStaff.password,
      options: {
        data: {
          full_name: newStaff.fullName,
        },
      },
    });

    if (authError) {
      toast({
        title: "Error",
        description: authError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!authData.user) {
      toast({
        title: "Error",
        description: "Failed to create user.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Assign role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: newStaff.role,
      });

    if (roleError) {
      toast({
        title: "Error",
        description: "User created but failed to assign role: " + roleError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Staff Created",
      description: `${newStaff.fullName} has been added as ${newStaff.role}.`,
    });

    setNewStaff({ email: "", password: "", fullName: "", role: "staff" });
    setIsDialogOpen(false);
    setIsSubmitting(false);
    fetchStaff();
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName || "this staff member"}?`)) {
      return;
    }

    // Remove role first
    const { error: roleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", staffId);

    if (roleError) {
      toast({
        title: "Error",
        description: "Failed to remove staff role.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Staff Removed",
      description: `${staffName || "Staff member"} has been removed.`,
    });
    
    fetchStaff();
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage your team members and their roles.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                    placeholder="Enter full name"
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="Enter email address"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    placeholder="Enter password (min 8 characters)"
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(value: "admin" | "staff") => 
                      setNewStaff({ ...newStaff, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleCreateStaff} 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Staff Account
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Staff Members Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first team member.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Staff
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      {staff.full_name || "—"}
                    </TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>
                      <Badge variant={staff.role === "admin" ? "default" : "secondary"}>
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(staff.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(staff.id, staff.full_name || "")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Staff;
