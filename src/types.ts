
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
  tournamentType?: 'round-robin' | 'rapid-swiss';
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

// Swiss Tournament Types
export type SwissPlayerStatus = 'waiting' | 'ready-to-pair' | 'playing' | 'finished';

export interface SwissPlayer extends Player {
  status: SwissPlayerStatus;
  currentRound: number;
  opponentHistory: number[]; // Array of opponent player IDs
  roundsPlayed: number;
  totalWins: number;
  totalLosses: number;
  pointsEarned: number; // Tournament points (3 for win, 1 for loss)
  buchholzScore: number;
  lastMatchTime?: Date;
}

export interface SwissMatch extends Match {
  startTime?: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number;
  isCurrentlyPlaying: boolean;
}

export interface PairingScenario {
  currentMatches: SwissMatch[];
  possibleOutcomes: MatchOutcome[];
  viablePairings: PairingSuggestion[];
  probabilityOfSuccess: number;
}

export interface MatchOutcome {
  matchId: number;
  player1Wins: boolean;
  probability: number;
}

export interface PairingSuggestion {
  player1Id: number;
  player2Id: number;
  priority: number; // Higher = better pairing
  pointsDifference: number;
  eloBalance: number;
  reason: string;
}

export interface SwissTournament extends Omit<Tournament, 'players' | 'matches'> {
  tournamentType: 'rapid-swiss';
  players: SwissPlayer[];
  matches: SwissMatch[];
  currentRound: number;
  maxRounds: number;
  pairingHistory: PairingSuggestion[][];
  allowPointDifference: number; // How many points difference is acceptable for pairing
  minimumPlayers: number;
}
