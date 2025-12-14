import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles, Leaf, ArrowRight, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CuephoriaBranding } from "@/components/CuephoriaBranding";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const { signIn, resetPassword, signOut, user, loading: authLoading, role } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  useEffect(() => {
    if (user && !authLoading && role) {
      // If customer is already logged in and visits staff portal, sign them out and show error
      if (role === "customer") {
        const handleCustomerAccess = async () => {
          await signOut();
          toast({
            title: "Access Denied",
            description: "This is the Staff Portal. Customers should use the Customer Portal to log in.",
            variant: "destructive",
          });
        };
        handleCustomerAccess();
      } else if (role === "admin" || role === "staff") {
        navigate("/dashboard");
      }
    }
  }, [user, authLoading, role, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      let errorMessage = "Login failed. Please try again.";
      const errorMsg = error?.message || String(error);
      
      if (errorMsg.includes("Invalid login credentials") || errorMsg.includes("Invalid credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (errorMsg.includes("Email not confirmed") || errorMsg.includes("email not confirmed")) {
        errorMessage = "Please confirm your email address first. Check your inbox for a confirmation link.";
      } else if (errorMsg.includes("Too many requests")) {
        errorMessage = "Too many login attempts. Please wait a moment and try again.";
      } else {
        errorMessage = `Login failed: ${errorMsg}`;
      }

      console.error("Login error details:", error);
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Check if user is a customer - fetch role directly to ensure we have the latest
    const { data: session } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const userRole = roleData?.role;

      // If user is a customer, sign them out and show error
      if (userRole === "customer") {
        await signOut();
        toast({
          title: "Access Denied",
          description: "This is the Staff Portal. Customers should use the Customer Portal to log in.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    toast({
      title: "Welcome back!",
      description: "Login successful.",
    });
    
    // Wait a moment for role to be fetched, then redirect
    setTimeout(() => {
      if (role === "customer") {
        navigate("/customer/dashboard");
      } else {
        navigate("/dashboard");
      }
    }, 100);
  };

  const handleForgotPassword = async () => {
    setForgotPasswordError("");
    
    if (!forgotPasswordEmail) {
      setForgotPasswordError("Please enter your email address");
      return;
    }

    const emailSchema = z.string().email("Please enter a valid email address");
    const result = emailSchema.safeParse(forgotPasswordEmail);
    
    if (!result.success) {
      setForgotPasswordError("Please enter a valid email address");
      return;
    }

    setIsResettingPassword(true);

    const { error } = await resetPassword(forgotPasswordEmail);

    if (error) {
      let errorMessage = "Failed to send reset email. Please try again.";
      const errorMsg = error?.message || String(error);
      
      if (errorMsg.includes("rate limit") || errorMsg.includes("too many")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else {
        errorMessage = `Failed to send reset email: ${errorMsg}`;
      }

      setForgotPasswordError(errorMessage);
      setIsResettingPassword(false);
      return;
    }

    toast({
      title: "Reset link sent!",
      description: "Check your email (including spam folder) for password reset instructions. The email should arrive within 30 seconds if custom SMTP is configured, or 2-5 minutes with default settings.",
      duration: 8000,
    });
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setIsResettingPassword(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image Overlay - Same as Hero */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5 z-0">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop"
          alt="Eco-printed fabric background"
          className="w-full h-full object-cover"
          loading="eager"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            type: "tween"
          }}
          className="absolute top-20 left-10 w-64 h-64 bg-primary-300/20 dark:bg-primary-700/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: 1,
            type: "tween"
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-earth-200/30 dark:bg-earth-800/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear",
            type: "tween"
          }}
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary-200/15 dark:bg-primary-800/15 rounded-full blur-xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 md:p-10 rounded-3xl shadow-2xl border border-primary-200/50 dark:border-primary-800/30 backdrop-blur-xl">
          {/* Logo and Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="mb-3 flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex justify-center"
              >
                <Logo size="3xl" linkTo="/" className="mx-auto !h-36 md:!h-40" />
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-script text-gradient mb-3"
            >
              Staff Portal
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm md:text-base flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Sign in to access your dashboard</span>
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-5 mt-8"
          >
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`h-12 rounded-xl text-base transition-all ${
                  errors.email 
                    ? "border-destructive focus-visible:ring-destructive" 
                    : "focus-visible:ring-primary"
                }`}
                disabled={isSubmitting}
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-destructive mt-1.5 flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>{errors.email}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`h-12 rounded-xl text-base pr-12 transition-all ${
                    errors.password 
                      ? "border-destructive focus-visible:ring-destructive" 
                      : "focus-visible:ring-primary"
                  }`}
                  disabled={isSubmitting}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-destructive mt-1.5 flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>{errors.password}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-between pt-2"
            >
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isSubmitting}
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary-700 dark:hover:text-primary-400 font-medium transition-colors"
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 hover:from-primary-600 hover:to-primary-800 dark:hover:from-primary-500 dark:hover:to-primary-700 group" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Decorative Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <Leaf className="w-4 h-4 text-primary" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </motion.div>

          {/* Back to store */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-6 pt-6 border-t border-border/50 text-center space-y-4"
          >
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back to store</span>
            </Link>
            <div className="flex justify-center items-center">
              <CuephoriaBranding variant="tag" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-script text-gradient flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </label>
              <Input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => {
                  setForgotPasswordEmail(e.target.value);
                  setForgotPasswordError("");
                }}
                placeholder="you@example.com"
                className="h-12 rounded-xl text-base"
                disabled={isResettingPassword}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleForgotPassword();
                  }
                }}
              />
              {forgotPasswordError && (
                <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                  <span>•</span>
                  <span>{forgotPasswordError}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail("");
                  setForgotPasswordError("");
                }}
                className="flex-1 rounded-xl"
                disabled={isResettingPassword}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleForgotPassword}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
