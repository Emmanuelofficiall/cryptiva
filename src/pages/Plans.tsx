import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const allPlans = [
  { name: "Starter", rate: "5%", min: "RWF 50,000", max: "RWF 99,000", duration: "30 days", badge: null },
  { name: "Bronze", rate: "7%", min: "RWF 100,000", max: "RWF 249,000", duration: "45 days", badge: "Popular" },
  { name: "Silver", rate: "10%", min: "RWF 250,000", max: "RWF 499,000", duration: "60 days", badge: null },
  { name: "Gold", rate: "12%", min: "RWF 500,000", max: "RWF 999,000", duration: "90 days", badge: "Best Value" },
  { name: "Platinum", rate: "15%", min: "RWF 1,000,000", max: "RWF 4,999,000", duration: "120 days", badge: null },
  { name: "Diamond", rate: "18%", min: "RWF 5,000,000", max: "Unlimited", duration: "180 days", badge: "VIP" },
];

const Plans = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Investment Plans</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Choose Your <span className="text-gradient">Growth Path</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Select from 6 carefully designed plans to match your investment goals.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 relative hover:border-primary/30 transition-all"
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-display font-semibold text-foreground mb-4">{plan.name}</h3>
              <p className="text-5xl font-display font-bold text-primary mb-1">{plan.rate}</p>
              <p className="text-sm text-muted-foreground mb-6">daily return</p>
              <div className="space-y-3 mb-6 text-sm">
                {[
                  ["Min. Deposit", plan.min],
                  ["Max. Deposit", plan.max],
                  ["Duration", plan.duration],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <Link to="/login">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  Invest Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Plans;
