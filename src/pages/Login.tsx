import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

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

    toast({
      title: "Welcome back!",
      description: "Login successful.",
    });
    navigate("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo size="xl" linkTo="/" className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Staff Portal</h1>
            <p className="text-muted-foreground text-sm">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`h-12 rounded-xl text-base ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                  <span>•</span>
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`h-12 rounded-xl text-base pr-12 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
                  <span>•</span>
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
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
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Back to store */}
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
            >
              <span>←</span>
              <span>Back to store</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
