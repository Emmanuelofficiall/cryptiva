import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, XCircle, AlertTriangle, Loader2, ArrowLeftRight, ShieldAlert
} from "lucide-react";

const AdminP2PPanel = ({ profiles }: { profiles: any[] }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"orders" | "disputes">("orders");
  const [resolution, setResolution] = useState<Record<string, string>>({});

  const { data: allOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-p2p-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("p2p_orders").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: allDisputes, isLoading: disputesLoading } = useQuery({
    queryKey: ["admin-p2p-disputes"],
    queryFn: async () => {
      const { data } = await supabase.from("p2p_disputes").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const getName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8);
  };

  const releaseUsdt = async (orderId: string, buyerUserId: string, sellerUserId: string, amount: number) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "completed" }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Credit buyer
    const { data: buyerProfile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", buyerUserId).maybeSingle();
    if (buyerProfile) {
      await supabase.from("profiles").update({ wallet_balance: Number(buyerProfile.wallet_balance || 0) + amount }).eq("user_id", buyerUserId);
    }

    // Deduct seller
    const { data: sellerProfile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", sellerUserId).maybeSingle();
    if (sellerProfile) {
      await supabase.from("profiles").update({ wallet_balance: Math.max(0, Number(sellerProfile.wallet_balance || 0) - amount) }).eq("user_id", sellerUserId);
    }

    toast({ title: "USDT Released!", description: `${amount} USDT credited to ${getName(buyerUserId)} and deducted from ${getName(sellerUserId)}.` });
    qc.invalidateQueries({ queryKey: ["admin-p2p-orders"] });
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "cancelled" }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Order cancelled" }); qc.invalidateQueries({ queryKey: ["admin-p2p-orders"] }); }
  };

  const resolveDispute = async (disputeId: string, orderId: string, action: "release" | "cancel") => {
    const resText = resolution[disputeId] || (action === "release" ? "Resolved: USDT released" : "Resolved: Order cancelled");
    await supabase.from("p2p_disputes").update({
      status: "resolved",
      resolution: resText,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputeId);

    if (action === "release") {
      const order = allOrders?.find((o) => o.id === orderId);
      if (order) {
        const buyerUserId = order.order_type === "buy" ? order.user_id : (order.matched_user_id || order.user_id);
        const sellerUserId = order.order_type === "sell" ? order.user_id : (order.matched_user_id || order.user_id);
        if (buyerUserId && sellerUserId) await releaseUsdt(orderId, buyerUserId, sellerUserId, Number(order.amount));
      }
    } else {
      await supabase.from("p2p_orders").update({ status: "cancelled" }).eq("id", orderId);
    }

    toast({ title: "Dispute resolved!" });
    qc.invalidateQueries({ queryKey: ["admin-p2p-disputes"] });
    qc.invalidateQueries({ queryKey: ["admin-p2p-orders"] });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-primary/10 text-primary";
      case "cancelled": return "bg-destructive/10 text-destructive";
      case "payment_sent": return "bg-blue-500/10 text-blue-400";
      case "disputed": return "bg-orange-500/10 text-orange-400";
      default: return "bg-accent/10 text-accent";
    }
  };

  const activeOrders = allOrders?.filter((o) => !["completed", "cancelled"].includes(o.status)) || [];
  const openDisputes = allDisputes?.filter((d) => d.status === "open") || [];

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <Button variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")} className="gap-2 text-xs sm:text-sm">
          <ArrowLeftRight className="w-4 h-4" /> Orders {activeOrders.length > 0 && <span className="ml-1 bg-accent/20 text-accent px-1.5 py-0.5 rounded-full text-[10px]">{activeOrders.length}</span>}
        </Button>
        <Button variant={tab === "disputes" ? "default" : "outline"} onClick={() => setTab("disputes")} className="gap-2 text-xs sm:text-sm">
          <ShieldAlert className="w-4 h-4" /> Disputes {openDisputes.length > 0 && <span className="ml-1 bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full text-[10px]">{openDisputes.length}</span>}
        </Button>
      </div>

      {tab === "orders" && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border"><h3 className="font-display font-semibold text-foreground">All P2P Orders</h3></div>
          {ordersLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Type", "User", "Matched", "Amount", "Currency", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium p-3 sm:p-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(allOrders || []).slice(0, 50).map((o) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3 sm:p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.order_type === "buy" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                          {o.order_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-sm text-foreground">{getName(o.user_id)}</td>
                      <td className="p-3 sm:p-4 text-sm text-muted-foreground">{o.matched_user_id ? getName(o.matched_user_id) : "—"}</td>
                      <td className="p-3 sm:p-4 text-sm font-semibold text-foreground">{Number(o.amount)} USDT</td>
                      <td className="p-3 sm:p-4 text-sm text-muted-foreground">{o.local_currency}</td>
                      <td className="p-3 sm:p-4"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(o.status)}`}>{o.status}</span></td>
                      <td className="p-3 sm:p-4 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at!).toLocaleDateString()}</td>
                      <td className="p-3 sm:p-4">
                        {["pending_payment", "payment_sent", "disputed"].includes(o.status) && (
                          <div className="flex gap-1.5 flex-wrap">
                            <Button size="sm" onClick={() => {
                              const buyerUserId = o.order_type === "buy" ? o.user_id : (o.matched_user_id || o.user_id);
                              const sellerUserId = o.order_type === "sell" ? o.user_id : (o.matched_user_id || o.user_id);
                              releaseUsdt(o.id, buyerUserId, sellerUserId, Number(o.amount));
                            }}
                              className="bg-primary text-primary-foreground h-7 text-[11px] gap-1">
                              <CheckCircle className="w-3 h-3" /> Release
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id)}
                              className="border-destructive text-destructive h-7 text-[11px] gap-1">
                              <XCircle className="w-3 h-3" /> Cancel
                            </Button>
                          </div>
                        )}
                        {!["pending_payment", "payment_sent", "disputed"].includes(o.status) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!allOrders || allOrders.length === 0) && (
                    <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No P2P orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "disputes" && (
        <div className="space-y-4">
          {disputesLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (allDisputes || []).length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">No disputes</div>
          ) : (
            (allDisputes || []).map((d) => {
              const order = allOrders?.find((o) => o.id === d.order_id);
              return (
                <div key={d.id} className={`glass-card p-4 sm:p-5 ${d.status === "open" ? "border-orange-500/30" : ""}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`w-4 h-4 ${d.status === "open" ? "text-orange-400" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === "open" ? "bg-orange-500/10 text-orange-400" : "bg-primary/10 text-primary"}`}>
                          {d.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">Reporter: {getName(d.reporter_user_id)}</p>
                      <p className="text-xs text-muted-foreground">Reason: {d.reason}</p>
                      {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                      {order && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Order: {order.order_type.toUpperCase()} {Number(order.amount)} USDT • {getName(order.user_id)} ↔ {order.matched_user_id ? getName(order.matched_user_id) : "—"}
                        </p>
                      )}
                      {d.resolution && <p className="text-xs text-primary mt-2">Resolution: {d.resolution}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(d.created_at!).toLocaleDateString()}</span>
                  </div>
                  {d.status === "open" && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-border/50">
                      <Input
                        placeholder="Resolution note..."
                        value={resolution[d.id] || ""}
                        onChange={(e) => setResolution((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        className="bg-secondary border-border text-foreground text-sm placeholder:text-muted-foreground flex-1"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => resolveDispute(d.id, d.order_id, "release")}
                          className="bg-primary text-primary-foreground h-8 text-xs gap-1">
                          <CheckCircle className="w-3 h-3" /> Release USDT
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => resolveDispute(d.id, d.order_id, "cancel")}
                          className="border-destructive text-destructive h-8 text-xs gap-1">
                          <XCircle className="w-3 h-3" /> Cancel Order
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminP2PPanel;
