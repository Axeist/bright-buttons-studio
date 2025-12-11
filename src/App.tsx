import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConstructionPopup } from "@/components/ConstructionPopup";

// Public Pages - Lazy loaded for better performance
const Index = lazy(() => import("./pages/Index"));
const AboutFounder = lazy(() => import("./pages/AboutFounder"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const Shop = lazy(() => import("./pages/Shop"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Customer Pages
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const CustomerDashboard = lazy(() => import("./pages/customer/Dashboard"));
const CustomerOrders = lazy(() => import("./pages/customer/Orders"));
const CustomerProfile = lazy(() => import("./pages/customer/Profile"));
const CustomerRewards = lazy(() => import("./pages/customer/Rewards"));

// Admin Pages - Lazy loaded
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Products = lazy(() => import("./pages/Products"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Staff = lazy(() => import("./pages/Staff"));
const Scanner = lazy(() => import("./pages/Scanner"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/category/:category" element={<Category />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/about-founder" element={<AboutFounder />} />
                  <Route path="/terms-conditions" element={<TermsConditions />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  
                  {/* Customer Auth Routes */}
                  <Route path="/customer/login" element={<CustomerLogin />} />
                  
                  {/* Customer Routes */}
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                  <Route path="/customer/dashboard" element={
                    <ProtectedRoute>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/customer/orders" element={
                    <ProtectedRoute>
                      <CustomerOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/customer/orders/:id" element={
                    <ProtectedRoute>
                      <CustomerOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/customer/profile" element={
                    <ProtectedRoute>
                      <CustomerProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="/customer/rewards" element={
                    <ProtectedRoute>
                      <CustomerRewards />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/pos" element={
                    <ProtectedRoute>
                      <POS />
                    </ProtectedRoute>
                  } />
                  <Route path="/products" element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } />
                  <Route path="/customers" element={
                    <ProtectedRoute>
                      <Customers />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff" element={
                    <ProtectedRoute requireAdmin>
                      <Staff />
                    </ProtectedRoute>
                  } />
                  <Route path="/scanner" element={
                    <ProtectedRoute>
                      <Scanner />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <ConstructionPopup />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
