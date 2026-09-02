import { useStaticData } from '../hooks/useStaticData';
import { useLiveFpl } from '../hooks/useLiveFpl';
import { PlayerCard } from '../components/PlayerCard';
import { ArrowUp, Activity } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Link } from 'react-router-dom';

export default function MyTeam() {
  const { players, loading: staticLoading } = useStaticData();
  const { teamData, loading: liveLoading } = useLiveFpl();
  const [teamId] = useLocalStorage('fplTeamId', '');

  if (!teamId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Activity className="w-16 h-16 text-fpl-green mb-4" />
        <h2 className="text-2xl font-bold mb-2">Welcome to FPL Intelligence</h2>
        <p className="text-text-secondary mb-6 max-w-md">
          To get started, please configure your FPL Team ID in the settings.
        </p>
        <Link to="/settings" className="bg-fpl-green text-fpl-purple font-bold px-6 py-2 rounded-lg">
          Go to Settings
        </Link>
      </div>
    );
  }

  if (staticLoading || liveLoading) {
    return <div className="p-8 text-center text-text-secondary">Loading team data...</div>;
  }

  // Mock a squad for display purposes based on highest owned players
  const sortedPlayers = [...players].sort((a, b) => b.fpl.ownership - a.fpl.ownership);
  
  const gks = sortedPlayers.filter(p => p.position === 'GKP').slice(0, 2);
  const defs = sortedPlayers.filter(p => p.position === 'DEF').slice(0, 5);
  const mids = sortedPlayers.filter(p => p.position === 'MID').slice(0, 5);
  const fwds = sortedPlayers.filter(p => p.position === 'FWD').slice(0, 3);
  
  const startingXi = [gks[0], ...defs.slice(0, 3), ...mids.slice(0, 4), ...fwds.slice(0, 3)].filter(Boolean);
  const bench = [gks[1], defs[3], defs[4], mids[4]].filter(Boolean);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card p-4 rounded-xl border border-white/5">
          <p className="text-xs text-text-secondary mb-1">Overall Rank</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{teamData?.summary_overall_rank?.toLocaleString() || '---'}</span>
            <ArrowUp className="w-4 h-4 text-fpl-green" />
          </div>
        </div>
        <div className="bg-bg-card p-4 rounded-xl border border-white/5">
          <p className="text-xs text-text-secondary mb-1">Total Points</p>
          <span className="text-2xl font-bold">{teamData?.summary_overall_points?.toLocaleString() || '---'}</span>
        </div>
        <div className="bg-bg-card p-4 rounded-xl border border-white/5">
          <p className="text-xs text-text-secondary mb-1">Team Value</p>
          <span className="text-2xl font-bold text-fpl-green">
            £{((teamData?.last_deadline_value || 0) / 10).toFixed(1)}m
          </span>
        </div>
        <div className="bg-bg-card p-4 rounded-xl border border-white/5">
          <p className="text-xs text-text-secondary mb-1">In Bank</p>
          <span className="text-2xl font-bold">
            £{((teamData?.last_deadline_bank || 0) / 10).toFixed(1)}m
          </span>
        </div>
      </div>

      {/* Squad Display */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Starting XI</h2>
          <span className="bg-white/10 text-xs px-2 py-1 rounded">3-4-3</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {startingXi.map((player, idx) => (
             <PlayerCard 
               key={player.id} 
               player={player} 
               isCaptain={idx === startingXi.length - 1} // Mock captain
               isViceCaptain={idx === startingXi.length - 2} // Mock VC
             />
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4 text-text-secondary">Bench</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-75">
          {bench.map(player => (
             <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
