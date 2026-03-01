import { DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Cryptiva</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/plans" className="hover:text-foreground transition-colors">Plans</Link>
            <Link to="/p2p" className="hover:text-foreground transition-colors">P2P</Link>
            <Link to="/referral" className="hover:text-foreground transition-colors">Referral</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
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
      </div>
    </footer>
  );
};

export default Footer;
