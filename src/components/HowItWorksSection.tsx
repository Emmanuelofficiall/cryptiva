import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Register & Verify", desc: "Create your account in 2 minutes and complete a simple verification process." },
  { num: "02", title: "Deposit USDT", desc: "Fund your wallet by sending USDT via TRC20 network to get started." },
  { num: "03", title: "Choose Plan", desc: "Select an investment plan that matches your financial goals and risk appetite." },
  { num: "04", title: "Earn Daily", desc: "Watch your investment grow with daily USDT returns automatically credited to your wallet." },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Start earning passive income in 4 simple steps. No complicated forms, no hidden fees.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <span className="text-5xl font-display font-bold text-primary/20 block mb-4">{step.num}</span>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
