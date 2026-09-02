import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useLiveFpl() {
  const [teamId] = useLocalStorage<string>('fplTeamId', '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    async function fetchLive() {
      setLoading(true);
      try {
        // Since CORS policy prevents direct browser fetch to FPL API, 
        // we might need a proxy or we simulate it if we can't fetch.
        // For V0, we will try fetching directly. If it fails due to CORS,
        // we will mock it or handle the error gracefully.
        
        // FPL API doesn't support CORS for browser requests. 
        // For a purely static GH Pages app without a backend proxy, 
        // fetching live user data directly from the browser is generally blocked.
        // We will mock this response for the sake of the V0 PRD if it fails.
        
        const response = await fetch(`https://fantasy.premierleague.com/api/entry/${teamId}/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const entryData = await response.json();
        
        setData(entryData);
        setError(null);
      } catch (err) {
        console.warn('CORS or Network error fetching live FPL data. Mocking for V0 UI purposes.', err);
        // Mock data fallback since CORS will block browser requests to FPL API
        setData({
          name: "Mocked Team Name",
          summary_overall_points: 1250,
          summary_overall_rank: 500000,
          last_deadline_value: 1025,
          last_deadline_bank: 15,
        });
        setError('Using fallback data due to CORS restrictions.');
      } finally {
        setLoading(false);
      }
    }

    fetchLive();
  }, [teamId]);

  return { teamData: data, loading, error };
}
