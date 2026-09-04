import type { FPLTeam } from '../types';

/**
 * Calculates offensive fixture difficulty (1-10) for the attacking team.
 * Lower means easier fixture.
 */
export function calculateOffensiveDifficulty(opponent: FPLTeam, isHome: boolean): number {
  let difficulty = 5.0; // Default baseline

  if (opponent.underlying) {
    // If we have understat data, use it.
    // Opponent xGA/NPxGA represents how many goals they are expected to concede.
    // Higher xGA = easier attacking fixture (lower difficulty score)
    const xga = (opponent.underlying.xGA_per_game + opponent.underlying.npxGA_per_game) / 2;
    
    // An average PL team might concede ~1.5 xG per game.
    // We map 0.5 xG -> difficulty 9 (very hard to score against)
    // We map 2.5 xG -> difficulty 1 (very easy to score against)
    difficulty = 11 - (xga * 4);
  } else {
    // Fallback to FPL defensive strength (1-5, higher is stronger)
    // Sometimes FPL API returns 0 for attack/defence strength, so fallback to overall strength
    const oppDefStrength = isHome
      ? (opponent.strength_defence_away || opponent.strength_overall_away || 3)
      : (opponent.strength_defence_home || opponent.strength_overall_home || 3);
    difficulty = oppDefStrength * 2;
  }
  
  // Add slight penalty for playing away
  if (!isHome) difficulty += 0.5;

  // Normalize between 1 and 10
  return Math.max(1, Math.min(10, difficulty));
}

/**
 * Calculates defensive fixture difficulty (1-10) for the defending team.
 * Lower means easier fixture (opponent is weak at attacking).
 */
export function calculateDefensiveDifficulty(opponent: FPLTeam, isHome: boolean): number {
  let difficulty = 5.0;

  if (opponent.underlying) {
    // Opponent xG/NPxG represents how many goals they are expected to score.
    // Higher xG = harder defensive fixture (higher difficulty score)
    const xg = (opponent.underlying.xG_per_game + opponent.underlying.npxG_per_game) / 2;
    
    // Average PL team ~1.5 xG per game.
    // 0.5 xG -> difficulty 1 (very easy to defend)
    // 2.5 xG -> difficulty 9 (very hard to defend)
    difficulty = (xg * 4) - 1;
  } else {
    // Fallback to FPL attacking strength
    // Sometimes FPL API returns 0 for attack/defence strength, so fallback to overall strength
    const oppAttStrength = isHome
      ? (opponent.strength_attack_away || opponent.strength_overall_away || 3)
      : (opponent.strength_attack_home || opponent.strength_overall_home || 3);
    difficulty = oppAttStrength * 2;
  }
  
  // Add slight penalty for playing away
  if (!isHome) difficulty += 0.5;

  // Normalize between 1 and 10
  return Math.max(1, Math.min(10, difficulty));
}

export function calculateOverallDifficulty(offDiff: number, defDiff: number): number {
  return (offDiff + defDiff) / 2;
}

export function getDifficultyColor(score: number): string {
  if (score < 4) return 'bg-fpl-green text-fpl-purple'; // Easy
  if (score < 7) return 'bg-yellow-400 text-black'; // Medium
  if (score < 9) return 'bg-orange-500 text-white'; // Hard
  return 'bg-fpl-pink text-white'; // Very Hard
}
