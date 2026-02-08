import { Bitcoin, Wallet, ArrowLeftRight, Users, ShieldCheck, Headphones } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { icon: Bitcoin, title: "Crypto Investment", desc: "Invest in top cryptocurrency plans including Bitcoin, Ethereum, Solana, and more with daily USDT returns." },
  { icon: Wallet, title: "USDT Wallet", desc: "Manage your funds with our built-in wallet. All transactions in USDT for simplicity." },
  { icon: ArrowLeftRight, title: "P2P Trading", desc: "Buy and sell USDT peer-to-peer with other traders directly on the platform." },
  { icon: Users, title: "3-Level Referral Program", desc: "Earn 5%, 3%, and 1% USDT commissions across three levels by inviting friends." },
  { icon: ShieldCheck, title: "Admin-Verified Transactions", desc: "Every deposit and withdrawal is manually verified by our admin team for security." },
  { icon: Headphones, title: "24/7 Live Support", desc: "Get help anytime with our real-time live chat support available around the clock." },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Our Services</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            What We <span className="text-gradient">Offer</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Comprehensive crypto investment services designed for both beginners and experienced investors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
