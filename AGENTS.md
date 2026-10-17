# Architecture rules
- Plan purchases use the authenticated `purchase_plan` RPC to debit the wallet, insert the investment, and process commissions atomically; direct investment inserts are disallowed to prevent fabricated qualifying purchases.
- Referral milestone qualification and credits are server-owned ledgers with unique referred-user and inviter-milestone keys; this prevents repeat purchases and concurrent requests from duplicating bonuses.
- Referral attribution is self-only and one-time before the first purchase; this prevents users from reassigning qualifying invitees.
- Dashboard banners are declared in one ordered array used by both rotation and navigation; this keeps slide controls aligned with images.