import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut,
  UserCog
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "POS", icon: ShoppingCart, href: "/pos" },
  { name: "Products", icon: Package, href: "/products" },
  { name: "Orders", icon: ClipboardList, href: "/orders" },
  { name: "Customers", icon: Users, href: "/customers" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Staff", icon: UserCog, href: "/staff", adminOnly: true },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const filteredSidebarItems = sidebarItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Get page title from current route
  const currentPage = filteredSidebarItems.find(
    (item) => item.href === location.pathname
  );
  const pageTitle = title || currentPage?.name || "Dashboard";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Admin</span>
              <Logo size="sm" linkTo="/dashboard" />
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredSidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                ← Back to Store
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-foreground"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {user?.email?.split("@")[0] || "User"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
