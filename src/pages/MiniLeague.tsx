import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Trophy } from 'lucide-react';

export default function MiniLeague() {
  const [leagueIds] = useLocalStorage<string[]>('fplLeagueIds', []);
  const [activeLeague, setActiveLeague] = useState<string>(leagueIds[0] || '');
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamId] = useLocalStorage<string>('fplTeamId', '');

  useEffect(() => {
    if (!activeLeague) return;

    async function fetchLeague() {
      setLoading(true);
      try {
        // Direct browser fetch to FPL API will fail due to CORS.
        // For V0, we catch it and mock the data.
        const response = await fetch(`https://fantasy.premierleague.com/api/leagues-classic/${activeLeague}/standings/`);
        if (!response.ok) throw new Error('Failed to fetch league');
        const data = await response.json();
        setStandings(data.standings.results);
        setError(null);
      } catch (err) {
        console.warn('CORS/Network error fetching league data. Mocking data.', err);
        setError('Using fallback data due to CORS restrictions.');
        
        // Mock standings
        setStandings([
          { id: 1, entry: 111, entry_name: "FC Top", player_name: "Alice", total: 1420, event_total: 55, rank: 1, last_rank: 1 },
          { id: 2, entry: 222, entry_name: "Runner Up", player_name: "Bob", total: 1390, event_total: 48, rank: 2, last_rank: 2 },
          { id: 3, entry: Number(teamId) || 333, entry_name: "My Team (Mock)", player_name: "You", total: 1378, event_total: 62, rank: 3, last_rank: 5 },
          { id: 4, entry: 444, entry_name: "Mid Table", player_name: "Charlie", total: 1300, event_total: 30, rank: 4, last_rank: 3 },
          { id: 5, entry: 555, entry_name: "Bottom", player_name: "Dave", total: 1200, event_total: 20, rank: 5, last_rank: 4 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeague();
  }, [activeLeague, teamId]);

  if (leagueIds.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
        <Trophy className="w-16 h-16 text-text-secondary mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">No Leagues Configured</h2>
        <p className="text-text-secondary">Please add Classic League IDs in Settings.</p>
      </div>
    );
  }

  const myTeamIndex = standings.findIndex(s => s.entry.toString() === teamId);
  const targetAbove = myTeamIndex > 0 ? standings[myTeamIndex - 1] : null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mini League</h1>
          <p className="text-text-secondary">Track your standings and analyse threats.</p>
        </div>
        
        <select 
          className="bg-bg-card border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fpl-green"
          value={activeLeague}
          onChange={(e) => setActiveLeague(e.target.value)}
        >
          {leagueIds.map(id => (
            <option key={id} value={id}>League ID: {id}</option>
          ))}
        </select>
      </div>

      {error && <div className="text-xs text-orange-400 bg-orange-400/10 p-2 rounded mb-4">{error}</div>}

      {targetAbove && (
        <div className="bg-gradient-to-r from-bg-card to-bg-dark p-6 rounded-xl border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-fpl-pink"></div>
          <h3 className="text-sm font-bold text-fpl-pink uppercase mb-1">Target Identified</h3>
          <p className="text-lg">
            <span className="font-bold">{targetAbove.player_name}</span> is <span className="font-bold text-fpl-pink">{targetAbove.total - (standings[myTeamIndex]?.total || 0)} points</span> ahead.
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="bg-bg-dark px-3 py-2 rounded">
               <span className="text-text-secondary text-xs block">Their differentials</span>
               <span className="font-bold">Palmer, Isak</span>
            </div>
            <div className="bg-bg-dark px-3 py-2 rounded">
               <span className="text-text-secondary text-xs block">Your differentials</span>
               <span className="font-bold">Saka, Watkins</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-bg-card rounded-xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">Loading standings...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-xs text-text-secondary uppercase">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Manager & Team</th>
                <th className="py-3 px-4 text-center">GW Pts</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team) => (
                <tr 
                  key={team.id} 
                  className={`border-b border-white/5 transition-colors ${team.entry.toString() === teamId ? 'bg-fpl-green/10' : 'hover:bg-white/5'}`}
                >
                  <td className="py-4 px-4 text-center font-bold">
                    {team.rank}
                    {team.rank < team.last_rank && <span className="text-fpl-green text-xs ml-1">▲</span>}
                    {team.rank > team.last_rank && <span className="text-fpl-pink text-xs ml-1">▼</span>}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold">{team.player_name}</p>
                    <p className="text-xs text-text-secondary">{team.entry_name}</p>
                  </td>
                  <td className="py-4 px-4 text-center">{team.event_total}</td>
                  <td className="py-4 px-4 text-right font-bold text-lg">{team.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
