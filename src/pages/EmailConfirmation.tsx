import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Email Confirmation Handler
 * This page handles redirects after users click email confirmation links.
 * It automatically redirects users to their appropriate dashboard based on role.
 */
const EmailConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // Check if we have confirmation tokens in the URL
    const hash = window.location.hash;
    const hasToken = hash.includes("access_token") || hash.includes("type=signup");

    if (hasToken && user && role) {
      // User is confirmed and we know their role
      // Redirect based on role
      if (role === "customer") {
        navigate("/customer/dashboard", { replace: true });
      } else if (role === "admin" || role === "staff") {
        navigate("/dashboard", { replace: true });
      } else {
        // Unknown role, redirect to home
        navigate("/", { replace: true });
      }
    } else if (hasToken && !user) {
      // Token present but user not loaded yet, wait a bit
      const timer = setTimeout(() => {
        if (user && role) {
          if (role === "customer") {
            navigate("/customer/dashboard", { replace: true });
          } else if (role === "admin" || role === "staff") {
            navigate("/dashboard", { replace: true });
          }
        } else {
          // If still no user after waiting, redirect to login
          navigate("/customer/login", { replace: true });
        }
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // No token, redirect to appropriate login
      const isCustomer = window.location.pathname.includes("/customer");
      navigate(isCustomer ? "/customer/login" : "/login", { replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Confirming Your Email...</h2>
        <p className="text-muted-foreground">
          Please wait while we verify your email and redirect you to your dashboard.
        </p>
      </div>
    </div>
  );
};

export default EmailConfirmation;

