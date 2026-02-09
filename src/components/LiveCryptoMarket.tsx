import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  total_volume: number;
}

const LiveCryptoMarket = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCoins(data);
    } catch {
      // Fallback static data
      setCoins([
        { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 67842, price_change_percentage_24h: 2.34, image: "", market_cap: 1330000000000, total_volume: 28000000000 },
        { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3456, price_change_percentage_24h: 1.89, image: "", market_cap: 415000000000, total_volume: 14000000000 },
        { id: "tether", symbol: "usdt", name: "Tether", current_price: 1.0, price_change_percentage_24h: 0.01, image: "", market_cap: 95000000000, total_volume: 52000000000 },
        { id: "binancecoin", symbol: "bnb", name: "BNB", current_price: 612, price_change_percentage_24h: -0.45, image: "", market_cap: 94000000000, total_volume: 1200000000 },
        { id: "solana", symbol: "sol", name: "Solana", current_price: 178, price_change_percentage_24h: 4.12, image: "", market_cap: 79000000000, total_volume: 3200000000 },
        { id: "ripple", symbol: "xrp", name: "XRP", current_price: 2.34, price_change_percentage_24h: -1.23, image: "", market_cap: 62000000000, total_volume: 2100000000 },
        { id: "cardano", symbol: "ada", name: "Cardano", current_price: 0.98, price_change_percentage_24h: 3.45, image: "", market_cap: 35000000000, total_volume: 890000000 },
        { id: "dogecoin", symbol: "doge", name: "Dogecoin", current_price: 0.18, price_change_percentage_24h: -2.11, image: "", market_cap: 26000000000, total_volume: 1500000000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) =>
    price >= 1 ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${price.toFixed(4)}`;

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    return `$${(cap / 1e6).toFixed(2)}M`;
  };

  return (
    <section className="py-20 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm text-accent font-semibold uppercase tracking-wider mb-3">Live Market</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Crypto <span className="text-gradient">Market Prices</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Real-time cryptocurrency prices updated every minute.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-5 gap-4 p-4 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span className="col-span-2">Asset</span>
              <span className="text-right">Price</span>
              <span className="text-right">24h Change</span>
              <span className="text-right">Market Cap</span>
            </div>

            <div className="divide-y divide-border/50">
              {coins.map((coin, i) => {
                const isUp = coin.price_change_percentage_24h >= 0;
                return (
                  <motion.div
                    key={coin.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center"
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                      {coin.image ? (
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
                          {coin.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{coin.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground text-right">{formatPrice(coin.current_price)}</p>
                    <div className="hidden sm:flex items-center justify-end gap-1">
                      {isUp ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                      <span className={`text-sm font-semibold ${isUp ? "text-primary" : "text-destructive"}`}>
                        {isUp ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
                      </span>
                    </div>
                    <p className="hidden sm:block text-sm text-muted-foreground text-right">{formatMarketCap(coin.market_cap)}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LiveCryptoMarket;
