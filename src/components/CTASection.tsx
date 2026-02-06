import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Award, Users } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Start Your Journey</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-6">
          Ready to Start <span className="text-gradient">Growing Your Wealth?</span>
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Join 10,000+ Rwandan investors earning daily returns. Create your account in minutes and start your first investment today.
        </p>
        <Link to="/login">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 glow-green">
            Get Started
          </Button>
        </Link>
        <div className="flex justify-center gap-8 mt-10">
          {[
            { icon: Shield, label: "Secure Platform" },
            { icon: Award, label: "Licensed & Regulated" },
            { icon: Users, label: "10,000+ Active Users" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-muted-foreground text-sm">
              <item.icon className="w-4 h-4 text-primary" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
