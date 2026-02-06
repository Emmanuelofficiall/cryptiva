import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Copy, TrendingUp, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";

const levels = [
  { level: "A", label: "Direct Referral", rate: "5%", color: "text-primary", desc: "Earn 5% commission on every investment made by people you directly invite." },
  { level: "B", label: "2nd Level", rate: "3%", color: "text-primary/80", desc: "Earn 3% commission on investments made by your referrals' referrals." },
  { level: "C", label: "3rd Level", rate: "1%", color: "text-primary/60", desc: "Earn 1% commission from the third tier of your referral network." },
];

const Referral = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ["commissions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_commissions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const referralCode = profile?.referral_code || "—";
  const referralLink = `${window.location.origin}/login?ref=${referralCode}`;
  const totalEarnings = commissions?.reduce((s, c) => s + Number(c.amount), 0) || 0;
  const totalReferrals = commissions?.length || 0;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
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
          className="glass-card p-6 max-w-lg mx-auto text-center mb-12 glow-green"
        >
          <Gift className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-2xl font-mono font-bold text-foreground tracking-wider">{referralCode}</span>
            <Button size="sm" variant="outline" onClick={copyCode} className="border-border hover:bg-primary hover:text-primary-foreground">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
            <code className="text-xs text-foreground font-mono break-all flex-1">{referralLink}</code>
            <Button size="sm" variant="outline" onClick={copyLink} className="border-border hover:bg-primary hover:text-primary-foreground shrink-0">
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
            { icon: Users, label: "Total Referrals", value: totalReferrals.toString() },
            { icon: TrendingUp, label: "Total Earnings", value: `RWF ${totalEarnings.toLocaleString()}` },
            { icon: Gift, label: "Your Code", value: referralCode },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5 text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Commissions Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-lg font-display font-semibold text-foreground">Your Referral Commissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Level</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Rate</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Commission</th>
                  <th className="text-left text-xs text-muted-foreground font-medium p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions && commissions.length > 0 ? commissions.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Level {c.level}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground">{c.rate}%</td>
                    <td className="p-4 text-sm text-primary font-semibold">RWF {Number(c.amount).toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at!).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No commissions yet. Share your referral code to start earning!
                    </td>
                  </tr>
                )}
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
