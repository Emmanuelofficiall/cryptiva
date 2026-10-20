import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function AdminMerchantApplications({ onReviewed }: { onReviewed: () => void }) {
  const client = useQueryClient();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { data = [], error, isLoading } = useQuery({ queryKey: ["admin-merchant-applications"], queryFn: async () => {
    const { data, error } = await supabase.from("merchant_applications").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  const review = async (id: string, decision: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await supabase.rpc("review_merchant_application", { application_id: id, decision, note: notes[id] || "" });
    setBusy(null);
    if (error) { toast({ title: "Review failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Application ${decision}` });
    client.invalidateQueries({ queryKey: ["admin-merchant-applications"] });
    client.invalidateQueries({ queryKey: ["merchant-applications"] });
    client.invalidateQueries({ queryKey: ["merchants"] });
    onReviewed();
  };
  return <section className="mb-8 space-y-4"><h2 className="text-lg font-semibold">Merchant Applications</h2>
    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : error ? <p className="text-destructive">Could not load applications.</p> : !data.length ? <p className="text-sm text-muted-foreground">No applications yet.</p> : data.map(a => <article key={a.id} className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex justify-between gap-3"><h3 className="break-words font-semibold">{a.display_name}</h3><span className="text-sm capitalize text-primary">{a.status}</span></div>
      <p className="text-sm text-muted-foreground">{a.country} · {a.contact_phone}</p><p className="whitespace-pre-wrap break-words text-sm">{a.experience}</p>
      {a.status === "pending" ? <><Textarea aria-label={`Review note for ${a.display_name}`} maxLength={1000} placeholder="Review note (optional)" value={notes[a.id] || ""} onChange={e => setNotes({ ...notes, [a.id]: e.target.value })} /><div className="flex gap-2"><Button disabled={busy !== null} onClick={() => review(a.id, "approved")} className="gap-2"><Check className="h-4 w-4" />Approve application</Button><Button variant="outline" disabled={busy !== null} onClick={() => review(a.id, "rejected")} className="gap-2"><X className="h-4 w-4" />Reject application</Button></div></> : a.review_note && <p className="text-sm text-muted-foreground">{a.review_note}</p>}
    </article>)}
  </section>;
}