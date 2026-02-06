import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Users, DollarSign, TrendingUp, Activity,
  CheckCircle, XCircle, Eye, BarChart3, GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const stats = [
  { label: "Total Users", value: "10,234", icon: Users, change: "+12%" },
  { label: "Total Invested", value: "RWF 2.5B", icon: DollarSign, change: "+8.3%" },
  { label: "Active Plans", value: "3,421", icon: TrendingUp, change: "+15%" },
  { label: "Pending Deposits", value: "47", icon: Activity, change: "-3%" },
];

const mockUsers = [
  { id: 1, name: "Jean-Claude M.", email: "jean@mail.com", plan: "Gold", invested: "RWF 500,000", status: "active", referrals: 5 },
  { id: 2, name: "Grace U.", email: "grace@mail.com", plan: "Bronze", invested: "RWF 100,000", status: "active", referrals: 3 },
  { id: 3, name: "Patrick N.", email: "patrick@mail.com", plan: "Silver", invested: "RWF 250,000", status: "pending", referrals: 8 },
  { id: 4, name: "Claudine M.", email: "claudine@mail.com", plan: "Starter", invested: "RWF 50,000", status: "active", referrals: 1 },
  { id: 5, name: "Eric H.", email: "eric@mail.com", plan: "Gold", invested: "RWF 1,000,000", status: "suspended", referrals: 12 },
];

const mockDeposits = [
  { id: 1, user: "Jean-Claude M.", amount: "RWF 200,000", method: "MTN MoMo", status: "pending", date: "2026-02-05" },
  { id: 2, user: "Grace U.", amount: "RWF 50,000", method: "Airtel Money", status: "pending", date: "2026-02-05" },
  { id: 3, user: "Patrick N.", amount: "RWF 100,000", method: "Bank Transfer", status: "approved", date: "2026-02-04" },
  { id: 4, user: "Claudine M.", amount: "RWF 75,000", method: "MTN MoMo", status: "rejected", date: "2026-02-04" },
];

const referralStats = [
  { user: "Eric H.", directRefs: 12, levelA: "RWF 150,000", levelB: "RWF 45,000", levelC: "RWF 12,000", total: "RWF 207,000" },
  { user: "Patrick N.", directRefs: 8, levelA: "RWF 95,000", levelB: "RWF 28,000", levelC: "RWF 8,000", total: "RWF 131,000" },
  { user: "Jean-Claude M.", directRefs: 5, levelA: "RWF 62,000", levelB: "RWF 15,000", levelC: "RWF 4,000", total: "RWF 81,000" },
];

type Tab = "overview" | "users" | "deposits" | "referrals";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleDeposit = (id: number, action: "approve" | "reject") => {
    toast({
      title: action === "approve" ? "Deposit Approved" : "Deposit Rejected",
      description: `Deposit #${id} has been ${action}d.`,
    });
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "deposits", label: "Deposits", icon: DollarSign },
    { key: "referrals", label: "Referrals", icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users, deposits, and referral commissions.</p>
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

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <span className={`text-xs font-semibold ${stat.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Deposits */}
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">Recent Deposits</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("deposits")} className="text-primary text-xs">
                    View All
                  </Button>
                </div>
                <div className="divide-y divide-border/50">
                  {mockDeposits.slice(0, 3).map((d) => (
                    <div key={d.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.user}</p>
                        <p className="text-xs text-muted-foreground">{d.method} • {d.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{d.amount}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          d.status === "approved" ? "bg-primary/10 text-primary" :
                          d.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Referrers */}
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">Top Referrers</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("referrals")} className="text-primary text-xs">
                    View All
                  </Button>
                </div>
                <div className="divide-y divide-border/50">
                  {referralStats.map((r) => (
                    <div key={r.user} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.user}</p>
                        <p className="text-xs text-muted-foreground">{r.directRefs} direct referrals</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">{r.total}</p>
                    </div>
                  ))}
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
                      {["Name", "Email", "Plan", "Invested", "Referrals", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers
                      .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-foreground">{u.name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                        <td className="p-4">
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">{u.plan}</span>
                        </td>
                        <td className="p-4 text-sm text-foreground">{u.invested}</td>
                        <td className="p-4 text-sm text-foreground">{u.referrals}</td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            u.status === "active" ? "bg-primary/10 text-primary" :
                            u.status === "pending" ? "bg-warning/10 text-warning" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
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
                    {["User", "Amount", "Method", "Date", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockDeposits.map((d) => (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{d.user}</td>
                      <td className="p-4 text-sm text-foreground font-semibold">{d.amount}</td>
                      <td className="p-4 text-sm text-muted-foreground">{d.method}</td>
                      <td className="p-4 text-sm text-muted-foreground">{d.date}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          d.status === "approved" ? "bg-primary/10 text-primary" :
                          d.status === "rejected" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {d.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleDeposit(d.id, "approve")} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeposit(d.id, "reject")} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 text-xs">
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
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
                <h3 className="font-display font-semibold text-foreground">Referral Commission Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["User", "Direct Refs", "Level A (5%)", "Level B (3%)", "Level C (1%)", "Total Earned"].map((h) => (
                        <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referralStats.map((r) => (
                      <tr key={r.user} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-foreground">{r.user}</td>
                        <td className="p-4 text-sm text-foreground">{r.directRefs}</td>
                        <td className="p-4 text-sm text-primary">{r.levelA}</td>
                        <td className="p-4 text-sm text-primary/80">{r.levelB}</td>
                        <td className="p-4 text-sm text-primary/60">{r.levelC}</td>
                        <td className="p-4 text-sm font-bold text-foreground">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
