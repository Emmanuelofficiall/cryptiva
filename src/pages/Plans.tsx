import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const allPlans = [
  { name: "Bitcoin", rate: 5, minUsdt: 37, maxUsdt: 73, duration: 30, badge: null },
  { name: "Ethereum", rate: 7, minUsdt: 74, maxUsdt: 184, duration: 45, badge: "Popular" },
  { name: "Solana", rate: 10, minUsdt: 185, maxUsdt: 370, duration: 60, badge: null },
  { name: "Cardano", rate: 12, minUsdt: 370, maxUsdt: 740, duration: 90, badge: "Best Value" },
  { name: "Polkadot", rate: 15, minUsdt: 741, maxUsdt: 3700, duration: 120, badge: null },
  { name: "Avalanche", rate: 18, minUsdt: 3701, maxUsdt: null, duration: 180, badge: "VIP" },
];

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<typeof allPlans[0] | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!selectedPlan) return;
    const amountUsdt = Number(investAmount);
    if (amountUsdt < selectedPlan.minUsdt || (selectedPlan.maxUsdt && amountUsdt > selectedPlan.maxUsdt)) {
      toast({
        title: "Invalid amount",
        description: `Amount must be between $${selectedPlan.minUsdt} and ${selectedPlan.maxUsdt ? `$${selectedPlan.maxUsdt}` : "unlimited"} USDT.`,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration);

      const { error } = await supabase.from("investments").insert({
        user_id: user.id,
        plan_name: selectedPlan.name,
        amount: amountUsdt,
        daily_rate: selectedPlan.rate,
        duration_days: selectedPlan.duration,
        expires_at: expiresAt.toISOString(),
      });
      if (error) throw error;
      toast({ title: "Investment Created!", description: `You've invested $${amountUsdt} USDT in the ${selectedPlan.name} plan.` });
      setSelectedPlan(null);
      setInvestAmount("");
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
            Select from 6 crypto-powered plans. All amounts in USDT.
          </p>
        </div>

        {/* Invest Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 max-w-md w-full glow-green"
            >
              <h3 className="text-xl font-display font-bold text-foreground mb-1">Invest in {selectedPlan.name} Plan</h3>
              <p className="text-sm text-muted-foreground mb-6">{selectedPlan.rate}% daily return • {selectedPlan.duration} days</p>
              <form onSubmit={handleInvest} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Investment Amount (USDT)</Label>
                  <Input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder={`Min: $${selectedPlan.minUsdt} USDT`}
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                    min={selectedPlan.minUsdt}
                    max={selectedPlan.maxUsdt || undefined}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: ${selectedPlan.minUsdt} – {selectedPlan.maxUsdt ? `$${selectedPlan.maxUsdt}` : "Unlimited"} USDT
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm Investment
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedPlan(null)} className="border-border">
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
                <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full ${
                  plan.badge === "VIP" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                }`}>
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-display font-semibold text-foreground mb-4">{plan.name}</h3>
              <p className="text-5xl font-display font-bold text-primary mb-1">{plan.rate}%</p>
              <p className="text-sm text-muted-foreground mb-6">daily return</p>
              <div className="space-y-3 mb-6 text-sm">
                {[
                  ["Min. Deposit", `$${plan.minUsdt} USDT`],
                  ["Max. Deposit", plan.maxUsdt ? `$${plan.maxUsdt} USDT` : "Unlimited"],
                  ["Duration", `${plan.duration} days`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  if (!user) { navigate("/login"); return; }
                  setSelectedPlan(plan);
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                Invest Now <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Plans;
