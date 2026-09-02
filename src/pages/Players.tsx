import { useState } from 'react';
import { useStaticData } from '../hooks/useStaticData';
import { Search, Activity, ChevronRight } from 'lucide-react';
import type { FPLPlayer } from '../types';
import { calculateProjectedPoints } from '../utils/projections';

export default function Players() {
  const { players, teams, fixtures, gameweeks, loading } = useStaticData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<FPLPlayer | null>(null);

  if (loading) return <div className="p-8 text-center">Loading players...</div>;

  const filteredPlayers = players
    .filter(p => 
      p.web_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.fpl.totalPoints - a.fpl.totalPoints)
    .slice(0, 50); // Show top 50 matches for performance

  const nextGw = gameweeks.find(gw => !gw.finished && !gw.is_current) || gameweeks[gameweeks.length - 1];
  
  const getNextFixture = (player: FPLPlayer) => {
    if (!nextGw) return null;
    const f = fixtures.find(fix => fix.event === nextGw.id && (fix.team_h === player.teamId || fix.team_a === player.teamId));
    if (!f) return null;
    
    const isHome = f.team_h === player.teamId;
    const oppId = isHome ? f.team_a : f.team_h;
    const opponent = teams.find(t => t.id === oppId);
    
    return { fixture: f, opponent, isHome };
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-80px)]">
      
      {/* Player List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 bg-bg-card border border-white/5 rounded-xl overflow-hidden h-full">
        <div className="p-4 border-b border-white/5 relative">
          <Search className="absolute left-7 top-7 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search players..."
            className="w-full bg-bg-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-fpl-green"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPlayers.map(player => (
            <div 
              key={player.id}
              onClick={() => setSelectedPlayer(player)}
              className={`p-3 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${
                selectedPlayer?.id === player.id ? 'bg-white/10 border-l-4 border-l-fpl-green' : ''
              }`}
            >
              <div>
                <p className="font-bold text-sm">{player.web_name}</p>
                <p className="text-xs text-text-secondary">{player.teamName} - {player.position}</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-xs font-bold text-fpl-green">£{player.price.toFixed(1)}</p>
                  <p className="text-xs text-text-secondary">{player.fpl.totalPoints} pts</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Detail (Intelligence) */}
      <div className="w-full md:w-2/3 bg-bg-card border border-white/5 rounded-xl h-full overflow-y-auto">
        {selectedPlayer ? (
          <div className="p-6 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold">{selectedPlayer.name}</h2>
                <p className="text-lg text-text-secondary">{selectedPlayer.teamName} - {selectedPlayer.position}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-fpl-green">£{selectedPlayer.price.toFixed(1)}</p>
                <p className="text-sm text-text-secondary">{selectedPlayer.fpl.ownership}% Ownership</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-dark p-4 rounded-lg border border-white/5">
                <p className="text-xs text-text-secondary">Total Points</p>
                <p className="text-2xl font-bold">{selectedPlayer.fpl.totalPoints}</p>
              </div>
              <div className="bg-bg-dark p-4 rounded-lg border border-white/5">
                <p className="text-xs text-text-secondary">Minutes</p>
                <p className="text-2xl font-bold">{selectedPlayer.fpl.minutes}</p>
              </div>
              <div className="bg-bg-dark p-4 rounded-lg border border-white/5">
                <p className="text-xs text-text-secondary">Goals</p>
                <p className="text-2xl font-bold">{selectedPlayer.fpl.goals}</p>
              </div>
              <div className="bg-bg-dark p-4 rounded-lg border border-white/5">
                <p className="text-xs text-text-secondary">Assists</p>
                <p className="text-2xl font-bold">{selectedPlayer.fpl.assists}</p>
              </div>
            </div>

            {/* Next Fixture Projection */}
            {(() => {
              const nextFix = getNextFixture(selectedPlayer);
              if (nextFix && nextFix.opponent) {
                const projected = calculateProjectedPoints({
                  player: selectedPlayer,
                  opponent: nextFix.opponent,
                  isHome: nextFix.isHome
                });
                return (
                  <div className="bg-gradient-to-r from-fpl-purple to-bg-dark p-4 rounded-lg border border-fpl-purple flex justify-between items-center">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">Next Fixture Projection</p>
                      <p className="font-bold">GW{nextGw?.id} vs {nextFix.opponent.name} {nextFix.isHome ? '(H)' : '(A)'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-fpl-green">{projected.toFixed(1)}</p>
                      <p className="text-[10px] text-text-secondary">Projected Points</p>
                    </div>
                  </div>
                )
              }
              return null;
            })()}

            {/* Underlying Stats */}
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-fpl-blue" />
                Underlying Performance (Season)
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedPlayer.underlying ? (
                  <>
                    <StatBox label="xG" value={selectedPlayer.underlying.xG.toFixed(2)} />
                    <StatBox label="xA" value={selectedPlayer.underlying.xA.toFixed(2)} />
                    <StatBox label="xGI" value={(selectedPlayer.underlying.xG + selectedPlayer.underlying.xA).toFixed(2)} />
                    <StatBox label="Shots" value={selectedPlayer.underlying.shots} />
                    <StatBox label="Key Passes" value={selectedPlayer.underlying.keyPasses} />
                    <StatBox label="npxG" value={selectedPlayer.underlying.npxG.toFixed(2)} />
                    <StatBox label="xGChain" value={selectedPlayer.underlying.xGChain.toFixed(2)} />
                    <StatBox label="xGBuildup" value={selectedPlayer.underlying.xGBuildup.toFixed(2)} />
                  </>
                ) : (
                  <>
                    <StatBox label="FPL xG" value={selectedPlayer.fpl.xG.toFixed(2)} />
                    <StatBox label="FPL xA" value={selectedPlayer.fpl.xA.toFixed(2)} />
                    <StatBox label="xGI" value={(selectedPlayer.fpl.xG + selectedPlayer.fpl.xA).toFixed(2)} />
                    <StatBox label="BPS" value={selectedPlayer.fpl.bps} />
                  </>
                )}
              </div>
              {!selectedPlayer.underlying && (
                <p className="text-xs text-text-secondary mt-4 italic">
                  Note: Detailed Understat metrics are not available for this player. Using FPL API equivalents.
                </p>
              )}
            </div>
            
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a player to view detailed intelligence.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-bg-dark p-3 rounded border border-white/5 flex flex-col">
      <span className="text-[10px] text-text-secondary uppercase">{label}</span>
      <span className="font-bold text-lg">{value}</span>
    </div>
  );
}
