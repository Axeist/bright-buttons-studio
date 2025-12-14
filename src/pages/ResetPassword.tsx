import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    // Check if we have the necessary tokens from Supabase
    // Supabase will add hash and type to the URL when redirecting from email
    const hash = searchParams.get("#access_token");
    if (!hash) {
      // If no token, redirect to appropriate login
      const isCustomer = window.location.pathname.includes("/customer");
      navigate(isCustomer ? "/customer/login" : "/login", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. Redirecting to login...",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        const isCustomer = window.location.pathname.includes("/customer");
        navigate(isCustomer ? "/customer/login" : "/login", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Password reset error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-card rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Password Reset Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been updated successfully. You will be redirected to the login page shortly.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Logo size="lg" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Password Requirements:</strong>
              <br />
              • At least 6 characters long
              <br />
              • Use a mix of letters, numbers, and special characters for better security
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

