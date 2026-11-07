import { describe, expect, it } from "vitest";
import { DEPOSIT_NETWORKS, PREFERRED_DEPOSIT_NETWORK } from "@/lib/crypto-networks";

describe("crypto networks and addresses", () => {
  const TRC20_ADDRESS = DEPOSIT_NETWORKS["TRC20 USDT"].address;
  const BEP20_ADDRESS = DEPOSIT_NETWORKS["BEP20 USDT"].address;

  it("prefers BEP20 while keeping TRC20 available", () => {
    expect(PREFERRED_DEPOSIT_NETWORK).toBe("BEP20 USDT");
    expect(Object.keys(DEPOSIT_NETWORKS)).toEqual(["BEP20 USDT", "TRC20 USDT"]);
  });

  it("has valid TRC20 address format", () => {
    expect(TRC20_ADDRESS.startsWith("T")).toBe(true);
    expect(TRC20_ADDRESS.length).toBe(34);
    expect(/^[A-HJ-NP-Za-km-z1-9]+$/.test(TRC20_ADDRESS)).toBe(true);
  });

  it("has valid BEP20 / BSC address format", () => {
    expect(BEP20_ADDRESS.startsWith("0x")).toBe(true);
    expect(BEP20_ADDRESS.length).toBe(42);
    expect(/^0x[a-fA-F0-9]{40}$/.test(BEP20_ADDRESS)).toBe(true);
  });

  it("validates withdrawal addresses by network", () => {
    const validateWithdrawAddress = (network: "TRC20 USDT" | "BEP20 USDT", address: string) => {
      const trimmed = address.trim();
      if (!trimmed) return "Address required";
      if (network === "TRC20 USDT" && !trimmed.startsWith("T")) return "TRC20 USDT addresses must start with 'T'.";
      if (network === "BEP20 USDT" && !trimmed.startsWith("0x")) return "BEP20 USDT addresses must start with '0x'.";
      return null;
    };

    expect(validateWithdrawAddress("TRC20 USDT", TRC20_ADDRESS)).toBeNull();
    expect(validateWithdrawAddress("TRC20 USDT", BEP20_ADDRESS)).toContain("must start with 'T'");
    expect(validateWithdrawAddress("BEP20 USDT", BEP20_ADDRESS)).toBeNull();
    expect(validateWithdrawAddress("BEP20 USDT", TRC20_ADDRESS)).toContain("must start with '0x'");
    expect(validateWithdrawAddress("TRC20 USDT", "")).toBe("Address required");
  });
});

