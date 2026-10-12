import { DollarSign, Home, Landmark, Users, Gift, LayoutDashboard, ListTodo, ShieldCheck, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

const pageLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plans", label: "Plans", icon: Landmark },
  { to: "/p2p", label: "P2P", icon: Users },
  { to: "/referral", label: "Referral", icon: Gift },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/login", label: "Login", icon: LogIn },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Cryptiva</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://whatsapp.com/channel/0029VbCWHlJ3gvWgPLWB8U0M"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                📱 WhatsApp Channel
              </a>
              <p className="text-xs text-muted-foreground">© 2026 Cryptiva. All rights reserved.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
            {pageLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-[72px] min-w-[110px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[#5da4ff]/35 bg-[#3a7ae5] px-3 py-2 text-center text-white shadow-[0_8px_20px_rgba(58,122,229,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4a88f3] hover:shadow-[0_10px_22px_rgba(58,122,229,0.3)]"
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
