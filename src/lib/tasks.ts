export interface TaskInvestmentRef {
  id: string;
  plan_name: string;
  amount: number;
  daily_rate: number;
}

/**
 * Extracts investment id from task description if encoded as (inv:<uuid>)
 */
export function getTaskInvestmentId(task: { description?: string | null }): string | null {
  if (!task || !task.description) return null;
  const match = task.description.match(/inv:([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Encodes investment reference and pair action into description
 */
export function makeTaskDescription(
  pairName: string,
  planName: string,
  invId: string,
  action?: "buy" | "sell"
): string {
  if (action) {
    return `${action.toUpperCase()} ${pairName} for ${planName} (inv:${invId})`;
  }
  return `Trade ${pairName} for ${planName} (inv:${invId})`;
}

/**
 * Computes daily income for an investment plan
 */
export function getPlanDailyIncome(amount: number, dailyRate: number): number {
  const amt = Number(amount) || 0;
  const rate = Number(dailyRate) || 0;
  return Number(((amt * rate) / 100).toFixed(4));
}

/**
 * Computes reward per exchange pair for an investment plan
 */
export function getPlanExchangeReward(
  amount: number,
  dailyRate: number,
  exchangeCount: number = 5
): number {
  if (exchangeCount <= 0) return 0;
  const dailyIncome = getPlanDailyIncome(amount, dailyRate);
  return Number((dailyIncome / exchangeCount).toFixed(4));
}

/**
 * Formats a distinct label for plans, numbering duplicates (e.g. "Solana #1", "Solana #2")
 */
export function formatPlanLabel(
  inv: { id: string; plan_name: string },
  allInvestments: Array<{ id: string; plan_name: string }>
): string {
  const sameName = allInvestments.filter((i) => i.plan_name === inv.plan_name);
  if (sameName.length <= 1) {
    return inv.plan_name;
  }
  const index = sameName.findIndex((i) => i.id === inv.id);
  return `${inv.plan_name} #${index >= 0 ? index + 1 : 1}`;
}

