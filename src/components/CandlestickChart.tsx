import { useMemo } from "react";

interface CandleData {
  label: string;
  open: number;
  close: number;
  high: number;
  low: number;
}

const generateCandleData = (pair: string, days: number = 20): CandleData[] => {
  const seed = pair.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const data: CandleData[] = [];
  let price = seed * 13.7;
  for (let i = 0; i < days; i++) {
    const rand = () => (Math.sin(seed * (i + 1) * 9301 + 49297) % 1 + 1) % 1;
    const change = (rand() - 0.45) * price * 0.04;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(change) * rand() * 0.5;
    const low = Math.min(open, close) - Math.abs(change) * rand() * 0.5;
    price = close;
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    data.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      open: Math.round(open * 100) / 100,
      close: Math.round(close * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
    });
  }
  return data;
};

interface Props {
  pair?: string;
  height?: number;
  showLabels?: boolean;
}

const CandlestickChart = ({ pair = "BTC/USDT", height = 160, showLabels = false }: Props) => {
  const data = useMemo(() => generateCandleData(pair), [pair]);

  const allPrices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const range = maxPrice - minPrice || 1;

  const chartW = 100;
  const chartH = 100;
  const candleW = chartW / data.length;
  const bodyW = candleW * 0.6;

  const toY = (price: number) => chartH - ((price - minPrice) / range) * (chartH * 0.85) - chartH * 0.05;

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" className="w-full h-full">
        {data.map((d, i) => {
          const x = i * candleW + candleW / 2;
          const bullish = d.close >= d.open;
          const color = bullish ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)";
          const bodyTop = toY(Math.max(d.open, d.close));
          const bodyBottom = toY(Math.min(d.open, d.close));
          const bodyHeight = Math.max(bodyBottom - bodyTop, 0.3);

          return (
            <g key={i}>
              {/* Wick */}
              <line x1={x} y1={toY(d.high)} x2={x} y2={toY(d.low)} stroke={color} strokeWidth={0.15} />
              {/* Body */}
              <rect
                x={x - bodyW / 2}
                y={bodyTop}
                width={bodyW}
                height={bodyHeight}
                fill={bullish ? color : color}
                rx={0.15}
                opacity={0.9}
              />
            </g>
          );
        })}
      </svg>
      {showLabels && (
        <div className="flex justify-between px-1 mt-1">
          <span className="text-[10px] text-muted-foreground">{data[0]?.label}</span>
          <span className="text-[10px] text-muted-foreground">{data[data.length - 1]?.label}</span>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;
