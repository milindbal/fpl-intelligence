import type { FPLPlayer, FPLTeam } from '../types';
import { calculateOffensiveDifficulty, calculateDefensiveDifficulty } from './difficulty';

export interface ProjectionContext {
  player: FPLPlayer;
  opponent: FPLTeam;
  isHome: boolean;
}

/**
 * Calculates deterministic projected FPL points for a player.
 */
export function calculateProjectedPoints({ player, opponent, isHome }: ProjectionContext): number {
  let projectedPoints = 0;
  let expectedMinutes = player.fpl.minutes > 60 ? 90 : (player.fpl.minutes > 0 ? 30 : 0);
  
  // Base points for playing
  if (expectedMinutes > 60) projectedPoints += 2;
  else if (expectedMinutes > 0) projectedPoints += 1;
  else return 0; // Doesn't play

  const offDiff = calculateOffensiveDifficulty(opponent, isHome);
  const defDiff = calculateDefensiveDifficulty(opponent, isHome);

  // Attacking returns (Goals & Assists based on xG/xA or historical goals/assists)
  const expectedGoals = (player.underlying?.xG || player.fpl.xG) / (player.fpl.minutes / 90 || 1);
  const expectedAssists = (player.underlying?.xA || player.fpl.xA) / (player.fpl.minutes / 90 || 1);

  // Fixture modifier (1 = favorable, 10 = difficult)
  // Reverse to make a multiplier: e.g. diff 1 -> multiplier 1.5, diff 10 -> multiplier 0.5
  const attackingMultiplier = 1 + ((5.5 - offDiff) * 0.1); 
  
  let posGoalPts = 0;
  if (player.position === 'FWD') posGoalPts = 4;
  else if (player.position === 'MID') posGoalPts = 5;
  else posGoalPts = 6;

  projectedPoints += (expectedGoals * posGoalPts * attackingMultiplier);
  projectedPoints += (expectedAssists * 3 * attackingMultiplier); // 3 pts for assist for all

  // Defensive returns (Clean Sheets, Goals Conceded)
  if (player.position === 'GKP' || player.position === 'DEF') {
    const defensiveMultiplier = 1 + ((5.5 - defDiff) * 0.1);
    
    // Base probability of a clean sheet depending on opponent attacking strength (simplified)
    const csProbability = 0.3 * defensiveMultiplier;
    projectedPoints += (csProbability * 4); // 4 pts for CS
    
    // Deduct for goals conceded (1 pt per 2 goals)
    const expGoalsConceded = (opponent.strength_attack_home / 5) * 1.5 * (1/defensiveMultiplier);
    projectedPoints -= Math.floor(expGoalsConceded / 2);
  } else if (player.position === 'MID') {
    const defensiveMultiplier = 1 + ((5.5 - defDiff) * 0.1);
    const csProbability = 0.3 * defensiveMultiplier;
    projectedPoints += (csProbability * 1); // 1 pt for CS for MIDs
  }

  // Bonus/BPS estimation (simplified correlation with bps per 90)
  const bpsPer90 = player.fpl.bps / (player.fpl.minutes / 90 || 1);
  if (bpsPer90 > 25) projectedPoints += 0.8;
  else if (bpsPer90 > 20) projectedPoints += 0.4;
  else if (bpsPer90 > 15) projectedPoints += 0.1;

  // Yellow/Red cards ignored for basic deterministic projection
  
  return Math.max(0, projectedPoints); // Never project below 0 for simplicity
}
