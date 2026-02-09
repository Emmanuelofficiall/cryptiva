import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import CandlestickChart from "@/components/CandlestickChart";

const miniCharts = ["BTC/USDT", "ETH/USDT", "SOL/USDT"];

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Zap className="w-3 h-3 text-accent" />
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
              Start your financial freedom journey with daily USDT returns, P2P trading, and secure crypto deposits.
            </p>

            <div className="glass-card p-4 inline-flex items-center gap-4 mb-8 glow-green">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform Currency</p>
                <p className="text-sm font-mono font-semibold text-foreground">USDT (TRC20)</p>
              </div>
              <span className="text-xs text-primary font-semibold ml-2 bg-primary/10 px-2 py-1 rounded-full">Live</span>
            </div>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/plans">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 glow-green">
                  Start Investing <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/p2p">
                <Button size="lg" variant="outline" className="border-accent/50 text-accent hover:bg-accent hover:text-accent-foreground gap-2">
                  P2P Trading <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="flex gap-10">
              {[
                { value: "10,000+", label: "Active Users" },
                { value: "$2.5M+", label: "Total Invested" },
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
            <div className="space-y-4">
              {miniCharts.map((pair, i) => (
                <motion.div
                  key={pair}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">{pair}</span>
                    <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">Live</span>
                  </div>
                  <CandlestickChart pair={pair} height={100} showLabels />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
