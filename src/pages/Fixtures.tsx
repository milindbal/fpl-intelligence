import { useState } from 'react';
import { useStaticData } from '../hooks/useStaticData';
import { calculateOffensiveDifficulty, calculateDefensiveDifficulty, calculateOverallDifficulty, getDifficultyColor } from '../utils/difficulty';

export default function Fixtures() {
  const { teams, fixtures, gameweeks, loading } = useStaticData();
  const [windowSize, setWindowSize] = useState(3);
  const [metric, setMetric] = useState<'overall' | 'offensive' | 'defensive'>('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  if (loading) return <div className="p-8 text-center">Loading fixtures...</div>;

  // Find the current/next gameweek
  const nextGw = gameweeks.find(gw => !gw.finished && !gw.is_current) || gameweeks[gameweeks.length - 1];
  const startGwId = nextGw ? nextGw.id : 1;

  // Compute team fixtures and difficulties
  const teamDifficulties = teams.map(team => {
    const upcomingFixtures = [];
    let offSum = 0;
    let defSum = 0;
    let overallSum = 0;

    for (let gw = startGwId; gw < startGwId + windowSize; gw++) {
      // Find fixture for this team in this GW
      const f = fixtures.find(fix => fix.event === gw && (fix.team_h === team.id || fix.team_a === team.id));
      
      if (f) {
        const isHome = f.team_h === team.id;
        const opponentId = isHome ? f.team_a : f.team_h;
        const opponent = teams.find(t => t.id === opponentId)!;
        
        const offDiff = calculateOffensiveDifficulty(opponent, isHome);
        const defDiff = calculateDefensiveDifficulty(opponent, isHome);
        const overall = calculateOverallDifficulty(offDiff, defDiff);

        offSum += offDiff;
        defSum += defDiff;
        overallSum += overall;

        upcomingFixtures.push({
          gw,
          opponent: opponent.short_name,
          isHome,
          offDiff,
          defDiff,
          overall
        });
      } else {
        // Blank gameweek
        upcomingFixtures.push({ gw, opponent: 'BLANK', isHome: null, offDiff: 10, defDiff: 10, overall: 10 });
        offSum += 10; defSum += 10; overallSum += 10;
      }
    }

    const count = upcomingFixtures.length;
    return {
      team,
      upcomingFixtures,
      avgOff: offSum / count,
      avgDef: defSum / count,
      avgOverall: overallSum / count
    };
  });

  // Sort based on user preference
  teamDifficulties.sort((a, b) => {
    let valA = a.avgOverall; let valB = b.avgOverall;
    if (metric === 'offensive') { valA = a.avgOff; valB = b.avgOff; }
    if (metric === 'defensive') { valA = a.avgDef; valB = b.avgDef; }
    
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fixture Ticker</h1>
          <p className="text-text-secondary">Analyze upcoming fixture difficulty.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-bg-card p-3 rounded-lg border border-white/5">
          <div className="flex flex-col gap-1">
             <label className="text-xs text-text-secondary">Window</label>
             <select 
               className="bg-bg-dark border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-fpl-green"
               value={windowSize}
               onChange={(e) => setWindowSize(Number(e.target.value))}
             >
               <option value={3}>Next 3 GWs</option>
               <option value={5}>Next 5 GWs</option>
               <option value={7}>Next 7 GWs</option>
             </select>
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-xs text-text-secondary">Metric</label>
             <select 
               className="bg-bg-dark border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-fpl-green"
               value={metric}
               onChange={(e) => setMetric(e.target.value as any)}
             >
               <option value="overall">Overall</option>
               <option value="offensive">Offensive</option>
               <option value="defensive">Defensive</option>
             </select>
          </div>
          <div className="flex flex-col gap-1">
             <label className="text-xs text-text-secondary">Sort</label>
             <select 
               className="bg-bg-dark border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-fpl-green"
               value={sortOrder}
               onChange={(e) => setSortOrder(e.target.value as any)}
             >
               <option value="asc">Easiest First</option>
               <option value="desc">Hardest First</option>
             </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-white/10 text-sm text-text-secondary">
              <th className="py-3 px-4 w-32 font-medium">Team</th>
              {Array.from({length: windowSize}).map((_, i) => (
                <th key={i} className="py-3 px-2 text-center font-medium">GW {startGwId + i}</th>
              ))}
              <th className="py-3 px-4 text-center font-medium">Avg Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {teamDifficulties.map(({ team, upcomingFixtures, avgOff, avgDef, avgOverall }) => {
              let avgDisplay = avgOverall;
              if (metric === 'offensive') avgDisplay = avgOff;
              if (metric === 'defensive') avgDisplay = avgDef;

              return (
                <tr key={team.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold">{team.short_name}</td>
                  {upcomingFixtures.map((fix, i) => {
                    let diff = fix.overall;
                    if (metric === 'offensive') diff = fix.offDiff;
                    if (metric === 'defensive') diff = fix.defDiff;

                    return (
                      <td key={i} className="py-2 px-1 text-center">
                        <div className={`text-xs py-1.5 px-1 rounded flex flex-col items-center justify-center ${getDifficultyColor(diff)}`}>
                          <span className="font-bold">{fix.opponent}{fix.isHome ? ' (H)' : fix.isHome === false ? ' (A)' : ''}</span>
                          <span className="opacity-80 text-[10px]">{diff.toFixed(1)}</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-center font-bold">
                     <span className={`px-3 py-1 rounded text-sm ${getDifficultyColor(avgDisplay)}`}>
                       {avgDisplay.toFixed(2)}
                     </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
