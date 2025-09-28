import { Tournament, Player, Match } from '../types';

// Interface for pairing scenarios used in safe pairing analysis
interface PairingScenario {
  outcomes: { matchId: number, player1Score: number, player2Score: number }[];
  players: Player[];
}

// Calculate ELO change for a player
export const calculateEloChange = (playerElo: number, opponentElo: number, playerScore: number, opponentScore: number, kFactor: number = 32): number => {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = playerScore > opponentScore ? 1 : 0;
  
  // Margin of victory adjustment
  const scoreDiff = Math.abs(playerScore - opponentScore);
  const marginMultiplier = Math.min(1 + (scoreDiff / 10), 2.0);
  
  return Math.round(kFactor * (actualScore - expectedScore) * marginMultiplier);
};

// Update match result and calculate new stats
export const updateMatchResult = (tournament: Tournament, matchId: number, player1ScoreStr: string, player2ScoreStr: string): Tournament => {
  const player1Score = parseInt(player1ScoreStr);
  const player2Score = parseInt(player2ScoreStr);
  
  const updatedMatches = tournament.matches.map(match => {
    if (match.id === matchId) {
      return {
        ...match,
        player1Score,
        player2Score,
        completed: true
      };
    }
    return match;
  });

  // Calculate new ELO ratings and stats
  const updatedPlayers = tournament.players.map(player => {
    const playerMatches = updatedMatches.filter(m => 
      (m.player1 === player.id || m.player2 === player.id) && m.completed
    );
    
    let newElo = player.startingElo;
    let points = 0;
    let matches = 0;
    let goalDiff = 0;

    playerMatches.forEach(match => {
      matches++;
      
      if (match.player1 === player.id) {
        // Player is player1
        const playerScore = match.player1Score!;
        const opponentScore = match.player2Score!;
        const opponentElo = tournament.players[match.player2].currentElo || tournament.players[match.player2].startingElo;
        
        points += playerScore > opponentScore ? 3 : 1;
        goalDiff += playerScore - opponentScore;
        
        const eloChange = calculateEloChange(newElo, opponentElo, playerScore, opponentScore);
        newElo += eloChange;
      } else {
        // Player is player2
        const playerScore = match.player2Score!;
        const opponentScore = match.player1Score!;
        const opponentElo = tournament.players[match.player1].currentElo || tournament.players[match.player1].startingElo;
        
        points += playerScore > opponentScore ? 3 : 1;
        goalDiff += playerScore - opponentScore;
        
        const eloChange = calculateEloChange(newElo, opponentElo, playerScore, opponentScore);
        newElo += eloChange;
      }
    });

    return {
      ...player,
      currentElo: newElo,
      points,
      matches,
      goalDiff
    };
  });

  return {
    ...tournament,
    matches: updatedMatches,
    players: updatedPlayers
  };
};

// Get player record against specific opponent
export const getPlayerRecord = (playerId: number, opponentId: number, matches: Match[]): { wins: number, losses: number } => {
  let wins = 0;
  let losses = 0;
  
  matches.forEach(match => {
    if (!match.completed) return;
    
    if (match.player1 === playerId && match.player2 === opponentId) {
      if (match.player1Score! > match.player2Score!) wins++;
      else losses++;
    } else if (match.player1 === opponentId && match.player2 === playerId) {
      if (match.player2Score! > match.player1Score!) wins++;
      else losses++;
    }
  });
  
  return { wins, losses };
};

// Get overall player record (for SwissDashboard usage)
export const getOverallPlayerRecord = (playerId: number, matches: Match[]): { wins: number, losses: number } => {
  let wins = 0;
  let losses = 0;
  
  matches.forEach(match => {
    if (!match.completed) return;
    
    if (match.player1 === playerId) {
      if (match.player1Score! > match.player2Score!) wins++;
      else losses++;
    } else if (match.player2 === playerId) {
      if (match.player2Score! > match.player1Score!) wins++;
      else losses++;
    }
  });
  
  return { wins, losses };
};

