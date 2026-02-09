import { motion } from "framer-motion";

const cryptos = [
  { name: "Bitcoin", symbol: "BTC", icon: "₿", color: "from-amber-500 to-orange-600" },
  { name: "Ethereum", symbol: "ETH", icon: "Ξ", color: "from-blue-400 to-indigo-600" },
  { name: "Solana", symbol: "SOL", icon: "◎", color: "from-purple-500 to-violet-600" },
  { name: "BNB", symbol: "BNB", icon: "⬡", color: "from-yellow-400 to-amber-600" },
  { name: "Cardano", symbol: "ADA", icon: "₳", color: "from-cyan-400 to-blue-600" },
  { name: "XRP", symbol: "XRP", icon: "✕", color: "from-gray-300 to-slate-500" },
  { name: "Dogecoin", symbol: "DOGE", icon: "Ð", color: "from-yellow-300 to-amber-500" },
  { name: "Polkadot", symbol: "DOT", icon: "●", color: "from-pink-500 to-rose-600" },
  { name: "Avalanche", symbol: "AVAX", icon: "▲", color: "from-red-500 to-rose-600" },
  { name: "Litecoin", symbol: "LTC", icon: "Ł", color: "from-gray-400 to-slate-600" },
  { name: "Tether", symbol: "USDT", icon: "₮", color: "from-emerald-400 to-green-600" },
  { name: "Polygon", symbol: "MATIC", icon: "⬡", color: "from-violet-500 to-purple-700" },
];

const doubled = [...cryptos, ...cryptos];

const CryptoLogosMarquee = () => {
  return (
    <section className="py-12 overflow-hidden border-y border-border/30 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Supported Cryptocurrencies
        </p>
      </div>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {doubled.map((coin, i) => (
            <div
              key={`${coin.symbol}-${i}`}
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors shrink-0"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${coin.color} flex items-center justify-center text-white font-bold text-lg`}>
                {coin.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{coin.name}</p>
                <p className="text-xs text-muted-foreground">{coin.symbol}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CryptoLogosMarquee;
