import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Store,
  ChevronDown,
  Menu,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import MobileBottomNav from "./MobileBottomNav";

const navItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/dashboard/create", label: "Create Listing", icon: PlusCircle },
  { path: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { path: "/dashboard/items", label: "Items", icon: Package },
  { path: "/dashboard/reviews", label: "Ratings & Reviews", icon: Star },
  { path: "/dashboard/analysis", label: "Analysis", icon: BarChart3 },
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
];


const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { currentShop, shops, setCurrentShop } = useShop();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const handleSwitchShop = (shop: typeof currentShop) => {
    if (shop) {
      setCurrentShop(shop);
      toast({
        title: "Shop switched",
        description: `Now viewing ${shop.name}`,
      });
    }
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-sea-green-dark flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-sidebar-foreground">SellerHub</h1>
          <p className="text-xs text-muted-foreground">Seller Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 w-1 h-6 bg-sidebar-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
              )} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-brown-dark flex items-center justify-center">
                <span className="text-sm font-semibold text-secondary-foreground">
                  {currentShop?.name?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{currentShop?.name || 'Select Shop'}</p>
                <p className="text-xs text-muted-foreground truncate">{currentShop?.city || 'No location'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {shops.map(shop => (
              <DropdownMenuItem key={shop.id} onClick={() => handleSwitchShop(shop)}>
                <Store className="w-4 h-4 mr-2" />
                {shop.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => { onNavigate?.(); navigate('/shops'); }}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Manage Shops
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-sea-green-dark flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold truncate">{currentShop?.name || 'SellerHub'}</span>
          </div>
          <div className="w-9" />
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <MobileBottomNav />
    </div>
  );
};


export default DashboardLayout;
