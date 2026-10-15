import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles, TrendingUp, Clock, DollarSign, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const allPlans = [
  { name: "Bitcoin", icon: "₿", invest: 15, dailyIncome: 0.6, duration: 90, badge: null, color: "from-amber-500 to-orange-600" },
  { name: "Ethereum", icon: "Ξ", invest: 30, dailyIncome: 1, duration: 90, badge: "Popular", color: "from-blue-400 to-indigo-600" },
  { name: "Solana", icon: "◎", invest: 60, dailyIncome: 2, duration: 90, badge: null, color: "from-purple-500 to-violet-600" },
  { name: "Cardano", icon: "₳", invest: 120, dailyIncome: 4, duration: 90, badge: "Best Value", color: "from-cyan-400 to-blue-600" },
  { name: "BNB", icon: "⬡", invest: 240, dailyIncome: 8, duration: 90, badge: null, color: "from-yellow-400 to-amber-600" },
  { name: "Binance USD", icon: "$", invest: 480, dailyIncome: 16, duration: 90, badge: "Premium", color: "from-emerald-400 to-green-600" },
  { name: "Litecoin", icon: "Ł", invest: 1000, dailyIncome: 32, duration: 90, badge: "VIP", color: "from-gray-300 to-slate-500" },
];

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<typeof allPlans[0] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const walletBalance = Number(profile?.wallet_balance || 0);

  const handleInvest = async () => {
    if (!user) { navigate("/login"); return; }
    if (!selectedPlan) return;

    if (walletBalance < selectedPlan.invest) {
      toast({
        title: "Insufficient Balance",
        description: `You need $${selectedPlan.invest} USDT. Your balance is $${walletBalance.toFixed(2)}. Please deposit via Crypto or P2P first.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration);
      const dailyRate = (selectedPlan.dailyIncome / selectedPlan.invest) * 100;

      // Deduct from wallet
      const newBalance = walletBalance - selectedPlan.invest;
      const { error: balError } = await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user.id);
      if (balError) throw balError;

      const { error } = await supabase.from("investments").insert({
        user_id: user.id,
        plan_name: selectedPlan.name,
        amount: selectedPlan.invest,
        daily_rate: dailyRate,
        duration_days: selectedPlan.duration,
        expires_at: expiresAt.toISOString(),
      });
      if (error) throw error;

      // Handle referral commissions server-side
      await supabase.rpc("process_referral_commission", {
        _investor_id: user.id,
        _invest_amount: selectedPlan.invest,
      });

      toast({ title: "Investment Created!", description: `$${selectedPlan.invest} USDT deducted. You're now earning $${selectedPlan.dailyIncome}/day.` });
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Investment Plans</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Choose Your <span className="text-gradient">Growth Path</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Invest in crypto-powered plans and earn daily returns for 90 days.
          </p>
          {user && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-primary/10">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Balance: ${walletBalance.toFixed(2)} USDT</span>
            </div>
          )}
        </div>

        {/* Confirm Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md w-full glow-green">
              <h3 className="text-xl font-display font-bold text-foreground mb-1">Confirm {selectedPlan.name} Plan</h3>
              <p className="text-sm text-muted-foreground mb-6">Invest ${selectedPlan.invest} USDT • Earn ${selectedPlan.dailyIncome}/day • {selectedPlan.duration} days</p>
              <div className="bg-secondary rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Your Balance</span><span className="text-foreground font-semibold">${walletBalance.toFixed(2)} USDT</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Investment</span><span className="text-foreground font-semibold">-${selectedPlan.invest} USDT</span></div>
                <div className="flex justify-between text-sm border-t border-border pt-2"><span className="text-muted-foreground">Remaining</span><span className={`font-semibold ${walletBalance >= selectedPlan.invest ? "text-primary" : "text-destructive"}`}>${(walletBalance - selectedPlan.invest).toFixed(2)} USDT</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Daily Income</span><span className="text-primary font-semibold">${selectedPlan.dailyIncome} USDT</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Return</span><span className="text-accent font-semibold">${(selectedPlan.dailyIncome * selectedPlan.duration).toLocaleString()} USDT</span></div>
              </div>
              {walletBalance < selectedPlan.invest && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
                  Insufficient balance. Deposit via <a href="/dashboard" className="underline font-semibold">Crypto</a> or <a href="/p2p" className="underline font-semibold">P2P</a> first.
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={handleInvest} disabled={submitting || walletBalance < selectedPlan.invest} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Confirm Investment
                </Button>
                <Button variant="outline" onClick={() => setSelectedPlan(null)} className="border-border">Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
              className="relative group"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
              <div className="relative glass-card p-6 hover:border-primary/30 transition-all h-full flex flex-col">
                {plan.badge && (
                  <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${
                    plan.badge === "VIP" ? "bg-accent/15 text-accent" :
                    plan.badge === "Premium" ? "bg-primary/15 text-primary" :
                    "bg-primary/10 text-primary"
                  }`}>{plan.badge}</span>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-xl font-bold text-white mb-4`}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-display font-bold text-foreground">${plan.invest}</span>
                  <span className="text-sm text-muted-foreground">USDT</span>
                </div>
                <p className="text-xs text-muted-foreground mb-5">One-time investment</p>
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Daily Income</span>
                    <span className="ml-auto text-primary font-bold">${plan.dailyIncome}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-muted-foreground">Duration</span>
                    <span className="ml-auto text-foreground font-medium">{plan.duration} days</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-muted-foreground">Total Return</span>
                    <span className="ml-auto text-accent font-bold">${(plan.dailyIncome * plan.duration).toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!user) { navigate("/login"); return; }
                    setSelectedPlan(plan);
                  }}
                  className={`w-full bg-gradient-to-r ${plan.color} text-white hover:opacity-90 gap-2 font-semibold transition-all`}
                >
                  <Sparkles className="w-4 h-4" /> Invest Now
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Plans;
