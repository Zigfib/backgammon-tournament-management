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
  
  // Debug logging for getCurrentRound
  console.log(`getCurrentRound debug: playingMatches=${playingMatches.length}, rounds=[${playingMatches.map(m => m.round).join(',')}], tournament.currentRound=${tournament.currentRound}`);
  
  if (playingMatches.length === 0) {
    return tournament.currentRound;
  }
  return Math.max(...playingMatches.map(m => m.round));
};

export const getPlayerStatus = (player: SwissPlayer, tournament: SwissTournament): SwissPlayerStatus => {
  // 1. PLAYING: Player is currently in an active match (admin confirmed pairing)
  const currentMatch = tournament.matches.find(
    m => m.isCurrentlyPlaying && (m.player1 === player.id || m.player2 === player.id)
  );
  
  if (currentMatch) {
    return 'playing';
  }
  
  // 2. WAITING: Player blocked by "2 rounds simultaneously" constraint (check BEFORE finished)
  const activeRounds = Array.from(new Set(tournament.matches
    .filter(m => m.isCurrentlyPlaying)
    .map(m => m.round))).sort((a, b) => a - b);
  
  if (activeRounds.length > 0) {
    const lowestActiveRound = Math.min(...activeRounds);
    const playerCompletedRound = player.roundsPlayed;
    
    // If player is 1+ rounds ahead of the lowest active round, they must wait
    // (Cannot start round N+2 while round N is active)
    if (playerCompletedRound - lowestActiveRound >= 1) {
      console.log(`Player ${player.name} WAITING: completed round ${playerCompletedRound} but round ${lowestActiveRound} still active (2-round limit)`);
      return 'waiting';
    }
  }
  
  // 3. FINISHED: Player completed all required rounds AND not blocked by constraints
  if (player.roundsPlayed >= tournament.maxRounds) {
    console.log(`Player ${player.name} marked as FINISHED: completed ${player.roundsPlayed}/${tournament.maxRounds} rounds`);
    return 'finished';
  }
  
  // 4. READY-TO-PAIR: Available for pairing (default case)
  return 'ready-to-pair';
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
  const readyPlayers = tournament.players.filter(p => getPlayerStatus(p, tournament) === 'ready-to-pair');
  
  if (readyPlayers.length < 2) return [];
  
  // Find optimal pairing combination for ALL ready players
  return findOptimalPairingCombination(readyPlayers, tournament);
};

// Maximum matching algorithm with backtracking
const findOptimalPairingCombination = (
  readyPlayers: SwissPlayer[],
  tournament: SwissTournament
): PairingSuggestion[] => {
  // Step 1: Build compatibility graph
  const compatibilityGraph = buildCompatibilityGraph(readyPlayers, tournament);
  
  // Step 2: Find maximum matching using backtracking
  const bestMatching = findMaximumMatching(compatibilityGraph, readyPlayers);
  
  return bestMatching.sort((a, b) => b.priority - a.priority);
};

// Build a compatibility graph between players
const buildCompatibilityGraph = (
  players: SwissPlayer[],
  tournament: SwissTournament
): Map<number, PairingSuggestion[]> => {
  const graph = new Map<number, PairingSuggestion[]>();
  
  // Initialize graph for each player
  players.forEach(player => {
    graph.set(player.id, []);
  });
  
  // Add edges for compatible pairs
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];
      
      // Check compatibility
      const pointsDiff = Math.abs(player1.pointsEarned - player2.pointsEarned);
      const withinTolerance = pointsDiff <= tournament.allowPointDifference;
      const notPlayedBefore = !havePlayedBefore(player1, player2);
      
      if (withinTolerance && notPlayedBefore) {
        const priority = calculatePairingPriority(player1, player2, pointsDiff);
        
        const suggestion: PairingSuggestion = {
          player1Id: player1.id,
          player2Id: player2.id,
          priority,
          pointsDifference: pointsDiff,
          eloBalance: Math.abs(player1.currentElo - player2.currentElo),
          reason: pointsDiff === 0 
            ? `Same points (${player1.pointsEarned}) - Fresh matchup`
            : `Point difference: ${pointsDiff} - Acceptable range`
        };
        
        // Add edge in both directions
        graph.get(player1.id)!.push(suggestion);
        graph.get(player2.id)!.push(suggestion);
      }
    }
  }
  
  return graph;
};

