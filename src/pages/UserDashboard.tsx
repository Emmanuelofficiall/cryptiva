import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentProofButton from "@/components/PaymentProofButton";
import { validatePaymentProof } from "@/lib/payment-proof";
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

const DEPOSIT_NETWORKS = {
  "TRC20 USDT": {
    name: "TRC20 USDT",
    network: "TRON (TRC20)",
    badge: "TRC20",
    address: "TKNVnSnUzztwsQ43H5zyk9d5KVJfMCP9nJ",
    warning: "⚠ Only send USDT via TRC20 network. Transferring any other cryptocurrency or using another network may result in permanent loss.",
    hint: "TRON network (TRC20)",
  },
  "BEP20 USDT": {
    name: "BEP20 USDT",
    network: "BNB Smart Chain (BEP20)",
    badge: "BEP20",
    address: "0xf602d3039a4a8cc080e3ecebb755343b97919ca3",
    warning: "⚠ Only send USDT via BEP20 (BNB Smart Chain) network. Transferring any other cryptocurrency or using another network may result in permanent loss.",
    hint: "BNB Smart Chain (BSC)",
  },
} as const;

type DepositNetworkKey = keyof typeof DEPOSIT_NETWORKS;
type WithdrawMethodKey = "TRC20 USDT" | "BEP20 USDT";
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
  const [depositMethod, setDepositMethod] = useState<DepositNetworkKey>("TRC20 USDT");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [proofInputKey, setProofInputKey] = useState(0);
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDest, setWithdrawDest] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethodKey>("TRC20 USDT");
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const proofError = validatePaymentProof(depositProof);
    if (proofError || !depositProof) {
      toast({ title: "Payment proof required", description: proofError || undefined, variant: "destructive" });
      return;
    }
    if (!Number.isFinite(Number(depositAmount)) || Number(depositAmount) <= 0) return;
    setSubmitting(true);
    let uploadedPath: string | null = null;
    try {
      const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[depositProof.type];
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, depositProof, { contentType: depositProof.type });
      if (uploadError) throw uploadError;
      uploadedPath = path;
      const { data, error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: Number(depositAmount),
        method: depositMethod,
        proof_path: path,
        currency: "USDT",
      }).select("invoice_number").single();
      if (error) throw error;
      uploadedPath = null;
      toast({ title: "Deposit submitted!", description: `Invoice: ${data.invoice_number} (${depositMethod}). Pending admin approval.` });
      setDepositAmount("");
      setDepositProof(null);
      setProofInputKey(k => k + 1);
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err: any) {
      if (uploadedPath) await supabase.storage.from("payment-proofs").remove([uploadedPath]);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || amt <= 0) return;
    const fee = Number((amt * 0.1).toFixed(2)); // 10% fee taken from the requested amount
    const netAmount = Number((amt - fee).toFixed(2)); // what actually arrives at the address
    if (amt > walletBalance) {
      toast({ title: "Insufficient balance", description: `You need at least $${amt.toFixed(2)} USDT in your wallet.`, variant: "destructive" });
      return;
    }
    const cleanDest = withdrawDest.trim();
    if (!cleanDest) {
      toast({ title: "Address required", description: "Please enter your destination wallet address.", variant: "destructive" });
      return;
    }
    if (withdrawMethod === "TRC20 USDT" && !cleanDest.startsWith("T")) {
      toast({ title: "Invalid TRC20 address", description: "TRC20 USDT addresses must start with 'T'.", variant: "destructive" });
      return;
    }
    if (withdrawMethod === "BEP20 USDT" && !cleanDest.startsWith("0x")) {
      toast({ title: "Invalid BEP20 address", description: "BEP20 USDT addresses must start with '0x'.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Deduct only the requested amount; the fee comes out of it (user receives net)
      const { error: balError } = await supabase.from("profiles").update({ wallet_balance: walletBalance - amt }).eq("user_id", user.id);
      if (balError) throw balError;

      const { error } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: amt,
        method: withdrawMethod,
        destination: cleanDest,
      });
      if (error) {
        // Rollback balance if insert fails
        await supabase.from("profiles").update({ wallet_balance: walletBalance }).eq("user_id", user.id);
        throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Withdrawal requested!", description: `$${amt.toFixed(2)} USDT deducted — $${fee.toFixed(2)} fee, $${netAmount.toFixed(2)} will arrive at your ${withdrawMethod} address. Pending admin approval.` });
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

              {/* Network Selector */}
              <div className="mb-4">
                <Label className="text-foreground text-sm mb-2 block">Select Deposit Network</Label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(DEPOSIT_NETWORKS) as DepositNetworkKey[]).map((key) => {
                    const item = DEPOSIT_NETWORKS[key];
                    const active = depositMethod === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDepositMethod(key)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                            : "border-border bg-secondary/70 hover:border-border/80 text-foreground"
                        }`}
                      >
                        <div className="font-semibold text-sm flex items-center justify-between">
                          <span>{item.name}</span>
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              active
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{item.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deposit Address Card */}
              <div className="bg-secondary rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {DEPOSIT_NETWORKS[depositMethod].name} Address
                  </p>
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {DEPOSIT_NETWORKS[depositMethod].network}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-foreground font-mono break-all flex-1 select-all">
                    {DEPOSIT_NETWORKS[depositMethod].address}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyAddress(DEPOSIT_NETWORKS[depositMethod].address)}
                    className="border-border hover:bg-primary hover:text-primary-foreground shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-destructive mt-2">
                  {DEPOSIT_NETWORKS[depositMethod].warning}
                </p>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount in USDT"
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deposit-proof">Payment proof</Label>
                  <Input
                    key={proofInputKey}
                    id="deposit-proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={submitting}
                    required
                    className="mt-2 h-auto bg-secondary"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      const error = validatePaymentProof(file);
                      if (error) {
                        setDepositProof(null);
                        e.target.value = "";
                        toast({ title: "Invalid proof", description: error, variant: "destructive" });
                      } else {
                        setDepositProof(file);
                      }
                    }}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, WebP or PDF · Maximum 5 MB</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  An invoice number will be auto-generated for your deposit via {depositMethod}.
                </p>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Deposit ({depositMethod})
                </Button>
              </form>
            </div>
            <h3 className="mb-3 font-semibold">Deposit history</h3>
            <div className="divide-y divide-border">
              {(deposits || []).map((d) => (
                <div key={d.id} className="space-y-2 py-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <strong>
                      {Number(d.amount).toFixed(2)} USDT
                      <span className="ml-2 text-xs font-normal text-muted-foreground">({d.method})</span>
                    </strong>
                    <span className="capitalize text-muted-foreground">{d.status}</span>
                  </div>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {d.invoice_number || d.transaction_ref}
                  </p>
                  <PaymentProofButton path={d.proof_path} />
                </div>
              ))}
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
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                  {withdrawAmount && Number(withdrawAmount) > 0 && (
                    <div className="mt-2 rounded-lg bg-primary/10 border border-primary/30 p-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">You will receive</span>
                      <span className="text-sm font-bold text-primary">
                        ${(Number(withdrawAmount) - Number((Number(withdrawAmount) * 0.1).toFixed(2))).toFixed(2)} USDT
                      </span>
                      <span className="text-xs text-muted-foreground">
                        10% fee: ${Number((Number(withdrawAmount) * 0.1).toFixed(2)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-foreground text-sm">Withdrawal Method / Network</Label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value as WithdrawMethodKey)}
                    className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm"
                  >
                    <option value="TRC20 USDT">TRC20 USDT (TRON Network)</option>
                    <option value="BEP20 USDT">BEP20 USDT (BNB Smart Chain)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-foreground text-sm">
                    {withdrawMethod === "BEP20 USDT" ? "BEP20 Wallet Address" : "TRC20 Wallet Address"}
                  </Label>
                  <Input
                    value={withdrawDest}
                    onChange={(e) => setWithdrawDest(e.target.value)}
                    placeholder={
                      withdrawMethod === "BEP20 USDT"
                        ? "Enter your BEP20 address (starts with 0x...)"
                        : "Enter your TRC20 address (starts with T...)"
                    }
                    className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {withdrawMethod === "BEP20 USDT"
                      ? "Make sure your receiving wallet supports USDT on BNB Smart Chain (BEP20)."
                      : "Make sure your receiving wallet supports USDT on TRON (TRC20)."}
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Request Withdrawal ({withdrawMethod})
                </Button>
              </form>
            </div>

            <h3 className="mt-8 mb-3 font-semibold text-foreground">Withdrawal history</h3>
            <div className="divide-y divide-border">
              {(!withdrawals || withdrawals.length === 0) ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No withdrawals yet</div>
              ) : (
                withdrawals.map((w) => (
                  <div key={w.id} className="space-y-1.5 py-4">
                    <div className="flex justify-between gap-3 text-sm">
                      <strong>
                        ${Number(w.amount).toFixed(2)} USDT
                        <span className="ml-2 text-xs font-normal text-muted-foreground">({w.method})</span>
                      </strong>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          w.status === "approved"
                            ? "bg-primary/10 text-primary"
                            : w.status === "rejected"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <span className="truncate max-w-xs">{w.destination}</span>
                      <button
                        onClick={() => copyAddress(w.destination)}
                        title="Copy address"
                        className="text-primary hover:text-primary/80 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
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
