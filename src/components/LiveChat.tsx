import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const LiveChat = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["chat-messages", user?.id],
    enabled: !!user && open,
    refetchInterval: open ? 5000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!user || !open) return;
    const channel = supabase
      .channel("chat-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, open, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      message: message.trim(),
      sender_role: "user",
      sender_name: user.email,
    });
    setMessage("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["chat-messages", user.id] });
  };

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[28rem] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">Live Support</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(!messages || messages.length === 0) && (
              <p className="text-center text-muted-foreground text-sm mt-8">
                👋 Hi! How can we help you today?
              </p>
            )}
            {messages?.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender_role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    m.sender_role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.message}
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(m.created_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground"
            />
            <Button type="submit" size="sm" disabled={sending} className="bg-primary text-primary-foreground shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default LiveChat;
