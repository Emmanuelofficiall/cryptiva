import { describe, expect, it } from "vitest";
import { getReferralTeam, type TeamProfile } from "@/lib/referral-team";

const profile = (id: string, referred_by: string | null): TeamProfile => ({ id, user_id: `auth-${id}`, referred_by, full_name: id, email: null, created_at: null });

describe("admin referral teams", () => {
  it("uses profile IDs to show three levels for the selected user only", () => {
    const profiles = [profile("owner", null), profile("direct", "owner"), profile("second", "direct"), profile("third", "second"), profile("fourth", "third"), profile("other", null)];
    expect(getReferralTeam(profiles, "owner").map(t => ({ level: t.level, ids: t.members.map(p => p.id) }))).toEqual([
      { level: "A", ids: ["direct"] }, { level: "B", ids: ["second"] }, { level: "C", ids: ["third"] },
    ]);
  });
  it("does not count the owner or duplicate members in a cycle", () => {
    expect(getReferralTeam([profile("owner", "direct"), profile("direct", "owner")], "owner").map(t => t.members.length)).toEqual([1, 0, 0]);
  });
});