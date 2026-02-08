import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import {
  Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Copy, Loader2, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const CRYPTO_ADDRESS = "TGRg61sjXpXeBcUnXmz88YfG2TeMKF9y6n";

type DashTab = "overview" | "deposit" | "withdraw" | "earnings";

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositRef, setDepositRef] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDest, setWithdrawDest] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("TRC20 USDT");
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

  const { data: investments } = useQuery({
    queryKey: ["investments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("investments").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: deposits } = useQuery({
    queryKey: ["deposits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("deposits").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: dailyEarnings } = useQuery({
    queryKey: ["daily-earnings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_earnings").select("*").eq("user_id", user!.id).order("earned_date", { ascending: true });
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

  const walletBalance = Number(profile?.wallet_balance || 0);
  const activeInvestments = investments?.filter((i) => i.status === "active") || [];
  const totalEarned = investments?.reduce((sum, i) => sum + Number(i.total_earned || 0), 0) || 0;

  const fmt = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const earningsChartData = (dailyEarnings || []).slice(-14).map((e) => ({
    day: new Date(e.earned_date!).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    amount: Number(e.amount),
  }));

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: Number(depositAmount),
        method: "TRC20 USDT",
        transaction_ref: depositRef,
        currency: "USDT",
      });
      if (error) throw error;
      toast({ title: "Deposit submitted!", description: "Pending admin approval." });
      setDepositAmount("");
      setDepositRef("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        destination: withdrawDest,
      });
      if (error) throw error;
      toast({ title: "Withdrawal requested!", description: "Pending admin approval." });
      setWithdrawAmount("");
      setWithdrawDest("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { key: DashTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Wallet },
    { key: "earnings", label: "Earnings", icon: TrendingUp },
    { key: "deposit", label: "Deposit", icon: ArrowDownCircle },
    { key: "withdraw", label: "Withdraw", icon: ArrowUpCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Welcome, {profile?.full_name || user.email}
          </h1>
          <p className="text-sm text-muted-foreground">
            Referral Code: <span className="font-mono text-primary">{profile?.referral_code}</span>
            <button onClick={() => copyAddress(profile?.referral_code || "")} className="ml-2 text-primary hover:text-primary/80">
              <Copy className="w-3 h-3 inline" />
            </button>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-secondary rounded-xl p-1 w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="glass-card p-6 glow-green">
                <div className="flex items-center gap-3 mb-3">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Wallet Balance</span>
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{fmt(walletBalance)}</p>
              </div>
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Active Investments</span>
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{activeInvestments.length}</p>
              </div>
              <div className="glass-card p-6 glow-gold">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowUpCircle className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                </div>
                <p className="text-3xl font-display font-bold text-gradient-gold">{fmt(totalEarned)}</p>
              </div>
            </div>

            {/* Active Investments */}
            <div className="glass-card overflow-hidden mb-8">
              <div className="p-5 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">Active Investments</h3>
              </div>
              {activeInvestments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No active investments yet. <a href="/plans" className="text-primary hover:underline">Choose a plan</a> to start.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {activeInvestments.map((inv) => (
                    <div key={inv.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.plan_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.daily_rate}% daily • {inv.duration_days} days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{fmt(Number(inv.amount))}</p>
                        <p className="text-xs text-primary">Earned: {fmt(Number(inv.total_earned))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-display font-semibold text-foreground">Recent Deposits</h3>
                </div>
                {(!deposits || deposits.length === 0) ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No deposits yet</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {deposits.slice(0, 5).map((d) => (
                      <div key={d.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.method}</p>
                          <p className="text-xs text-muted-foreground">{new Date(d.created_at!).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">${Number(d.amount).toLocaleString()} USDT</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            d.status === "approved" ? "bg-primary/10 text-primary" :
                            d.status === "rejected" ? "bg-destructive/10 text-destructive" :
                            "bg-accent/10 text-accent"
                          }`}>{d.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-display font-semibold text-foreground">Recent Withdrawals</h3>
                </div>
                {(!withdrawals || withdrawals.length === 0) ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">No withdrawals yet</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {withdrawals.slice(0, 5).map((w) => (
                      <div key={w.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{w.method}</p>
                          <p className="text-xs text-muted-foreground">{new Date(w.created_at!).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">${Number(w.amount).toLocaleString()} USDT</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            w.status === "approved" ? "bg-primary/10 text-primary" :
                            w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                            "bg-accent/10 text-accent"
                          }`}>{w.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div>
            <div className="glass-card p-6 mb-8">
              <h3 className="font-display font-semibold text-foreground mb-4">Daily Earnings History</h3>
              {earningsChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={earningsChartData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
                      <XAxis dataKey="day" stroke="hsl(210, 10%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(210, 10%, 55%)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(220, 20%, 7%)", border: "1px solid hsl(220, 15%, 14%)", borderRadius: "8px", color: "hsl(210, 20%, 95%)" }} />
                      <Area type="monotone" dataKey="amount" stroke="hsl(160, 84%, 39%)" fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No earnings yet. Invest in a plan to start earning daily returns.</p>
              )}
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">Earnings Log</h3>
              </div>
              {(dailyEarnings || []).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No earnings recorded yet.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {[...(dailyEarnings || [])].reverse().slice(0, 20).map((e) => (
                    <div key={e.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">{new Date(e.earned_date!).toLocaleDateString()}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{fmt(Number(e.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deposit Tab */}
        {activeTab === "deposit" && (
          <div className="max-w-lg">
            <div className="glass-card p-6 mb-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Deposit USDT</h3>
              <div className="bg-secondary rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">TRC20 USDT Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-foreground font-mono break-all flex-1">{CRYPTO_ADDRESS}</code>
                  <Button size="sm" variant="outline" onClick={() => copyAddress(CRYPTO_ADDRESS)} className="border-border hover:bg-primary hover:text-primary-foreground shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-destructive mt-2">⚠ Only send USDT via TRC20 network</p>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Enter amount in USDT" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Transaction Reference / ID</Label>
                  <Input value={depositRef} onChange={(e) => setDepositRef(e.target.value)} placeholder="Enter transaction ID or hash" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Deposit
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === "withdraw" && (
          <div className="max-w-lg">
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-2">Withdraw USDT</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Available: <span className="text-primary font-semibold">{fmt(walletBalance)}</span>
              </p>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Enter amount" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Withdrawal Method</Label>
                  <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)} className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
                    <option value="TRC20 USDT">TRC20 USDT</option>
                  </select>
                </div>
                <div>
                  <Label className="text-foreground text-sm">TRC20 Wallet Address</Label>
                  <Input value={withdrawDest} onChange={(e) => setWithdrawDest(e.target.value)} placeholder="Your TRC20 address" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Request Withdrawal
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;
