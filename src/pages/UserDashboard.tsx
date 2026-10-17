import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";
import banner4 from "@/assets/banner-4.jpg";
import {
  Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle,
  Copy, Loader2, Calendar, User, Volume2, Layers, ArrowLeftRight, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const CRYPTO_ADDRESS = "TCC3Es9hAbjsosuBz7ZhGpzSVCJqLSgFwz";
const banners = [
  { img: banner1, t: "Grow Your Wealth", s: "Earn daily returns on USDT plans" },
  { img: banner2, t: "Trade P2P Instantly", s: "Buy & sell USDT with trusted merchants" },
  { img: banner3, t: "Your Crypto Portfolio", s: "Explore Bitcoin, Ethereum, Solana and more" },
  { img: banner4, t: "Invite. Grow. Earn.", s: "100 USDT for every 15 qualifying friends" },
];

type DashTab = "overview" | "deposit" | "withdraw" | "earnings" | "profile";

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashTab>((searchParams.get("tab") as DashTab) || "overview");
  const [slide, setSlide] = useState(0);
  useEffect(() => { const t = searchParams.get("tab") as DashTab; setActiveTab(t || "overview"); }, [searchParams]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const i = setInterval(() => setSlide((s) => (s + 1) % banners.length), 6000);
    return () => clearInterval(i);
  }, []);
  const [depositAmount, setDepositAmount] = useState("");
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDest, setWithdrawDest] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("TRC20 USDT");
  const [submitting, setSubmitting] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);

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

  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setSubmitting(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: Number(depositAmount),
        method: "TRC20 USDT",
        transaction_ref: invoiceNumber,
        currency: "USDT",
      });
      if (error) throw error;
      toast({ title: "Deposit submitted!", description: `Invoice: ${invoiceNumber}. Pending admin approval.` });
      setDepositAmount("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || amt <= 0) return;
    const WITHDRAWAL_FEE = Number((amt * 0.1).toFixed(2)); // 10% fee
    if (amt + WITHDRAWAL_FEE > walletBalance) {
      toast({ title: "Insufficient balance", description: `You need at least $${(amt + WITHDRAWAL_FEE).toFixed(2)} USDT (including 10% fee of $${WITHDRAWAL_FEE.toFixed(2)}).`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Deduct wallet balance immediately (amount + fee)
      const totalDeduction = amt + WITHDRAWAL_FEE;
      const { error: balError } = await supabase.from("profiles").update({ wallet_balance: walletBalance - totalDeduction }).eq("user_id", user.id);
      if (balError) throw balError;

      const { error } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: amt,
        method: withdrawMethod,
        destination: withdrawDest,
      });
      if (error) {
        // Rollback balance if insert fails
        await supabase.from("profiles").update({ wallet_balance: walletBalance }).eq("user_id", user.id);
        throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Withdrawal requested!", description: `$${amt} USDT (+ $${WITHDRAWAL_FEE} fee) deducted. Pending admin approval.` });
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
    { key: "profile", label: "Profile", icon: User },
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
        <div className="flex gap-1 mb-8 bg-secondary rounded-xl p-1 w-full sm:w-fit overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
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
            <div className="max-w-3xl mx-auto mb-8 space-y-6">
              <div className="relative rounded-2xl overflow-hidden aspect-[12/5]">
                {banners.map((b, i) => (
                  <div key={b.t} aria-hidden={slide !== i} className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${slide === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                    <img src={b.img} alt={b.t} loading={i === 0 ? "eager" : "lazy"} width={1536} height={640} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5">
                      <h2 className="text-lg sm:text-3xl font-display font-bold text-foreground">{b.t}</h2>
                      <p className="text-xs sm:text-base text-foreground/80">{b.s}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2 -mt-3">
                {banners.map((b, i) => (
                  <Button key={b.t} variant="ghost" size="icon" aria-label={`Slide ${i + 1}`} aria-pressed={slide === i} onClick={() => setSlide(i)} className="h-7 w-8 hover:bg-gold/10">
                    <span className={`h-2 rounded-full transition-all ${slide === i ? "w-6 bg-gold" : "w-2 bg-muted-foreground/50"}`} />
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 overflow-hidden">
                <Volume2 className="w-5 h-5 text-accent shrink-0" />
                <div className="overflow-hidden flex-1">
                  <p className="whitespace-nowrap font-mono text-sm text-muted-foreground animate-ticker">Invest in USDT plans and earn daily returns! Complete daily tasks, invite friends and trade P2P safely on Cryptiva.</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Deposit", icon: ArrowDownCircle, onClick: () => setActiveTab("deposit") },
                  { label: "Withdraw", icon: ArrowUpCircle, onClick: () => setActiveTab("withdraw") },
                  { label: "Plans", icon: Layers, to: "/plans" },
                  { label: "Referral", icon: Users, to: "/referral" },
                ].map((a) => {
                  const inner = (
                    <>
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-secondary flex items-center justify-center">
                        <a.icon className="w-7 h-7 sm:w-9 sm:h-9 text-primary" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-foreground">{a.label}</span>
                    </>
                  );
                  return a.to ? (
                    <Link key={a.label} to={a.to} className="flex flex-col items-center gap-2">{inner}</Link>
                  ) : (
                    <button key={a.label} onClick={a.onClick} className="flex flex-col items-center gap-2">{inner}</button>
                  );
                })}
              </div>
              <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                <p className="text-xs sm:text-sm uppercase tracking-widest opacity-90">Account Balance</p>
                <p className="mt-2 text-4xl sm:text-5xl font-display font-bold">{walletBalance.toFixed(2)} <span className="text-lg sm:text-xl">USDT</span></p>
                <div className="mt-4 flex gap-6 text-sm opacity-90">
                  <span>Earned: {fmt(totalEarned)}</span>
                  <span>Plans: {activeInvestments.length}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                <p className="text-xs text-muted-foreground mt-2">An invoice number will be auto-generated for your deposit.</p>
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
              <p className="text-sm text-muted-foreground mb-2">
                Available: <span className="text-primary font-semibold">{fmt(walletBalance)}</span>
              </p>
              <p className="text-xs text-accent mb-6">⚠ A 10% withdrawal fee applies to every withdrawal.</p>

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

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-lg">
            <div className="glass-card p-6 mb-6">
              <h3 className="font-display font-semibold text-foreground mb-6">Your Profile</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{profile?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Referral Code</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-primary">{profile?.referral_code}</span>
                    <button onClick={() => copyAddress(profile?.referral_code || "")} className="text-primary hover:text-primary/80">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Preferred Currency</p>
                  <span className="text-sm font-semibold text-foreground">{profile?.preferred_currency || "RWF"}</span>
                </div>

                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Member Since</p>
                  <span className="text-sm text-foreground">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </div>

            {/* Edit Name */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Edit Profile</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editName.trim()) return;
                setEditingProfile(true);
                try {
                  const { error } = await supabase.from("profiles").update({ full_name: editName }).eq("user_id", user.id);
                  if (error) throw error;
                  toast({ title: "Profile updated!", description: "Your name has been changed." });
                  queryClient.invalidateQueries({ queryKey: ["profile"] });
                  setEditName("");
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                } finally {
                  setEditingProfile(false);
                }
              }} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Full Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={profile?.full_name || "Enter your name"}
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <Button type="submit" disabled={editingProfile} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  {editingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
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
