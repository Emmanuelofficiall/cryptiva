import { Link, useLocation, useNavigate } from "react-router-dom";
import { DollarSign, BarChart3, Menu, X, LogOut, Bell, Home, CheckSquare, Layers, ArrowLeftRight, User, Shield } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/plans", label: "Plans" },
        { to: "/p2p", label: "P2P" },
        { to: "/tasks", label: "Tasks" },
        { to: "/referral", label: "Referral" },
        ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
      ]
    : [{ to: "/", label: "Home" }];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    document.body.classList.toggle("has-bottom-nav", !!user);
    return () => document.body.classList.remove("has-bottom-nav");
  }, [user]);

  if (user) {
    const bottom = [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/tasks", label: "Task", icon: CheckSquare },
      { to: "/plans", label: "Plans", icon: Layers },
      { to: "/p2p", label: "P2P", icon: ArrowLeftRight },
      { to: "/dashboard?tab=profile", label: "Mine", icon: User },
    ];
    const isActive = (to: string) => {
      const [path, q] = to.split("?");
      if (location.pathname !== path) return false;
      return q ? location.search.includes(q) : !location.search.includes("tab=profile");
    };
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold tracking-wide text-foreground uppercase">Cryptiva</span>
            </Link>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Link to="/admin" aria-label="Admin" className="p-2 text-muted-foreground hover:text-foreground"><Shield className="w-5 h-5" /></Link>
              )}
              <Link to="/referral" aria-label="Notifications" className="relative p-2 text-muted-foreground hover:text-foreground">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-destructive" />
              </Link>
              <button onClick={handleSignOut} aria-label="Logout" className="p-2 text-muted-foreground hover:text-foreground"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </header>
        <nav aria-label="Bottom menu" className="premium-bottom-nav fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-gold/30">
          <div className="max-w-3xl mx-auto grid grid-cols-5 h-20">
            {bottom.map((b) => {
              const active = isActive(b.to);
              return (
                <Link key={b.label} to={b.to} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${active ? "text-gold" : "text-foreground/70 hover:text-gold"}`}>
                  <span className={`flex h-9 w-12 items-center justify-center rounded-lg ${active ? "bg-gold/15" : ""}`}><b.icon className="w-6 h-6" /></span>
                  {b.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">Cryptiva</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "text-foreground border-b-2 border-primary pb-1"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to={isAdmin ? "/admin" : "/dashboard"}>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Login
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleSignOut}>
              Logout
            </Button>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full mt-2">Login</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
