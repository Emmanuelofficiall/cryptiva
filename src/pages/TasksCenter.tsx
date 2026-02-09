import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import { CheckCircle, Clock, Star, Loader2, Gift, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const dailyTasks = [
  { title: "Daily login bonus", description: "Log in to claim your daily reward", reward: 0.1 },
  { title: "Watch a tutorial", description: "Watch an investment tutorial video", reward: 0.05 },
  { title: "Check your portfolio", description: "Review your active investments", reward: 0.05 },
  { title: "Visit P2P marketplace", description: "Browse the P2P trading section", reward: 0.05 },
  { title: "Share on social media", description: "Share Cryptiva with your network", reward: 0.1 },
];

const oneTimeTasks = [
  { title: "Complete your profile", description: "Add your full name and details", reward: 0.5 },
  { title: "Make your first deposit", description: "Deposit any amount to get started", reward: 1 },
  { title: "Refer a friend", description: "Share your referral code with someone", reward: 2 },
  { title: "Invest in a plan", description: "Choose and invest in any plan", reward: 1.5 },
  { title: "Add payment method", description: "Add a payment method for P2P trading", reward: 0.5 },
];

const TasksCenter = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Auto-initialize tasks + reset daily tasks each day
  useEffect(() => {
    if (!user || tasksLoading || tasks === undefined) return;

    const initAndResetTasks = async () => {
      const today = new Date().toISOString().split("T")[0];

      if (tasks.length === 0) {
        // First time: create all tasks
        const inserts = [
          ...dailyTasks.map((t) => ({
            user_id: user.id,
            title: t.title,
            description: t.description,
            reward: t.reward,
            task_type: "daily",
            status: "pending",
          })),
          ...oneTimeTasks.map((t) => ({
            user_id: user.id,
            title: t.title,
            description: t.description,
            reward: t.reward,
            task_type: "one_time",
            status: "pending",
          })),
        ];
        await supabase.from("user_tasks").insert(inserts);
        queryClient.invalidateQueries({ queryKey: ["user-tasks", user.id] });
        return;
      }

      // Reset completed daily tasks from previous days
      const dailyCompleted = tasks.filter(
        (t) =>
          t.task_type === "daily" &&
          t.status === "completed" &&
          t.completed_at &&
          t.completed_at.split("T")[0] !== today
      );

      if (dailyCompleted.length > 0) {
        for (const task of dailyCompleted) {
          await supabase
            .from("user_tasks")
            .update({ status: "pending", completed_at: null })
            .eq("id", task.id);
        }
        queryClient.invalidateQueries({ queryKey: ["user-tasks", user.id] });
      }
    };

    initAndResetTasks();
  }, [user, tasks, tasksLoading, queryClient]);

  const completeTask = async (taskId: string, reward: number) => {
    // Mark task completed
    const { error } = await supabase
      .from("user_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Credit reward to wallet
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user!.id)
      .single();

    if (profile) {
      const newBalance = Number(profile.wallet_balance || 0) + reward;
      await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("user_id", user!.id);
    }

    toast({ title: "Task Completed! 🎉", description: `$${reward.toFixed(2)} USDT credited to your wallet.` });
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

  const daily = tasks?.filter((t) => t.task_type === "daily") || [];
  const oneTime = tasks?.filter((t) => t.task_type === "one_time") || [];
  const pendingDaily = daily.filter((t) => t.status === "pending");
  const completedDaily = daily.filter((t) => t.status === "completed");
  const pendingOneTime = oneTime.filter((t) => t.status === "pending");
  const completedOneTime = oneTime.filter((t) => t.status === "completed");
  const allCompleted = [...completedDaily, ...completedOneTime];
  const totalRewards = allCompleted.reduce((s, t) => s + Number(t.reward || 0), 0);

  const TaskCard = ({ task, showClaim = true }: { task: any; showClaim?: boolean }) => (
    <div
      key={task.id}
      className={`glass-card p-4 flex items-center justify-between ${task.status === "completed" ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            task.status === "completed" ? "bg-primary/10" : "bg-accent/10"
          }`}
        >
          {task.status === "completed" ? (
            <CheckCircle className="w-5 h-5 text-primary" />
          ) : (
            <Clock className="w-5 h-5 text-accent" />
          )}
        </div>
        <div>
          <p className={`text-sm font-medium text-foreground ${task.status === "completed" ? "line-through" : ""}`}>
            {task.title}
          </p>
          <p className="text-xs text-muted-foreground">{task.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${task.status === "completed" ? "text-primary" : "text-accent"}`}>
          +${Number(task.reward).toFixed(2)}
        </span>
        {showClaim && task.status === "pending" && (
          <Button
            size="sm"
            onClick={() => completeTask(task.id, Number(task.reward))}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
          >
            Claim
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Tasks Center</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Complete Tasks, <span className="text-gradient">Earn Daily Income</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Complete daily tasks every day to earn USDT rewards directly to your wallet.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5 text-center">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{pendingDaily.length + pendingOneTime.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="glass-card p-5 text-center">
            <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{allCompleted.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="glass-card p-5 text-center glow-gold">
            <Gift className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-gradient-gold">${totalRewards.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-display font-semibold text-foreground">Daily Tasks</h2>
            <span className="text-xs text-muted-foreground ml-2">(Resets every day)</span>
          </div>
          <div className="space-y-3">
            {daily.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* One-Time Tasks */}
        {pendingOneTime.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-display font-semibold text-foreground">One-Time Tasks</h2>
            </div>
            <div className="space-y-3">
              {pendingOneTime.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Completed One-Time */}
        {completedOneTime.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Completed One-Time Tasks</h2>
            <div className="space-y-3">
              {completedOneTime.map((task) => (
                <TaskCard key={task.id} task={task} showClaim={false} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TasksCenter;
