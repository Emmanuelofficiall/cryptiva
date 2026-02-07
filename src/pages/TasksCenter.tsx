import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import { CheckCircle, Clock, Star, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const defaultTasks = [
  { title: "Complete your profile", description: "Add your full name and details", reward: 500, task_type: "one_time" },
  { title: "Make your first deposit", description: "Deposit any amount to get started", reward: 1000, task_type: "one_time" },
  { title: "Refer a friend", description: "Share your referral code with someone", reward: 2000, task_type: "one_time" },
  { title: "Daily login bonus", description: "Log in to claim your daily reward", reward: 100, task_type: "daily" },
  { title: "Invest in a plan", description: "Choose and invest in any plan", reward: 1500, task_type: "one_time" },
];

const TasksCenter = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
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

  const initializeTasks = async () => {
    if (!user) return;
    const inserts = defaultTasks.map((t) => ({
      user_id: user.id,
      title: t.title,
      description: t.description,
      reward: t.reward,
      task_type: t.task_type,
    }));
    await supabase.from("user_tasks").insert(inserts);
    queryClient.invalidateQueries({ queryKey: ["user-tasks", user.id] });
  };

  const completeTask = async (taskId: string) => {
    const { error } = await supabase
      .from("user_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task Completed! 🎉", description: "Reward will be credited to your wallet." });
      queryClient.invalidateQueries({ queryKey: ["user-tasks", user?.id] });
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

  const pending = tasks?.filter((t) => t.status === "pending") || [];
  const completed = tasks?.filter((t) => t.status === "completed") || [];
  const totalRewards = completed.reduce((s, t) => s + Number(t.reward || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Tasks Center</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Complete Tasks, <span className="text-gradient">Earn Rewards</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Complete daily and one-time tasks to earn bonus rewards.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-5 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="glass-card p-5 text-center">
            <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="glass-card p-5 text-center">
            <Gift className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-primary">RWF {totalRewards.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
        </div>

        {/* Initialize tasks if none */}
        {tasks && tasks.length === 0 && (
          <div className="glass-card p-8 text-center mb-8">
            <Star className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to Tasks Center!</h3>
            <p className="text-muted-foreground mb-4">Get started by loading your tasks.</p>
            <Button onClick={initializeTasks} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Load My Tasks
            </Button>
          </div>
        )}

        {/* Pending Tasks */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Pending Tasks</h2>
            <div className="space-y-3">
              {pending.map((task) => (
                <div key={task.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-primary">+RWF {Number(task.reward).toLocaleString()}</span>
                    <Button size="sm" onClick={() => completeTask(task.id)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                      Claim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">Completed</h2>
            <div className="space-y-3">
              {completed.map((task) => (
                <div key={task.id} className="glass-card p-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground line-through">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary">+RWF {Number(task.reward).toLocaleString()}</span>
                </div>
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
