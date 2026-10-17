import { describe, expect, it } from "vitest";
import { referralRewardProgress } from "@/lib/referral-rewards";

describe("repeatable referral reward", () => {
  it("does not award before 15 qualifying invited users", () => {
    expect(referralRewardProgress(14)).toMatchObject({ earnedUSDT: 0, remaining: 1 });
  });
  it("awards 100 USDT at 15 qualifying users", () => {
    expect(referralRewardProgress(15)).toMatchObject({ earnedUSDT: 100, nextMilestone: 30, currentBatch: 0 });
  });
  it("awards another 100 USDT for another 15 users", () => {
    expect(referralRewardProgress(30)).toMatchObject({ earnedUSDT: 200, nextMilestone: 45 });
  });
});