// Find maximum matching using backtracking
const findMaximumMatching = (
  graph: Map<number, PairingSuggestion[]>,
  players: SwissPlayer[]
): PairingSuggestion[] => {
  let bestMatching: PairingSuggestion[] = [];
  let bestScore = -1;
  
  // Try all possible matchings using backtracking
  const backtrack = (
    currentMatching: PairingSuggestion[],
    remainingPlayers: Set<number>
  ): void => {
    // If no more pairs can be made, evaluate this matching
    if (remainingPlayers.size < 2) {
      const score = currentMatching.reduce((sum, pair) => sum + pair.priority, 0);
      
      // Prefer more pairings, then higher priority
      if (currentMatching.length > bestMatching.length || 
          (currentMatching.length === bestMatching.length && score > bestScore)) {
        bestMatching = [...currentMatching];
        bestScore = score;
      }
      return;
    }
    
    // Get first available player
    const playerId = Array.from(remainingPlayers)[0];
    const playerPairings = graph.get(playerId) || [];
    
    // Try pairing with each compatible player
    let foundValidPairing = false;
    for (const pairing of playerPairings) {
      const otherId = pairing.player1Id === playerId ? pairing.player2Id : pairing.player1Id;
      
      if (remainingPlayers.has(otherId)) {
        foundValidPairing = true;
        
        // Make this pairing
        currentMatching.push(pairing);
        const newRemaining = new Set(remainingPlayers);
        newRemaining.delete(playerId);
        newRemaining.delete(otherId);
        
        // Recurse
        backtrack(currentMatching, newRemaining);
        
        // Backtrack
        currentMatching.pop();
      }
    }
    
    // If no valid pairing found, skip this player
    if (!foundValidPairing) {
      const newRemaining = new Set(remainingPlayers);
      newRemaining.delete(playerId);
      backtrack(currentMatching, newRemaining);
    }
  };
  
  // Start backtracking
  const allPlayerIds = new Set(players.map(p => p.id));
  backtrack([], allPlayerIds);
  
  return bestMatching;
};


// Handle cross-point pairings for remaining players



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
  
  // Generate all possible outcome combinations (cartesian product)
  const possibleOutcomeCombinations = generateMatchOutcomes(currentMatches);
  
  // For each outcome scenario combination, check if viable pairings exist
  const viableScenarios = possibleOutcomeCombinations.map(outcomeCombo => {
    const simulatedTournament = simulateMatchOutcomes(tournament, outcomeCombo);
    const futureReadyPlayers = simulatedTournament.players.filter(
      p => getPlayerStatus(p, simulatedTournament) === 'ready-to-pair'
    );
    
    // Check if we can still make valid pairings after this outcome
    const futurePairings = findLegalPairings(simulatedTournament);
    const canPairAll = futurePairings.length * 2 >= futureReadyPlayers.length;
    
    return {
      outcome: outcomeCombo,
      viable: canPairAll,
      futurePairings
    };
  });
  
  const successfulScenarios = viableScenarios.filter(s => s.viable);
  const probabilityOfSuccess = successfulScenarios.length / viableScenarios.length;
  
  return {
    currentMatches,
    possibleOutcomes: possibleOutcomeCombinations.flat(), // Flatten for UI compatibility
    viablePairings: proposedPairings,
    probabilityOfSuccess
  };
};

