import { describe, it, expect } from "vitest";
import { parseMarketData, formatPrice, formatMarketCap, formatChange } from "@/lib/market-data";

describe("incomplete market responses", () => {
  it("keeps coins with null or missing financial values without crashing", () => {
    const coins = parseMarketData([{ id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: null, price_change_percentage_24h: null, market_cap: null }, null]);
    expect(coins).toHaveLength(1);
    expect(coins[0].current_price).toBeNull();
    expect(coins[0].total_volume).toBeNull();
    expect(formatPrice(coins[0].current_price)).toBe("—");
    expect(formatMarketCap(coins[0].market_cap)).toBe("—");
    expect(formatChange(coins[0].price_change_percentage_24h)).toBe("—");
  });
  it("preserves zero values and negative changes", () => {
    expect(formatPrice(0)).toBe("$0.0000");
    expect(formatChange(0)).toBe("+0.00%");
    expect(formatChange(-2.5)).toBe("-2.50%");
  });
  it("rejects invalid response shapes and ignores malformed coins", () => {
    expect(() => parseMarketData({ error: "Rate limit" })).toThrow();
    expect(parseMarketData([{ id: "bad" }])).toEqual([]);
    expect(formatPrice(NaN)).toBe("—");
  });
});