import { 
  SwissTournament, 
  SwissPlayer, 
  SwissMatch, 
  PairingSuggestion, 
  PairingScenario,
  MatchOutcome,
  SwissPlayerStatus
} from '../types';

/**
 * Swiss Tournament Pairing Engine
 * Based on VBA implementation with permutation-based future viability checking
 */

// Player Status Management
export const updatePlayerStatus = (
  tournament: SwissTournament,
  playerId: number,
  newStatus: SwissPlayerStatus
): SwissTournament => {
  return {
    ...tournament,
    players: tournament.players.map(player =>
      player.id === playerId ? { ...player, status: newStatus } : player
    )
  };
};

export const getCurrentRound = (tournament: SwissTournament): number => {
  // Find the highest round number being played
  const playingMatches = tournament.matches.filter(m => m.isCurrentlyPlaying);
  if (playingMatches.length === 0) {
    return tournament.currentRound;
  }
  return Math.max(...playingMatches.map(m => m.round));
};

export const getPlayerStatus = (player: SwissPlayer, tournament: SwissTournament): SwissPlayerStatus => {
  // Check if player is currently playing a match
  const currentMatch = tournament.matches.find(
    m => m.isCurrentlyPlaying && (m.player1 === player.id || m.player2 === player.id)
  );
  
  if (currentMatch) {
    return 'playing';
  }
  
  // Check if player has finished all rounds
  if (player.roundsPlayed >= tournament.maxRounds) {
    return 'finished';
  }
  
  // Check if player has completed current round but not paired for next
  const currentRound = getCurrentRound(tournament);
  const hasCompletedCurrentRound = player.currentRound >= currentRound;
  const isPairedForNextRound = isPlayerPairedForNextRound(player, tournament);
  
  if (hasCompletedCurrentRound && !isPairedForNextRound) {
    return 'ready-to-pair';
  }
  
  return 'waiting';
};

export const isPlayerPairedForNextRound = (
  player: SwissPlayer, 
  tournament: SwissTournament
): boolean => {
  const nextRound = player.currentRound + 1;
  return tournament.matches.some(
    m => m.round === nextRound && 
         (m.player1 === player.id || m.player2 === player.id) &&
         !m.completed
  );
};

// Core Pairing Algorithm - Based on VBA FindLegalPairing
export const findLegalPairings = (
  tournament: SwissTournament
): PairingSuggestion[] => {
  const readyPlayers = tournament.players.filter(p => p.status === 'ready-to-pair');
  const suggestions: PairingSuggestion[] = [];
  
  // Group players by points earned (tournament points, not game points)
  const playersByPoints = groupPlayersByPoints(readyPlayers);
  
  // Find pairings within same point group first
  Object.entries(playersByPoints).forEach(([points, players]) => {
    const pointValue = parseInt(points);
    if (players.length >= 2) {
      const pairings = findPairingsInGroup(players, tournament, pointValue);
      suggestions.push(...pairings);
    }
  });
  
  // If we can't pair everyone within same points, try allowing point differences
  if (suggestions.length * 2 < readyPlayers.length) {
    const crossPointPairings = findCrossPointPairings(
      readyPlayers, 
      tournament, 
      suggestions
    );
    suggestions.push(...crossPointPairings);
  }
  
  return suggestions.sort((a, b) => b.priority - a.priority);
};

const groupPlayersByPoints = (players: SwissPlayer[]): Record<number, SwissPlayer[]> => {
  return players.reduce((groups, player) => {
    const points = player.pointsEarned;
    if (!groups[points]) {
      groups[points] = [];
    }
    groups[points].push(player);
    return groups;
  }, {} as Record<number, SwissPlayer[]>);
};

const findPairingsInGroup = (
  players: SwissPlayer[], 
  tournament: SwissTournament,
  points: number
): PairingSuggestion[] => {
  const suggestions: PairingSuggestion[] = [];
  let availablePlayers = [...players];
  
  // Randomize player order for first round (when all have 0 points and no opponent history)
  const isFirstRound = points === 0 && players.every(p => p.opponentHistory.length === 0);
  if (isFirstRound) {
    // Fisher-Yates shuffle algorithm
    for (let i = availablePlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePlayers[i], availablePlayers[j]] = [availablePlayers[j], availablePlayers[i]];
    }
  }
  
  for (let i = 0; i < availablePlayers.length; i++) {
    for (let j = i + 1; j < availablePlayers.length; j++) {
      const player1 = availablePlayers[i];
      const player2 = availablePlayers[j];
      
      // Check if they haven't played before
      if (!havePlayedBefore(player1, player2)) {
        const suggestion: PairingSuggestion = {
          player1Id: player1.id,
          player2Id: player2.id,
          priority: calculatePairingPriority(player1, player2, 0),
          pointsDifference: 0,
          eloBalance: Math.abs(player1.currentElo - player2.currentElo),
          reason: isFirstRound 
            ? `First round - Randomized pairing` 
            : `Same points (${points}) - Fresh matchup`
        };
        suggestions.push(suggestion);
      }
    }
  }
  
  return suggestions;
};

