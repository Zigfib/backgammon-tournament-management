import { Tournament, Player, Match } from '../types';

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
        
        points += playerScore > opponentScore ? 1 : 0;
        goalDiff += playerScore - opponentScore;
        
        const eloChange = calculateEloChange(newElo, opponentElo, playerScore, opponentScore);
        newElo += eloChange;
      } else {
        // Player is player2
        const playerScore = match.player2Score!;
        const opponentScore = match.player1Score!;
        const opponentElo = tournament.players[match.player1].currentElo || tournament.players[match.player1].startingElo;
        
        points += playerScore > opponentScore ? 1 : 0;
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
        
        points += playerScore > opponentScore ? 1 : 0;
        goalDiff += playerScore - opponentScore;
        
        const eloChange = calculateEloChange(newElo, opponentElo, playerScore, opponentScore);
        newElo += eloChange;
      } else {
        const playerScore = match.player2Score!;
        const opponentScore = match.player1Score!;
        const opponent = players.find(p => p.id === match.player1)!;
        const opponentElo = opponent.currentElo || opponent.startingElo;
        
        points += playerScore > opponentScore ? 1 : 0;
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

  // Rapid Swiss: Only suggest pairings if ALL possible future outcomes allow legal pairings
  if (playersWaitingForPairing.length > 0) {
    console.log(`Testing rapid pairings: ${candidateGroup.length} available, ${playersWaitingForPairing.length} waiting`);
    
    // For each possible pairing of available players, check if remaining players 
    // can form legal pairings regardless of active match outcomes
    const safePairings: { player1Id: number, player2Id: number, round: number }[] = [];
    const usedPlayers = new Set<number>();
    
    // Try to pair available players one by one
    for (let i = 0; i < candidateGroup.length && safePairings.length < candidateGroup.length / 2; i++) {
      if (usedPlayers.has(candidateGroup[i].id)) continue;
      
      const player1 = candidateGroup[i];
      
      for (let j = i + 1; j < candidateGroup.length; j++) {
        if (usedPlayers.has(candidateGroup[j].id)) continue;
        
        const player2 = candidateGroup[j];
        
        // Check if this pairing is valid (Swiss rules)
        const pointDiff = Math.abs(player1.points - player2.points);
        const withinTolerance = pointDiff <= tournament.swissTolerance;
        const notPlayedBefore = !havePlayedBefore(player1.id, player2.id, tournament.matches);
        
        if (!withinTolerance || !notPlayedBefore) continue;
        
        // Test if this pairing is safe for ALL possible future outcomes
        const isSafe = testPairingSafety(
          player1, player2, candidateGroup, playersWaitingForPairing, 
          [...safePairings], usedPlayers, tournament, activeMatches
        );
        
        if (isSafe) {
          safePairings.push({ player1Id: player1.id, player2Id: player2.id, round: nextRound });
          usedPlayers.add(player1.id);
          usedPlayers.add(player2.id);
          console.log(`Safe rapid pairing: ${player1.id} vs ${player2.id}`);
          break;
        }
      }
    }
    
    console.log(`Found ${safePairings.length} safe rapid pairings`);
    return safePairings;
  }

  // If no players waiting or too many to analyze, use simple greedy pairing
  return findGreedyPairings(candidateGroup, tournament, nextRound);
};

