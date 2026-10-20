import { z } from "zod";

const marketNumber = z.number().finite().nullish().transform(value => value ?? null);
const coinSchema = z.object({
  id: z.string(), symbol: z.string(), name: z.string(),
  current_price: marketNumber, price_change_percentage_24h: marketNumber,
  market_cap: marketNumber, total_volume: marketNumber,
  image: z.string().nullish().transform(value => value ?? ""),
});
export type CoinData = z.infer<typeof coinSchema>;

export function parseMarketData(data: unknown): CoinData[] {
  if (!Array.isArray(data)) throw new Error("Invalid market response");
  return data.flatMap(row => {
    const result = coinSchema.safeParse(row);
    return result.success ? [result.data] : [];
  });
}

export function formatPrice(price: number | null | undefined): string {
  if (typeof price !== "number" || !Number.isFinite(price)) return "—";
  return price >= 1 ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${price.toFixed(4)}`;
}

export function formatMarketCap(cap: number | null | undefined): string {
  if (typeof cap !== "number" || !Number.isFinite(cap)) return "—";
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  return `$${(cap / 1e6).toFixed(2)}M`;
}

export function formatChange(change: number | null | undefined): string {
  if (typeof change !== "number" || !Number.isFinite(change)) return "—";
  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
}