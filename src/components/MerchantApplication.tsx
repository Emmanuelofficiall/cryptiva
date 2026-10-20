import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Store, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const applicationSchema = z.object({
  display_name: z.string().trim().min(2).max(100), contact_phone: z.string().trim().min(5).max(40),
  country: z.string().trim().min(2).max(100), experience: z.string().trim().min(10).max(2000),
});

export default function MerchantApplication() {
  const { user } = useAuth();
  const client = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState({ display_name: "", contact_phone: "", country: "", experience: "" });
  const { data: applications = [], isLoading, error } = useQuery({ queryKey: ["merchant-applications", user?.id], enabled: !!user, refetchInterval: 10000, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from("merchant_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  const latest = applications[0];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || busy) return;
    const parsed = applicationSchema.safeParse(fields);
    if (!parsed.success) { toast({ title: "Check your application", description: parsed.error.issues[0]?.message, variant: "destructive" }); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("merchant_applications").insert({ user_id: user.id, ...parsed.data });
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["merchant-applications"] });
      client.invalidateQueries({ queryKey: ["notifications"] });
      toast({ title: "Application submitted", description: "Your application is awaiting admin review." });
    } catch (e) { toast({ title: "Could not submit application", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" }); }
    finally { setBusy(false); }
  };
  if (isLoading) return <Loader2 className="mx-auto h-6 w-6 animate-spin" />;
  if (error) return <p className="text-destructive">Could not load your application.</p>;
  return <section className="mx-auto max-w-lg space-y-6">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Store className="h-6 w-6 text-primary" />Become a Merchant</h2>
    {latest && <div className="space-y-2 border-l-2 border-primary pl-4"><p className="font-semibold capitalize">Application {latest.status}</p><p className="text-sm text-muted-foreground">{latest.display_name} · {new Date(latest.created_at).toLocaleDateString()}</p>{latest.review_note && <p className="break-words text-sm">{latest.review_note}</p>}</div>}
    {latest?.status !== "pending" && latest?.status !== "approved" && <form onSubmit={submit} className="space-y-4">
      <div><Label htmlFor="merchant-name">Merchant display name</Label><Input id="merchant-name" required minLength={2} maxLength={100} value={fields.display_name} onChange={e => setFields({ ...fields, display_name: e.target.value })} className="mt-2" /></div>
      <div><Label htmlFor="merchant-phone">Contact phone</Label><Input id="merchant-phone" type="tel" required minLength={5} maxLength={40} value={fields.contact_phone} onChange={e => setFields({ ...fields, contact_phone: e.target.value })} className="mt-2" /></div>
      <div><Label htmlFor="merchant-country">Country</Label><Input id="merchant-country" required minLength={2} maxLength={100} value={fields.country} onChange={e => setFields({ ...fields, country: e.target.value })} className="mt-2" /></div>
      <div><Label htmlFor="merchant-experience">Trading experience</Label><Textarea id="merchant-experience" required minLength={10} maxLength={2000} value={fields.experience} onChange={e => setFields({ ...fields, experience: e.target.value })} className="mt-2" /></div>
      <Button disabled={busy} type="submit" className="w-full gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit application</Button>
    </form>}
  </section>;
}