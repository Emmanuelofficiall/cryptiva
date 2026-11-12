import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate, Link } from "react-router-dom";
import { CheckCircle, Clock, Loader2, Gift, TrendingUp, TrendingDown, Sparkles, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useMemo } from "react";
import CandlestickChart from "@/components/CandlestickChart";
import {
  getTaskInvestmentId,
  getPlanDailyIncome,
  getPlanExchangeReward,
  formatPlanLabel,
} from "@/lib/tasks";

const useCountdownToMidnight = () => {
  const getTimeLeft = useCallback(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  }, []);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [getTimeLeft]);

  return timeLeft;
};

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
  const countdown = useCountdownToMidnight();

  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [submittingTrade, setSubmittingTrade] = useState<string | null>(null);

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

  const { data: investments } = useQuery({
    queryKey: ["investments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const activeInvestments = useMemo(() => {
    return (investments || []).filter((i) => i.status === "active");
  }, [investments]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Helper to determine if a task is completed today
  const isTaskCompletedToday = useCallback(
    (t: { status: string | null; completed_at: string | null }) => {
      return (
        t.status === "completed" &&
        !!t.completed_at &&
        t.completed_at.split("T")[0] === todayStr
      );
    },
    [todayStr]
  );

  // Helper to get number of completed exchange tasks today for an investment
  const getCompletedCountForInv = useCallback(
    (invId: string) => {
      return new Set((tasks || []).filter(
        (t) =>
          t.task_type === "exchange" &&
          getTaskInvestmentId(t) === invId &&
          isTaskCompletedToday(t)
      ).map((t) => t.title)).size;
    },
    [tasks, isTaskCompletedToday]
  );

  // Set default selected investment if none or invalid
  useEffect(() => {
    if (activeInvestments.length === 0) {
      setSelectedInvId(null);
      return;
    }
    // If selected is still valid, keep it
    if (selectedInvId && activeInvestments.some((i) => i.id === selectedInvId)) {
      return;
    }
    // Otherwise pick first pending plan, or first plan
    const firstPending = activeInvestments.find(
      (inv) => getCompletedCountForInv(inv.id) < exchanges.length
    );
    setSelectedInvId(firstPending ? firstPending.id : activeInvestments[0].id);
  }, [activeInvestments, selectedInvId, getCompletedCountForInv]);

  // Current active plan being viewed/operated
  const currentInv = useMemo(() => {
    return activeInvestments.find((i) => i.id === selectedInvId) || activeInvestments[0] || null;
  }, [activeInvestments, selectedInvId]);

  const currentPlanLabel = useMemo(() => {
    if (!currentInv) return "";
    return formatPlanLabel(currentInv, activeInvestments);
  }, [currentInv, activeInvestments]);

  const currentInvDailyIncome = useMemo(() => {
    if (!currentInv) return 0;
    return getPlanDailyIncome(Number(currentInv.amount), Number(currentInv.daily_rate));
  }, [currentInv]);

  const currentExchangeReward = useMemo(() => {
    if (!currentInv) return 0;
    return getPlanExchangeReward(Number(currentInv.amount), Number(currentInv.daily_rate), exchanges.length);
  }, [currentInv]);

  // Current plan's tasks
  const currentPlanTasks = useMemo(() => {
    if (!currentInv) return [];
    return (tasks || []).filter(
      (t) => t.task_type === "exchange" && getTaskInvestmentId(t) === currentInv.id
    );
  }, [tasks, currentInv]);

  const currentPlanCompletedCount = useMemo(() => {
    if (!currentInv) return 0;
    return getCompletedCountForInv(currentInv.id);
  }, [currentInv, getCompletedCountForInv]);

  // Overall platform calculation
  const totalDailyIncome = useMemo(() => {
    return activeInvestments.reduce((sum, inv) => {
      return sum + getPlanDailyIncome(Number(inv.amount), Number(inv.daily_rate));
    }, 0);
  }, [activeInvestments]);

  const totalTasksCount = activeInvestments.length * exchanges.length;
  const completedTasksCount = useMemo(() => {
    return activeInvestments.reduce((sum, inv) => sum + getCompletedCountForInv(inv.id), 0);
  }, [activeInvestments, getCompletedCountForInv]);

  const completedPlansCount = useMemo(() => {
    return activeInvestments.filter((inv) => getCompletedCountForInv(inv.id) >= exchanges.length).length;
  }, [activeInvestments, getCompletedCountForInv]);

  const todayEarned = useMemo(() => {
    return (tasks || [])
      .filter((t) => t.task_type === "exchange" && isTaskCompletedToday(t))
      .reduce((sum, t) => sum + Number(t.reward || 0), 0);
  }, [tasks, isTaskCompletedToday]);

  // Claim trade for the current selected plan
  const claimExchange = async (exchangeName: string, action: "buy" | "sell") => {
    if (!user || !currentInv) return;

    setSubmittingTrade(exchangeName);
    try {
      const { data: result, error: rpcError } = await supabase.rpc("complete_exchange_task", {
        _investment_id: currentInv.id, _pair: exchangeName, _action: action,
      });
      if (rpcError) throw rpcError;
      const res = result as { reward: number; completed: number; plan_finished: boolean };
      const reward = Number(res.reward);

      // Check if this plan's 5 tasks are now fully completed
      const newCompletedCount = res.completed;
      const isPlanFinished = res.plan_finished;

      if (isPlanFinished) {
        // Check for remaining active plans with pending tasks
        const nextPending = activeInvestments.find(
          (i) => i.id !== currentInv.id && getCompletedCountForInv(i.id) < exchanges.length
        );

        if (nextPending) {
          const nextLabel = formatPlanLabel(nextPending, activeInvestments);
          toast({
            title: `🎉 Tasks for ${currentPlanLabel} completed!`,
            description: `+$${currentInvDailyIncome.toFixed(2)} USDT credited. Switching to ${nextLabel} (${nextPending.amount} USDT) to do tasks for your next plan.`,
          });
          setSelectedInvId(nextPending.id);
        } else {
          toast({
            title: "🎉 All tasks completed for all plans!",
            description: `Total daily income of $${totalDailyIncome.toFixed(2)} USDT credited to your wallet today!`,
          });
        }
      } else {
        toast({
          title: `${action === "buy" ? "Bought" : "Sold"} ${exchangeName} (${currentPlanLabel}) ✅`,
          description: `+$${reward.toFixed(2)} USDT credited to wallet. (${newCompletedCount}/5 trades completed for this plan)`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["user-tasks", user.id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["daily-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["investments"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingTrade(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-2">Tasks Center</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Trade & <span className="text-gradient">Earn Daily</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
            {activeInvestments.length > 0
              ? activeInvestments.length === 1
                ? `You have 1 active plan ($${totalDailyIncome.toFixed(2)}/day). Complete all 5 trades to claim daily rewards.`
                : `You have ${activeInvestments.length} active plans. Tasks must be done for each plan purchased (${completedPlansCount}/${activeInvestments.length} plans completed today).`
              : "Purchase an investment plan to unlock daily tasks and start earning."}
          </p>
        </div>

        {/* Global Progress Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="glass-card p-5 text-center">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">
              {Math.max(0, totalTasksCount - completedTasksCount)}
            </p>
            <p className="text-xs text-muted-foreground">Trades Remaining</p>
          </div>
          <div className="glass-card p-5 text-center">
            <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">
              {completedPlansCount} / {activeInvestments.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Plans Completed ({completedTasksCount}/{totalTasksCount} trades)
            </p>
          </div>
          <div className="glass-card p-5 text-center glow-gold">
            <Gift className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-gradient-gold">
              ${todayEarned.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Earned Today (Target: ${totalDailyIncome.toFixed(2)})
            </p>
          </div>
        </div>

        {activeInvestments.length === 0 ? (
          <div className="glass-card p-8 text-center border-accent/30">
            <Sparkles className="w-10 h-10 text-accent mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">No Active Plan</h2>
            <p className="text-sm text-muted-foreground mb-5">
              You need to purchase an investment plan to unlock daily tasks and start earning.
            </p>
            <Link to="/plans">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Sparkles className="w-4 h-4 mr-2" /> Browse Plans
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Active Plan Selector Tabs */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Your Active Plans ({activeInvestments.length})
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Click a plan to do its trades
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeInvestments.map((inv) => {
                  const label = formatPlanLabel(inv, activeInvestments);
                  const isSelected = inv.id === currentInv?.id;
                  const completedCount = getCompletedCountForInv(inv.id);
                  const isDone = completedCount >= exchanges.length;
                  const invIncome = getPlanDailyIncome(Number(inv.amount), Number(inv.daily_rate));

                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => setSelectedInvId(inv.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                          : "border-border bg-secondary/60 hover:border-border/80 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                          {label}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isDone
                              ? "bg-primary/20 text-primary"
                              : completedCount > 0
                              ? "bg-accent/20 text-accent"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {isDone ? "Done (5/5)" : `${completedCount}/5 Done`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Invest: ${Number(inv.amount).toFixed(0)} USDT</span>
                        <span className="text-primary font-medium">+${invIncome.toFixed(2)}/day</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Active Plan Banner */}
            {currentInv && (
              <div className="glass-card p-4 mb-6 border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                      Current Task Set:
                    </span>
                    <span className="text-sm font-bold text-foreground">{currentPlanLabel}</span>
                    <span className="text-xs text-muted-foreground">(${Number(currentInv.amount).toFixed(0)} USDT Plan)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Daily Return: <strong className="text-primary">${currentInvDailyIncome.toFixed(2)} USDT</strong> ·
                    Each trade yields <strong className="text-foreground">+${currentExchangeReward.toFixed(2)} USDT</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      currentPlanCompletedCount >= exchanges.length
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {currentPlanCompletedCount >= exchanges.length
                      ? "Plan Completed Today ✅"
                      : `${currentPlanCompletedCount}/5 Trades Done`}
                  </span>
                </div>
              </div>
            )}

            {/* Exchange Pairs for Current Plan */}
            <div className="space-y-4">
              {exchanges.map((ex) => {
                const isClaimed = currentPlanTasks.some((t) => t.title === ex.name && isTaskCompletedToday(t));
                const isSubmitting = submittingTrade === ex.name;

                return (
                  <div key={ex.name} className={`glass-card p-4 transition-opacity ${isClaimed ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-lg font-bold text-accent">
                          {ex.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                            <span className="text-[10px] text-muted-foreground font-mono">({currentPlanLabel})</span>
                          </div>
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
                        {currentExchangeReward > 0 && (
                          <span className="text-xs font-semibold text-accent mr-1">
                            +${currentExchangeReward.toFixed(2)}
                          </span>
                        )}
                        {isClaimed ? (
                          <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                            <CheckCircle className="w-4 h-4" /> Done
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              disabled={!!submittingTrade}
                              onClick={() => claimExchange(ex.name, "buy")}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1 h-8"
                            >
                              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                              Buy
                            </Button>
                            <Button
                              size="sm"
                              disabled={!!submittingTrade}
                              onClick={() => claimExchange(ex.name, "sell")}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1 h-8"
                            >
                              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingDown className="w-3 h-3" />}
                              Sell
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

            {/* Prompt for next plan if current plan is completed and other plans exist */}
            {currentPlanCompletedCount >= exchanges.length && activeInvestments.length > 1 && (
              (() => {
                const pendingPlan = activeInvestments.find(
                  (i) => i.id !== currentInv?.id && getCompletedCountForInv(i.id) < exchanges.length
                );
                if (!pendingPlan) return null;
                const nextLabel = formatPlanLabel(pendingPlan, activeInvestments);
                return (
                  <div className="glass-card p-4 mt-6 border-accent/40 bg-accent/5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Ready for your next plan tasks?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {nextLabel} has pending trades. Complete its tasks to claim its daily return!
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedInvId(pendingPlan.id)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 gap-1"
                    >
                      Trade {nextLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })()
            )}

            {/* Reset Countdown */}
            <div className="glass-card p-4 mt-6 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                <Clock className="w-3 h-3 inline mr-1" />
                Tasks reset daily at midnight. Each plan you purchase unlocks its own set of daily trades.
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="bg-secondary rounded-lg px-3 py-1.5 min-w-[48px]">
                  <p className="text-lg font-display font-bold text-foreground">
                    {String(countdown.hours).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">HRS</p>
                </div>
                <span className="text-muted-foreground font-bold">:</span>
                <div className="bg-secondary rounded-lg px-3 py-1.5 min-w-[48px]">
                  <p className="text-lg font-display font-bold text-foreground">
                    {String(countdown.minutes).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">MIN</p>
                </div>
                <span className="text-muted-foreground font-bold">:</span>
                <div className="bg-secondary rounded-lg px-3 py-1.5 min-w-[48px]">
                  <p className="text-lg font-display font-bold text-foreground">
                    {String(countdown.seconds).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">SEC</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">until next daily reset</p>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TasksCenter;
