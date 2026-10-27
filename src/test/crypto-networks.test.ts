import { describe, expect, it } from "vitest";

describe("crypto networks and addresses", () => {
  const TRC20_ADDRESS = "TKNVnSnUzztwsQ43H5zyk9d5KVJfMCP9nJ";
  const BEP20_ADDRESS = "0xf602d3039a4a8cc080e3ecebb755343b97919ca3";

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
