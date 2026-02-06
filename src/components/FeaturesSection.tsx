import { BarChart3, RefreshCw, TrendingUp, Smartphone, Shield, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: BarChart3, title: "Multiple Investment Plans", desc: "Choose from 6 tailored plans designed for different risk levels and financial goals." },
  { icon: RefreshCw, title: "Currency Exchange", desc: "Seamlessly convert between RWF and USD inside your dashboard with live rates." },
  { icon: TrendingUp, title: "Daily Returns", desc: "Earn consistent daily profits automatically credited to your wallet balance." },
  { icon: Smartphone, title: "Mobile Money Integration", desc: "Deposit and withdraw using MTN, Airtel, or other popular Rwandan mobile payment services." },
  { icon: Shield, title: "Bank-Level Security", desc: "Your funds are protected with 256-bit encryption and multi-factor authentication." },
  { icon: UserCheck, title: "Admin Verified", desc: "Every transaction is manually reviewed and approved by our trusted admin team." },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Why Choose InvestRW</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Everything You Need to <span className="text-gradient">Grow Your Wealth</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
