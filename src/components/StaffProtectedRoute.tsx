import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface StaffProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Protected route for staff-only pages (admin/staff)
 * Ensures only users with 'admin' or 'staff' role can access
 * Customers are redirected to customer dashboard
 */
export const StaffProtectedRoute = ({ children, requireAdmin = false }: StaffProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is customer, redirect to customer dashboard
  if (role === "customer") {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // Require admin role if specified
  if (requireAdmin && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not staff (admin/staff), show access pending
  if (role !== "admin" && role !== "staff") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Pending</h2>
          <p className="text-muted-foreground">Your account is awaiting role assignment. Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

