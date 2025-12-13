import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CustomerProtectedRoute } from "@/components/CustomerProtectedRoute";
import { StaffProtectedRoute } from "@/components/StaffProtectedRoute";
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
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const CustomerDashboard = lazy(() => import("./pages/customer/Dashboard"));
const CustomerOrders = lazy(() => import("./pages/customer/Orders"));
const CustomerProfile = lazy(() => import("./pages/customer/Profile"));
const CustomerRewards = lazy(() => import("./pages/customer/Rewards"));
const CustomerWishlist = lazy(() => import("./pages/customer/Wishlist"));

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
          <CustomerAuthProvider>
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
                  <Route path="/customer/reset-password" element={<ResetPassword />} />
                  <Route path="/customer/confirm" element={<EmailConfirmation />} />
                  
                  {/* Customer Routes */}
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                  <Route path="/customer/dashboard" element={
                    <CustomerProtectedRoute>
                      <CustomerDashboard />
                    </CustomerProtectedRoute>
                  } />
                  <Route path="/customer/orders" element={
                    <CustomerProtectedRoute>
                      <CustomerOrders />
                    </CustomerProtectedRoute>
                  } />
                  <Route path="/customer/orders/:id" element={
                    <CustomerProtectedRoute>
                      <CustomerOrders />
                    </CustomerProtectedRoute>
                  } />
                  <Route path="/customer/profile" element={
                    <CustomerProtectedRoute>
                      <CustomerProfile />
                    </CustomerProtectedRoute>
                  } />
                  <Route path="/customer/rewards" element={
                    <CustomerProtectedRoute>
                      <CustomerRewards />
                    </CustomerProtectedRoute>
                  } />
                  <Route path="/customer/wishlist" element={
                    <CustomerProtectedRoute>
                      <CustomerWishlist />
                    </CustomerProtectedRoute>
                  } />
                  
                  {/* Admin Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/confirm" element={<EmailConfirmation />} />
                  
                  {/* Protected Staff Routes (Admin/Staff) */}
                  <Route path="/dashboard" element={
                    <StaffProtectedRoute>
                      <Dashboard />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/pos" element={
                    <StaffProtectedRoute>
                      <POS />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/products" element={
                    <StaffProtectedRoute>
                      <Products />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <StaffProtectedRoute>
                      <Orders />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/customers" element={
                    <StaffProtectedRoute>
                      <Customers />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <StaffProtectedRoute>
                      <Reports />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <StaffProtectedRoute>
                      <Settings />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/staff" element={
                    <StaffProtectedRoute requireAdmin>
                      <Staff />
                    </StaffProtectedRoute>
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
          </CustomerAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
