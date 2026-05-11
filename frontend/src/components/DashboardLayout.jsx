import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Package,
  Truck,
  Calculator,
  CalendarClock,
  BookUser,
  Receipt,
  BarChart3,
  FileText,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/track", label: "Track Shipment", icon: Search },
  { to: "/dashboard/ship", label: "Ship Now", icon: Package },
  { to: "/dashboard/quote", label: "Get a Quote", icon: Calculator },
  { to: "/dashboard/pickup", label: "Schedule Pickup", icon: CalendarClock },
  { to: "/dashboard/shipments", label: "My Shipments", icon: Truck },
  { to: "/dashboard/addresses", label: "Address Book", icon: BookUser },
  { to: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { to: "/dashboard/customs", label: "Customs Documents", icon: FileText },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const SidebarContent = ({ onNavigate }) => {
  return (
    <nav data-testid="sidebar-nav" className="flex flex-col py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-dhl-red bg-dhl-yellow/10"
                  : "text-dhl-muted hover:text-dhl-text hover:bg-dhl-panel"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-dhl-yellow" />
                )}
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-dhl-red" : "text-dhl-muted"}`}
                  strokeWidth={2}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-dhl-panel flex flex-col">
      {/* Top Header */}
      <header
        data-testid="dashboard-header"
        className="bg-white border-b border-dhl-border h-16 sticky top-0 z-40 flex items-center px-4 lg:px-6"
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                data-testid="mobile-sidebar-toggle"
                className="lg:hidden p-2 -ml-2 text-dhl-text"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white border-r border-dhl-border">
              <div className="h-16 px-5 flex items-center border-b border-dhl-border">
                <Logo size="md" to="/dashboard" />
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Logo size="md" to="/dashboard" className="hidden lg:inline-flex" />

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhl-muted pointer-events-none" />
              <Input
                data-testid="dashboard-search"
                placeholder="Search shipments, invoices, addresses…"
                className="pl-9 h-10 bg-dhl-panel border-dhl-border focus-visible:ring-dhl-yellow focus-visible:border-dhl-yellow rounded-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <Button
            variant="ghost"
            size="icon"
            data-testid="notification-bell"
            className="relative h-10 w-10 hover:bg-dhl-panel"
            onClick={() => toast.info("No new notifications", { description: "You're all caught up." })}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-dhl-text" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-dhl-red rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="account-dropdown-trigger"
                className="flex items-center gap-2 pl-2 pr-2 lg:pr-3 h-10 hover:bg-dhl-panel rounded-sm transition-colors"
              >
                <div className="w-8 h-8 bg-dhl-yellow text-dhl-ink rounded-full flex items-center justify-center font-bold text-xs">
                  {initials}
                </div>
                <span className="hidden lg:inline text-sm font-semibold text-dhl-text">
                  {user?.firstName || "Account"}
                </span>
                <ChevronDown className="hidden lg:inline w-4 h-4 text-dhl-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border border-dhl-border rounded-sm shadow-lg"
              data-testid="account-dropdown-menu"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-xs text-dhl-muted">Signed in as</span>
                  <span className="text-sm font-semibold text-dhl-text truncate">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="dropdown-settings"
                onClick={() => navigate("/dashboard/settings")}
                className="cursor-pointer"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="dropdown-logout"
                onClick={handleLogout}
                className="cursor-pointer text-dhl-red focus:text-dhl-red"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          data-testid="dashboard-sidebar"
          className="hidden lg:block w-64 bg-white border-r border-dhl-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin"
        >
          <SidebarContent />
        </aside>

        {/* Main */}
        <main
          data-testid="dashboard-main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