const generateMatchOutcomes = (matches: SwissMatch[]): MatchOutcome[][] => {
  // Generate all possible combinations of outcomes (cartesian product)
  if (matches.length === 0) return [[]];
  
  const generateCombinations = (matchIndex: number): MatchOutcome[][] => {
    if (matchIndex >= matches.length) return [[]];
    
    const match = matches[matchIndex];
    const remainingCombinations = generateCombinations(matchIndex + 1);
    
    const allCombinations: MatchOutcome[][] = [];
    
    // Player 1 wins
    remainingCombinations.forEach(combo => {
      allCombinations.push([
        { matchId: match.id, player1Wins: true, probability: 0.5 },
        ...combo
      ]);
    });
    
    // Player 2 wins  
    remainingCombinations.forEach(combo => {
      allCombinations.push([
        { matchId: match.id, player1Wins: false, probability: 0.5 },
        ...combo
      ]);
    });
    
    return allCombinations;
  };
  
  return generateCombinations(0);
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
        pointsEarned: player.pointsEarned + (outcome.player1Wins ? 1 : 0),
        // CRITICAL: Update opponent history to prevent rematches
        opponentHistory: [...player.opponentHistory, match.player2]
      };
    } else if (player.id === match.player2) {
      return {
        ...player,
        status: 'ready-to-pair' as SwissPlayerStatus,
        roundsPlayed: player.roundsPlayed + 1,
        totalWins: player.totalWins + (outcome.player1Wins ? 0 : 1),
        totalLosses: player.totalLosses + (outcome.player1Wins ? 1 : 0),
        pointsEarned: player.pointsEarned + (outcome.player1Wins ? 0 : 1),
        // CRITICAL: Update opponent history to prevent rematches
        opponentHistory: [...player.opponentHistory, match.player1]
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

const simulateMatchOutcomes = (
  tournament: SwissTournament, 
  outcomes: MatchOutcome[]
): SwissTournament => {
  // Apply all outcomes in sequence
  return outcomes.reduce((currentTournament, outcome) => 
    simulateMatchOutcome(currentTournament, outcome), 
    tournament
  );
};

// Main Pairing Engine
export const initiatePairingProcess = (tournament: SwissTournament): {
  suggestions: PairingSuggestion[];
  scenario: PairingScenario;
  canProceed: boolean;
  message: string;
} => {
  const readyPlayers = tournament.players.filter(p => getPlayerStatus(p, tournament) === 'ready-to-pair');
  
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

  // Determine target round based on ready players (they all need the same round)
  const targetRound = readyPlayers[0].roundsPlayed + 1;
  
  // Check if tournament has reached maximum rounds
  if (targetRound > tournament.maxRounds) {
    return {
      suggestions: [],
      scenario: { currentMatches: [], possibleOutcomes: [], viablePairings: [], probabilityOfSuccess: 1 },
      canProceed: false,
      message: `Tournament complete! All ${tournament.maxRounds} rounds have been played.`
    };
  }

  // Check round gap constraint: only allow 2 rounds to be played simultaneously
  const activeRounds = Array.from(new Set(tournament.matches
    .filter(m => m.isCurrentlyPlaying)
    .map(m => m.round)));
  
  if (activeRounds.length > 0) {
    const minActiveRound = Math.min(...activeRounds);
    
    // Don't allow round N+2 while round N is still active  
    if (targetRound - minActiveRound >= 2) {
      return {
        suggestions: [],
        scenario: { currentMatches: [], possibleOutcomes: [], viablePairings: [], probabilityOfSuccess: 1 },
        canProceed: false,
        message: `Cannot start round ${targetRound} while round ${minActiveRound} is still in progress. Maximum 2 rounds can play simultaneously.`
      };
    }
  }
  
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
  
  // Temporarily disable 100% enforcement for debugging - TODO: Re-enable after fixing simulation
  const canProceed = suggestions.length > 0; // && scenario.probabilityOfSuccess === 1.0;
  
  let message = '';
  if (canProceed && suggestions.length > 0) {
    message = `${suggestions.length} pairing(s) available and ready to implement`;
  } else if (suggestions.length > 0 && scenario.probabilityOfSuccess < 1.0) {
    message = `${suggestions.length} pairing(s) found, but future success not guaranteed (${(scenario.probabilityOfSuccess * 100).toFixed(1)}% success rate). Waiting for better pairing opportunities.`;
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
  // Determine round based on the players being paired (they should both need the same round)
  const player1 = tournament.players.find(p => p.id === suggestion.player1Id);
  const player2 = tournament.players.find(p => p.id === suggestion.player2Id);
  
  if (!player1 || !player2) {
    console.error(`Cannot find players: ${suggestion.player1Id}, ${suggestion.player2Id}`);
    return tournament; // Return unchanged tournament
  }
  
  const nextRound = player1.roundsPlayed + 1;
  
  // Guard against creating matches beyond maxRounds
  if (nextRound > tournament.maxRounds) {
    console.error(`Cannot create match for round ${nextRound} - tournament limited to ${tournament.maxRounds} rounds`);
    return tournament; // Return unchanged tournament
  }

  // Defensive round gap constraint: only allow 2 rounds simultaneously  
  const activeRounds = Array.from(new Set(tournament.matches
    .filter(m => m.isCurrentlyPlaying)
    .map(m => m.round)));
    
  if (activeRounds.length > 0) {
    const minActiveRound = Math.min(...activeRounds);
    if (nextRound - minActiveRound >= 2) {
      console.error(`Cannot start round ${nextRound} while round ${minActiveRound} is still active. Maximum 2 rounds can play simultaneously.`);
      return tournament; // Return unchanged tournament
    }
  }
  
  // Check that players are ready for the target round
  
  if (player1.roundsPlayed + 1 !== nextRound) {
    console.error(`Player ${player1.name} cannot be paired for round ${nextRound} - they need round ${player1.roundsPlayed + 1}`);
    return tournament; // Return unchanged tournament  
  }
  
  if (player2.roundsPlayed + 1 !== nextRound) {
    console.error(`Player ${player2.name} cannot be paired for round ${nextRound} - they need round ${player2.roundsPlayed + 1}`);
    return tournament; // Return unchanged tournament
  }
  
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
    // Take specific properties from regular tournament (avoid spreading numRounds)
    name: regularTournament.name,
    rankingSystem: regularTournament.rankingSystem,
    scoreEntryMode: regularTournament.scoreEntryMode,
    isAdmin: regularTournament.isAdmin,
    maxPoints: regularTournament.maxPoints,
    // Swiss-specific properties
    tournamentType: 'rapid-swiss',
    players: swissPlayers,
    matches: [],
    currentRound: 0, // Start at 0, first matches will be round 1
    maxRounds, // Use the explicitly passed maxRounds parameter
    pairingHistory: [],
    allowPointDifference,
    minimumPlayers: swissPlayers.length,
    // Initialize required fields
    results: {},
    numRounds: maxRounds // Also set numRounds for consistency
  };
};