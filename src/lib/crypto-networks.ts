export const PREFERRED_DEPOSIT_NETWORK = "BEP20 USDT";

export const DEPOSIT_NETWORKS = {
  "BEP20 USDT": {
    name: "BEP20 USDT",
    network: "BNB Smart Chain (BEP20)",
    badge: "BEP20",
    address: "0xf602d3039a4a8cc080e3ecebb755343b97919ca3",
    warning: "⚠ Only send USDT via BEP20 (BNB Smart Chain) network. Transferring any other cryptocurrency or using another network may result in permanent loss.",
    hint: "BNB Smart Chain (BSC)",
  },
  "TRC20 USDT": {
    name: "TRC20 USDT",
    network: "TRON (TRC20)",
    badge: "TRC20",
    address: "TKNVnSnUzztwsQ43H5zyk9d5KVJfMCP9nJ",
    warning: "⚠ Only send USDT via TRC20 network. Transferring any other cryptocurrency or using another network may result in permanent loss.",
    hint: "TRON network (TRC20)",
  },
} as const;

export type DepositNetworkKey = keyof typeof DEPOSIT_NETWORKS;