import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getReferralTeam, type TeamProfile } from "@/lib/referral-team";

export default function AdminUserTeams({ profiles }: { profiles: TeamProfile[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<"all" | "A" | "B" | "C">("all");
  const owner = profiles.find(p => p.id === selectedId) || profiles[0];
  const team = getReferralTeam(profiles, owner?.id || "");
  const rows = team.flatMap(t => t.members.map(member => ({ ...member, level: t.level })))
    .filter(p => (level === "all" || p.level === level) && `${p.full_name || ""} ${p.email || ""}`.toLowerCase().includes(search.toLowerCase()));

  return <section className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
      <div className="flex-1 min-w-0">
        <Label htmlFor="team-owner">User's team</Label>
        <select id="team-owner" value={owner?.id || ""} onChange={e => setSelectedId(e.target.value)} className="mt-2 w-full h-10 rounded-md border border-input bg-background text-foreground px-3 text-sm">
          {!profiles.length && <option value="">No users</option>}
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email || "Unnamed user"}{p.full_name && p.email ? ` — ${p.email}` : ""}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-0"><Label htmlFor="team-search">Search team</Label><Input id="team-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email" className="mt-2" /></div>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Team levels">
      <Button variant={level === "all" ? "default" : "outline"} onClick={() => setLevel("all")}>All ({team.reduce((sum, t) => sum + t.members.length, 0)})</Button>
      {team.map(t => <Button key={t.level} variant={level === t.level ? "default" : "outline"} onClick={() => setLevel(t.level)}>Level {t.level} ({t.members.length})</Button>)}
    </div>
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border">{["Name", "Email", "Level", "Invited by", "Joined"].map(h => <th key={h} className="p-4 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map(p => <tr key={p.id} className="border-b border-border last:border-0">
          <td className="p-4 font-medium">{p.full_name || "—"}</td><td className="p-4 text-muted-foreground">{p.email || "—"}</td><td className="p-4 whitespace-nowrap">Level {p.level}</td>
          <td className="p-4">{(() => { const inviter = profiles.find(i => i.id === p.referred_by); return inviter?.full_name || inviter?.email || "—"; })()}</td>
          <td className="p-4 whitespace-nowrap text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">{search ? "No matching team members" : "No team members"}</p>}
    </div>
  </section>;
}