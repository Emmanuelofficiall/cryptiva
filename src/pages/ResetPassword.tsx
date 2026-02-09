import { useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Email sent!", description: "Check your inbox for the reset link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center hero-gradient p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">Cryptiva</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Check Your Email</h3>
              <p className="text-sm text-muted-foreground mb-6">
                We've sent a password reset link to <span className="text-primary font-medium">{email}</span>.
              </p>
              <Link to="/login">
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 glow-green">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send Reset Link <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/login" className="text-primary hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