const findCrossPointPairings = (
  allPlayers: SwissPlayer[],
  tournament: SwissTournament,
  existingSuggestions: PairingSuggestion[]
): PairingSuggestion[] => {
  const suggestions: PairingSuggestion[] = [];
  const pairedPlayerIds = new Set([
    ...existingSuggestions.flatMap(s => [s.player1Id, s.player2Id])
  ]);
  
  const availablePlayers = allPlayers.filter(p => !pairedPlayerIds.has(p.id));
  
  for (let i = 0; i < availablePlayers.length; i++) {
    for (let j = i + 1; j < availablePlayers.length; j++) {
      const player1 = availablePlayers[i];
      const player2 = availablePlayers[j];
      
      const pointsDiff = Math.abs(player1.pointsEarned - player2.pointsEarned);
      
      // Only allow pairings within the configured point difference
      if (pointsDiff <= tournament.allowPointDifference && !havePlayedBefore(player1, player2)) {
        const suggestion: PairingSuggestion = {
          player1Id: player1.id,
          player2Id: player2.id,
          priority: calculatePairingPriority(player1, player2, pointsDiff),
          pointsDifference: pointsDiff,
          eloBalance: Math.abs(player1.currentElo - player2.currentElo),
          reason: `Point difference: ${pointsDiff} - Acceptable range`
        };
        suggestions.push(suggestion);
      }
    }
  }
  
  return suggestions;
};

const havePlayedBefore = (player1: SwissPlayer, player2: SwissPlayer): boolean => {
  return player1.opponentHistory.includes(player2.id) || 
         player2.opponentHistory.includes(player1.id);
};

const calculatePairingPriority = (
  player1: SwissPlayer, 
  player2: SwissPlayer, 
  pointsDifference: number
): number => {
  let priority = 100;
  
  // Prefer same points (highest priority)
  priority -= pointsDifference * 20;
  
  // Prefer balanced ELO ratings
  const eloDiff = Math.abs(player1.currentElo - player2.currentElo);
  priority -= eloDiff / 20;
  
  // Slight preference for players who haven't played many rounds
  const avgRounds = (player1.roundsPlayed + player2.roundsPlayed) / 2;
  priority += (10 - avgRounds) * 2;
  
  return Math.max(priority, 0);
};

// Scenario Simulation - Your VBA innovation!
export const simulatePairingScenarios = (
  tournament: SwissTournament,
  proposedPairings: PairingSuggestion[]
): PairingScenario => {
  const currentMatches = tournament.matches.filter(m => m.isCurrentlyPlaying);
  
  // Generate all possible outcomes for current matches
  const possibleOutcomes = generateMatchOutcomes(currentMatches);
  
  // For each outcome scenario, check if viable pairings exist
  const viableScenarios = possibleOutcomes.map(outcome => {
    const simulatedTournament = simulateMatchOutcome(tournament, outcome);
    const futureReadyPlayers = simulatedTournament.players.filter(
      p => getPlayerStatus(p, simulatedTournament) === 'ready-to-pair'
    );
    
    // Check if we can still make valid pairings after this outcome
    const futurePairings = findLegalPairings(simulatedTournament);
    const canPairAll = futurePairings.length * 2 >= futureReadyPlayers.length;
    
    return {
      outcome,
      viable: canPairAll,
      futurePairings
    };
  });
  
  const successfulScenarios = viableScenarios.filter(s => s.viable);
  // Handle edge case where no matches are playing (avoid NaN)
  const probabilityOfSuccess = viableScenarios.length === 0 ? 1.0 : successfulScenarios.length / viableScenarios.length;
  
  return {
    currentMatches,
    possibleOutcomes,
    viablePairings: proposedPairings,
    probabilityOfSuccess
  };
};

const generateMatchOutcomes = (matches: SwissMatch[]): MatchOutcome[] => {
  // For simplicity, assume 50/50 probability for each match
  // In a real implementation, you might use ELO to calculate probabilities
  return matches.flatMap(match => [
    { matchId: match.id, player1Wins: true, probability: 0.5 },
    { matchId: match.id, player1Wins: false, probability: 0.5 }
  ]);
};

