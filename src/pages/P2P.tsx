import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import {
  Loader2, ShoppingCart, Tag, Plus, X, CheckCircle, CreditCard,
  User, Phone, Wallet, ArrowRight, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type Tab = "buy" | "sell" | "my-orders" | "payment-methods";

const P2P = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("buy");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("RWF");
  const [submitting, setSubmitting] = useState(false);
  // Payment method form
  const [showAddPM, setShowAddPM] = useState(false);
  const [pmName, setPmName] = useState("");
  const [pmAccName, setPmAccName] = useState("");
  const [pmAccNum, setPmAccNum] = useState("");
  const [pmMethod, setPmMethod] = useState("MTN MoMo");

  // Queries
  const { data: currencies } = useQuery({
    queryKey: ["p2p-currencies"],
    queryFn: async () => {
      const { data } = await supabase.from("p2p_settings").select("*").eq("is_active", true).order("currency");
      return data || [];
    },
  });

  const { data: merchants } = useQuery({
    queryKey: ["merchants"],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["p2p-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      return data || [];
    },
  });

  const { data: myOrders } = useQuery({
    queryKey: ["my-p2p-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("p2p_orders").select("*").or(`user_id.eq.${user!.id},matched_user_id.eq.${user!.id}`).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myPaymentMethods } = useQuery({
    queryKey: ["my-payment-methods", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_payment_methods").select("*").eq("user_id", user!.id);
      return data || [];
    },
  });

  const { data: merchantPayments } = useQuery({
    queryKey: ["merchant-payments", selectedMerchant?.user_id],
    enabled: !!selectedMerchant,
    queryFn: async () => {
      const { data } = await supabase.from("user_payment_methods").select("*").eq("user_id", selectedMerchant!.user_id);
      return data || [];
    },
  });

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;

  const getName = (userId: string) => {
    const p = profiles?.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || "User";
  };

  const getPrice = () => {
    const c = currencies?.find((c) => c.currency === selectedCurrency);
    return c ? Number(c.usdt_price) : 0;
  };

  const isMerchant = merchants?.some((m) => m.user_id === user.id);

  // Buy USDT from merchant: user creates a buy order
  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant || !buyAmount) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("p2p_orders").insert({
        user_id: user.id,
        order_type: "buy",
        amount: Number(buyAmount),
        price_per_unit: getPrice(),
        payment_method: selectedCurrency,
        local_currency: selectedCurrency,
        matched_user_id: selectedMerchant.user_id,
        status: "pending_payment",
      });
      if (error) throw error;
      toast({ title: "Buy order created!", description: `Send ${selectedCurrency} ${(Number(buyAmount) * getPrice()).toLocaleString()} to the merchant and confirm.` });
      setBuyAmount("");
      setSelectedMerchant(null);
      qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Sell USDT to merchant
  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant || !sellAmount) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("p2p_orders").insert({
        user_id: user.id,
        order_type: "sell",
        amount: Number(sellAmount),
        price_per_unit: getPrice(),
        payment_method: selectedCurrency,
        local_currency: selectedCurrency,
        matched_user_id: selectedMerchant.user_id,
        status: "pending_payment",
      });
      if (error) throw error;
      toast({ title: "Sell order created!", description: "Waiting for merchant to send payment and you to release USDT." });
      setSellAmount("");
      setSelectedMerchant(null);
      qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm payment sent (buyer confirms they sent money)
  const confirmPaymentSent = async (orderId: string) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "payment_sent" }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Payment confirmed!", description: "Waiting for merchant to verify and release USDT." }); qc.invalidateQueries({ queryKey: ["my-p2p-orders"] }); }
  };

  // Release USDT (merchant confirms and releases)
  const releaseUsdt = async (orderId: string, buyerUserId: string, amount: number) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "completed" }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Credit buyer's wallet
    const { data: buyerProfile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", buyerUserId).maybeSingle();
    if (buyerProfile) {
      await supabase.from("profiles").update({ wallet_balance: Number(buyerProfile.wallet_balance || 0) + amount }).eq("user_id", buyerUserId);
    }
    toast({ title: "USDT Released!", description: `${amount} USDT credited to buyer's wallet.` });
    qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
  };

  // Release USDT for sell order (seller releases after merchant pays)
  const releaseUsdtSell = async (orderId: string, merchantUserId: string, amount: number) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "completed" }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "USDT Released!", description: `${amount} USDT released to merchant.` });
    qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("p2p_orders").delete().eq("id", orderId);
    if (!error) { toast({ title: "Order Cancelled" }); qc.invalidateQueries({ queryKey: ["my-p2p-orders"] }); }
  };

  const addPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("user_payment_methods").insert({
        user_id: user.id,
        method_name: pmMethod,
        account_name: pmAccName,
        account_number: pmAccNum,
      });
      if (error) throw error;
      toast({ title: "Payment method added!" });
      setShowAddPM(false);
      setPmAccName("");
      setPmAccNum("");
      qc.invalidateQueries({ queryKey: ["my-payment-methods"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deletePaymentMethod = async (id: string) => {
    await supabase.from("user_payment_methods").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-payment-methods"] });
    toast({ title: "Removed" });
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "buy", label: "Buy USDT", icon: ShoppingCart },
    { key: "sell", label: "Sell USDT", icon: Tag },
    { key: "my-orders", label: "My Orders", icon: Wallet },
    { key: "payment-methods", label: "Payment Methods", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">P2P Trading</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Peer-to-Peer <span className="text-gradient">USDT Exchange</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">Buy and sell USDT directly with verified merchants.</p>
        </div>

        {/* Currency & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setSelectedMerchant(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>
          {(tab === "buy" || tab === "sell") && (
            <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}
              className="rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
              {(currencies || []).map((c) => (
                <option key={c.currency} value={c.currency}>{c.currency} — {Number(c.usdt_price).toLocaleString()} per USDT</option>
              ))}
            </select>
          )}
        </div>

        {/* BUY TAB */}
        {tab === "buy" && !selectedMerchant && (
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Select a Merchant to Buy USDT</h3>
            {(!merchants || merchants.length === 0) ? (
              <div className="glass-card p-12 text-center text-muted-foreground">No merchants available yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {merchants.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-5 hover:border-primary/40 transition-all cursor-pointer group"
                    onClick={() => setSelectedMerchant(m)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{m.display_name}</p>
                        <p className="text-xs text-primary">Verified Merchant</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Price ({selectedCurrency})</span>
                      <span className="text-foreground font-semibold">{getPrice().toLocaleString()}</span>
                    </div>
                    <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 mt-2 group-hover:glow-green">
                      Buy USDT <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buy from selected merchant */}
        {tab === "buy" && selectedMerchant && (
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-6 glow-green">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedMerchant.display_name}</p>
                    <p className="text-xs text-primary">Verified Merchant</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMerchant(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              {merchantPayments && merchantPayments.length > 0 && (
                <div className="bg-secondary rounded-xl p-4 mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Merchant Payment Details</p>
                  {merchantPayments.map((pm) => (
                    <div key={pm.id} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">{pm.method_name}</span>
                      <span className="text-foreground font-medium">{pm.account_name} — {pm.account_number}</span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleBuy} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input type="number" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} placeholder="e.g. 50" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required min="1" />
                  {buyAmount && <p className="text-xs text-primary mt-1">You'll pay: {selectedCurrency} {(Number(buyAmount) * getPrice()).toLocaleString()}</p>}
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Buy USDT
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* SELL TAB */}
        {tab === "sell" && !selectedMerchant && (
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Select a Merchant to Sell USDT</h3>
            {(!merchants || merchants.length === 0) ? (
              <div className="glass-card p-12 text-center text-muted-foreground">No merchants available yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {merchants.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-5 hover:border-accent/40 transition-all cursor-pointer group"
                    onClick={() => setSelectedMerchant(m)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{m.display_name}</p>
                        <p className="text-xs text-accent">Verified Merchant</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Price ({selectedCurrency})</span>
                      <span className="text-foreground font-semibold">{getPrice().toLocaleString()}</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground gap-2 mt-2">
                      Sell USDT <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "sell" && selectedMerchant && (
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-6 glow-gold">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><Shield className="w-5 h-5 text-accent" /></div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedMerchant.display_name}</p>
                    <p className="text-xs text-accent">Verified Merchant</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMerchant(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSell} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input type="number" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} placeholder="e.g. 50" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required min="1" />
                  {sellAmount && <p className="text-xs text-accent mt-1">You'll receive: {selectedCurrency} {(Number(sellAmount) * getPrice()).toLocaleString()}</p>}
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 glow-gold">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Sell USDT
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* MY ORDERS TAB */}
        {tab === "my-orders" && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">My P2P Orders</h3>
            </div>
            {(!myOrders || myOrders.length === 0) ? (
              <div className="p-12 text-center text-muted-foreground">No orders yet.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {myOrders.map((o) => {
                  const isBuyer = o.order_type === "buy" && o.user_id === user.id;
                  const isSeller = o.order_type === "sell" && o.user_id === user.id;
                  const isMerchantOnBuy = o.order_type === "buy" && o.matched_user_id === user.id;
                  const isMerchantOnSell = o.order_type === "sell" && o.matched_user_id === user.id;

                  return (
                    <div key={o.id} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.order_type === "buy" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                              {o.order_type.toUpperCase()}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              o.status === "completed" ? "bg-primary/10 text-primary" :
                              o.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                              "bg-secondary text-muted-foreground"
                            }`}>{o.status?.replace("_", " ")}</span>
                          </div>
                          <p className="text-sm text-foreground font-semibold">{Number(o.amount).toLocaleString()} USDT</p>
                          <p className="text-xs text-muted-foreground">
                            {o.local_currency} {(Number(o.amount) * Number(o.price_per_unit)).toLocaleString()} • {new Date(o.created_at!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {/* Buyer confirms payment sent */}
                          {isBuyer && o.status === "pending_payment" && (
                            <>
                              <Button size="sm" onClick={() => confirmPaymentSent(o.id)} className="bg-primary text-primary-foreground h-8 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" /> I've Sent Payment
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id)} className="border-destructive text-destructive h-8 text-xs">Cancel</Button>
                            </>
                          )}
                          {/* Merchant releases USDT to buyer */}
                          {isMerchantOnBuy && o.status === "payment_sent" && (
                            <Button size="sm" onClick={() => releaseUsdt(o.id, o.user_id, Number(o.amount))} className="bg-primary text-primary-foreground h-8 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Release USDT
                            </Button>
                          )}
                          {/* Merchant confirms payment sent for sell order */}
                          {isMerchantOnSell && o.status === "pending_payment" && (
                            <Button size="sm" onClick={() => confirmPaymentSent(o.id)} className="bg-accent text-accent-foreground h-8 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> I've Sent Payment
                            </Button>
                          )}
                          {/* Seller releases USDT to merchant */}
                          {isSeller && o.status === "payment_sent" && (
                            <Button size="sm" onClick={() => releaseUsdtSell(o.id, o.matched_user_id!, Number(o.amount))} className="bg-accent text-accent-foreground h-8 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Release USDT
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PAYMENT METHODS TAB */}
        {tab === "payment-methods" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-foreground">My Payment Methods</h3>
              <Button onClick={() => setShowAddPM(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" /> Add Method
              </Button>
            </div>

            {showAddPM && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md w-full glow-green">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-bold text-foreground">Add Payment Method</h3>
                    <button onClick={() => setShowAddPM(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={addPaymentMethod} className="space-y-4">
                    <div>
                      <Label className="text-foreground text-sm">Method</Label>
                      <select value={pmMethod} onChange={(e) => setPmMethod(e.target.value)} className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
                        <option>MTN MoMo</option>
                        <option>Airtel Money</option>
                        <option>Bank Transfer</option>
                        <option>TRC20 USDT</option>
                        <option>M-Pesa</option>
                        <option>Wave</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-foreground text-sm">Account Name</Label>
                      <Input value={pmAccName} onChange={(e) => setPmAccName(e.target.value)} placeholder="Your full name" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm">Account Number / Address</Label>
                      <Input value={pmAccNum} onChange={(e) => setPmAccNum(e.target.value)} placeholder="Phone number or wallet address" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save
                    </Button>
                  </form>
                </motion.div>
              </div>
            )}

            {(!myPaymentMethods || myPaymentMethods.length === 0) ? (
              <div className="glass-card p-12 text-center text-muted-foreground">No payment methods added. Add one to start trading.</div>
            ) : (
              <div className="space-y-3">
                {myPaymentMethods.map((pm) => (
                  <div key={pm.id} className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{pm.method_name}</p>
                        <p className="text-xs text-muted-foreground">{pm.account_name} — {pm.account_number}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => deletePaymentMethod(pm.id)} className="border-destructive text-destructive h-8 text-xs">Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default P2P;
