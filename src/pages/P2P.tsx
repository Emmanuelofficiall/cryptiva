import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Navigate } from "react-router-dom";
import {
  Loader2, ShoppingCart, Tag, Plus, X, CheckCircle, CreditCard,
  User, Phone, Wallet, ArrowRight, Shield, ArrowLeftRight, Search,
  BarChart3, Image, ListOrdered, TrendingUp, Store, Copy, Globe, Smartphone, Building2,
  AlertTriangle, Send, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type Tab = "market" | "my-orders" | "my-trades" | "payment" | "gallery" | "orders" | "trades" | "earnings" | "merchant" | "transfer";
type TradeFilter = "all" | "completed" | "pending" | "cancelled";

const P2P = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("market");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<"buy" | "sell">("buy");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("RWF");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [merchantOrderType, setMerchantOrderType] = useState<"buy" | "sell">("buy");
  const [merchantOrderAmount, setMerchantOrderAmount] = useState("");
  const [showAddPM, setShowAddPM] = useState(false);
  const [pmAccName, setPmAccName] = useState("");
  const [pmAccNum, setPmAccNum] = useState("");
  const [pmMethod, setPmMethod] = useState("MTN MoMo");
  const [convertAmount, setConvertAmount] = useState("");
  const [convertDirection, setConvertDirection] = useState<"to-local" | "to-usdt">("to-local");
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("all");
  const [galleryRegion, setGalleryRegion] = useState<"africa" | "international" | "asia">("africa");
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("Payment not received");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [showConfirm, setShowConfirm] = useState<{ type: "buy" | "sell"; amount: string } | null>(null);

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

  // Only fetch merchant orders (orders created by active merchants)
  const { data: openOrders } = useQuery({
    queryKey: ["open-p2p-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("p2p_orders").select("*").eq("status", "open").order("created_at", { ascending: false });
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

  const { data: myDisputes } = useQuery({
    queryKey: ["my-disputes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("p2p_disputes").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myTransfers } = useQuery({
    queryKey: ["my-transfers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("internal_transfers").select("*").or(`sender_user_id.eq.${user!.id},recipient_user_id.eq.${user!.id}`).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-p2p", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;

  const getName = (userId: string) => {
    const p = profiles?.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || "User";
  };

  const getMerchantName = (userId: string) => {
    const m = merchants?.find((m) => m.user_id === userId);
    return m?.display_name || getName(userId);
  };

  const getPrice = (currency?: string) => {
    const c = currencies?.find((c) => c.currency === (currency || selectedCurrency));
    return c ? Number(c.usdt_price) : 0;
  };

  const isMerchant = merchants?.some((m) => m.user_id === user.id);

  // Only show orders from merchants who have active orders
  const merchantUserIds = new Set(merchants?.map((m) => m.user_id) || []);
  const filteredOrders = openOrders?.filter((o) => {
    // Only merchant orders appear in market
    if (!merchantUserIds.has(o.user_id)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.local_currency.toLowerCase().includes(q) ||
      o.payment_method.toLowerCase().includes(q) ||
      o.currency.toLowerCase().includes(q) ||
      o.order_type.toLowerCase().includes(q) ||
      getMerchantName(o.user_id).toLowerCase().includes(q)
    );
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  // Buy USDT from merchant - starts as pending_payment, buyer must verify payment
  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant || !buyAmount) return;
    if (!myPaymentMethods || myPaymentMethods.length === 0) {
      toast({ title: "Add payment method first", description: "Go to the Payment tab to add your payment method before trading.", variant: "destructive" });
      return;
    }
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
      toast({ title: "Buy order created!", description: `Send ${selectedCurrency} ${(Number(buyAmount) * getPrice()).toLocaleString()} to the merchant, then confirm payment in My Orders.` });
      setBuyAmount("");
      setSelectedMerchant(null);
      qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
      qc.invalidateQueries({ queryKey: ["open-p2p-orders"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant || !sellAmount) return;
    if (!myPaymentMethods || myPaymentMethods.length === 0) {
      toast({ title: "Add payment method first", description: "Go to the Payment tab to add your payment method before trading.", variant: "destructive" });
      return;
    }
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
      toast({ title: "Sell order created!", description: "Verify your payment details in My Orders before proceeding." });
      setSellAmount("");
      setSelectedMerchant(null);
      qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
      qc.invalidateQueries({ queryKey: ["open-p2p-orders"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPaymentSent = async (orderId: string) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "payment_sent" }).eq("id", orderId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Payment confirmed!" }); qc.invalidateQueries({ queryKey: ["my-p2p-orders"] }); }
  };

  const releaseUsdt = async (orderId: string, buyerUserId: string, amount: number) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "completed" }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const { data: buyerProfile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", buyerUserId).maybeSingle();
    if (buyerProfile) {
      await supabase.from("profiles").update({ wallet_balance: Number(buyerProfile.wallet_balance || 0) + amount }).eq("user_id", buyerUserId);
    }
    toast({ title: "USDT Released!", description: `${amount} USDT credited to buyer's wallet.` });
    qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
  };

  const releaseUsdtSell = async (orderId: string, merchantUserId: string, amount: number) => {
    const { error } = await supabase.from("p2p_orders").update({ status: "completed" }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "USDT Released!", description: `${amount} USDT released to merchant.` });
    qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("p2p_orders").delete().eq("id", orderId);
    if (!error) { toast({ title: "Order Cancelled" }); qc.invalidateQueries({ queryKey: ["my-p2p-orders"] }); qc.invalidateQueries({ queryKey: ["open-p2p-orders"] }); }
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

  const handleMerchantOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantOrderAmount) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("p2p_orders").insert({
        user_id: user.id,
        order_type: merchantOrderType,
        amount: Number(merchantOrderAmount),
        price_per_unit: getPrice(),
        payment_method: selectedCurrency,
        local_currency: selectedCurrency,
        status: "open",
      });
      if (error) throw error;
      toast({ title: "Order created!", description: `Your ${merchantOrderType} order for ${merchantOrderAmount} USDT is now live.` });
      setMerchantOrderAmount("");
      qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
      qc.invalidateQueries({ queryKey: ["open-p2p-orders"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrderId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("p2p_disputes").insert({
        order_id: disputeOrderId,
        reporter_user_id: user.id,
        reason: disputeReason,
        description: disputeDesc || null,
      });
      if (error) throw error;
      // Mark order as disputed
      await supabase.from("p2p_orders").update({ status: "disputed" }).eq("id", disputeOrderId);
      toast({ title: "Dispute submitted!", description: "An admin will review your dispute shortly." });
      setDisputeOrderId(null);
      setDisputeReason("Payment not received");
      setDisputeDesc("");
      qc.invalidateQueries({ queryKey: ["my-p2p-orders"] });
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmail || !transferAmount) return;
    setSubmitting(true);
    try {
      // Find recipient by email
      const { data: recipientProfile } = await supabase.from("profiles").select("user_id, full_name").eq("email", transferEmail).maybeSingle();
      if (!recipientProfile) { toast({ title: "User not found", description: "No user with that email exists.", variant: "destructive" }); return; }
      if (recipientProfile.user_id === user.id) { toast({ title: "Cannot transfer to yourself", variant: "destructive" }); return; }
      const amount = Number(transferAmount);
      const balance = Number(myProfile?.wallet_balance || 0);
      if (amount > balance) { toast({ title: "Insufficient balance", description: `Your balance is ${balance} USDT.`, variant: "destructive" }); return; }

      // Deduct from sender
      await supabase.from("profiles").update({ wallet_balance: balance - amount }).eq("user_id", user.id);
      // Credit recipient
      const { data: recProfile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", recipientProfile.user_id).maybeSingle();
      await supabase.from("profiles").update({ wallet_balance: Number(recProfile?.wallet_balance || 0) + amount }).eq("user_id", recipientProfile.user_id);
      // Record transfer
      const { error } = await supabase.from("internal_transfers").insert({
        sender_user_id: user.id,
        recipient_user_id: recipientProfile.user_id,
        amount,
        note: transferNote || null,
      });
      if (error) throw error;
      toast({ title: "Transfer successful!", description: `${amount} USDT sent to ${recipientProfile.full_name || transferEmail}.` });
      setTransferEmail("");
      setTransferAmount("");
      setTransferNote("");
      qc.invalidateQueries({ queryKey: ["my-transfers"] });
      qc.invalidateQueries({ queryKey: ["my-profile-p2p"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "market", label: "Market", icon: ShoppingCart },
    { key: "my-orders", label: "My Orders", icon: ListOrdered },
    { key: "my-trades", label: "My Trades", icon: ArrowLeftRight },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "gallery", label: "Gallery", icon: Image },
    { key: "orders", label: "Orders", icon: Wallet },
    { key: "trades", label: "Trades", icon: BarChart3 },
    { key: "earnings", label: "Earnings", icon: TrendingUp },
    ...(isMerchant ? [
      { key: "merchant" as Tab, label: "Merchant", icon: Store },
      { key: "transfer" as Tab, label: "Transfer", icon: Send },
    ] : []),
  ];

  const myTrades = myOrders?.filter((o) => o.status === "completed") || [];
  const myActiveOrders = myOrders?.filter((o) => o.user_id === user.id && o.status !== "completed" && o.status !== "cancelled") || [];

  // Earnings calculation
  const totalP2PEarnings = myTrades.reduce((sum, t) => {
    // For buy trades, user bought USDT. For sell trades, user sold USDT.
    return sum + Number(t.amount);
  }, 0);
  const buyTrades = myTrades.filter((t) => t.order_type === "buy");
  const sellTrades = myTrades.filter((t) => t.order_type === "sell");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <ArrowLeftRight className="w-7 h-7 text-foreground" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">P2P Trading</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-10">
            Buy and sell USDT globally with {currencies?.length || 0} currencies
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSelectedMerchant(null); }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* MARKET TAB - Only merchant orders */}
        {tab === "market" && !selectedMerchant && (
          <div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by currency or payment method..."
                className="pl-12 py-6 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl text-sm"
              />
            </div>

            {(!filteredOrders || filteredOrders.length === 0) ? (
              <div className="glass-card p-16 text-center">
                <p className="text-muted-foreground">No orders available at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((o, i) => {
                  const orderMerchant = merchants?.find((m) => m.user_id === o.user_id);
                  return (
                    <motion.div
                      key={o.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {orderMerchant?.photo_url ? (
                          <img src={orderMerchant.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground text-sm">{getMerchantName(o.user_id)}</p>
                          <p className="text-xs text-muted-foreground">{o.payment_method} • Verified Merchant</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{Number(o.amount).toLocaleString()} USDT</p>
                          <p className="text-xs text-muted-foreground">{o.local_currency} {Number(o.price_per_unit).toLocaleString()}/USDT</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          o.order_type === "buy" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                        }`}>
                          {o.order_type === "buy" ? "BUYING" : "SELLING"}
                        </span>
                        {o.user_id !== user.id && (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (orderMerchant) {
                                setSelectedMerchant(orderMerchant);
                                setSelectedCurrency(o.local_currency);
                                // If merchant is BUYING, user SELLs. If merchant is SELLING, user BUYs.
                                setSelectedOrderType(o.order_type === "buy" ? "sell" : "buy");
                              }
                            }}
                            className={`h-8 text-xs ${
                              o.order_type === "buy"
                                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                          >
                            {o.order_type === "buy" ? "Sell" : "Buy"}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected merchant - Buy/Sell form */}
        {tab === "market" && selectedMerchant && (
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-6 glow-green">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedMerchant.photo_url ? (
                    <img src={selectedMerchant.photo_url} alt={selectedMerchant.display_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{selectedMerchant.display_name}</p>
                    <p className="text-xs text-primary">Verified Merchant</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMerchant(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* Merchant payment details with separate copy for name and number */}
              {merchantPayments && merchantPayments.length > 0 && (
                <div className="bg-secondary rounded-xl p-4 mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Payment Details</p>
                  {merchantPayments.map((pm) => (
                    <div key={pm.id} className="py-3 border-b border-border/30 last:border-0">
                      <p className="text-xs text-muted-foreground mb-1">{pm.method_name}</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">Name: <span className="font-medium">{pm.account_name}</span></span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(pm.account_name, "Account Name")} className="h-7 px-2 text-primary hover:text-primary text-xs gap-1">
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Number: <span className="font-medium">{pm.account_number}</span></span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(pm.account_number, "Account Number")} className="h-7 px-2 text-primary hover:text-primary text-xs gap-1">
                          <Copy className="w-3 h-3" /> Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show only Buy form when user wants to buy */}
              {selectedOrderType === "buy" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground text-sm">Buy Amount (USDT)</Label>
                    <Input type="number" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} placeholder="e.g. 50" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" min="1" />
                    {buyAmount && (
                      <div className="mt-2 bg-primary/10 rounded-lg p-3">
                        <p className="text-sm font-semibold text-primary">Amount to send: {selectedCurrency} {(Number(buyAmount) * getPrice()).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Send this exact amount to the merchant's payment method above</p>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => { if (buyAmount) setShowConfirm({ type: "buy", amount: buyAmount }); }} disabled={!buyAmount} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                    <ShoppingCart className="w-4 h-4 mr-2" />Buy USDT
                  </Button>
                </div>
              )}

              {/* Show only Sell form when user wants to sell */}
              {selectedOrderType === "sell" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground text-sm">Sell Amount (USDT)</Label>
                    <Input type="number" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} placeholder="e.g. 50" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" min="1" />
                    {sellAmount && (
                      <div className="mt-2 bg-accent/10 rounded-lg p-3">
                        <p className="text-sm font-semibold text-accent">You'll receive: {selectedCurrency} {(Number(sellAmount) * getPrice()).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">The merchant will send this amount to your payment method</p>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => { if (sellAmount) setShowConfirm({ type: "sell", amount: sellAmount }); }} disabled={!sellAmount} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 glow-gold">
                    <Tag className="w-4 h-4 mr-2" />Sell USDT
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MY ORDERS TAB - with verification flow */}
        {tab === "my-orders" && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">My P2P Orders</h3>
              <p className="text-sm text-muted-foreground">Both parties must verify payments before completing trades</p>
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

                  const statusSteps = (() => {
                    if (o.order_type === "buy") {
                      return [
                        { label: "Order Created", done: true },
                        { label: "Buyer Sends Payment", done: ["payment_sent", "completed"].includes(o.status) },
                        { label: "Merchant Verifies & Releases USDT", done: o.status === "completed" },
                      ];
                    } else {
                      return [
                        { label: "Order Created", done: true },
                        { label: "Merchant Sends Payment", done: ["payment_sent", "completed"].includes(o.status) },
                        { label: "Seller Verifies & Releases USDT", done: o.status === "completed" },
                      ];
                    }
                  })();

                  return (
                    <div key={o.id} className="p-4">
                      <div className="flex flex-col gap-3">
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
                            {o.matched_user_id && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Trading with: {getName(o.matched_user_id === user.id ? o.user_id : o.matched_user_id)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {/* BUY flow: buyer confirms payment → merchant verifies & releases */}
                            {isBuyer && o.status === "pending_payment" && (
                              <>
                                <Button size="sm" onClick={() => confirmPaymentSent(o.id)} className="bg-primary text-primary-foreground h-8 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Verify: I've Sent Payment
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id)} className="border-destructive text-destructive h-8 text-xs">Cancel</Button>
                              </>
                            )}
                            {isBuyer && o.status === "payment_sent" && (
                              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">⏳ Waiting for merchant to verify & release</span>
                            )}
                            {isMerchantOnBuy && o.status === "pending_payment" && (
                              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">⏳ Waiting for buyer to send payment</span>
                            )}
                            {isMerchantOnBuy && o.status === "payment_sent" && (
                              <Button size="sm" onClick={() => releaseUsdt(o.id, o.user_id, Number(o.amount))} className="bg-primary text-primary-foreground h-8 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verify Payment Received & Release USDT
                              </Button>
                            )}
                            {/* SELL flow: merchant confirms payment → seller verifies & releases */}
                            {isMerchantOnSell && o.status === "pending_payment" && (
                              <Button size="sm" onClick={() => confirmPaymentSent(o.id)} className="bg-accent text-accent-foreground h-8 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verify: I've Sent Payment
                              </Button>
                            )}
                            {isMerchantOnSell && o.status === "payment_sent" && (
                              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">⏳ Waiting for seller to verify & release</span>
                            )}
                            {isSeller && o.status === "pending_payment" && (
                              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">⏳ Waiting for merchant to send payment</span>
                            )}
                            {isSeller && o.status === "payment_sent" && (
                              <Button size="sm" onClick={() => releaseUsdtSell(o.id, o.matched_user_id!, Number(o.amount))} className="bg-accent text-accent-foreground h-8 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verify Payment Received & Release USDT
                              </Button>
                            )}
                            {o.user_id === user.id && o.status === "open" && (
                              <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id)} className="border-destructive text-destructive h-8 text-xs">Cancel</Button>
                            )}
                            {/* Dispute button for active non-completed trades */}
                            {o.status !== "completed" && o.status !== "cancelled" && o.status !== "open" && o.status !== "disputed" && (
                              <Button size="sm" variant="outline" onClick={() => setDisputeOrderId(o.id)} className="border-destructive text-destructive h-8 text-xs gap-1">
                                <AlertTriangle className="w-3 h-3" /> Dispute
                              </Button>
                            )}
                            {o.status === "disputed" && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive">⚠️ Disputed</span>
                            )}
                          </div>
                        </div>
                        {/* Progress steps */}
                        {o.status !== "cancelled" && o.status !== "open" && (
                          <div className="flex items-center gap-1 mt-1">
                            {statusSteps.map((step, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${step.done ? "bg-primary" : "bg-muted-foreground/30"}`} />
                                <span className={`text-[10px] ${step.done ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                                {i < statusSteps.length - 1 && <div className={`w-6 h-0.5 ${step.done ? "bg-primary" : "bg-muted-foreground/30"}`} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MY TRADES TAB */}
        {tab === "my-trades" && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">Completed Trades</h3>
            </div>
            {myTrades.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No completed trades yet.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {myTrades.map((o) => (
                  <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.order_type === "buy" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                          {o.order_type.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">completed</span>
                      </div>
                      <p className="text-sm text-foreground font-semibold">{Number(o.amount).toLocaleString()} USDT</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at!).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAYMENT TAB with copy functionality */}
        {tab === "payment" && (
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(pm.account_number, pm.method_name)}
                        className="h-8 px-2 text-primary hover:text-primary"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deletePaymentMethod(pm.id)} className="border-destructive text-destructive h-8 text-xs">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GALLERY TAB - Payment Methods Gallery */}
        {tab === "gallery" && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-3 mb-1">
                <Globe className="w-6 h-6 text-primary" />
                <h3 className="font-display font-semibold text-foreground text-lg">Payment Methods Gallery</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-9">30+ payment methods supported across 13 currencies</p>
            </div>
            <div className="p-4">
              <div className="flex rounded-lg overflow-hidden border border-border mb-6">
                {([
                  { key: "africa" as const, label: "Africa", icon: Smartphone },
                  { key: "international" as const, label: "International", icon: CreditCard },
                  { key: "asia" as const, label: "Asia", icon: Building2 },
                ]).map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setGalleryRegion(r.key)}
                    className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      galleryRegion === r.key
                        ? "bg-accent text-accent-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <r.icon className="w-4 h-4" />
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {galleryRegion === "africa" && [
                  { name: "MTN Mobile Money", desc: "Mobile money transfer - Rwanda, Uganda, Ghana", emoji: "📱" },
                  { name: "Airtel Money", desc: "Mobile money transfer - Multiple African countries", emoji: "📲" },
                  { name: "M-Pesa", desc: "Mobile money - Kenya, Tanzania", emoji: "💰" },
                  { name: "Bank of Kigali", desc: "Bank transfer - Rwanda", emoji: "🏦" },
                  { name: "Equity Bank", desc: "Bank transfer - Kenya, Rwanda, Uganda", emoji: "🏦" },
                  { name: "Orange Money", desc: "Mobile money - Central & West Africa", emoji: "📱" },
                  { name: "Wave", desc: "Mobile money - Senegal, Côte d'Ivoire", emoji: "🌊" },
                  { name: "Ecobank", desc: "Bank transfer - Pan-African", emoji: "🏦" },
                ].map((pm) => (
                  <div key={pm.name} className="glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl">{pm.emoji}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pm.name}</p>
                      <p className="text-xs text-muted-foreground">{pm.desc}</p>
                    </div>
                  </div>
                ))}
                {galleryRegion === "international" && [
                  { name: "Bank Transfer (SWIFT)", desc: "International wire transfer", emoji: "🏦" },
                  { name: "PayPal", desc: "Online payment - Global", emoji: "💳" },
                  { name: "Wise (TransferWise)", desc: "Low-cost international transfer", emoji: "🌍" },
                  { name: "Western Union", desc: "Money transfer - Global", emoji: "💵" },
                  { name: "Skrill", desc: "Digital wallet - International", emoji: "💰" },
                  { name: "TRC20 USDT", desc: "Crypto wallet - TRON network", emoji: "🔗" },
                ].map((pm) => (
                  <div key={pm.name} className="glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl">{pm.emoji}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pm.name}</p>
                      <p className="text-xs text-muted-foreground">{pm.desc}</p>
                    </div>
                  </div>
                ))}
                {galleryRegion === "asia" && [
                  { name: "GCash", desc: "Mobile wallet - Philippines", emoji: "📱" },
                  { name: "GoPay", desc: "Digital wallet - Indonesia", emoji: "💳" },
                  { name: "UPI", desc: "Unified Payments - India", emoji: "🇮🇳" },
                  { name: "PromptPay", desc: "Mobile payment - Thailand", emoji: "📲" },
                ].map((pm) => (
                  <div key={pm.name} className="glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl">{pm.emoji}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{pm.name}</p>
                      <p className="text-xs text-muted-foreground">{pm.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">Active Orders</h3>
            </div>
            {myActiveOrders.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No active orders.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {myActiveOrders.map((o) => (
                  <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.order_type === "buy" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                        {o.order_type.toUpperCase()}
                      </span>
                      <p className="text-sm text-foreground font-semibold mt-1">{Number(o.amount).toLocaleString()} USDT</p>
                      <p className="text-xs text-muted-foreground">{o.status?.replace("_", " ")}</p>
                    </div>
                    {o.status === "open" && (
                      <Button size="sm" variant="outline" onClick={() => cancelOrder(o.id)} className="border-destructive text-destructive h-8 text-xs">Cancel</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRADES TAB - with filters like reference */}
        {tab === "trades" && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-display font-semibold text-foreground text-lg">Trade History</h3>
              <p className="text-sm text-muted-foreground">View all your P2P trades</p>
            </div>
            <div className="p-4">
              <div className="flex rounded-lg overflow-hidden border border-border mb-6">
                {(["all", "completed", "pending", "cancelled"] as TradeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTradeFilter(f)}
                    className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                      tradeFilter === f
                        ? "bg-accent text-accent-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {(() => {
                const allTrades = myOrders || [];
                const filtered = tradeFilter === "all"
                  ? allTrades
                  : allTrades.filter((o) => {
                      if (tradeFilter === "completed") return o.status === "completed";
                      if (tradeFilter === "pending") return ["pending_payment", "payment_sent", "open"].includes(o.status);
                      if (tradeFilter === "cancelled") return o.status === "cancelled";
                      return true;
                    });
                return filtered.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">No trades yet</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filtered.map((o) => (
                      <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        <p className="text-xs text-muted-foreground">
                          {o.matched_user_id ? `with ${getName(o.matched_user_id === user.id ? o.user_id : o.matched_user_id)}` : "Open"}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* EARNINGS TAB */}
        {tab === "earnings" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="glass-card p-5 text-center">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold text-foreground">{totalP2PEarnings.toLocaleString()} USDT</p>
                <p className="text-xs text-muted-foreground">Total Volume Traded</p>
              </div>
              <div className="glass-card p-5 text-center">
                <ShoppingCart className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold text-foreground">{buyTrades.length}</p>
                <p className="text-xs text-muted-foreground">Buy Trades</p>
              </div>
              <div className="glass-card p-5 text-center">
                <Tag className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-2xl font-display font-bold text-foreground">{sellTrades.length}</p>
                <p className="text-xs text-muted-foreground">Sell Trades</p>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-display font-semibold text-foreground">Trade History</h3>
              </div>
              {myTrades.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No completed trades yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs text-muted-foreground font-medium p-4">Type</th>
                        <th className="text-left text-xs text-muted-foreground font-medium p-4">Amount</th>
                        <th className="text-left text-xs text-muted-foreground font-medium p-4">Local Value</th>
                        <th className="text-left text-xs text-muted-foreground font-medium p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTrades.map((t) => (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="p-4">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${t.order_type === "buy" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                              {t.order_type.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-foreground font-semibold">{Number(t.amount).toLocaleString()} USDT</td>
                          <td className="p-4 text-sm text-muted-foreground">{t.local_currency} {(Number(t.amount) * Number(t.price_per_unit)).toLocaleString()}</td>
                          <td className="p-4 text-sm text-muted-foreground">{new Date(t.created_at!).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MERCHANT TAB */}
        {tab === "merchant" && isMerchant && (
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-6 glow-green">
              <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Create P2P Order
              </h3>
              <div className="flex gap-2 mb-6">
                <Button type="button" onClick={() => setMerchantOrderType("buy")}
                  className={`flex-1 ${merchantOrderType === "buy" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Buy Order
                </Button>
                <Button type="button" onClick={() => setMerchantOrderType("sell")}
                  className={`flex-1 ${merchantOrderType === "sell" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <Tag className="w-4 h-4 mr-2" /> Sell Order
                </Button>
              </div>
              <div className="mb-4">
                <Label className="text-foreground text-sm">Currency</Label>
                <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
                  {(currencies || []).map((c) => (
                    <option key={c.currency} value={c.currency}>{c.currency} — {Number(c.usdt_price).toLocaleString()} per USDT</option>
                  ))}
                </select>
              </div>
              <form onSubmit={handleMerchantOrder} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input type="number" value={merchantOrderAmount} onChange={(e) => setMerchantOrderAmount(e.target.value)} placeholder="e.g. 100" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required min="1" />
                  {merchantOrderAmount && (
                    <p className="text-xs text-primary mt-1">{selectedCurrency} value: {(Number(merchantOrderAmount) * getPrice()).toLocaleString()}</p>
                  )}
                </div>
                <Button type="submit" disabled={submitting} className={`w-full ${merchantOrderType === "buy" ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-green" : "bg-accent text-accent-foreground hover:bg-accent/90 glow-gold"}`}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create {merchantOrderType === "buy" ? "Buy" : "Sell"} Order
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* TRANSFER TAB - Merchants internal USDT transfer */}
        {tab === "transfer" && isMerchant && (
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-6 glow-green">
              <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Internal USDT Transfer
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Send USDT to another user on the platform</p>
              <div className="bg-secondary rounded-xl p-4 mb-4 text-center">
                <p className="text-xs text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-display font-bold text-foreground">{Number(myProfile?.wallet_balance || 0).toLocaleString()} USDT</p>
              </div>
              <form onSubmit={handleInternalTransfer} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Recipient Email</Label>
                  <Input type="email" value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="user@example.com" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Amount (USDT)</Label>
                  <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="e.g. 50" className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" required min="1" />
                </div>
                <div>
                  <Label className="text-foreground text-sm">Note (optional)</Label>
                  <Input value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder="Payment for..." className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send USDT
                </Button>
              </form>

              {/* Transfer history */}
              {myTransfers && myTransfers.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Transfer History</h4>
                  <div className="space-y-2">
                    {myTransfers.map((t: any) => (
                      <div key={t.id} className="bg-secondary rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {t.sender_user_id === user.id ? "Sent" : "Received"} {Number(t.amount).toLocaleString()} USDT
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.sender_user_id === user.id ? `To: ${getName(t.recipient_user_id)}` : `From: ${getName(t.sender_user_id)}`}
                          </p>
                          {t.note && <p className="text-xs text-muted-foreground mt-1">"{t.note}"</p>}
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirm && selectedMerchant && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 max-w-sm w-full">
              <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" /> Confirm {showConfirm.type === "buy" ? "Buy" : "Sell"} Order
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className={`font-semibold ${showConfirm.type === "buy" ? "text-primary" : "text-accent"}`}>{showConfirm.type.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-foreground font-semibold">{Number(showConfirm.amount).toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="text-foreground">{selectedCurrency} {getPrice().toLocaleString()}/USDT</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="text-muted-foreground font-semibold">{showConfirm.type === "buy" ? "You pay" : "You receive"}</span>
                  <span className="text-foreground font-bold">{selectedCurrency} {(Number(showConfirm.amount) * getPrice()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Merchant</span>
                  <span className="text-foreground">{selectedMerchant.display_name}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowConfirm(null)} className="flex-1 border-border text-foreground">Cancel</Button>
                <Button
                  disabled={submitting}
                  onClick={async () => {
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                    if (showConfirm.type === "buy") {
                      await handleBuy(fakeEvent);
                    } else {
                      await handleSell(fakeEvent);
                    }
                    setShowConfirm(null);
                  }}
                  className={`flex-1 ${showConfirm.type === "buy" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-accent text-accent-foreground hover:bg-accent/90"}`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm {showConfirm.type === "buy" ? "Buy" : "Sell"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Dispute Modal */}
        {disputeOrderId && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" /> Report Dispute
                </h3>
                <button onClick={() => setDisputeOrderId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={submitDispute} className="space-y-4">
                <div>
                  <Label className="text-foreground text-sm">Reason</Label>
                  <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
                    <option>Payment not received</option>
                    <option>Wrong amount sent</option>
                    <option>Merchant unresponsive</option>
                    <option>USDT not released</option>
                    <option>Fraudulent activity</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <Label className="text-foreground text-sm">Description</Label>
                  <textarea
                    value={disputeDesc}
                    onChange={(e) => setDisputeDesc(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm min-h-[100px] placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                  Submit Dispute
                </Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Currency Converter */}
        <div className="mt-12 glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Currency Converter</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <Label className="text-foreground text-sm">
                {convertDirection === "to-local" ? "USDT Amount" : `${selectedCurrency} Amount`}
              </Label>
              <Input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConvertDirection(convertDirection === "to-local" ? "to-usdt" : "to-local")}
              className="border-border text-foreground h-10"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
            <div className="flex-1 w-full">
              <Label className="text-foreground text-sm">
                {convertDirection === "to-local" ? `${selectedCurrency}` : "USDT"}
              </Label>
              <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm">
                {(currencies || []).map((c) => (
                  <option key={c.currency} value={c.currency}>{c.currency}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <Label className="text-foreground text-sm">Result</Label>
              <div className="mt-1.5 rounded-lg bg-secondary border border-border text-foreground p-2.5 text-sm font-semibold">
                {convertAmount
                  ? convertDirection === "to-local"
                    ? `${selectedCurrency} ${(Number(convertAmount) * getPrice()).toLocaleString()}`
                    : `${(Number(convertAmount) / (getPrice() || 1)).toLocaleString(undefined, { maximumFractionDigits: 4 })} USDT`
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default P2P;
