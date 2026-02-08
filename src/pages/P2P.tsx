import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import { ArrowUpDown, Plus, Loader2, X, ShoppingCart, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type OrderType = "buy" | "sell";

const P2P = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrderType>("buy");
  const [showCreate, setShowCreate] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("sell");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MTN MoMo");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["p2p-orders", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("p2p_orders")
        .select("*")
        .eq("order_type", filter)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myOrders } = useQuery({
    queryKey: ["my-p2p-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("p2p_orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["p2p-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email");
      if (error) throw error;
      return data || [];
    },
  });

  const getName = (userId: string) => {
    const p = profiles?.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || "Trader";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !price) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("p2p_orders").insert({
        user_id: user.id,
        order_type: orderType,
        amount: Number(amount),
        price_per_unit: Number(price),
        payment_method: paymentMethod,
        payment_details: paymentDetails,
      });
      if (error) throw error;
      toast({ title: "Order Created!", description: `Your ${orderType} order has been posted.` });
      setShowCreate(false);
      setAmount("");
      setPrice("");
      setPaymentDetails("");
      queryClient.invalidateQueries({ queryKey: ["p2p-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-p2p-orders"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrade = async (orderId: string) => {
    const { error } = await supabase
      .from("p2p_orders")
      .update({ status: "in_progress", matched_user_id: user.id })
      .eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trade Initiated!", description: "Contact the trader to complete the transaction." });
      queryClient.invalidateQueries({ queryKey: ["p2p-orders"] });
    }
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("p2p_orders").delete().eq("id", orderId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order Cancelled" });
      queryClient.invalidateQueries({ queryKey: ["p2p-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-p2p-orders"] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">P2P Trading</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Peer-to-Peer <span className="text-gradient">USDT Exchange</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Buy and sell USDT directly with other traders. Fast, secure, and commission-free.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            <button
              onClick={() => setFilter("buy")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "buy" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Buy USDT
            </button>
            <button
              onClick={() => setFilter("sell")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "sell" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tag className="w-4 h-4" /> Sell USDT
            </button>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" /> Post Order
          </Button>
        </div>

        {/* Create Order Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md w-full glow-green">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-foreground">Create P2P Order</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="flex gap-1 bg-secondary rounded-lg p-1">
                  <button type="button" onClick={() => setOrderType("buy")}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${orderType === "buy" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >I want to Buy</button>
                  <button type="button" onClick={() => setOrderType("sell")}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${orderType === "sell" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                  >I want to Sell</button>
                </div>
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Price per USDT (RWF)</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 1349" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                  {amount && price && <p className="text-xs text-primary mt-1">Total: RWF {(Number(amount) * Number(price)).toLocaleString()}</p>}
                </div>
                <div>
                  <Label className="text-foreground text-sm">Payment Method</Label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
                    <option value="MTN MoMo">MTN MoMo</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="TRC20 USDT">TRC20 USDT</option>
                  </select>
                </div>
                <div>
                  <Label className="text-foreground text-sm">Payment Details (phone/address)</Label>
                  <Input value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} placeholder="Your payment info" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Post Order
                </Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Orders List */}
        <div className="glass-card overflow-hidden mb-8">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">
              {filter === "buy" ? "Buy Orders" : "Sell Orders"} — Open
            </h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
          ) : !orders || orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No open {filter} orders right now.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Trader", "Amount", "Price/USDT", "Total (RWF)", "Payment", "Action"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-sm font-medium text-foreground">{getName(o.user_id)}</td>
                      <td className="p-4 text-sm text-foreground font-semibold">${Number(o.amount).toLocaleString()} USDT</td>
                      <td className="p-4 text-sm text-accent font-semibold">RWF {Number(o.price_per_unit).toLocaleString()}</td>
                      <td className="p-4 text-sm text-foreground">RWF {(Number(o.amount) * Number(o.price_per_unit)).toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{o.payment_method}</td>
                      <td className="p-4">
                        {o.user_id === user.id ? (
                          <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id)} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 text-xs">
                            Cancel
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleTrade(o.id)} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
                            {filter === "buy" ? "Sell" : "Buy"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Orders */}
        {myOrders && myOrders.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">My Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Type", "Amount", "Price/USDT", "Payment", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium p-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.order_type === "buy" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                          {o.order_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-foreground font-semibold">${Number(o.amount).toLocaleString()}</td>
                      <td className="p-4 text-sm text-foreground">RWF {Number(o.price_per_unit).toLocaleString()}</td>
                      <td className="p-4 text-sm text-muted-foreground">{o.payment_method}</td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          o.status === "completed" ? "bg-primary/10 text-primary" :
                          o.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                          o.status === "in_progress" ? "bg-accent/10 text-accent" :
                          "bg-secondary text-muted-foreground"
                        }`}>{o.status}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(o.created_at!).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default P2P;
