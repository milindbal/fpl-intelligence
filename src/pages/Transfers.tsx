import { useState, useMemo } from 'react';
import { useStaticData } from '../hooks/useStaticData';
import { useLiveFpl } from '../hooks/useLiveFpl';
import { calculateProjectedPoints } from '../utils/projections';
import type { FPLPlayer, FPLTeam, FPLFixture } from '../types';
import Captaincy from '../components/Captaincy';
import { ArrowRight } from 'lucide-react';

export default function Transfers() {
  const { players, teams, fixtures, gameweeks, loading: staticLoading } = useStaticData();
  const { teamData, loading: liveLoading } = useLiveFpl();
  const [selectedSell, setSelectedSell] = useState<FPLPlayer | null>(null);

  // Pre-compute maps for O(1) lookups instead of O(N) array searches
  const teamsMap = useMemo(() => {
    const map = new Map<number, FPLTeam>();
    if (teams) {
      for (const t of teams) {
        map.set(t.id, t);
      }
    }
    return map;
  }, [teams]);

  const teamFixturesMap = useMemo(() => {
    const map = new Map<number, Map<number, FPLFixture>>();
    if (fixtures) {
      for (const fix of fixtures) {
        if (!fix.event) continue;

        // For home team
        let homeMap = map.get(fix.team_h);
        if (!homeMap) {
          homeMap = new Map<number, FPLFixture>();
          map.set(fix.team_h, homeMap);
        }
        if (!homeMap.has(fix.event)) {
          homeMap.set(fix.event, fix);
        }

        // For away team
        let awayMap = map.get(fix.team_a);
        if (!awayMap) {
          awayMap = new Map<number, FPLFixture>();
          map.set(fix.team_a, awayMap);
        }
        if (!awayMap.has(fix.event)) {
          awayMap.set(fix.event, fix);
        }
      }
    }
    return map;
  }, [fixtures]);

  if (staticLoading || liveLoading) return <div className="p-8 text-center">Loading Transfer Lab...</div>;

  const nextGw = gameweeks.find(gw => !gw.finished && !gw.is_current) || gameweeks[gameweeks.length - 1];
  const startGwId = nextGw ? nextGw.id : 1;

  // Helper to project points for next N gameweeks
  const getMultiGwProjection = (player: FPLPlayer, numGws: number) => {
    let totalProj = 0;
    const playerFixtures = teamFixturesMap.get(player.teamId);
    if (!playerFixtures) return 0;

    for (let i = 0; i < numGws; i++) {
      const gw = startGwId + i;
      const f = playerFixtures.get(gw);
      if (f) {
        const isHome = f.team_h === player.teamId;
        const opponentId = isHome ? f.team_a : f.team_h;
        const opponent = teamsMap.get(opponentId);
        if (opponent) {
          totalProj += calculateProjectedPoints({ player, opponent, isHome });
        }
      }
    }
    return totalProj;
  };

  // Squad setup
  let squadOptions: FPLPlayer[] = [];
  let availableBank = 0;
  
  if (teamData && teamData.current_picks?.picks) {
    availableBank = (teamData.last_deadline_bank || 0) / 10;
    squadOptions = teamData.current_picks.picks
      .map((pick: any) => players.find(p => p.id === pick.element))
      .filter(Boolean) as FPLPlayer[];
  } else {
    // Fallback if no real squad data
    squadOptions = [...players].sort((a, b) => b.fpl.ownership - a.fpl.ownership).slice(0, 15);
  }

  // Recommendations based on selected player to sell
  let recommendations: any[] = [];
  let sellProj5 = 0;

  if (selectedSell) {
    sellProj5 = getMultiGwProjection(selectedSell, 5);
    
    // Actual budget constraint
    const maxPrice = selectedSell.price + availableBank;
    
    // Count existing players per team to enforce max 3 per team rule
    const currentTeamCounts: Record<number, number> = {};
    squadOptions.forEach(p => {
        if (p.id !== selectedSell.id) { // Don't count the player we are selling
            currentTeamCounts[p.teamId] = (currentTeamCounts[p.teamId] || 0) + 1;
        }
    });
    
    recommendations = players
      .filter(p => {
          if (p.id === selectedSell.id) return false;
          if (p.position !== selectedSell.position) return false;
          if (p.price > maxPrice) return false;
          
          // Max 3 players per team
          const count = currentTeamCounts[p.teamId] || 0;
          if (count >= 3) return false;
          
          // Cannot buy a player already in the squad
          if (squadOptions.some(squadP => squadP.id === p.id)) return false;
          
          return true;
      })
      .map(p => {
        const buyProj5 = getMultiGwProjection(p, 5);
        const gain = buyProj5 - sellProj5;
        
        // Transfer score weighting
        // 40% projected FPL points (normalized roughly)
        // 25% fixture quality (built into projection)
        // 20% underlying performance
        // 10% minutes security
        // 5% ownership / differential
        
        const xGI = p.underlying ? (p.underlying.xG + p.underlying.xA) : (p.fpl.xG + p.fpl.xA);
        const minSec = (p.fpl.minutes / (startGwId * 90)) * 100;
        
        const score = (buyProj5 * 0.4) + (xGI * 0.2) + (minSec * 0.05); // Simplified score

        return { player: p, buyProj5, gain, score, xGI };
      })
      .filter(r => r.gain > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Transfer Lab</h1>
        <p className="text-text-secondary">Analyze potential transfers using the scoring model.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Transfer Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card p-6 rounded-xl border border-white/5">
            <h2 className="text-xl font-bold mb-4">1. Select Player to Sell</h2>
            <select 
              className="w-full bg-bg-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-fpl-green"
              value={selectedSell?.id || ''}
              onChange={(e) => {
                const p = players.find(p => p.id === Number(e.target.value));
                setSelectedSell(p || null);
              }}
            >
              <option value="">-- Choose a player --</option>
              {squadOptions.map(p => (
                <option key={p.id} value={p.id}>{p.web_name} (£{p.price.toFixed(1)}m) - {p.position}</option>
              ))}
            </select>
          </div>

          {selectedSell && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center justify-between">
                  <span>2. Recommendations</span>
                  <span className="text-sm bg-white/10 px-3 py-1 rounded text-fpl-green">Max Budget: £{(selectedSell.price + availableBank).toFixed(1)}m</span>
              </h2>
              <p className="text-sm text-text-secondary">Model recommendation based on next 5 GW projection.</p>
              
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <div key={rec.player.id} className="bg-bg-card p-5 rounded-xl border border-white/5 flex flex-col md:flex-row items-center gap-6">
                    
                    {/* Sell Side */}
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-xs text-fpl-pink font-bold uppercase mb-1">Sell</p>
                      <p className="font-bold text-lg">{selectedSell.web_name}</p>
                      <p className="text-sm text-text-secondary">£{selectedSell.price.toFixed(1)}m</p>
                      <p className="text-xs mt-2 bg-white/5 inline-block px-2 py-1 rounded">5 GW Proj: {sellProj5.toFixed(1)}</p>
                    </div>
                    
                    {/* Arrow / Diff */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="bg-fpl-green/10 p-2 rounded-full mb-1">
                        <ArrowRight className="w-6 h-6 text-fpl-green" />
                      </div>
                      <span className="text-fpl-green font-bold text-sm">+{rec.gain.toFixed(1)} pts</span>
                    </div>

                    {/* Buy Side */}
                    <div className="flex-1 text-center md:text-right">
                      <p className="text-xs text-fpl-blue font-bold uppercase mb-1">Buy</p>
                      <p className="font-bold text-lg">{rec.player.web_name}</p>
                      <p className="text-sm text-text-secondary">£{rec.player.price.toFixed(1)}m</p>
                      <p className="text-xs mt-2 bg-white/5 inline-block px-2 py-1 rounded">5 GW Proj: {rec.buyProj5.toFixed(1)}</p>
                    </div>

                  </div>
                ))
              ) : (
                <div className="bg-bg-card p-6 rounded-xl border border-white/5 text-center text-text-secondary">
                  No clear upgrades found for this player within budget.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Captaincy */}
        <div>
          <Captaincy />
        </div>

      </div>
    </div>
  );
}
