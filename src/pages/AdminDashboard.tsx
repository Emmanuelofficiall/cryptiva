import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import {
  Users, DollarSign, TrendingUp, Activity,
  CheckCircle, XCircle, BarChart3, GitBranch, Loader2, ShieldAlert,
  MessageCircle, Send, Shield, Settings, Plus, Trash2, ArrowLeftRight
} from "lucide-react";
import AdminP2PPanel from "@/components/AdminP2PPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

type Tab = "overview" | "users" | "deposits" | "withdrawals" | "referrals" | "chat" | "merchants" | "p2p-settings" | "p2p-orders";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) return false;
      return !!data;
    },
  });

  const { data: allProfiles } = useQuery({ queryKey: ["admin-profiles"], enabled: !!isAdmin, queryFn: async () => { const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: allDeposits, refetch: refetchDeposits } = useQuery({ queryKey: ["admin-deposits"], enabled: !!isAdmin, queryFn: async () => { const { data } = await supabase.from("deposits").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: allWithdrawals, refetch: refetchWithdrawals } = useQuery({ queryKey: ["admin-withdrawals"], enabled: !!isAdmin, queryFn: async () => { const { data } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: allInvestments } = useQuery({ queryKey: ["admin-investments"], enabled: !!isAdmin, queryFn: async () => { const { data } = await supabase.from("investments").select("*"); return data || []; } });
  const { data: allCommissions } = useQuery({ queryKey: ["admin-commissions"], enabled: !!isAdmin, queryFn: async () => { const { data } = await supabase.from("referral_commissions").select("*"); return data || []; } });
  const { data: merchants, refetch: refetchMerchants } = useQuery({ queryKey: ["admin-merchants"], enabled: !!isAdmin, queryFn: async () => { const { data } = await supabase.from("merchants").select("*").order("created_at", { ascending: false }); return data || []; } });
  const { data: p2pSettings, refetch: refetchP2P } = useQuery({ queryKey: ["admin-p2p-settings"], enabled: !!isAdmin, queryFn: async () => { const { data } = await supabase.from("p2p_settings").select("*").order("currency"); return data || []; } });

  if (authLoading || roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const totalUsers = allProfiles?.length || 0;
  const totalInvested = allInvestments?.reduce((s, i) => s + Number(i.amount), 0) || 0;
  const activeInvestments = allInvestments?.filter(i => i.status === "active").length || 0;
  const pendingDeposits = allDeposits?.filter(d => d.status === "pending").length || 0;
  const getProfileName = (userId: string) => { const p = allProfiles?.find(p => p.user_id === userId); return p?.full_name || p?.email || userId.slice(0, 8); };

  const handleDeposit = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase.from("deposits").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: action === "approved" ? "Deposit Approved" : "Deposit Rejected" }); refetchDeposits(); }
  };

  const handleWithdrawal = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase.from("withdrawals").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: action === "approved" ? "Withdrawal Approved" : "Withdrawal Rejected" }); refetchWithdrawals(); }
  };

  const stats = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users },
    { label: "Total Invested", value: `$${totalInvested.toLocaleString()}`, icon: DollarSign },
    { label: "Active Plans", value: activeInvestments.toLocaleString(), icon: TrendingUp },
    { label: "Pending Deposits", value: pendingDeposits.toLocaleString(), icon: Activity },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "deposits", label: "Deposits", icon: DollarSign },
    { key: "withdrawals", label: "Withdrawals", icon: Activity },
    { key: "referrals", label: "Referrals", icon: GitBranch },
    { key: "merchants", label: "Merchants", icon: Shield },
    { key: "p2p-settings", label: "P2P Prices", icon: Settings },
    { key: "p2p-orders", label: "P2P Orders", icon: ArrowLeftRight },
    { key: "chat", label: "Chat", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users, deposits, withdrawals, merchants, and P2P settings.</p>
        </div>

        <div className="flex gap-1 mb-8 bg-secondary rounded-xl p-1 w-full sm:w-fit overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="glass-card p-5">
                  <stat.icon className="w-5 h-5 text-primary mb-3" />
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">Recent Deposits</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("deposits")} className="text-primary text-xs">View All</Button>
                </div>
                <div className="divide-y divide-border/50">
                  {(allDeposits || []).slice(0, 4).map((d) => (
                    <div key={d.id} className="p-4 flex items-center justify-between">
                      <div><p className="text-sm font-medium text-foreground">{getProfileName(d.user_id)}</p><p className="text-xs text-muted-foreground">{d.method}</p></div>
                      <div className="text-right"><p className="text-sm font-semibold text-foreground">${Number(d.amount).toLocaleString()}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === "approved" ? "bg-primary/10 text-primary" : d.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{d.status}</span>
                      </div>
                    </div>
                  ))}
                  {(!allDeposits || allDeposits.length === 0) && <div className="p-6 text-center text-muted-foreground text-sm">No deposits yet</div>}
                </div>
              </div>
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">Recent Withdrawals</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("withdrawals")} className="text-primary text-xs">View All</Button>
                </div>
                <div className="divide-y divide-border/50">
                  {(allWithdrawals || []).slice(0, 4).map((w) => (
                    <div key={w.id} className="p-4 flex items-center justify-between">
                      <div><p className="text-sm font-medium text-foreground">{getProfileName(w.user_id)}</p><p className="text-xs text-muted-foreground">{w.method}</p></div>
                      <div className="text-right"><p className="text-sm font-semibold text-foreground">${Number(w.amount).toLocaleString()}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${w.status === "approved" ? "bg-primary/10 text-primary" : w.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{w.status}</span>
                      </div>
                    </div>
                  ))}
                  {(!allWithdrawals || allWithdrawals.length === 0) && <div className="p-6 text-center text-muted-foreground text-sm">No withdrawals yet</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="mb-6"><Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground" /></div>
            <div className="glass-card overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">{["Name", "Email", "Referral Code", "Wallet (USDT)", "Joined"].map((h) => <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>)}</tr></thead>
                <tbody>
                  {(allProfiles || []).filter((u) => (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{u.full_name || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="p-4 text-sm font-mono text-primary">{u.referral_code}</td>
                      <td className="p-4 text-sm text-foreground">${Number(u.wallet_balance || 0).toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(u.created_at!).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          </div>
        )}

        {activeTab === "deposits" && (
          <div className="glass-card overflow-hidden"><div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["User", "Amount", "Method", "Ref", "Date", "Status", "Actions"].map((h) => <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>)}</tr></thead>
              <tbody>
                {(allDeposits || []).map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{getProfileName(d.user_id)}</td>
                    <td className="p-4 text-sm text-foreground font-semibold">${Number(d.amount).toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{d.method}</td>
                    <td className="p-4 text-sm text-muted-foreground font-mono">{d.transaction_ref || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(d.created_at!).toLocaleDateString()}</td>
                    <td className="p-4"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${d.status === "approved" ? "bg-primary/10 text-primary" : d.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{d.status}</span></td>
                    <td className="p-4">{d.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleDeposit(d.id, "approved")} className="bg-primary text-primary-foreground h-8 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeposit(d.id, "rejected")} className="border-destructive text-destructive h-8 text-xs"><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
                {(!allDeposits || allDeposits.length === 0) && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No deposits</td></tr>}
              </tbody>
            </table>
          </div></div>
        )}

        {activeTab === "withdrawals" && (
          <div className="glass-card overflow-hidden"><div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["User", "Amount", "Method", "Destination", "Date", "Status", "Actions"].map((h) => <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>)}</tr></thead>
              <tbody>
                {(allWithdrawals || []).map((w) => (
                  <tr key={w.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{getProfileName(w.user_id)}</td>
                    <td className="p-4 text-sm text-foreground font-semibold">${Number(w.amount).toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{w.method}</td>
                    <td className="p-4 text-sm text-muted-foreground font-mono">{w.destination}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(w.created_at!).toLocaleDateString()}</td>
                    <td className="p-4"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${w.status === "approved" ? "bg-primary/10 text-primary" : w.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{w.status}</span></td>
                    <td className="p-4">{w.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleWithdrawal(w.id, "approved")} className="bg-primary text-primary-foreground h-8 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => handleWithdrawal(w.id, "rejected")} className="border-destructive text-destructive h-8 text-xs"><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
                {(!allWithdrawals || allWithdrawals.length === 0) && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No withdrawals</td></tr>}
              </tbody>
            </table>
          </div></div>
        )}

        {activeTab === "referrals" && (
          <div>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="glass-card p-5 text-center"><p className="text-sm text-muted-foreground mb-1">Level A</p><p className="text-3xl font-display font-bold text-primary">5%</p></div>
              <div className="glass-card p-5 text-center"><p className="text-sm text-muted-foreground mb-1">Level B</p><p className="text-3xl font-display font-bold text-accent">3%</p></div>
              <div className="glass-card p-5 text-center"><p className="text-sm text-muted-foreground mb-1">Level C</p><p className="text-3xl font-display font-bold text-muted-foreground">1%</p></div>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-border"><h3 className="font-display font-semibold text-foreground">All Referral Commissions</h3></div>
              <div className="overflow-x-auto"><table className="w-full">
                <thead><tr className="border-b border-border">{["Earner", "From User", "Level", "Rate", "Amount", "Date"].map((h) => <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>)}</tr></thead>
                <tbody>
                  {(allCommissions || []).map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{getProfileName(c.user_id)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{getProfileName(c.from_user_id)}</td>
                      <td className="p-4"><span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">Level {c.level}</span></td>
                      <td className="p-4 text-sm text-foreground">{c.rate}%</td>
                      <td className="p-4 text-sm text-primary font-semibold">${Number(c.amount).toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at!).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!allCommissions || allCommissions.length === 0) && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No commissions</td></tr>}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {activeTab === "merchants" && <MerchantsPanel profiles={allProfiles || []} merchants={merchants || []} refetch={refetchMerchants} />}
        {activeTab === "p2p-settings" && <P2PSettingsPanel settings={p2pSettings || []} refetch={refetchP2P} />}
        {activeTab === "p2p-orders" && <AdminP2PPanel profiles={allProfiles || []} />}
        {activeTab === "chat" && <AdminChatPanel />}
      </div>
    </div>
  );
};

// Merchants Management Panel
const MerchantsPanel = ({ profiles, merchants, refetch }: { profiles: any[]; merchants: any[]; refetch: () => void }) => {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  const addMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !displayName) return;
    setSubmitting(true);
    const { error } = await supabase.from("merchants").insert({ user_id: selectedUserId, display_name: displayName });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Merchant added!" }); setSelectedUserId(""); setDisplayName(""); refetch(); }
    setSubmitting(false);
  };

  const removeMerchant = async (id: string) => {
    await supabase.from("merchants").delete().eq("id", id);
    toast({ title: "Merchant removed" });
    refetch();
  };

  const handlePhotoUpload = async (merchantId: string, file: File) => {
    setUploadingPhoto(merchantId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${merchantId}.${ext}`;
      // Remove old photo if exists
      await supabase.storage.from("merchant-photos").remove([path]);
      const { error: uploadError } = await supabase.storage.from("merchant-photos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("merchant-photos").getPublicUrl(path);
      const { error: updateError } = await supabase.from("merchants").update({ photo_url: urlData.publicUrl }).eq("id", merchantId);
      if (updateError) throw updateError;
      toast({ title: "Photo uploaded!" });
      refetch();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const nonMerchantProfiles = profiles.filter(p => !merchants.some(m => m.user_id === p.user_id));

  return (
    <div>
      <div className="glass-card p-6 mb-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Add New Merchant</h3>
        <form onSubmit={addMerchant} className="flex flex-col sm:flex-row gap-3">
          <select value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); const p = profiles.find(p => p.user_id === e.target.value); setDisplayName(p?.full_name || ""); }}
            className="flex-1 rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
            <option value="">Select a user...</option>
            {nonMerchantProfiles.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name || p.email}</option>)}
          </select>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="sm:w-48 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
          <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" /> Add Merchant
          </Button>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border"><h3 className="font-display font-semibold text-foreground">Active Merchants</h3></div>
        {merchants.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No merchants yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {merchants.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.display_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Shield className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.display_name}</p>
                    <p className="text-xs text-muted-foreground">{m.user_id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(m.id, f); }}
                    />
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      {uploadingPhoto === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {m.photo_url ? "Change Photo" : "Upload Photo"}
                    </span>
                  </label>
                  <Button size="sm" variant="outline" onClick={() => removeMerchant(m.id)} className="border-destructive text-destructive h-8 text-xs"><Trash2 className="w-3 h-3 mr-1" />Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// P2P Price Settings Panel
const P2PSettingsPanel = ({ settings, refetch }: { settings: any[]; refetch: () => void }) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuyPrice, setEditBuyPrice] = useState("");
  const [editSellPrice, setEditSellPrice] = useState("");

  const updatePrices = async (id: string) => {
    const { error } = await supabase.from("p2p_settings").update({
      buy_price: Number(editBuyPrice),
      sell_price: Number(editSellPrice),
      usdt_price: Number(editBuyPrice),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Prices updated!" }); setEditingId(null); refetch(); }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-border"><h3 className="font-display font-semibold text-foreground">USDT Buy & Sell Prices Per Currency</h3></div>
      <div className="divide-y divide-border/50">
        {settings.map((s) => (
          <div key={s.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{s.currency}</p>
                <p className="text-xs text-muted-foreground">Last updated: {new Date(s.updated_at).toLocaleDateString()}</p>
              </div>
              {editingId !== s.id && (
                <Button size="sm" variant="outline" onClick={() => { setEditingId(s.id); setEditBuyPrice(String(s.buy_price || s.usdt_price)); setEditSellPrice(String(s.sell_price || s.usdt_price)); }} className="h-8 text-xs">Edit</Button>
              )}
            </div>
            {editingId === s.id ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-10">Buy:</Label>
                  <Input type="number" step="any" value={editBuyPrice} onChange={(e) => setEditBuyPrice(e.target.value)} className="w-32 bg-secondary border-border text-foreground text-sm h-8" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-10">Sell:</Label>
                  <Input type="number" step="any" value={editSellPrice} onChange={(e) => setEditSellPrice(e.target.value)} className="w-32 bg-secondary border-border text-foreground text-sm h-8" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updatePrices(s.id)} className="bg-primary text-primary-foreground h-8 text-xs">Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8 text-xs">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 mt-1">
                <span className="text-sm"><span className="text-muted-foreground">Buy:</span> <span className="font-bold text-green-400">{Number(s.buy_price || s.usdt_price).toLocaleString()}</span></span>
                <span className="text-sm"><span className="text-muted-foreground">Sell:</span> <span className="font-bold text-red-400">{Number(s.sell_price || s.usdt_price).toLocaleString()}</span></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Admin Chat Panel
const AdminChatPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: chatUsers } = useQuery({
    queryKey: ["admin-chat-users"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_messages").select("user_id, sender_name").order("created_at", { ascending: false });
      const unique = new Map<string, string>();
      (data || []).forEach((m) => { if (!unique.has(m.user_id)) unique.set(m.user_id, m.sender_name || m.user_id.slice(0, 8)); });
      return Array.from(unique.entries()).map(([id, name]) => ({ user_id: id, name }));
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-chat-messages", selectedUserId],
    enabled: !!selectedUserId,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("user_id", selectedUserId!).order("created_at", { ascending: true });
      return data || [];
    },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedUserId || !user) return;
    setSending(true);
    await supabase.from("chat_messages").insert({ user_id: selectedUserId, message: replyMessage.trim(), sender_role: "admin", sender_name: "Admin" });
    setReplyMessage("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["admin-chat-messages", selectedUserId] });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6" style={{ minHeight: "500px" }}>
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-display font-semibold text-foreground text-sm">Conversations</h3></div>
        <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
          {(chatUsers || []).map((cu) => (
            <button key={cu.user_id} onClick={() => setSelectedUserId(cu.user_id)}
              className={`w-full text-left p-4 text-sm transition-colors ${selectedUserId === cu.user_id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              <MessageCircle className="w-4 h-4 inline mr-2" />{cu.name}
            </button>
          ))}
          {(!chatUsers || chatUsers.length === 0) && <div className="p-6 text-center text-muted-foreground text-sm">No conversations yet</div>}
        </div>
      </div>
      <div className="lg:col-span-2 glass-card flex flex-col overflow-hidden">
        {selectedUserId ? (
          <>
            <div className="p-4 border-b border-border"><h3 className="font-display font-semibold text-foreground text-sm">Chat with {chatUsers?.find((u) => u.user_id === selectedUserId)?.name}</h3></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
              {messages?.map((m) => (
                <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.sender_role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {m.message}
                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendReply} className="p-3 border-t border-border flex gap-2">
              <Input value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type a reply..." className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground" />
              <Button type="submit" size="sm" disabled={sending} className="bg-primary text-primary-foreground shrink-0">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
