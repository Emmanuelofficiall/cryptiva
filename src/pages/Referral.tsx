import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Copy, TrendingUp, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const levels = [
  { level: "A", label: "Direct Referral", rate: "5%", color: "text-primary", desc: "Earn 5% commission on every investment made by people you directly invite." },
  { level: "B", label: "2nd Level", rate: "3%", color: "text-primary/80", desc: "Earn 3% commission on investments made by your referrals' referrals." },
  { level: "C", label: "3rd Level", rate: "1%", color: "text-primary/60", desc: "Earn 1% commission from the third tier of your referral network." },
];

const mockReferrals = [
  { name: "Alice K.", level: "A", invested: "RWF 200,000", commission: "RWF 10,000", date: "2026-01-15" },
  { name: "Bob M.", level: "A", invested: "RWF 500,000", commission: "RWF 25,000", date: "2026-01-20" },
  { name: "Claire N.", level: "B", invested: "RWF 100,000", commission: "RWF 3,000", date: "2026-01-22" },
  { name: "David R.", level: "B", invested: "RWF 300,000", commission: "RWF 9,000", date: "2026-02-01" },
  { name: "Eve T.", level: "C", invested: "RWF 150,000", commission: "RWF 1,500", date: "2026-02-03" },
];

const Referral = () => {
  const { toast } = useToast();
  const referralCode = "INVEST-JC2024";

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Referral Program</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Earn More by <span className="text-gradient">Inviting Friends</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Share your referral code and earn commissions on 3 levels of your network.
          </p>
        </div>

        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 max-w-md mx-auto text-center mb-12 glow-green"
        >
          <Gift className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-mono font-bold text-foreground tracking-wider">{referralCode}</span>
            <Button size="sm" variant="outline" onClick={copyCode} className="border-border hover:bg-primary hover:text-primary-foreground">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Commission Levels */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {levels.map((l, i) => (
            <motion.div
              key={l.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-display font-bold text-primary">L{l.level}</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-1">{l.label}</h3>
              <p className={`text-4xl font-display font-bold ${l.color} mb-2`}>{l.rate}</p>
              <p className="text-sm text-muted-foreground">{l.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { icon: Users, label: "Total Referrals", value: "12" },
            { icon: TrendingUp, label: "Total Earnings", value: "RWF 48,500" },
            { icon: Gift, label: "Active Network", value: "8" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5 text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-lg font-display font-semibold text-foreground">Recent Referral Commissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Name</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Level</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Invested</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Commission</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockReferrals.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-sm text-foreground">{r.name}</td>
                    <td className="p-4">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Level {r.level}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground">{r.invested}</td>
                    <td className="p-4 text-sm text-primary font-semibold">{r.commission}</td>
                    <td className="p-4 text-sm text-muted-foreground">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Referral;
