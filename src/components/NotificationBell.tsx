import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

export default function NotificationBell() {
  const { user } = useAuth();
  const client = useQueryClient();
  const { toast } = useToast();
  const key = ["notifications", user?.id];
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: key, enabled: !!user, refetchInterval: 10000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const unread = notifications.filter(n => !n.read_at).length;
  const markRead = async (id?: string) => {
    if (!user) return;
    let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    if (id) query = query.eq("id", id);
    const { error } = await query;
    if (error) toast({ title: "Could not mark notifications read", variant: "destructive" });
    else client.invalidateQueries({ queryKey: key });
  };
  return <Popover>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative text-muted-foreground">
      <Bell className="h-6 w-6" />
      {unread > 0 && <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread > 99 ? "99+" : unread}</span>}
    </Button></PopoverTrigger>
    <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
      <div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-semibold">Notifications</h2><Button size="sm" variant="ghost" disabled={!unread} onClick={() => markRead()} className="gap-1 text-xs"><CheckCheck className="h-4 w-4" />Mark all read</Button></div>
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : error ? <p className="p-6 text-sm text-destructive">Could not load notifications.</p> : notifications.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No notifications yet.</p> : notifications.map(n => <Link key={n.id} to={n.link} onClick={() => markRead(n.id)} className={`block border-b border-border p-4 last:border-0 hover:bg-secondary ${!n.read_at ? "bg-primary/5" : ""}`}>
          <div className="flex items-start gap-2"><span className="flex-1 text-sm font-semibold">{n.title}</span>{!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}</div>
          <p className="mt-1 break-words text-xs text-muted-foreground">{n.message}</p><time className="mt-2 block text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</time>
        </Link>)}
      </div>
    </PopoverContent>
  </Popover>;
}