import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import { CheckCircle, Clock, Loader2, Gift, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const exchanges = [
  { name: "BTC/USDT", icon: "₿", buy: 67842.50, sell: 67838.20, reward: 0.08 },
  { name: "ETH/USDT", icon: "Ξ", buy: 3456.10, sell: 3454.80, reward: 0.06 },
  { name: "BNB/USDT", icon: "◆", buy: 612.35, sell: 611.90, reward: 0.05 },
  { name: "SOL/USDT", icon: "◎", buy: 178.22, sell: 178.05, reward: 0.05 },
  { name: "XRP/USDT", icon: "✕", buy: 2.34, sell: 2.33, reward: 0.04 },
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
      const { data, error } = await supabase
        .from("user_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Load today's claimed exchanges
  useEffect(() => {
    if (!tasks) return;
    const today = new Date().toISOString().split("T")[0];
    const claimed = new Set<string>();
    tasks.forEach((t) => {
      if (
        t.task_type === "exchange" &&
        t.status === "completed" &&
        t.completed_at?.split("T")[0] === today
      ) {
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

      // Reset yesterday's exchange tasks
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

      // Create exchange tasks if none exist
      if (exchangeTasks.length === 0) {
        const inserts = exchanges.map((e) => ({
          user_id: user.id,
          title: e.name,
          description: `Trade ${e.name} to earn daily reward`,
          reward: e.reward,
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

    const task = tasks?.find((t) => t.task_type === "exchange" && t.title === exchangeName && t.status === "pending");
    if (!task) return;

    const reward = Number(task.reward);

    const { error } = await supabase
      .from("user_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString(), description: `${action.toUpperCase()} ${exchangeName}` })
      .eq("id", task.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user!.id).single();
    if (profile) {
      await supabase.from("profiles").update({ wallet_balance: Number(profile.wallet_balance || 0) + reward }).eq("user_id", user!.id);
    }

    setClaimedExchanges((prev) => new Set(prev).add(exchangeName));
    toast({ title: `${action === "buy" ? "Bought" : "Sold"} ${exchangeName} ✅`, description: `+$${reward.toFixed(2)} USDT credited to your wallet.` });
    queryClient.invalidateQueries({ queryKey: ["user-tasks", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
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
  const totalEarned = tasks?.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.reward || 0), 0) || 0;

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
            Click Buy or Sell on each exchange pair daily to earn USDT income.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5 text-center">
            <ArrowUpDown className="w-6 h-6 text-accent mx-auto mb-2" />
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
            <p className="text-2xl font-display font-bold text-gradient-gold">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
        </div>

        {/* Exchange Pairs */}
        <div className="mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Daily Exchange Tasks</h2>
          <div className="space-y-3">
            {exchanges.map((ex) => {
              const claimed = claimedExchanges.has(ex.name);
              return (
                <div
                  key={ex.name}
                  className={`glass-card p-4 flex items-center justify-between ${claimed ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-xl font-bold text-accent">
                      {ex.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                      <div className="flex items-center gap-3 mt-1">
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
                    <span className="text-xs font-semibold text-accent mr-1">+${ex.reward.toFixed(2)}</span>
                    {claimed ? (
                      <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                        <CheckCircle className="w-4 h-4" /> Done
                      </span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => claimExchange(ex.name, "buy")}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1 h-8"
                        >
                          <TrendingUp className="w-3 h-3" /> Buy
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => claimExchange(ex.name, "sell")}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1 h-8"
                        >
                          <TrendingDown className="w-3 h-3" /> Sell
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-4 mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            Tasks reset daily at midnight. Complete all 5 to earn up to <span className="text-accent font-semibold">${exchanges.reduce((s, e) => s + e.reward, 0).toFixed(2)} USDT/day</span>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TasksCenter;