// Calculate tournament statistics
export const calculateStats = (players: Player[], matches: Match[]): Player[] => {
  return players.map(player => {
    const playerMatches = matches.filter(m => 
      (m.player1 === player.id || m.player2 === player.id) && m.completed
    );
    
    let newElo = player.startingElo;
    let points = 0;
    let matchCount = 0;
    let goalDiff = 0;

    playerMatches.forEach(match => {
      matchCount++;
      
      if (match.player1 === player.id) {
        const playerScore = match.player1Score!;
        const opponentScore = match.player2Score!;
        const opponent = players.find(p => p.id === match.player2)!;
        const opponentElo = opponent.currentElo || opponent.startingElo;
        
        points += playerScore > opponentScore ? 3 : 1;
        goalDiff += playerScore - opponentScore;
        
        const eloChange = calculateEloChange(newElo, opponentElo, playerScore, opponentScore);
        newElo += eloChange;
      } else {
        const playerScore = match.player2Score!;
        const opponentScore = match.player1Score!;
        const opponent = players.find(p => p.id === match.player1)!;
        const opponentElo = opponent.currentElo || opponent.startingElo;
        
        points += playerScore > opponentScore ? 3 : 1;
        goalDiff += playerScore - opponentScore;
        
        const eloChange = calculateEloChange(newElo, opponentElo, playerScore, opponentScore);
        newElo += eloChange;
      }
    });

    return {
      ...player,
      currentElo: newElo,
      points,
      matches: matchCount,
      goalDiff
    };
  });
};

// Helper functions for Swiss tournament logic
export const getRoundsPlayed = (player: Player, matches: Match[]): number => {
  return matches.filter(m => 
    (m.player1 === player.id || m.player2 === player.id) && m.completed
  ).length;
};

export const getCurrentRound = (tournament: Tournament): number => {
  const playingMatches = tournament.matches.filter(m => !m.completed);
  
  if (playingMatches.length === 0) {
    const completedMatches = tournament.matches.filter(m => m.completed);
    const rounds = completedMatches.map(m => m.round);
    return rounds.length > 0 ? Math.max(...rounds) + 1 : 1;
  }
  
  const activeRounds = playingMatches.map(m => m.round);
  const minActiveRound = Math.min(...activeRounds);
  
  return minActiveRound;
};

export const getActiveRounds = (tournament: Tournament): number[] => {
  const activeMatches = tournament.matches.filter(m => !m.completed);
  const roundSet = new Set(activeMatches.map(m => m.round));
  const rounds = Array.from(roundSet);
  return rounds.sort((a, b) => a - b);
};

export const getNextRound = (tournament: Tournament): number => {
  const availablePlayers = getAvailablePlayers(tournament);
  
  if (availablePlayers.length === 0) {
    return getCurrentRound(tournament);
  }
  
  const minRoundsPlayed = Math.min(...availablePlayers.map(player => getRoundsPlayed(player, tournament.matches)));
  return minRoundsPlayed + 1;
};

export const getAvailablePlayers = (tournament: Tournament): Player[] => {
  const activeMatches = tournament.matches.filter(m => !m.completed);
  const playersInActiveMatches = new Set<number>();
  
  activeMatches.forEach(match => {
    playersInActiveMatches.add(match.player1);
    playersInActiveMatches.add(match.player2);
  });
  
  return tournament.players.filter(player => 
    !playersInActiveMatches.has(player.id) && 
    getRoundsPlayed(player, tournament.matches) < tournament.numRounds
  );
};

export const havePlayedBefore = (playerId1: number, playerId2: number, matches: Match[]): boolean => {
  return matches.some(match => 
    (match.player1 === playerId1 && match.player2 === playerId2) ||
    (match.player1 === playerId2 && match.player2 === playerId1)
  );
};

// Utility function to shuffle array
const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate all possible outcome scenarios for active matches
const enumerateOutcomeScenarios = (tournament: Tournament, activeMatches: Match[], availableAfterCompletion: Player[]): PairingScenario[] => {
  if (activeMatches.length === 0) {
    return [{ outcomes: [], players: [...tournament.players] }];
  }
  
  if (activeMatches.length > 8) {
    return [];
  }
  
  const scenarios: PairingScenario[] = [];
  
  const generateScenarios = (matchIndex: number, currentOutcomes: any[], currentPlayers: Player[]) => {
    if (matchIndex >= activeMatches.length) {
      scenarios.push({
        outcomes: [...currentOutcomes],
        players: [...currentPlayers]
      });
      return;
    }
    
    const match = activeMatches[matchIndex];
    const player1 = currentPlayers[match.player1];
    const player2 = currentPlayers[match.player2];
    
    // Scenario 1: Player 1 wins
    const outcome1 = { matchId: match.id, player1Score: tournament.maxPoints, player2Score: tournament.maxPoints - 1 };
    const newPlayers1 = [...currentPlayers];
    newPlayers1[match.player1] = { ...player1, points: player1.points + 3, matches: player1.matches + 1 };
    newPlayers1[match.player2] = { ...player2, points: player2.points + 1, matches: player2.matches + 1 };
    generateScenarios(matchIndex + 1, [...currentOutcomes, outcome1], newPlayers1);
    
    // Scenario 2: Player 2 wins
    const outcome2 = { matchId: match.id, player1Score: tournament.maxPoints - 1, player2Score: tournament.maxPoints };
    const newPlayers2 = [...currentPlayers];
    newPlayers2[match.player1] = { ...player1, points: player1.points + 1, matches: player1.matches + 1 };
    newPlayers2[match.player2] = { ...player2, points: player2.points + 3, matches: player2.matches + 1 };
    generateScenarios(matchIndex + 1, [...currentOutcomes, outcome2], newPlayers2);
  };
  
  generateScenarios(0, [], tournament.players);
  return scenarios;
};

