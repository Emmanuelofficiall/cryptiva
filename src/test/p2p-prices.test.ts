import { describe, expect, it } from "vitest";
import { getP2PRate } from "@/lib/p2p-prices";

const settings = [
  { currency: "RWF", buy_price: 1400, sell_price: 1500, usdt_price: 999 },
  { currency: "KES", buy_price: 125, sell_price: 135, usdt_price: 999 },
];

describe("admin P2P prices", () => {
  it("charges customers the admin selling rate when buying USDT", () => {
    for (const setting of settings) {
      expect(getP2PRate(settings, setting.currency, "buy")).toBe(setting.sell_price);
    }
  });
  it("pays customers the admin buying rate when selling USDT", () => {
    for (const setting of settings) {
      expect(getP2PRate(settings, setting.currency, "sell")).toBe(setting.buy_price);
    }
  });
  it("prices merchant orders at the corresponding admin rate", () => {
    expect(getP2PRate(settings, "RWF", "buy", "merchant")).toBe(1400);
    expect(getP2PRate(settings, "RWF", "sell", "merchant")).toBe(1500);
  });
  it("uses updated admin prices instead of the legacy generic rate", () => {
    const updated = [{ ...settings[0], sell_price: 1600 }];
    expect(getP2PRate(updated, "RWF", "buy")).toBe(1600);
  });
  it("does not fabricate rates for missing or invalid admin settings", () => {
    expect(getP2PRate(settings, "USD", "buy")).toBe(0);
    expect(getP2PRate([{ currency: "RWF", buy_price: null, sell_price: -1 }], "RWF", "buy")).toBe(0);
  });
});