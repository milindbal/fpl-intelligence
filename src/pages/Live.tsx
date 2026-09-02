import { useState, useEffect } from 'react';
import { useStaticData } from '../hooks/useStaticData';
import { Activity } from 'lucide-react';

export default function Live() {
  const { gameweeks, loading } = useStaticData();
  const [liveData, setLiveData] = useState<any>(null);

  // Identify current gameweek
  const currentGw = gameweeks.find(gw => gw.is_current);

  useEffect(() => {
    if (!currentGw) return;

    // Simulate fetching live event data
    // Direct browser fetch to FPL API blocked by CORS.
    setLiveData({
      score: 48,
      projected: 64.3,
      players: [
        { id: 1, name: "Haaland", status: "finished", points: 12, isCaptain: true },
        { id: 2, name: "Saka", status: "finished", points: 8, isCaptain: false },
        { id: 3, name: "Palmer", status: "playing", points: 3, isCaptain: false },
        { id: 4, name: "Raya", status: "upcoming", points: 2, isCaptain: false }, // assuming appearance pts projected
        { id: 5, name: "Gabriel", status: "upcoming", points: 0, isCaptain: false },
      ]
    });

  }, [currentGw]);

  if (loading) return <div className="p-8 text-center">Loading Live data...</div>;

  if (!currentGw) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Activity className="w-16 h-16 text-text-secondary opacity-50 mb-4" />
        <h2 className="text-xl font-bold">No Active Gameweek</h2>
        <p className="text-text-secondary">Live data is only available during an active gameweek.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-fpl-pink rounded-full animate-pulse"></div>
        <h1 className="text-3xl font-bold">GW{currentGw.id} Live</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Live Score Summary */}
        <div className="bg-bg-card p-6 rounded-xl border border-white/5 space-y-6">
          <div className="flex justify-between items-end border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-text-secondary">Current Score</p>
              <p className="text-5xl font-bold">{liveData?.score || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Projected Final</p>
              <p className="text-2xl font-bold text-fpl-green">{liveData?.projected || 0}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-text-secondary uppercase">Live Players</h3>
            {liveData?.players.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {p.status === 'finished' && <span className="text-fpl-green">✓</span>}
                  {p.status === 'playing' && <span className="w-2 h-2 bg-fpl-blue rounded-full"></span>}
                  {p.status === 'upcoming' && <span className="w-2 h-2 border border-text-secondary rounded-full"></span>}
                  
                  <span className="font-medium">
                    {p.name}
                    {p.isCaptain && <span className="ml-2 text-xs bg-fpl-purple px-1 rounded">C</span>}
                  </span>
                </div>
                <span className="font-bold">{p.points}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mock Live Features */}
        <div className="space-y-6">
          <div className="bg-bg-card p-6 rounded-xl border border-white/5">
             <h3 className="font-bold mb-2">Live Mini-League</h3>
             <p className="text-sm text-text-secondary mb-4">You are currently <span className="text-fpl-green font-bold">▲ 2nd</span> in your primary league.</p>
             <p className="text-xs text-fpl-blue border border-fpl-blue/30 bg-fpl-blue/5 p-2 rounded">Note: Due to CORS restrictions, this view uses mocked local data.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