// Build eligibility graph for perfect matching
const buildEligibilityGraph = (players: Player[], tournament: Tournament, targetRound: number): Map<number, Set<number>> => {
  const graph = new Map<number, Set<number>>();
  
  players.forEach(player => {
    graph.set(player.id, new Set<number>());
  });
  
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];
      
      const pointDifference = Math.abs(player1.points - player2.points);
      const withinTolerance = pointDifference <= tournament.swissTolerance;
      const notPlayedBefore = !havePlayedBefore(player1.id, player2.id, tournament.matches);
      
      if (withinTolerance && notPlayedBefore) {
        graph.get(player1.id)!.add(player2.id);
        graph.get(player2.id)!.add(player1.id);
      }
    }
  }
  
  return graph;
};

// Find perfect matching using backtracking
const findPerfectMatchingBacktracking = (
  playerIds: number[], 
  eligibilityGraph: Map<number, Set<number>>,
  fixedPairs: [number, number][] = []
): boolean => {
  if (playerIds.length === 0) {
    return true;
  }
  
  if (playerIds.length % 2 !== 0) {
    return false;
  }
  
  const firstPlayer = playerIds[0];
  const remainingPlayers = playerIds.slice(1);
  const eligibleOpponents = eligibilityGraph.get(firstPlayer);
  
  if (!eligibleOpponents) {
    return false;
  }
  
  for (const opponent of Array.from(eligibleOpponents)) {
    if (remainingPlayers.includes(opponent)) {
      const newRemaining = remainingPlayers.filter(id => id !== opponent);
      const newFixed = [...fixedPairs, [firstPlayer, opponent]] as [number, number][];
      
      if (findPerfectMatchingBacktracking(newRemaining, eligibilityGraph, newFixed)) {
        return true;
      }
    }
  }
  
  return false;
};

export const getProposedSwissPairings = (tournament: Tournament): { player1Id: number, player2Id: number, round: number }[] => {
  const availablePlayers = getAvailablePlayers(tournament);

  if (availablePlayers.length < 2) {
    return [];
  }

  // Use same cohorting logic as generateSwissPairings
  const targetRoundsPlayed = Math.min(...availablePlayers.map(player => getRoundsPlayed(player, tournament.matches)));
  const candidateGroup = availablePlayers.filter(player => getRoundsPlayed(player, tournament.matches) === targetRoundsPlayed);
  const nextRound = targetRoundsPlayed + 1;

  // Check if this is round 1 - use simple pairing for first round
  const isRound1 = targetRoundsPlayed === 0;

  if (isRound1) {
    // Round 1: Simple randomized pairing - no need for safe pairing analysis
    const proposedPairs: { player1Id: number, player2Id: number, round: number }[] = [];
    const shuffledPlayers = shuffle(candidateGroup);

    for (let i = 0; i < shuffledPlayers.length - 1; i += 2) {
      const player1 = shuffledPlayers[i];
      const player2 = shuffledPlayers[i + 1];

      proposedPairs.push({
        player1Id: player1.id,
        player2Id: player2.id,
        round: nextRound
      });
    }

    return proposedPairs;
  }

  // SAFE SWISS PAIRING ALGORITHM for subsequent rounds
  console.log(`Safe pairing analysis: ${candidateGroup.length} candidates for round ${nextRound}`);

  // Get active matches that could affect pairing decisions
  const activeMatches = tournament.matches.filter(m => !m.completed);
  console.log(`Active matches: ${activeMatches.length}`);

  // Get all players currently in active matches
  const playersInActiveMatches = new Set<number>();
  activeMatches.forEach(match => {
    playersInActiveMatches.add(match.player1);
    playersInActiveMatches.add(match.player2);
  });

  // Check if we have players in active matches who will need pairing later
  const playersWaitingForPairing = tournament.players.filter(player => 
    playersInActiveMatches.has(player.id) && 
    getRoundsPlayed(player, tournament.matches) < tournament.numRounds
  );

  console.log(`Players waiting in active matches: ${playersWaitingForPairing.length}`);

  // If we have players waiting and the number is small enough to analyze, use safe pairing
  if (playersWaitingForPairing.length > 0 && activeMatches.length <= 8) {
    // Generate all possible outcome scenarios for active matches
    const scenarios = enumerateOutcomeScenarios(tournament, activeMatches, playersWaitingForPairing);

    if (scenarios.length === 0) {
      // Too many active matches - be conservative and propose no pairings
      console.log('Too many active matches for safe pairing analysis - waiting');
      return [];
    }

    console.log(`Analyzing ${scenarios.length} possible outcome scenarios`);

    // Enhanced safe pair finding that considers future availability
    const safePairs = findSafePairsWithFutureConstraints(candidateGroup, scenarios, tournament, nextRound, playersWaitingForPairing);

    console.log(`Found ${safePairs.length} safe pairings considering future constraints`);

    return safePairs;
  }

  // If no players waiting or too many to analyze, use simple greedy pairing
  return findGreedyPairings(candidateGroup, tournament, nextRound);
};

