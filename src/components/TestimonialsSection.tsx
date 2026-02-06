import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "I started with the Bronze plan 3 months ago. My investment has grown significantly. The daily returns are consistent and withdrawals are fast!",
    gain: "+70% in 90 days",
    name: "Jean-Claude M.",
    location: "Kigali",
    avatar: "https://i.pravatar.cc/100?u=jean",
  },
  {
    quote: "As a small business owner, this platform helps me grow my savings passively. The Mobile Money integration makes deposits so easy.",
    gain: "+55% in 60 days",
    name: "Grace U.",
    location: "Huye",
    avatar: "https://i.pravatar.cc/100?u=grace",
  },
  {
    quote: "The admin verification gives me peace of mind. Every transaction is transparent. I've reinvested my profits twice already.",
    gain: "+120% in 6 months",
    name: "Patrick N.",
    location: "Musanze",
    avatar: "https://i.pravatar.cc/100?u=patrick",
  },
  {
    quote: "I was skeptical at first, but the daily returns are real. Started with Starter plan, now on Gold. Customer support is excellent too.",
    gain: "+85% in 4 months",
    name: "Claudine M.",
    location: "Kigali",
    avatar: "https://i.pravatar.cc/100?u=claudine",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Success Stories</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Trusted by Our Investors
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <p className="text-foreground/80 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                {t.gain}
              </span>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
