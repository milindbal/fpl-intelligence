import { useState, useEffect } from 'react';
import type { FPLPlayer, FPLTeam, FPLFixture } from '../types';

interface StaticData {
  players: FPLPlayer[];
  teams: FPLTeam[];
  fixtures: FPLFixture[];
  gameweeks: any[];
  loading: boolean;
  error: string | null;
}

export function useStaticData() {
  const [data, setData] = useState<StaticData>({
    players: [],
    teams: [],
    fixtures: [],
    gameweeks: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // In production on GH pages, basePath needs to handle repository name if not at root
        const basePath = import.meta.env.BASE_URL || '/';
        
        const [playersRes, teamsRes, fixturesRes, gameweeksRes] = await Promise.all([
          fetch(`${basePath}data/players.json`),
          fetch(`${basePath}data/teams.json`),
          fetch(`${basePath}data/fixtures.json`),
          fetch(`${basePath}data/gameweeks.json`)
        ]);

        if (!playersRes.ok || !teamsRes.ok || !fixturesRes.ok) {
          throw new Error('Failed to fetch static data');
        }

        const [players, teams, fixtures, gameweeks] = await Promise.all([
          playersRes.json(),
          teamsRes.json(),
          fixturesRes.json(),
          gameweeksRes.json()
        ]);

        setData({
          players,
          teams,
          fixtures,
          gameweeks,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading static data:', err);
        setData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
    }

    fetchData();
  }, []);

  return data;
}
