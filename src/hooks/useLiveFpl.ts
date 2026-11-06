import { useState, useEffect } from 'react';

export function useLiveFpl() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLive() {
      setLoading(true);
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/my_team.json`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch my_team.json');
        }
        
        const myTeamData = await response.json();
        
        if (myTeamData && myTeamData.entry) {
          setData(myTeamData);
        } else {
          setError('No team data available. Please check FPL_TEAM_ID configuration.');
        }
      } catch (err) {
        console.warn('Error fetching my_team.json', err);
        setError('Using fallback data due to missing configuration or network error.');
      } finally {
        setLoading(false);
      }
    }

    fetchLive();
  }, []);

  return { teamData: data?.entry, picks: data?.picks, loading, error };
}
