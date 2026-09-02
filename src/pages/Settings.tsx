import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [teamId, setTeamId] = useLocalStorage<string>('fplTeamId', '');
  const [leagueIds, setLeagueIds] = useLocalStorage<string[]>('fplLeagueIds', []);
  
  const [localTeamId, setLocalTeamId] = useState(teamId);
  const [localLeagueIds, setLocalLeagueIds] = useState(leagueIds.join(', '));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setTeamId(localTeamId);
    
    const parsedLeagues = localLeagueIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id !== '');
    
    setLeagueIds(parsedLeagues);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-text-secondary">Configure your FPL Intelligence application.</p>
      </div>

      <div className="bg-bg-card p-6 rounded-xl border border-white/5 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">FPL Team ID</label>
          <input
            type="text"
            value={localTeamId}
            onChange={(e) => setLocalTeamId(e.target.value)}
            placeholder="e.g. 1234567"
            className="w-full bg-bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fpl-green transition-colors"
          />
          <p className="text-xs text-text-secondary mt-2">
            You can find this in the URL of your FPL team page.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Classic League IDs (Optional)</label>
          <input
            type="text"
            value={localLeagueIds}
            onChange={(e) => setLocalLeagueIds(e.target.value)}
            placeholder="e.g. 314, 521"
            className="w-full bg-bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fpl-green transition-colors"
          />
          <p className="text-xs text-text-secondary mt-2">
            Comma-separated list of classic league IDs to track.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-fpl-green text-fpl-purple font-bold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-opacity"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-fpl-green mt-4">
            <AlertCircle className="w-5 h-5" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
}