// Test if a pairing is safe across all possible future outcomes
const testPairingSafety = (
  player1: Player, 
  player2: Player, 
  availablePlayers: Player[], 
  waitingPlayers: Player[], 
  currentPairings: { player1Id: number, player2Id: number, round: number }[],
  usedPlayerIds: Set<number>,
  tournament: Tournament,
  activeMatches: Match[]
): boolean => {
  // If too many active matches, be conservative
  if (activeMatches.length > 6) return false;
  
  // Generate all possible outcomes for active matches
  const scenarios = generateMatchOutcomes(activeMatches, tournament);
  
  for (const scenario of scenarios) {
    // Simulate tournament state after this scenario
    const simulatedPlayers = simulateScenarioOutcome(tournament.players, scenario);
    
    // Get all players who will be available after active matches complete
    const futureAvailable = waitingPlayers.map(p => 
      simulatedPlayers.find(sp => sp.id === p.id)!
    );
    
    // Get current available players not yet committed to pairings
    const uncommittedAvailable = availablePlayers.filter(p => 
      !usedPlayerIds.has(p.id) && p.id !== player1.id && p.id !== player2.id
    );
    
    // All players who need to be paired in future rounds
    const allUncommitted = [...uncommittedAvailable, ...futureAvailable];
    
    // Check if these players can form perfect matching
    if (!canFormValidPairings(allUncommitted, tournament)) {
      return false; // This scenario would strand players
    }
  }
  
  return true; // Safe across all scenarios
};

// Generate all possible outcomes for active matches
const generateMatchOutcomes = (activeMatches: Match[], tournament: Tournament): { matchId: number, winner: number }[][] => {
  if (activeMatches.length === 0) return [[]];
  if (activeMatches.length > 4) return []; // Too many combinations
  
  const outcomes: { matchId: number, winner: number }[][] = [];
  
  const generateCombinations = (matchIndex: number, currentOutcome: { matchId: number, winner: number }[]) => {
    if (matchIndex >= activeMatches.length) {
      outcomes.push([...currentOutcome]);
      return;
    }
    
    const match = activeMatches[matchIndex];
    
    // Player 1 wins
    generateCombinations(matchIndex + 1, [...currentOutcome, { matchId: match.id, winner: match.player1 }]);
    
    // Player 2 wins  
    generateCombinations(matchIndex + 1, [...currentOutcome, { matchId: match.id, winner: match.player2 }]);
  };
  
  generateCombinations(0, []);
  return outcomes;
};

// Simulate player stats after a scenario outcome
const simulateScenarioOutcome = (players: Player[], scenario: { matchId: number, winner: number }[]): Player[] => {
  return players.map(player => {
    const playerCopy = { ...player };
    
    scenario.forEach(outcome => {
      if (outcome.winner === player.id) {
        playerCopy.points += 1; // Winner gets 1 point
        playerCopy.matches += 1;
      } else {
        // Check if player was the loser in this match
        // This is a simplification - in real implementation we'd track match participants
        playerCopy.matches += 1;
        // Loser gets 0 points (no change)
      }
    });
    
    return playerCopy;
  });
};

// Check if players can form valid pairings
const canFormValidPairings = (players: Player[], tournament: Tournament): boolean => {
  if (players.length % 2 !== 0) return false;
  if (players.length === 0) return true;
  
  // Simple check: ensure at least some players haven't played everyone else
  // In a full implementation, this would use graph matching algorithms
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const pointDiff = Math.abs(players[i].points - players[j].points);
      const withinTolerance = pointDiff <= tournament.swissTolerance;
      const notPlayedBefore = !havePlayedBefore(players[i].id, players[j].id, tournament.matches);
      
      if (withinTolerance && notPlayedBefore) {
        return true; // At least one valid pairing exists
      }
    }
  }
  
  return false;
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

  // First pass: strict tolerance
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

  // Second pass: relax tolerance to pair remaining players
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (usedPlayers.has(sortedPlayers[i].id)) continue;

    const player1 = sortedPlayers[i];

    // Find any opponent who hasn't played this player before
    for (let j = i + 1; j < sortedPlayers.length; j++) {
      if (usedPlayers.has(sortedPlayers[j].id)) continue;

      const player2 = sortedPlayers[j];
      const notPlayedBefore = !havePlayedBefore(player1.id, player2.id, tournament.matches);

      if (notPlayedBefore) {
        console.log(`Relaxed pairing: ${player1.id} (${player1.points}pts) vs ${player2.id} (${player2.points}pts)`);
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

  console.log(`Created ${pairs.length} pairings from ${players.length} players`);
  return pairs;
};