export interface FPLPlayer {
  id: number;
  name: string;
  web_name: string;
  teamId: number;
  teamName: string;
  position: string;
  price: number;
  fpl: {
    totalPoints: number;
    form: number;
    ownership: number;
    minutes: number;
    goals: number;
    assists: number;
    xG: number;
    xA: number;
    bonus: number;
    bps: number;
  };
  underlying?: {
    xG: number;
    xA: number;
    npxG: number;
    shots: number;
    keyPasses: number;
    xGChain: number;
    xGBuildup: number;
  };
}

export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  underlying?: {
    xG_per_game: number;
    xGA_per_game: number;
    npxG_per_game: number;
    npxGA_per_game: number;
  };
}

export interface FPLFixture {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string;
  finished: boolean;
}
