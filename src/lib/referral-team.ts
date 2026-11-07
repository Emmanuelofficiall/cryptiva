import type { Tables } from "@/integrations/supabase/types";

export type TeamProfile = Pick<Tables<"profiles">, "id" | "user_id" | "referred_by" | "full_name" | "email" | "created_at">;

export function getReferralTeam(profiles: TeamProfile[], ownerId: string) {
  const seen = new Set([ownerId]);
  let parents = new Set([ownerId]);
  return (["A", "B", "C"] as const).map(level => {
    const members = profiles.filter(p => p.referred_by && parents.has(p.referred_by) && !seen.has(p.id));
    for (const member of members) seen.add(member.id);
    parents = new Set(members.map(p => p.id));
    return { level, members };
  });
}