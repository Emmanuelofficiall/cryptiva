import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const USDT_TO_RWF = 1349;

const plans = [
  { name: "Bitcoin", rate: "5%", minUsdt: 37, duration: "30 days", badge: null },
  { name: "Ethereum", rate: "7%", minUsdt: 74, duration: "45 days", badge: "Popular" },
  { name: "Solana", rate: "10%", minUsdt: 185, duration: "60 days", badge: null },
  { name: "Cardano", rate: "12%", minUsdt: 370, duration: "90 days", badge: "Best Value" },
];

const PlansSection = () => {
  return (
    <section className="py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Investment Plans</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Choose Your <span className="text-gradient">Growth Path</span>
            </h2>
          </div>
          <Link to="/plans" className="hidden sm:block">
            <Button variant="ghost" className="text-primary hover:text-primary gap-2">
              View All Plans <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 relative hover:border-primary/30 transition-all"
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-display font-semibold text-foreground mb-4">{plan.name}</h3>
              <p className="text-4xl font-display font-bold text-primary mb-1">{plan.rate}</p>
              <p className="text-sm text-muted-foreground mb-6">daily return</p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min. Deposit</span>
                  <span className="text-foreground font-medium">${plan.minUsdt} USDT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">≈ RWF</span>
                  <span className="text-foreground font-medium">RWF {(plan.minUsdt * USDT_TO_RWF).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground font-medium">{plan.duration}</span>
                </div>
              </div>
              <Link to="/plans">
                <Button variant="outline" className="w-full border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                  Select Plan
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
