import { useState } from "react";
import { FileCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function PaymentProofButton({ path }: { path: string | null }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  if (!path) return <span className="text-xs text-muted-foreground">No proof (older deposit)</span>;
  const open = async () => {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60);
      if (error) throw error;
      if (!tab) throw new Error("Allow pop-ups to view payment proof.");
      tab.location.href = data.signedUrl;
    } catch (error) {
      tab?.close();
      toast({ title: "Unable to open proof", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };
  return <Button size="sm" variant="outline" disabled={loading} onClick={open} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}View proof</Button>;
}