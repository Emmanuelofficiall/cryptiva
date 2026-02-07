import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import {
  Users, DollarSign, TrendingUp, Activity,
  CheckCircle, XCircle, Eye, BarChart3, GitBranch, Loader2, ShieldAlert,
  MessageCircle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

type Tab = "overview" | "users" | "deposits" | "withdrawals" | "referrals" | "chat";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });

  const { data: allProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allDeposits, refetch: refetchDeposits } = useQuery({
    queryKey: ["admin-deposits"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allWithdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["admin-withdrawals"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allInvestments } = useQuery({
    queryKey: ["admin-investments"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("investments").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allCommissions } = useQuery({
    queryKey: ["admin-commissions"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("referral_commissions").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex flex-col items-center justify-center text-center px-4">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const totalUsers = allProfiles?.length || 0;
  const totalInvested = allInvestments?.reduce((s, i) => s + Number(i.amount), 0) || 0;
  const activeInvestments = allInvestments?.filter(i => i.status === "active").length || 0;
  const pendingDeposits = allDeposits?.filter(d => d.status === "pending").length || 0;

  const getProfileName = (userId: string) => {
    const p = allProfiles?.find(p => p.user_id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8);
  };

  const handleDeposit = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("deposits")
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "approved" ? "Deposit Approved" : "Deposit Rejected" });
      refetchDeposits();
    }
  };

  const handleWithdrawal = async (id: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("withdrawals")
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "approved" ? "Withdrawal Approved" : "Withdrawal Rejected" });
      refetchWithdrawals();
    }
  };

  const stats = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users, change: `${totalUsers}` },
    { label: "Total Invested", value: `RWF ${totalInvested.toLocaleString()}`, icon: DollarSign, change: "" },
    { label: "Active Plans", value: activeInvestments.toLocaleString(), icon: TrendingUp, change: "" },
    { label: "Pending Deposits", value: pendingDeposits.toLocaleString(), icon: Activity, change: "" },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "deposits", label: "Deposits", icon: DollarSign },
    { key: "withdrawals", label: "Withdrawals", icon: Activity },
    { key: "referrals", label: "Referrals", icon: GitBranch },
    { key: "chat", label: "Chat", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users, deposits, withdrawals and referrals.</p>
        </div>

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

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
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
                      <div>
                        <p className="text-sm font-medium text-foreground">{getProfileName(d.user_id)}</p>
                        <p className="text-xs text-muted-foreground">{d.method} • {new Date(d.created_at!).toLocaleDateString()}</p>
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
                  {(!allDeposits || allDeposits.length === 0) && (
                    <div className="p-6 text-center text-muted-foreground text-sm">No deposits yet</div>
                  )}
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
                      <div>
                        <p className="text-sm font-medium text-foreground">{getProfileName(w.user_id)}</p>
                        <p className="text-xs text-muted-foreground">{w.method} • {new Date(w.created_at!).toLocaleDateString()}</p>
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
                  {(!allWithdrawals || allWithdrawals.length === 0) && (
                    <div className="p-6 text-center text-muted-foreground text-sm">No withdrawals yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="mb-6">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Name", "Email", "Referral Code", "Wallet Balance", "Joined"].map((h) => (
                        <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(allProfiles || [])
                      .filter((u) =>
                        (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-foreground">{u.full_name || "—"}</td>
                        <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                        <td className="p-4 text-sm font-mono text-primary">{u.referral_code}</td>
                        <td className="p-4 text-sm text-foreground">RWF {Number(u.wallet_balance || 0).toLocaleString()}</td>
                        <td className="p-4 text-sm text-muted-foreground">{new Date(u.created_at!).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === "deposits" && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["User", "Amount", "Method", "Ref", "Date", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(allDeposits || []).map((d) => (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{getProfileName(d.user_id)}</td>
                      <td className="p-4 text-sm text-foreground font-semibold">{d.currency} {Number(d.amount).toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{d.method}</td>
                      <td className="p-4 text-sm text-muted-foreground font-mono">{d.transaction_ref || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(d.created_at!).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          d.status === "approved" ? "bg-primary/10 text-primary" :
                          d.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }`}>{d.status}</span>
                      </td>
                      <td className="p-4">
                        {d.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleDeposit(d.id, "approved")} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeposit(d.id, "rejected")} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 text-xs">
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!allDeposits || allDeposits.length === 0) && (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No deposits yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === "withdrawals" && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["User", "Amount", "Method", "Destination", "Date", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(allWithdrawals || []).map((w) => (
                    <tr key={w.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{getProfileName(w.user_id)}</td>
                      <td className="p-4 text-sm text-foreground font-semibold">RWF {Number(w.amount).toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{w.method}</td>
                      <td className="p-4 text-sm text-muted-foreground font-mono">{w.destination}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(w.created_at!).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          w.status === "approved" ? "bg-primary/10 text-primary" :
                          w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }`}>{w.status}</span>
                      </td>
                      <td className="p-4">
                        {w.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleWithdrawal(w.id, "approved")} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleWithdrawal(w.id, "rejected")} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 text-xs">
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!allWithdrawals || allWithdrawals.length === 0) && (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No withdrawals yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <div>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Level A Commission</p>
                <p className="text-3xl font-display font-bold text-primary">5%</p>
                <p className="text-xs text-muted-foreground">Direct referrals</p>
              </div>
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Level B Commission</p>
                <p className="text-3xl font-display font-bold text-primary/80">3%</p>
                <p className="text-xs text-muted-foreground">2nd level</p>
              </div>
              <div className="glass-card p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">Level C Commission</p>
                <p className="text-3xl font-display font-bold text-primary/60">1%</p>
                <p className="text-xs text-muted-foreground">3rd level</p>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">All Referral Commissions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Earner", "From User", "Level", "Rate", "Amount", "Date"].map((h) => (
                        <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(allCommissions || []).map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-foreground">{getProfileName(c.user_id)}</td>
                        <td className="p-4 text-sm text-muted-foreground">{getProfileName(c.from_user_id)}</td>
                        <td className="p-4">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">Level {c.level}</span>
                        </td>
                        <td className="p-4 text-sm text-foreground">{c.rate}%</td>
                        <td className="p-4 text-sm text-primary font-semibold">RWF {Number(c.amount).toLocaleString()}</td>
                        <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at!).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!allCommissions || allCommissions.length === 0) && (
                      <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No referral commissions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && <AdminChatPanel />}
      </div>
    </div>
  );
};

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
      const { data, error } = await supabase
        .from("chat_messages")
        .select("user_id, sender_name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const unique = new Map<string, string>();
      (data || []).forEach((m) => {
        if (!unique.has(m.user_id)) unique.set(m.user_id, m.sender_name || m.user_id.slice(0, 8));
      });
      return Array.from(unique.entries()).map(([id, name]) => ({ user_id: id, name }));
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-chat-messages", selectedUserId],
    enabled: !!selectedUserId,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", selectedUserId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedUserId || !user) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      user_id: selectedUserId,
      message: replyMessage.trim(),
      sender_role: "admin",
      sender_name: "Admin",
    });
    setReplyMessage("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["admin-chat-messages", selectedUserId] });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6" style={{ minHeight: "500px" }}>
      {/* User list */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold text-foreground text-sm">Conversations</h3>
        </div>
        <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
          {(chatUsers || []).map((cu) => (
            <button
              key={cu.user_id}
              onClick={() => setSelectedUserId(cu.user_id)}
              className={`w-full text-left p-4 text-sm transition-colors ${
                selectedUserId === cu.user_id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              {cu.name}
            </button>
          ))}
          {(!chatUsers || chatUsers.length === 0) && (
            <div className="p-6 text-center text-muted-foreground text-sm">No conversations yet</div>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <div className="lg:col-span-2 glass-card flex flex-col overflow-hidden">
        {selectedUserId ? (
          <>
            <div className="p-4 border-b border-border">
              <h3 className="font-display font-semibold text-foreground text-sm">
                Chat with {chatUsers?.find((u) => u.user_id === selectedUserId)?.name}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
              {messages?.map((m) => (
                <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    m.sender_role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}>
                    {m.message}
                    <p className="text-[10px] opacity-60 mt-1">
                      {new Date(m.created_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendReply} className="p-3 border-t border-border flex gap-2">
              <Input
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type a reply..."
                className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground"
              />
              <Button type="submit" size="sm" disabled={sending} className="bg-primary text-primary-foreground shrink-0">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
