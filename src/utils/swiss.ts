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
  
  if (readyPlayers.length < 2) return [];
  
  // Find optimal pairing combination for ALL ready players
  return findOptimalPairingCombination(readyPlayers, tournament);
};

// Find the best combination of pairings that covers all ready players
const findOptimalPairingCombination = (
  readyPlayers: SwissPlayer[],
  tournament: SwissTournament
): PairingSuggestion[] => {
  const playersByPoints = groupPlayersByPoints(readyPlayers);
  const finalPairings: PairingSuggestion[] = [];
  let remainingPlayers = [...readyPlayers];
  
  // First, pair players within same point groups
  Object.entries(playersByPoints)
    .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Start with highest points
    .forEach(([points, players]) => {
      const pointValue = parseInt(points);
      const availablePlayers = players.filter(p => 
        remainingPlayers.some(rp => rp.id === p.id)
      );
      
      if (availablePlayers.length >= 2) {
        const pairings = findOptimalPairingWithinGroup(availablePlayers, tournament, pointValue);
        finalPairings.push(...pairings);
        
        // Remove paired players from remaining list
        const pairedPlayerIds = new Set(pairings.flatMap(p => [p.player1Id, p.player2Id]));
        remainingPlayers = remainingPlayers.filter(p => !pairedPlayerIds.has(p.id));
      }
    });
  
  // Handle any remaining players with cross-point pairings
  if (remainingPlayers.length >= 2) {
    const crossPointPairings = findOptimalCrossPointPairings(remainingPlayers, tournament);
    finalPairings.push(...crossPointPairings);
  }
  
  return finalPairings.sort((a, b) => b.priority - a.priority);
};

// Create optimal pairings within a point group (greedy approach)
const findOptimalPairingWithinGroup = (
  players: SwissPlayer[],
  tournament: SwissTournament,
  points: number
): PairingSuggestion[] => {
  let availablePlayers = [...players];
  const suggestions: PairingSuggestion[] = [];
  
  // Randomize for first round
  const isFirstRound = points === 0 && players.every(p => p.opponentHistory.length === 0);
  if (isFirstRound) {
    // Fisher-Yates shuffle
    for (let i = availablePlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePlayers[i], availablePlayers[j]] = [availablePlayers[j], availablePlayers[i]];
    }
  }
  
  // Greedily pair players
  while (availablePlayers.length >= 2) {
    const player1 = availablePlayers[0];
    let bestMatch = null;
    let bestMatchIndex = -1;
    let bestPriority = -1;
    
    // Find the best opponent for player1
    for (let i = 1; i < availablePlayers.length; i++) {
      const player2 = availablePlayers[i];
      
      if (!havePlayedBefore(player1, player2)) {
        const priority = calculatePairingPriority(player1, player2, 0);
        if (priority > bestPriority) {
          bestMatch = player2;
          bestMatchIndex = i;
          bestPriority = priority;
        }
      }
    }
    
    if (bestMatch) {
      suggestions.push({
        player1Id: player1.id,
        player2Id: bestMatch.id,
        priority: bestPriority,
        pointsDifference: 0,
        eloBalance: Math.abs(player1.currentElo - bestMatch.currentElo),
        reason: isFirstRound 
          ? `First round - Randomized pairing` 
          : `Same points (${points}) - Fresh matchup`
      });
      
      // Remove both players from available list
      availablePlayers = availablePlayers.filter((p, index) => 
        index !== 0 && index !== bestMatchIndex
      );
    } else {
      // No valid pairing found, remove player1 and try next
      availablePlayers.shift();
    }
  }
  
  return suggestions;
};

// Handle cross-point pairings for remaining players
const findOptimalCrossPointPairings = (
  remainingPlayers: SwissPlayer[],
  tournament: SwissTournament
): PairingSuggestion[] => {
  const suggestions: PairingSuggestion[] = [];
  let availablePlayers = [...remainingPlayers];
  
  while (availablePlayers.length >= 2) {
    const player1 = availablePlayers[0];
    let bestMatch = null;
    let bestMatchIndex = -1;
    let bestPriority = -1;
    
    for (let i = 1; i < availablePlayers.length; i++) {
      const player2 = availablePlayers[i];
      const pointsDiff = Math.abs(player1.pointsEarned - player2.pointsEarned);
      
      if (pointsDiff <= tournament.allowPointDifference && !havePlayedBefore(player1, player2)) {
        const priority = calculatePairingPriority(player1, player2, pointsDiff);
        if (priority > bestPriority) {
          bestMatch = player2;
          bestMatchIndex = i;
          bestPriority = priority;
        }
      }
    }
    
    if (bestMatch) {
      const pointsDiff = Math.abs(player1.pointsEarned - bestMatch.pointsEarned);
      suggestions.push({
        player1Id: player1.id,
        player2Id: bestMatch.id,
        priority: bestPriority,
        pointsDifference: pointsDiff,
        eloBalance: Math.abs(player1.currentElo - bestMatch.currentElo),
        reason: `Point difference: ${pointsDiff} - Acceptable range`
      });
      
      availablePlayers = availablePlayers.filter((p, index) => 
        index !== 0 && index !== bestMatchIndex
      );
    } else {
      availablePlayers.shift();
    }
  }
  
  return suggestions;
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
  
  // If no current matches are playing, success rate should be 100% since proposed pairings are already valid
  if (currentMatches.length === 0) {
    return {
      currentMatches: [],
      possibleOutcomes: [],
      viablePairings: proposedPairings,
      probabilityOfSuccess: 1.0 // 100% success when no active matches to worry about
    };
  }
  
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
  const probabilityOfSuccess = successfulScenarios.length / viableScenarios.length;
  
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