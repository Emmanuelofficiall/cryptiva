import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import {
  Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Copy, Loader2, Smartphone, Bitcoin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const CRYPTO_ADDRESS = "TGRg61sjXpXeBcUnXmz88YfG2TeMKF9y6n";
const MOMO_NUMBER = "0789435243";

// Mock chart data
const earningsData = [
  { day: "Mon", amount: 1200 },
  { day: "Tue", amount: 1800 },
  { day: "Wed", amount: 1500 },
  { day: "Thu", amount: 2200 },
  { day: "Fri", amount: 1900 },
  { day: "Sat", amount: 2500 },
  { day: "Sun", amount: 2100 },
];

type DashTab = "overview" | "deposit" | "withdraw";

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DashTab>("overview");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<"crypto" | "momo">("crypto");
  const [depositRef, setDepositRef] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDest, setWithdrawDest] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("MTN MoMo");
  const [submitting, setSubmitting] = useState(false);

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

  const { data: investments } = useQuery({
    queryKey: ["investments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: deposits } = useQuery({
    queryKey: ["deposits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
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

  const walletBalance = Number(profile?.wallet_balance || 0);
  const activeInvestments = investments?.filter((i) => i.status === "active") || [];
  const totalEarned = investments?.reduce((sum, i) => sum + Number(i.total_earned || 0), 0) || 0;

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard." });
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: Number(depositAmount),
        method: depositMethod === "crypto" ? "TRC20 USDT" : "MTN MoMo",
        transaction_ref: depositRef,
        currency: depositMethod === "crypto" ? "USDT" : "RWF",
      });
      if (error) throw error;
      toast({ title: "Deposit submitted!", description: "Your deposit is pending admin approval." });
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
      toast({ title: "Withdrawal requested!", description: "Your withdrawal is pending admin approval." });
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
        <div className="flex gap-1 mb-8 bg-secondary rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Wallet Balance</span>
                </div>
                <p className="text-3xl font-display font-bold text-foreground">RWF {walletBalance.toLocaleString()}</p>
              </div>
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Active Investments</span>
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{activeInvestments.length}</p>
              </div>
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowUpCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                </div>
                <p className="text-3xl font-display font-bold text-primary">RWF {totalEarned.toLocaleString()}</p>
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="glass-card p-6 mb-8">
              <h3 className="font-display font-semibold text-foreground mb-4">Daily Earnings</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 14%)" />
                    <XAxis dataKey="day" stroke="hsl(0, 0%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(0, 0%, 55%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 7%)",
                        border: "1px solid hsl(0, 0%, 14%)",
                        borderRadius: "8px",
                        color: "hsl(0, 0%, 95%)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(160, 84%, 39%)"
                      fillOpacity={1}
                      fill="url(#colorEarnings)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                        <p className="text-sm font-semibold text-foreground">RWF {Number(inv.amount).toLocaleString()}</p>
                        <p className="text-xs text-primary">Earned: RWF {Number(inv.total_earned).toLocaleString()}</p>
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
                          <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{d.currency} {Number(d.amount).toLocaleString()}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            d.status === "approved" ? "bg-primary/10 text-primary" :
                            d.status === "rejected" ? "bg-destructive/10 text-destructive" :
                            "bg-warning/10 text-warning"
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
                          <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">RWF {Number(w.amount).toLocaleString()}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            w.status === "approved" ? "bg-primary/10 text-primary" :
                            w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                            "bg-warning/10 text-warning"
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

        {/* Deposit Tab */}
        {activeTab === "deposit" && (
          <div className="max-w-lg">
            <div className="glass-card p-6 mb-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Choose Deposit Method</h3>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setDepositMethod("crypto")}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    depositMethod === "crypto"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Bitcoin className="w-5 h-5" />
                  <span className="text-sm font-medium">Crypto (TRC20)</span>
                </button>
                <button
                  onClick={() => setDepositMethod("momo")}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    depositMethod === "momo"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-sm font-medium">Mobile Money</span>
                </button>
              </div>

              {depositMethod === "crypto" ? (
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
              ) : (
                <div className="bg-secondary rounded-xl p-4 mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Mobile Money Number</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg text-foreground font-mono font-bold">{MOMO_NUMBER}</code>
                    <Button size="sm" variant="outline" onClick={() => copyAddress(MOMO_NUMBER)} className="border-border hover:bg-primary hover:text-primary-foreground">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Send to this number then fill the form below</p>
                </div>
              )}

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount ({depositMethod === "crypto" ? "USDT" : "RWF"})</Label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Transaction Reference / ID</Label>
                  <Input
                    value={depositRef}
                    onChange={(e) => setDepositRef(e.target.value)}
                    placeholder="Enter transaction ID or reference"
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
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
              <h3 className="font-display font-semibold text-foreground mb-2">Withdraw Funds</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Available balance: <span className="text-primary font-semibold">RWF {walletBalance.toLocaleString()}</span>
              </p>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount (RWF)</Label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Withdrawal Method</Label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm"
                  >
                    <option value="MTN MoMo">MTN MoMo</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="TRC20 USDT">TRC20 USDT</option>
                  </select>
                </div>
                <div>
                  <Label className="text-foreground text-sm">
                    {withdrawMethod === "TRC20 USDT" ? "Wallet Address" : "Phone Number / Account"}
                  </Label>
                  <Input
                    value={withdrawDest}
                    onChange={(e) => setWithdrawDest(e.target.value)}
                    placeholder={withdrawMethod === "TRC20 USDT" ? "TRC20 address" : "07xxxxxxxx"}
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
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