// Enhanced safe pairing that considers future constraints
const findSafePairsWithFutureConstraints = (
  availableNow: Player[],
  scenarios: PairingScenario[],
  tournament: Tournament,
  targetRound: number,
  playersWaitingForPairing: Player[]
): { player1Id: number, player2Id: number, round: number }[] => {
  const safePairs: { player1Id: number, player2Id: number, round: number }[] = [];
  const usedPlayers = new Set<number>();

  // For each potential pairing among currently available players
  for (let i = 0; i < availableNow.length; i++) {
    if (usedPlayers.has(availableNow[i].id)) continue;

    for (let j = i + 1; j < availableNow.length; j++) {
      if (usedPlayers.has(availableNow[j].id)) continue;

      const player1 = availableNow[i];
      const player2 = availableNow[j];

      // Check if this pair is valid now
      const pointDifference = Math.abs(player1.points - player2.points);
      const withinTolerance = pointDifference <= tournament.swissTolerance;
      const notPlayedBefore = !havePlayedBefore(player1.id, player2.id, tournament.matches);

      if (!withinTolerance || !notPlayedBefore) {
        continue;
      }

      // Test if this pairing is safe across all possible future scenarios
      let isSafeInAllScenarios = true;

      for (const scenario of scenarios) {
        // Simulate the tournament state after this pairing and the scenario outcomes
        const simulatedTournament = {
          ...tournament,
          players: scenario.players
        };

        // Get players who will be available for pairing after active matches complete
        const futureAvailablePlayers = getAvailablePlayers(simulatedTournament);

        // Check if we can form a perfect matching with remaining players
        if (!canFormPerfectMatching(futureAvailablePlayers, simulatedTournament)) {
          isSafeInAllScenarios = false;
          break;
        }
      }

      if (isSafeInAllScenarios) {
        safePairs.push({
          player1Id: player1.id,
          player2Id: player2.id,
          round: targetRound
        });
        usedPlayers.add(player1.id);
        usedPlayers.add(player2.id);

        // Break out of inner loop to try next available player
        break;
      }
    }
  }

  return safePairs;
};

// Check if a set of players can form a perfect matching
const canFormPerfectMatching = (players: Player[], tournament: Tournament): boolean => {
  if (players.length % 2 !== 0) {
    return false; // Odd number of players cannot form perfect matching
  }

  if (players.length === 0) {
    return true; // Empty set has perfect matching
  }

  // Build eligibility graph
  const graph = buildEligibilityGraph(players, tournament, 1); // round doesn't matter for eligibility

  // Use backtracking to find perfect matching
  const playerIds = players.map(p => p.id);
  return findPerfectMatchingBacktracking(playerIds, graph);
};

// Fallback greedy pairing when safe analysis isn't applicable
const findGreedyPairings = (
  players: Player[],
  tournament: Tournament,
  targetRound: number
): { player1Id: number, player2Id: number, round: number }[] => {
  const pairs: { player1Id: number, player2Id: number, round: number }[] = [];
  const usedPlayers = new Set<number>();

  // Sort players by points (descending) for better Swiss pairing
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  for (let i = 0; i < sortedPlayers.length; i++) {
    if (usedPlayers.has(sortedPlayers[i].id)) continue;

    const player1 = sortedPlayers[i];

    // Find best opponent within tolerance
    for (let j = i + 1; j < sortedPlayers.length; j++) {
      if (usedPlayers.has(sortedPlayers[j].id)) continue;

      const player2 = sortedPlayers[j];
      const pointDifference = Math.abs(player1.points - player2.points);
      const withinTolerance = pointDifference <= tournament.swissTolerance;
      const notPlayedBefore = !havePlayedBefore(player1.id, player2.id, tournament.matches);

      if (withinTolerance && notPlayedBefore) {
        pairs.push({
          player1Id: player1.id,
          player2Id: player2.id,
          round: targetRound
        });
        usedPlayers.add(player1.id);
        usedPlayers.add(player2.id);
        break;
      }
    }
  }

  return pairs;
};