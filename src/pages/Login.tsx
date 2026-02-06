import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DollarSign, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: isLogin ? "Welcome back!" : "Account created!",
      description: isLogin ? "Redirecting to dashboard..." : "Your account has been created successfully.",
    });
    setTimeout(() => navigate("/"), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center hero-gradient p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">InvestRW</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? "Sign in to access your dashboard" : "Start your investment journey today"}
          </p>
        </div>

        <div className="glass-card p-8">
          <div className="flex mb-6 rounded-lg bg-secondary overflow-hidden">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                !isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-foreground text-sm">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean-Claude Mugabo"
                  className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            )}

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

            <div>
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="referral" className="text-foreground text-sm">Referral Code (Optional)</Label>
                <Input
                  id="referral"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Enter referral code"
                  className="mt-1.5 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 glow-green">
              {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {isLogin && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              <button className="text-primary hover:underline">Forgot password?</button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="text-primary hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
