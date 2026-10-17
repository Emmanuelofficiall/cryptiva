export const REFERRAL_BATCH_SIZE = 15;
export const REFERRAL_REWARD_USDT = 100;

export function referralRewardProgress(qualifiedUsers: number) {
  const count = Math.max(0, Math.floor(qualifiedUsers));
  return {
    earnedRewards: Math.floor(count / REFERRAL_BATCH_SIZE),
    earnedUSDT: Math.floor(count / REFERRAL_BATCH_SIZE) * REFERRAL_REWARD_USDT,
    currentBatch: count % REFERRAL_BATCH_SIZE,
    remaining: REFERRAL_BATCH_SIZE - (count % REFERRAL_BATCH_SIZE),
    nextMilestone: (Math.floor(count / REFERRAL_BATCH_SIZE) + 1) * REFERRAL_BATCH_SIZE,
  };
}