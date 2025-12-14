import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route for customer-only pages
 * Ensures only users with 'customer' role can access
 */
export const CustomerProtectedRoute = ({ children }: CustomerProtectedRouteProps) => {
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
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }

  // If user is staff (admin/staff), redirect to staff dashboard
  if (role === "admin" || role === "staff") {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is not a customer, show access denied
  if (role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This page is only accessible to customers. Please use the customer login.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

