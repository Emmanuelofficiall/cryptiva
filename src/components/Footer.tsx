import { DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const pageLinks = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/p2p", label: "P2P" },
  { to: "/referral", label: "Referral" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tasks", label: "Tasks" },
  { to: "/admin", label: "Admin" },
  { to: "/login", label: "Login" },
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

          <div className="flex flex-wrap items-center justify-center gap-3">
            {pageLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground/80 transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground shadow-sm"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
