import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center hero-gradient pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trusted by 10,000+ Investors
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
              Invest Smart.
              <br />
              <span className="text-gradient">Grow Wealth.</span>
              <br />
              Live Free.
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Start your financial freedom journey with daily returns, flexible currency options, and secure Mobile Money deposits.
            </p>

            <div className="glass-card p-4 inline-flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Exchange Rate</p>
                <p className="text-sm font-mono font-semibold text-foreground">1 USD = 1,349 RWF</p>
              </div>
              <span className="text-xs text-primary font-semibold ml-2">+0.2%</span>
            </div>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/plans">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 glow-green">
                  Start Investing <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                  View Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex gap-10">
              {[
                { value: "10,000+", label: "Active Users" },
                { value: "RWF 2.5B", label: "Total Invested" },
                { value: "12%", label: "Avg. Daily Return" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
              <img
                src="https://images.unsplash.com/photo-1663000805908-1106cf7ad001?w=600&h=700&fit=crop"
                alt="Mobile banking on smartphone"
                className="relative rounded-2xl w-full max-w-md mx-auto shadow-2xl"
              />
              <div className="absolute bottom-8 right-0 glass-card p-4 flex items-center gap-3 glow-green">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Daily Returns</p>
                  <p className="text-lg font-bold text-primary">+8.5%</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
