import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles, Leaf, ArrowRight, X, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useAuth } from "@/hooks/useAuth";
import { ToastAction } from "@/components/ui/toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { customer, signIn, signUp, resendConfirmationEmail, resetPassword, loading } = useCustomerAuth();
  const { user, role } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  useEffect(() => {
    // If user is logged in with customer role, redirect to customer dashboard
    if (user && role === "customer" && !loading) {
      navigate("/customer/dashboard");
    }
    // If user is staff trying to access customer login, redirect to staff dashboard
    if (user && (role === "admin" || role === "staff")) {
      navigate("/dashboard");
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login Error",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Welcome back!",
        description: "Login successful.",
      });
      // Redirect will happen automatically via useEffect when role is set
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({ fullName, email, password, confirmPassword, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const { error, data } = await signUp(email, password, fullName, phone);

    if (error) {
      toast({
        title: "Signup Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Check if email confirmation is required
    const needsConfirmation = data?.user && !data?.session;
    
    if (needsConfirmation) {
      toast({
        title: "Account created!",
        description: "Please check your email (including spam folder) to confirm your account.",
        duration: 8000,
      });
      
      // Show additional message with resend option after a short delay
      setTimeout(() => {
        toast({
          title: "Didn't receive the email?",
          description: "Click the button below to resend the confirmation email.",
          duration: 10000,
          action: (
            <ToastAction
              altText="Resend confirmation email"
              onClick={async () => {
                const { error: resendError } = await resendConfirmationEmail(email);
                if (resendError) {
                  toast({
                    title: "Error",
                    description: "Failed to resend confirmation email. Please try again later.",
                    variant: "destructive",
                  });
                } else {
                  toast({
                    title: "Email sent!",
                    description: "Confirmation email has been resent. Please check your inbox.",
                  });
                }
              }}
            >
              Resend Email
            </ToastAction>
          ),
        });
      }, 2000);
    } else {
      toast({
        title: "Account created!",
        description: "Welcome! Your account has been created successfully.",
      });
    }
    setIsSubmitting(false);
    // User will be redirected after email confirmation
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
      description: "Check your email for password reset instructions.",
    });
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setIsResettingPassword(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
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

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 md:p-10 rounded-3xl shadow-2xl border border-primary-200/50 dark:border-primary-800/30 backdrop-blur-xl">
          <div className="text-center mb-8">
            <Logo size="3xl" linkTo="/" className="mx-auto !h-36 md:!h-40 mb-4" />
            <h1 className="text-3xl md:text-4xl font-script text-gradient mb-3">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {isLogin ? "Sign in to your account" : "Join Bright Buttons family"}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              variant={isLogin ? "default" : "outline"}
              className="flex-1 rounded-full"
              onClick={() => {
                setIsLogin(true);
                setErrors({});
              }}
            >
              Login
            </Button>
            <Button
              variant={!isLogin ? "default" : "outline"}
              className="flex-1 rounded-full"
              onClick={() => {
                setIsLogin(false);
                setErrors({});
              }}
            >
              Sign Up
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`h-12 rounded-xl ${errors.email ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
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
                      className={`h-12 rounded-xl pr-12 ${errors.password ? "border-destructive" : ""}`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignup}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className={`h-12 rounded-xl ${errors.fullName ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`h-12 rounded-xl ${errors.email ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99999 99999"
                    className={`h-12 rounded-xl ${errors.phone ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className={`h-12 rounded-xl pr-12 ${errors.password ? "border-destructive" : ""}`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className={`h-12 rounded-xl pr-12 ${errors.confirmPassword ? "border-destructive" : ""}`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Back to store</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => {
                  setForgotPasswordEmail(e.target.value);
                  setForgotPasswordError("");
                }}
                disabled={isResettingPassword}
                className={forgotPasswordError ? "border-destructive" : ""}
              />
              {forgotPasswordError && (
                <p className="text-sm text-destructive">
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

export default CustomerLogin;
