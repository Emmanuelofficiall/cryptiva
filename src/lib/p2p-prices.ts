type P2PPriceSetting = {
  currency: string;
  buy_price: number | string | null;
  sell_price: number | string | null;
};

// Admin rates are merchant-facing: merchants buy low and sell high.
export function getP2PRate(
  settings: readonly P2PPriceSetting[] | undefined,
  currency: string,
  action: "buy" | "sell",
  perspective: "customer" | "merchant" = "customer",
): number {
  const setting = settings?.find((item) => item.currency === currency);
  const merchantAction = perspective === "merchant" ? action : action === "buy" ? "sell" : "buy";
  const rate = Number(merchantAction === "buy" ? setting?.buy_price : setting?.sell_price);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}