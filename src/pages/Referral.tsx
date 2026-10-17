import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Copy, TrendingUp, Gift, Loader2, Share2, UserPlus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { referralRewardProgress } from "@/lib/referral-rewards";

const levels = [
  { level: "A", label: "Direct Referral", rate: "5%", color: "text-primary", desc: "Earn 5% commission on every investment made by people you directly invite." },
  { level: "B", label: "2nd Level", rate: "3%", color: "text-accent", desc: "Earn 3% commission on investments made by your referrals' referrals." },
  { level: "C", label: "3rd Level", rate: "1%", color: "text-muted-foreground", desc: "Earn 1% commission from the third tier of your referral network." },
];

const Referral = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: qualificationCount, isPending: rewardsLoading, error: rewardsError } = useQuery({
    queryKey: ["referral-qualifications", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase.from("referral_qualifications").select("referred_user_id", { count: "exact", head: true }).eq("referrer_user_id", user.id);
      if (error) throw error;
      return count || 0;
    },
  });
  const { data: rewards, error: rewardHistoryError } = useQuery({
    queryKey: ["referral-rewards", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("referral_rewards").select("*").eq("user_id", user.id).order("milestone", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ["commissions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("referral_commissions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch referral network: users who were referred by this user (Level A)
  const { data: directReferrals } = useQuery({
    queryKey: ["direct-referrals", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, created_at, user_id").eq("referred_by", profile!.id);
      if (error) throw error;
      return data || [];
    },
  });

  // Level B referrals: users referred by Level A users
  const { data: levelBReferrals } = useQuery({
    queryKey: ["level-b-referrals", directReferrals?.map((r) => r.id)],
    enabled: !!directReferrals && directReferrals.length > 0,
    queryFn: async () => {
      const ids = directReferrals!.map((r) => r.id);
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, created_at, referred_by").in("referred_by", ids);
      if (error) throw error;
      return data || [];
    },
  });

  // Level C referrals
  const { data: levelCReferrals } = useQuery({
    queryKey: ["level-c-referrals", levelBReferrals?.map((r) => r.id)],
    enabled: !!levelBReferrals && levelBReferrals.length > 0,
    queryFn: async () => {
      const ids = levelBReferrals!.map((r) => r.id);
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, created_at, referred_by").in("referred_by", ids);
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
  const bonusEarnings = rewards?.reduce((s, reward) => s + Number(reward.amount), 0) || 0;
  const totalEarnings = (commissions?.reduce((s, c) => s + Number(c.amount), 0) || 0) + bonusEarnings;
  const rewardProgress = referralRewardProgress(qualificationCount || 0);
  const levelAEarnings = commissions?.filter((c) => c.level === "A").reduce((s, c) => s + Number(c.amount), 0) || 0;
  const levelBEarnings = commissions?.filter((c) => c.level === "B").reduce((s, c) => s + Number(c.amount), 0) || 0;
  const levelCEarnings = commissions?.filter((c) => c.level === "C").reduce((s, c) => s + Number(c.amount), 0) || 0;
  const totalReferrals = (directReferrals?.length || 0) + (levelBReferrals?.length || 0) + (levelCReferrals?.length || 0);
  const pendingCommissions = commissions?.length || 0;

  const copyCode = () => { navigator.clipboard.writeText(referralCode); toast({ title: "Copied!", description: "Referral code copied." }); };
  const copyLink = () => { navigator.clipboard.writeText(referralLink); toast({ title: "Copied!", description: "Referral link copied." }); };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join Cryptiva and start earning! Use my referral code: ${referralCode}\n${referralLink}`)}`, "_blank");
  };
  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Join Cryptiva and start earning! Use my referral code: ${referralCode}`)}`, "_blank");
  };
  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Cryptiva and start earning! Use my referral code: ${referralCode} ${referralLink}`)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Referral Program</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Earn More by <span className="text-gradient">Inviting Friends</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">Share your referral code and earn commissions on 3 levels.</p>
        </div>

        <section aria-label="Referral milestone reward" className="border-y border-gold/30 py-6 mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold flex items-center gap-2"><Gift className="w-6 h-6 text-gold" />100 USDT Referral Reward</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">Earn 100 USDT for every 15 different friends you directly invite who purchase Solana ($60) or a higher-priced plan. Each friend counts once; rewards repeat at 15, 30, 45 and beyond.</p>
            </div>
            <div><p className="text-xs text-muted-foreground">Bonuses credited to wallet</p><p className="text-2xl font-bold text-gold">{bonusEarnings.toLocaleString()} USDT</p></div>
          </div>
          {rewardsError || rewardHistoryError ? <p role="alert" className="text-sm text-destructive mt-4">Unable to load reward progress. Please try again.</p> : rewardsLoading ? <Loader2 aria-label="Loading reward progress" className="w-5 h-5 animate-spin mt-4 text-gold" /> : <>
            <div className="flex flex-wrap justify-between gap-2 text-sm mt-5 mb-2"><span>{qualificationCount || 0} qualifying friends</span><span className="text-gold">{rewardProgress.remaining} more for your next 100 USDT</span></div>
            <div role="progressbar" aria-label="Next referral bonus" aria-valuemin={0} aria-valuemax={15} aria-valuenow={rewardProgress.currentBatch} className="grid grid-cols-15 gap-1 h-2">
              {Array.from({ length: 15 }, (_, i) => <span key={i} className={`rounded-sm ${i < rewardProgress.currentBatch ? "bg-gold" : "bg-secondary"}`} />)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Next reward at {rewardProgress.nextMilestone} qualifying friends · Automatically added to your wallet</p>
          </>}
          {(rewards || []).length > 0 && <div className="mt-4 divide-y divide-border">{rewards?.slice(0, 5).map((reward) => <div key={reward.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{reward.milestone} qualifying friends · {new Date(reward.created_at).toLocaleDateString()}</span><span className="text-gold font-semibold">+100 USDT credited</span></div>)}</div>}
        </section>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Users, label: "Total Referrals", value: totalReferrals.toString(), color: "text-primary" },
            { icon: DollarSign, label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, color: "text-accent" },
            { icon: UserPlus, label: "Direct Referrals", value: (directReferrals?.length || 0).toString(), color: "text-primary" },
            { icon: TrendingUp, label: "Commissions", value: pendingCommissions.toString(), color: "text-accent" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 text-center">
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Referral Code & Link + Share Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 max-w-lg mx-auto text-center mb-10 glow-green">
          <Gift className="w-10 h-10 text-accent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-2xl font-mono font-bold text-foreground tracking-wider">{referralCode}</span>
            <Button size="sm" variant="outline" onClick={copyCode} className="border-border hover:bg-primary hover:text-primary-foreground"><Copy className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-3 mb-4">
            <code className="text-xs text-foreground font-mono break-all flex-1">{referralLink}</code>
            <Button size="sm" variant="outline" onClick={copyLink} className="border-border hover:bg-primary hover:text-primary-foreground shrink-0"><Copy className="w-4 h-4" /></Button>
          </div>

          {/* Share buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" onClick={shareWhatsApp} className="bg-[hsl(142,70%,45%)] text-white hover:bg-[hsl(142,70%,40%)] gap-2 text-xs">
              <Share2 className="w-3 h-3" /> WhatsApp
            </Button>
            <Button size="sm" onClick={shareTelegram} className="bg-[hsl(200,80%,50%)] text-white hover:bg-[hsl(200,80%,45%)] gap-2 text-xs">
              <Share2 className="w-3 h-3" /> Telegram
            </Button>
            <Button size="sm" onClick={shareTwitter} className="bg-[hsl(210,10%,20%)] text-white hover:bg-[hsl(210,10%,15%)] gap-2 text-xs">
              <Share2 className="w-3 h-3" /> X / Twitter
            </Button>
          </div>
        </motion.div>

        {/* Commission Levels */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {levels.map((l, i) => (
            <motion.div key={l.level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-display font-bold text-primary">L{l.level}</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-1">{l.label}</h3>
              <p className={`text-4xl font-display font-bold ${l.color} mb-2`}>{l.rate}</p>
              <p className="text-sm text-muted-foreground">{l.desc}</p>
              <p className="text-xs text-primary mt-2 font-semibold">
                Earned: ${l.level === "A" ? levelAEarnings.toLocaleString() : l.level === "B" ? levelBEarnings.toLocaleString() : levelCEarnings.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Referral Network Tree */}
        <div className="glass-card overflow-hidden mb-10">
          <div className="p-5 border-b border-border">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Your Referral Network
            </h3>
          </div>
          <div className="p-5 space-y-6">
            {/* Level A */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">Level A — Direct ({directReferrals?.length || 0})</span>
              </div>
              {(!directReferrals || directReferrals.length === 0) ? (
                <p className="text-sm text-muted-foreground ml-4">No direct referrals yet. Share your code to start building your network!</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-4">
                  {directReferrals.map((r) => (
                    <div key={r.id} className="bg-secondary rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at!).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Level B */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent">Level B — 2nd Tier ({levelBReferrals?.length || 0})</span>
              </div>
              {(!levelBReferrals || levelBReferrals.length === 0) ? (
                <p className="text-sm text-muted-foreground ml-4">No 2nd level referrals yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-4">
                  {levelBReferrals.map((r) => (
                    <div key={r.id} className="bg-secondary rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at!).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Level C */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-muted-foreground">Level C — 3rd Tier ({levelCReferrals?.length || 0})</span>
              </div>
              {(!levelCReferrals || levelCReferrals.length === 0) ? (
                <p className="text-sm text-muted-foreground ml-4">No 3rd level referrals yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-4">
                  {levelCReferrals.map((r) => (
                    <div key={r.id} className="bg-secondary rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at!).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
                    <td className="p-4"><span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">Level {c.level}</span></td>
                    <td className="p-4 text-sm text-foreground">{c.rate}%</td>
                    <td className="p-4 text-sm text-primary font-semibold">${Number(c.amount).toLocaleString()} USDT</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at!).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No commissions yet. Share your referral code to start earning!</td></tr>
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
