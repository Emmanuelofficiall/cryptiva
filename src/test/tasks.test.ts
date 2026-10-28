import { describe, expect, it } from "vitest";
import {
  getTaskInvestmentId,
  makeTaskDescription,
  getPlanDailyIncome,
  getPlanExchangeReward,
  formatPlanLabel,
} from "@/lib/tasks";

describe("Tasks and plan utilities", () => {
  it("encodes and extracts investment id from task descriptions", () => {
    const invId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const desc = makeTaskDescription("BTC/USDT", "Solana", invId, "buy");
    expect(desc).toContain(`(inv:${invId})`);
    expect(desc).toContain("BUY BTC/USDT for Solana");
    expect(getTaskInvestmentId({ description: desc })).toBe(invId);

    const defaultDesc = makeTaskDescription("ETH/USDT", "Bitcoin", invId);
    expect(defaultDesc).toBe(`Trade ETH/USDT for Bitcoin (inv:${invId})`);
    expect(getTaskInvestmentId({ description: defaultDesc })).toBe(invId);

    expect(getTaskInvestmentId({ description: "Trade BTC/USDT to earn daily reward" })).toBeNull();
    expect(getTaskInvestmentId({ description: null })).toBeNull();
  });

  it("calculates plan daily income and exchange rewards correctly", () => {
    // Solana: $60 at 100/30 (3.3333%) = $2.00
    const solanaDaily = getPlanDailyIncome(60, 100 / 30);
    expect(Number(solanaDaily.toFixed(2))).toBe(2);
    expect(Number(getPlanExchangeReward(60, 100 / 30, 5).toFixed(2))).toBe(0.4);

    // Bitcoin: $15 at 4% = $0.60
    const btcDaily = getPlanDailyIncome(15, 4);
    expect(Number(btcDaily.toFixed(2))).toBe(0.6);
    expect(Number(getPlanExchangeReward(15, 4, 5).toFixed(2))).toBe(0.12);
  });

  it("formats plan labels distinctively when duplicate plans exist", () => {
    const plans = [
      { id: "1", plan_name: "Solana" },
      { id: "2", plan_name: "Solana" },
      { id: "3", plan_name: "Bitcoin" },
    ];
    expect(formatPlanLabel(plans[0], plans)).toBe("Solana #1");
    expect(formatPlanLabel(plans[1], plans)).toBe("Solana #2");
    expect(formatPlanLabel(plans[2], plans)).toBe("Bitcoin");
  });
});

