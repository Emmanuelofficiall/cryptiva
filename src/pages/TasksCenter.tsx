import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import { CheckCircle, Clock, Loader2, Gift, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import CandlestickChart from "@/components/CandlestickChart";

const exchanges = [
  { name: "BTC/USDT", icon: "₿", buy: 67842.50, sell: 67838.20 },
  { name: "ETH/USDT", icon: "Ξ", buy: 3456.10, sell: 3454.80 },
  { name: "BNB/USDT", icon: "◆", buy: 612.35, sell: 611.90 },
  { name: "SOL/USDT", icon: "◎", buy: 178.22, sell: 178.05 },
  { name: "XRP/USDT", icon: "✕", buy: 2.34, sell: 2.33 },
];

const TasksCenter = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [claimedExchanges, setClaimedExchanges] = useState<Set<string>>(new Set());

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["user-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_tasks").select("*").eq("user_id", user!.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
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

  // Calculate daily income from active plans
  const activeInvestments = investments?.filter((i) => i.status === "active") || [];
  const totalDailyIncome = activeInvestments.reduce((sum, inv) => {
    return sum + (Number(inv.amount) * Number(inv.daily_rate) / 100);
  }, 0);
  // Split daily income across 5 exchanges
  const perExchangeReward = activeInvestments.length > 0 ? totalDailyIncome / exchanges.length : 0;

  // Load today's claimed exchanges
  useEffect(() => {
    if (!tasks) return;
    const today = new Date().toISOString().split("T")[0];
    const claimed = new Set<string>();
    tasks.forEach((t) => {
      if (t.task_type === "exchange" && t.status === "completed" && t.completed_at?.split("T")[0] === today) {
        claimed.add(t.title);
      }
    });
    setClaimedExchanges(claimed);
  }, [tasks]);

  // Auto-initialize exchange tasks
  useEffect(() => {
    if (!user || tasksLoading || tasks === undefined) return;

    const init = async () => {
      const today = new Date().toISOString().split("T")[0];
      const exchangeTasks = tasks.filter((t) => t.task_type === "exchange");

      // Reset yesterday's tasks
      const toReset = exchangeTasks.filter(
        (t) => t.status === "completed" && t.completed_at && t.completed_at.split("T")[0] !== today
      );
      if (toReset.length > 0) {
        for (const task of toReset) {
          await supabase.from("user_tasks").update({ status: "pending", completed_at: null }).eq("id", task.id);
        }
        queryClient.invalidateQueries({ queryKey: ["user-tasks", user.id] });
        return;
      }

      if (exchangeTasks.length === 0) {
        const inserts = exchanges.map((e) => ({
          user_id: user.id,
          title: e.name,
          description: `Trade ${e.name} to earn daily reward`,
          reward: 0,
          task_type: "exchange",
          status: "pending",
        }));
        await supabase.from("user_tasks").insert(inserts);
        queryClient.invalidateQueries({ queryKey: ["user-tasks", user.id] });
      }
    };

    init();
  }, [user, tasks, tasksLoading, queryClient]);

  const claimExchange = async (exchangeName: string, action: "buy" | "sell") => {
    if (claimedExchanges.has(exchangeName)) return;

    if (activeInvestments.length === 0) {
      toast({ title: "No Active Plan", description: "You need to purchase a plan first to earn daily income from tasks.", variant: "destructive" });
      return;
    }

    const task = tasks?.find((t) => t.task_type === "exchange" && t.title === exchangeName && t.status === "pending");
    if (!task) return;

    const reward = perExchangeReward;

    const { error } = await supabase.from("user_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString(), reward, description: `${action.toUpperCase()} ${exchangeName}` })
      .eq("id", task.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Credit to wallet
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user!.id).single();
    if (profile) {
      await supabase.from("profiles").update({ wallet_balance: Number(profile.wallet_balance || 0) + reward }).eq("user_id", user!.id);
    }

    const newClaimed = new Set(claimedExchanges).add(exchangeName);
    setClaimedExchanges(newClaimed);

    // Check if all exchanges are now claimed — record daily earning
    if (newClaimed.size === exchanges.length) {
      await supabase.from("daily_earnings").insert({
        user_id: user!.id,
        amount: totalDailyIncome,
        investment_id: activeInvestments[0]?.id || null,
      });
      // Update total_earned on investments
      for (const inv of activeInvestments) {
        const invReward = (Number(inv.amount) * Number(inv.daily_rate) / 100);
        await supabase.from("investments").update({ total_earned: Number(inv.total_earned || 0) + invReward }).eq("id", inv.id);
      }
      toast({ title: "🎉 All tasks completed!", description: `Daily income of $${totalDailyIncome.toFixed(2)} USDT has been credited!` });
    } else {
      toast({ title: `${action === "buy" ? "Bought" : "Sold"} ${exchangeName} ✅`, description: `+$${reward.toFixed(2)} USDT credited to your wallet.` });
    }

    queryClient.invalidateQueries({ queryKey: ["user-tasks", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["daily-earnings"] });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const exchangeTasks = tasks?.filter((t) => t.task_type === "exchange") || [];
  const completedToday = exchangeTasks.filter((t) => t.status === "completed").length;
  const todayEarned = exchangeTasks.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.reward || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Tasks Center</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Trade & <span className="text-gradient">Earn Daily</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            {activeInvestments.length > 0
              ? `Your daily income: $${totalDailyIncome.toFixed(2)} USDT — Click Buy or Sell on each pair to claim.`
              : "Purchase a plan first to start earning daily income from tasks."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="glass-card p-5 text-center">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{exchanges.length - completedToday}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
          <div className="glass-card p-5 text-center">
            <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{completedToday}/{exchanges.length}</p>
            <p className="text-xs text-muted-foreground">Completed Today</p>
          </div>
          <div className="glass-card p-5 text-center glow-gold">
            <Gift className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-gradient-gold">${todayEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Earned Today</p>
          </div>
        </div>

        {activeInvestments.length === 0 ? (
          <div className="glass-card p-8 text-center border-accent/30">
            <Sparkles className="w-10 h-10 text-accent mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">No Active Plan</h2>
            <p className="text-sm text-muted-foreground mb-5">You need to purchase an investment plan to unlock daily tasks and start earning.</p>
            <Button onClick={() => window.location.href = "/plans"} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Sparkles className="w-4 h-4 mr-2" /> Browse Plans
            </Button>
          </div>
        ) : (
        <>
        {/* Exchange Pairs with Candlestick Charts */}
        <div className="space-y-4">
          {exchanges.map((ex) => {
            const claimed = claimedExchanges.has(ex.name);
            return (
              <div key={ex.name} className={`glass-card p-4 ${claimed ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-lg font-bold text-accent">
                      {ex.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          Buy: <span className="text-green-400 font-medium">${ex.buy.toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Sell: <span className="text-red-400 font-medium">${ex.sell.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {perExchangeReward > 0 && (
                      <span className="text-xs font-semibold text-accent mr-1">+${perExchangeReward.toFixed(2)}</span>
                    )}
                    {claimed ? (
                      <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                        <CheckCircle className="w-4 h-4" /> Done
                      </span>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => claimExchange(ex.name, "buy")}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1 h-8">
                          <TrendingUp className="w-3 h-3" /> Buy
                        </Button>
                        <Button size="sm" onClick={() => claimExchange(ex.name, "sell")}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1 h-8">
                          <TrendingDown className="w-3 h-3" /> Sell
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CandlestickChart pair={ex.name} height={80} />
              </div>
            );
          })}
        </div>

        <div className="glass-card p-4 mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            Tasks reset daily. Your daily income is based on your active investment plan.
          </p>
        </div>
        </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TasksCenter;