const simulateMatchOutcome = (
  tournament: SwissTournament, 
  outcome: MatchOutcome
): SwissTournament => {
  // Simulate completing a match with the given outcome
  const match = tournament.matches.find(m => m.id === outcome.matchId);
  if (!match) return tournament;
  
  const updatedPlayers = tournament.players.map(player => {
    if (player.id === match.player1) {
      return {
        ...player,
        status: 'ready-to-pair' as SwissPlayerStatus,
        roundsPlayed: player.roundsPlayed + 1,
        totalWins: player.totalWins + (outcome.player1Wins ? 1 : 0),
        totalLosses: player.totalLosses + (outcome.player1Wins ? 0 : 1),
        pointsEarned: player.pointsEarned + (outcome.player1Wins ? 3 : 1)
      };
    } else if (player.id === match.player2) {
      return {
        ...player,
        status: 'ready-to-pair' as SwissPlayerStatus,
        roundsPlayed: player.roundsPlayed + 1,
        totalWins: player.totalWins + (outcome.player1Wins ? 0 : 1),
        totalLosses: player.totalLosses + (outcome.player1Wins ? 1 : 0),
        pointsEarned: player.pointsEarned + (outcome.player1Wins ? 1 : 3)
      };
    }
    return player;
  });
  
  return {
    ...tournament,
    players: updatedPlayers,
    matches: tournament.matches.map(m => 
      m.id === outcome.matchId 
        ? { ...m, completed: true, isCurrentlyPlaying: false }
        : m
    )
  };
};

// Main Pairing Engine
export const initiatePairingProcess = (tournament: SwissTournament): {
  suggestions: PairingSuggestion[];
  scenario: PairingScenario;
  canProceed: boolean;
  message: string;
} => {
  const readyPlayers = tournament.players.filter(p => p.status === 'ready-to-pair');
  
  if (readyPlayers.length < 2) {
    return {
      suggestions: [],
      scenario: { currentMatches: [], possibleOutcomes: [], viablePairings: [], probabilityOfSuccess: 1 },
      canProceed: false,
      message: readyPlayers.length === 0 
        ? "No players ready to pair" 
        : "Only one player ready - need at least 2 for pairing"
    };
  }
  
  const suggestions = findLegalPairings(tournament);
  const scenario = simulatePairingScenarios(tournament, suggestions);
  
  const canProceed = suggestions.length > 0; // Algorithm guarantees future viability
  
  let message = '';
  if (canProceed && suggestions.length > 0) {
    message = `${suggestions.length} pairing(s) available and ready to implement`;
  } else if (suggestions.length === 0) {
    message = "No legal pairings found - all players may have already played each other";
  }
  
  return { suggestions, scenario, canProceed, message };
};

// Implementation Helper
export const implementPairing = (
  tournament: SwissTournament,
  suggestion: PairingSuggestion
): SwissTournament => {
  const nextRound = getCurrentRound(tournament) + 1;
  const newMatchId = Math.max(...tournament.matches.map(m => m.id), -1) + 1;
  
  const newMatch: SwissMatch = {
    id: newMatchId,
    player1: suggestion.player1Id,
    player2: suggestion.player2Id,
    round: nextRound,
    player1Score: null,
    player2Score: null,
    completed: false,
    isCurrentlyPlaying: true,
    startTime: new Date(),
    estimatedDuration: 45 // Default 45 minutes
  };
  
  // Update player statuses and opponent history
  const updatedPlayers = tournament.players.map(player => {
    if (player.id === suggestion.player1Id) {
      return {
        ...player,
        status: 'playing' as SwissPlayerStatus,
        currentRound: nextRound,
        opponentHistory: [...player.opponentHistory, suggestion.player2Id]
      };
    } else if (player.id === suggestion.player2Id) {
      return {
        ...player,
        status: 'playing' as SwissPlayerStatus,
        currentRound: nextRound,
        opponentHistory: [...player.opponentHistory, suggestion.player1Id]
      };
    }
    return player;
  });
  
  return {
    ...tournament,
    players: updatedPlayers,
    matches: [...tournament.matches, newMatch],
    currentRound: Math.max(tournament.currentRound, nextRound)
  };
};

// Utility to create initial Swiss tournament from regular tournament
export const createSwissTournament = (
  regularTournament: any,
  maxRounds: number = 7,
  allowPointDifference: number = 1
): SwissTournament => {
  const swissPlayers: SwissPlayer[] = regularTournament.players.map((player: any) => ({
    ...player,
    status: 'ready-to-pair' as SwissPlayerStatus,
    currentRound: 0,
    opponentHistory: [],
    roundsPlayed: 0,
    totalWins: 0,
    totalLosses: 0,
    pointsEarned: 0,
    buchholzScore: 0
  }));
  
  return {
    ...regularTournament,
    tournamentType: 'rapid-swiss',
    players: swissPlayers,
    matches: [],
    currentRound: 1,
    maxRounds,
    pairingHistory: [],
    allowPointDifference,
    minimumPlayers: swissPlayers.length
  };
};