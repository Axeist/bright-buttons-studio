import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  User, 
  Package, 
  Gift,
  Heart,
  Sparkles as SparklesIcon,
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Sparkles,
  Leaf
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { CuephoriaBranding } from "@/components/CuephoriaBranding";

interface CustomerLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/customer/dashboard" },
  { name: "My Profile", icon: User, href: "/customer/profile" },
  { name: "My Orders", icon: Package, href: "/customer/orders" },
  { name: "My Wishlist", icon: Heart, href: "/customer/wishlist" },
  { name: "Custom Orders", icon: SparklesIcon, href: "/customer/custom-orders" },
  { name: "Rewards & Points", icon: Gift, href: "/customer/rewards" },
];

export const CustomerLayout = ({ children, title }: CustomerLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { customer, signOut } = useCustomerAuth();

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/customer/login");
  };

  // Get page title from current route
  const currentPage = sidebarItems.find(
    (item) => item.href === location.pathname
  );
  const pageTitle = title || currentPage?.name || "Dashboard";

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : (isSidebarOpen ? 0 : "-100%")
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed top-0 left-0 bottom-0 w-72 bg-card/95 dark:bg-card/90 backdrop-blur-xl border-r border-primary-200/50 dark:border-primary-800/30 z-50 shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 border-b border-primary-200/50 dark:border-primary-800/30 bg-gradient-to-br from-primary-50/50 via-transparent to-earth-50/50 dark:from-primary-900/20 dark:to-transparent"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex justify-center mb-4"
            >
              <Logo size="2xl" linkTo="/" className="mx-auto" />
            </motion.div>
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 dark:from-primary-900/40 dark:via-primary-900/20 dark:to-primary-900/40 rounded-full border border-primary/30 dark:border-primary-800/50 shadow-md backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </motion.div>
                <span className="text-xs font-script text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-primary-500 to-primary-700 dark:from-primary-300 dark:via-primary-400 dark:to-primary-300">
                  My Account
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 text-white shadow-lg shadow-primary/30"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 rounded-xl"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <motion.div
                        animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative z-10"
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                      </motion.div>
                      <span className="relative z-10">{item.name}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative z-10 ml-auto"
                        >
                          <Leaf className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 border-t border-primary-200/50 dark:border-primary-800/30 space-y-3 bg-gradient-to-t from-primary-50/30 via-transparent to-transparent dark:from-primary-900/10"
          >
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary-900/30 dark:via-primary-900/20 border border-primary/20 dark:border-primary-800/40 backdrop-blur-sm"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-700 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center text-white text-sm font-semibold shadow-lg flex-shrink-0"
              >
                {customer?.email?.charAt(0).toUpperCase() || customer?.name?.charAt(0).toUpperCase() || "C"}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {customer?.name || customer?.email?.split("@")[0] || "Customer"}
                </p>
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {customer?.email || "support@brightbuttons.in"}
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                  {customer?.loyalty_tier ? customer.loyalty_tier.charAt(0).toUpperCase() + customer.loyalty_tier.slice(1) : "Bronze"} Member
                </span>
              </div>
            </motion.div>

            <Link to="/shop">
              <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-primary transition-colors rounded-xl">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </motion.div>
            </Link>
            <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </motion.div>
            <div className="pt-3 mt-3 border-t border-primary-200/30 dark:border-primary-800/20 flex justify-center">
              <CuephoriaBranding variant="tag" />
            </div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="lg:ml-72 relative z-10">
        {/* Top Bar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="sticky top-0 z-30 glass-card border-b border-primary-200/50 dark:border-primary-800/30"
        >
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
              >
                <Menu className="w-6 h-6" />
              </motion.button>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-script text-gradient"
              >
                {pageTitle}
              </motion.h1>
            </div>
            
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

