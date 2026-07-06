import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, PlusCircle, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  path: string;
  label: string;
  icon: typeof Home;
  center?: boolean;
  onClick?: () => void;
}

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs: Tab[] = [
    { path: "/dashboard", label: "Overview", icon: Home },
    { path: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    { path: "/dashboard/create", label: "Create", icon: PlusCircle, center: true },
    { path: "/dashboard/items", label: "Items", icon: Package },
    { path: "/dashboard/settings", label: "You", icon: User },
  ];

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <nav
      data-mobile-bottom-nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border h-16 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-full">
        {tabs.map((t) => {
          const active = isActive(t.path);
          const Icon = t.icon;
          if (t.center) {
            return (
              <button
                key={t.path}
                onClick={() => navigate(t.path)}
                className="flex flex-col items-center justify-center gap-0.5 -mt-4"
                aria-label={t.label}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-background",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/90 text-primary-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-medium text-foreground/80">{t.label}</span>
              </button>
            );
          }
          return (
            <NavLink
              key={t.path}
              to={t.path}
              end={t.path === "/dashboard"}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={t.label}
            >
              <Icon className={cn("w-5 h-5", active && "text-primary")} strokeWidth={active ? 2.4 : 2} />
              <span>{t.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
