import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const plans = [
  { name: "Bitcoin", icon: "₿", invest: 15, dailyIncome: 0.6, duration: 90, color: "from-amber-500 to-orange-600" },
  { name: "Ethereum", icon: "Ξ", invest: 30, dailyIncome: 1, duration: 90, color: "from-blue-400 to-indigo-600" },
  { name: "Solana", icon: "◎", invest: 60, dailyIncome: 2, duration: 90, color: "from-purple-500 to-violet-600" },
  { name: "Cardano", icon: "₳", invest: 120, dailyIncome: 4, duration: 90, color: "from-cyan-400 to-blue-600" },
];

const PlansSection = () => {
  return (
    <section className="py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-16">
          <div>
            <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Investment Plans</p>
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
              className="relative group"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
              <div className="relative glass-card p-6 hover:border-primary/30 transition-all h-full flex flex-col">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center text-lg font-bold text-white mb-4`}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-3">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-display font-bold text-foreground">${plan.invest}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Earn ${plan.dailyIncome}/day for {plan.duration} days</p>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-muted-foreground">Total Return</span>
                  <span className="text-accent font-bold">${(plan.dailyIncome * plan.duration).toLocaleString()}</span>
                </div>
                <Link to="/plans" className="mt-auto">
                  <Button className={`w-full bg-gradient-to-r ${plan.color} text-white hover:opacity-90 gap-2`}>
                    <Sparkles className="w-4 h-4" /> Invest
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
