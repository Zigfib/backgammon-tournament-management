
export interface Player {
  id: number;
  name: string;
  startingElo: number;
  currentElo: number;
  email: string;
  phone: string;
  matches: number;
  points: number;
  goalDiff: number;
}

export interface Match {
  id: number;
  player1: number;
  player2: number;
  round: number;
  player1Score: number | null;
  player2Score: number | null;
  completed: boolean;
}

export interface MatchResult {
  round: number;
  score1: number;
  score2: number;
  points1: number;
  points2: number;
  elo1Before: number;
  elo2Before: number;
  elo1After: number;
  elo2After: number;
  elo1Change: number;
  elo2Change: number;
}

export interface Tournament {
  name: string;
  players: Player[];
  numRounds: number;
  maxPoints: number;
  matches: Match[];
  results: Record<number, Record<number, MatchResult[]>>;
  rankingSystem: 'standard' | 'hybrid';
  scoreEntryMode: 'admin-only' | 'player-entry' | 'dual-confirm' | 'open-access';
  isAdmin: boolean;
  tournamentType: 'round-robin' | 'rapid-swiss';
}

export interface Tiebreakers {
  winsAgainstSamePoints: number;
  buchholzScore: number;
  goalDifference: number;
}

export interface PlayerWithTiebreakers extends Player {
  tiebreakers: Tiebreakers;
  rankMethod?: 'points' | 'elo';
  eloChange?: number;
}

export interface EloCalculation {
  newWinnerELO: number;
  newLoserELO: number;
  winnerChange: number;
  loserChange: number;
}
