import { useStaticData } from '../hooks/useStaticData';
import { calculateProjectedPoints } from '../utils/projections';
import type { FPLPlayer, FPLTeam } from '../types';

export default function Captaincy() {
  const { players, teams, fixtures, gameweeks, loading } = useStaticData();

  if (loading) return null;

  const nextGw = gameweeks.find(gw => !gw.finished && !gw.is_current) || gameweeks[gameweeks.length - 1];
  
  if (!nextGw) return <div className="text-sm text-text-secondary">No upcoming gameweeks.</div>;

  // Calculate captaincy options from the whole database (in reality, would just be from user's squad, but we don't have authenticated squad fetch for V0)
  // We'll score top players based on next GW projection
  
  const fixtureByTeamId = new Map();
  for (const fix of fixtures) {
    if (fix.event === nextGw.id) {
      fixtureByTeamId.set(fix.team_h, fix);
      fixtureByTeamId.set(fix.team_a, fix);
    }
  }

  const teamById = new Map();
  for (const team of teams) {
    teamById.set(team.id, team);
  }

  const options = players
    .map(player => {
      const f = fixtureByTeamId.get(player.teamId);
      if (!f) return null;
      
      const isHome = f.team_h === player.teamId;
      const opponentId = isHome ? f.team_a : f.team_h;
      const opponent = teamById.get(opponentId);
      
      if (!opponent) return null;

      const projected = calculateProjectedPoints({ player, opponent, isHome });
      
      // Calculate a basic "reasoning"
      const reasons = [];
      if (projected > 7) reasons.push("Elite projection");
      else if (projected > 5) reasons.push("Strong projection");
      
      const xGI = player.underlying ? (player.underlying.xG + player.underlying.xA) : (player.fpl.xG + player.fpl.xA);
      if (xGI > 5) reasons.push("Excellent underlying stats");
      
      return { player, opponent, isHome, projected, reasons: reasons.join(' + ') };
    })
    .filter(Boolean) as {player: FPLPlayer, opponent: FPLTeam, isHome: boolean, projected: number, reasons: string}[];

  options.sort((a, b) => b.projected - a.projected);
  
  const topOptions = options.slice(0, 3);

  return (
    <div className="bg-bg-card p-6 rounded-xl border border-white/5 space-y-4">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <span className="bg-fpl-purple text-white w-6 h-6 rounded flex items-center justify-center text-xs">C</span>
        Captaincy Recommendations
      </h3>
      
      <p className="text-sm text-text-secondary mb-4">Top options for Gameweek {nextGw.id} based on projected points and fixture difficulty.</p>

      {topOptions.map((opt, idx) => (
        <div key={opt.player.id} className={`p-4 rounded-lg border ${idx === 0 ? 'border-fpl-green bg-fpl-green/5' : 'border-white/5 bg-bg-dark'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg ${idx === 0 ? 'text-fpl-green' : ''}`}>
                {idx + 1}. {opt.player.web_name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-lg">{opt.projected.toFixed(1)}</span>
              <span className="text-[10px] text-text-secondary ml-1">proj</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            vs {opt.opponent.name} {opt.isHome ? '(H)' : '(A)'}
          </p>
          {idx === 0 && (
            <div className="mt-3 text-sm">
              <span className="font-bold">Reason:</span> {opt.reasons || "Best available projection."}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
