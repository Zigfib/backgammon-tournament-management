import { Player, Match, Tournament, MatchResult, EloCalculation } from '../types';

export const calculateELO = (winnerELO: number, loserELO: number, winnerScore: number, loserScore: number): EloCalculation => {
  // ELO calculation parameters
  const K_FACTOR = 32; // Standard K-factor for chess/backgammon
  
  // Calculate expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerELO - loserELO) / 400));
  
  // Score multiplier based on margin of victory
  // Larger victories have slightly more impact
  const marginMultiplier = Math.min(1 + (winnerScore - loserScore) / 20, 2.0);
  
  // Calculate new ELO ratings
  const newWinnerELO = Math.round(winnerELO + K_FACTOR * marginMultiplier * (1 - expectedWinner));
  const newLoserELO = Math.round(loserELO + K_FACTOR * marginMultiplier * (0 - expectedLoser));
  
  return {
    newWinnerELO: newWinnerELO,
    newLoserELO: newLoserELO,
    winnerChange: newWinnerELO - winnerELO,
    loserChange: newLoserELO - loserELO
  };
};

export const generateMatches = (tournament: Tournament): Tournament => {
  const matches: Match[] = [];
  const players = tournament.players;
  let matchId = 0;

  // Generate round-robin matches
  for (let round = 1; round <= tournament.numRounds; round++) {
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          id: matchId++,
          player1: i,
          player2: j,
          round: round,
          player1Score: null,
          player2Score: null,
          completed: false
        });
      }
    }
  }

  return {
    ...tournament,
    matches
  };
};

export const updateMatchResult = (tournament: Tournament, matchId: number, player1Score: string, player2Score: string): Tournament => {
  const match = tournament.matches.find(m => m.id === matchId);
  if (!match) return tournament;
  
  // Store previous ELO values for potential rollback
  const prevPlayer1ELO = tournament.players[match.player1].currentElo;
  const prevPlayer2ELO = tournament.players[match.player2].currentElo;
  
  const updatedMatch = {
    ...match,
    player1Score: player1Score !== '' ? parseInt(player1Score) : null,
    player2Score: player2Score !== '' ? parseInt(player2Score) : null
  };
  
  updatedMatch.completed = updatedMatch.player1Score !== null && updatedMatch.player2Score !== null;
  
  const updatedPlayers = [...tournament.players];
  let updatedResults = { ...tournament.results };
  
  if (updatedMatch.completed && updatedMatch.player1Score !== null && updatedMatch.player2Score !== null) {
    // Determine winner and assign points
    let p1Points, p2Points;
    let winnerELO, loserELO, winnerScore, loserScore;
    let isPlayer1Winner = updatedMatch.player1Score > updatedMatch.player2Score;
    
    if (isPlayer1Winner) {
      p1Points = 3; // Winner gets 3 points
      p2Points = 1; // Loser gets 1 point
      winnerELO = prevPlayer1ELO;
      loserELO = prevPlayer2ELO;
      winnerScore = updatedMatch.player1Score;
      loserScore = updatedMatch.player2Score;
    } else {
      p1Points = 1;
      p2Points = 3;
      winnerELO = prevPlayer2ELO;
      loserELO = prevPlayer1ELO;
      winnerScore = updatedMatch.player2Score;
      loserScore = updatedMatch.player1Score;
    }
    
    // Calculate new ELO ratings
    const eloResult = calculateELO(winnerELO, loserELO, winnerScore, loserScore);
    
    // Update player ELO ratings
    if (isPlayer1Winner) {
      updatedPlayers[match.player1].currentElo = eloResult.newWinnerELO;
      updatedPlayers[match.player2].currentElo = eloResult.newLoserELO;
    } else {
      updatedPlayers[match.player1].currentElo = eloResult.newLoserELO;
      updatedPlayers[match.player2].currentElo = eloResult.newWinnerELO;
    }
    
    // Store result with ELO changes
    const resultData: MatchResult = {
      round: updatedMatch.round,
      score1: updatedMatch.player1Score,
      score2: updatedMatch.player2Score,
      points1: p1Points,
      points2: p2Points,
      elo1Before: prevPlayer1ELO,
      elo2Before: prevPlayer2ELO,
      elo1After: updatedPlayers[match.player1].currentElo,
      elo2After: updatedPlayers[match.player2].currentElo,
      elo1Change: updatedPlayers[match.player1].currentElo - prevPlayer1ELO,
      elo2Change: updatedPlayers[match.player2].currentElo - prevPlayer2ELO
    };
    
    // Remove any existing result for this round first
    if (!updatedResults[match.player1]) updatedResults[match.player1] = {};
    if (!updatedResults[match.player1][match.player2]) updatedResults[match.player1][match.player2] = [];
    
    updatedResults[match.player1][match.player2] = 
      updatedResults[match.player1][match.player2].filter(r => r.round !== updatedMatch.round);
    
    // Add the new result
    updatedResults[match.player1][match.player2].push(resultData);
    
  } else {
    // Match is incomplete - remove result and restore ELO
    if (updatedResults[match.player1]?.[match.player2]) {
      updatedResults[match.player1][match.player2] = 
        updatedResults[match.player1][match.player2].filter(r => r.round !== updatedMatch.round);
    }
    
    // Restore previous ELO ratings
    updatedPlayers[match.player1].currentElo = prevPlayer1ELO;
    updatedPlayers[match.player2].currentElo = prevPlayer2ELO;
  }
  
  const updatedTournament = {
    ...tournament,
    matches: tournament.matches.map(m => m.id === matchId ? updatedMatch : m),
    players: updatedPlayers,
    results: updatedResults
  };
  
  // If a match was just completed AND this is a rapid swiss tournament, trigger Swiss pairing generation
  if (updatedMatch.completed && updatedMatch.player1Score !== null && updatedMatch.player2Score !== null && updatedTournament.tournamentType === 'rapid-swiss') {
    console.log('Match completed in rapid swiss tournament - check Proposed Pairings section for next round options');
    
    // CRITICAL: Recalculate player stats (including points) after match completion
    const playersWithStats = calculateStats(updatedTournament.players, updatedTournament.matches);
    const tournamentWithStats = { ...updatedTournament, players: playersWithStats };
    
    return tournamentWithStats;
  }
  
  return updatedTournament;
};

export const calculateStats = (players: Player[], matches: Match[]): Player[] => {
  // Reset player stats
  const updatedPlayers = players.map(player => ({
    ...player,
    matches: 0,
    points: 0,
    goalDiff: 0
  }));
  
  // Calculate stats from completed matches
  matches.forEach(match => {
    if (match.completed && match.player1Score !== null && match.player2Score !== null) {
      const p1 = updatedPlayers[match.player1];
      const p2 = updatedPlayers[match.player2];
      
      p1.matches++;
      p2.matches++;
      
      const goalDiff = match.player1Score - match.player2Score;
      p1.goalDiff += goalDiff;
      p2.goalDiff -= goalDiff;
      
      if (match.player1Score > match.player2Score) {
        p1.points += 3;
        p2.points += 1;
      } else {
        p1.points += 1;
        p2.points += 3;
      }
    }
  });
  
  return updatedPlayers;
};

// Swiss Tournament Functions
export const getCurrentRound = (tournament: Tournament): number => {
  const playingMatches = tournament.matches.filter(match => !match.completed);
  const rounds = playingMatches.map(match => match.round);
  const currentRound = rounds.length > 0 ? Math.max(...rounds) : tournament.numRounds;
  
  console.log(`getCurrentRound debug: playingMatches=${playingMatches.length}, rounds=[${rounds.join(',')}], tournament.currentRound=${currentRound}`);
  
  return currentRound;
};

export const getActiveRounds = (tournament: Tournament): number[] => {
  const playingMatches = tournament.matches.filter(match => !match.completed);
  const roundsSet = new Set(playingMatches.map(match => match.round));
  const rounds = Array.from(roundsSet).sort();
  return rounds;
};

export const getRoundsPlayed = (player: Player, matches: Match[]): number => {
  return matches.filter(match => 
    (match.player1 === player.id || match.player2 === player.id) && match.completed
  ).length;
};

export const updatePlayerRoundsPlayed = (tournament: Tournament, matchId: number): Tournament => {
  const match = tournament.matches.find(m => m.id === matchId);
  if (!match || !match.completed) return tournament;
  
  const player1 = tournament.players[match.player1];
  const player2 = tournament.players[match.player2];
  
  const player1RoundsPlayed = getRoundsPlayed(player1, tournament.matches);
  const player2RoundsPlayed = getRoundsPlayed(player2, tournament.matches);
  
  console.log(`Match completion: Player ${player1.name} roundsPlayed: ${player1RoundsPlayed - 1} -> ${player1RoundsPlayed}, currentRound -> ${match.round}`);
  console.log(`Match completion: Player ${player2.name} roundsPlayed: ${player2RoundsPlayed - 1} -> ${player2RoundsPlayed}, currentRound -> ${match.round}`);
  
  return tournament;
};

// Swiss Tournament Pairing Algorithm
export const generateSwissPairings = (tournament: Tournament): Tournament => {
  console.log('generateSwissPairings: Starting pairing generation');
  
  // Get available players (not currently in active matches)
  const activeMatches = tournament.matches.filter(m => !m.completed);
  const playersInActiveMatches = new Set();
  
  activeMatches.forEach(match => {
    playersInActiveMatches.add(match.player1);
    playersInActiveMatches.add(match.player2);
  });
  
  const availablePlayers = tournament.players.filter(player => 
    !playersInActiveMatches.has(player.id) && 
    getRoundsPlayed(player, tournament.matches) < tournament.numRounds
  );
  
  console.log(`generateSwissPairings: ${availablePlayers.length} players available for pairing`);
  console.log(`Available players: ${availablePlayers.map(p => p.name).join(', ')}`);
  
  if (availablePlayers.length < 2) {
    console.log('generateSwissPairings: Not enough players available for pairing');
    return tournament;
  }
  
  // FIXED: Round calculation based on available players' progress, not global state
  const targetRoundsPlayed = Math.min(...availablePlayers.map(player => getRoundsPlayed(player, tournament.matches)));
  const candidateGroup = availablePlayers.filter(player => getRoundsPlayed(player, tournament.matches) === targetRoundsPlayed);
  const nextRound = targetRoundsPlayed + 1;
  
  console.log(`generateSwissPairings: Target rounds played: ${targetRoundsPlayed}, candidate group: ${candidateGroup.length} players`);
  
  // Only work with players who have completed the same number of rounds
  const availableForPairing = candidateGroup;
  
  // Group players by points (Swiss tournament principle) - only those in candidate group
  const playersByPoints = new Map();
  availableForPairing.forEach(player => {
    const points = player.points;
    if (!playersByPoints.has(points)) {
      playersByPoints.set(points, []);
    }
    playersByPoints.get(points).push(player);
  });
  
  // Sort point groups in descending order
  const sortedPointGroups = Array.from(playersByPoints.entries()).sort((a, b) => b[0] - a[0]);
  console.log(`generateSwissPairings: Point groups:`, sortedPointGroups.map(([points, players]) => 
    `${points}pts: [${players.map((p: Player) => p.name).join(', ')}]`
  ).join(', '));
  
  const newMatches = [];
  const usedPlayers = new Set();
  
  let nextMatchId = Math.max(...tournament.matches.map(m => m.id), -1) + 1;
  
  // Create pairings within and between score groups
  for (const [points, players] of sortedPointGroups) {
    const availableInGroup = players.filter((p: Player) => !usedPlayers.has(p.id));
    
    // Pair within the same score group first
    for (let i = 0; i < availableInGroup.length - 1; i += 2) {
      const player1 = availableInGroup[i];
      const player2 = availableInGroup[i + 1];
      
      // Check if they've played before
      const havePlayedBefore = tournament.matches.some(match => 
        (match.player1 === player1.id && match.player2 === player2.id) ||
        (match.player1 === player2.id && match.player2 === player1.id)
      );
      
      if (!havePlayedBefore) {
        newMatches.push({
          id: nextMatchId++,
          player1: player1.id,
          player2: player2.id,
          round: nextRound,
          player1Score: null,
          player2Score: null,
          completed: false
        });
        
        usedPlayers.add(player1.id);
        usedPlayers.add(player2.id);
        console.log(`generateSwissPairings: Paired ${player1.name} vs ${player2.name} (both ${points} points)`);
      }
    }
  }
  
  // Handle leftover players by pairing across score groups (respecting tolerance)
  const remainingPlayers = availableForPairing.filter(p => !usedPlayers.has(p.id));
  console.log(`generateSwissPairings: ${remainingPlayers.length} players remaining for cross-group pairing (tolerance: ${tournament.swissTolerance})`);
  
  // Sort remaining players by points for tolerance-based pairing
  const sortedRemainingPlayers = remainingPlayers.sort((a, b) => b.points - a.points);
  
  for (let i = 0; i < sortedRemainingPlayers.length; i++) {
    if (usedPlayers.has(sortedRemainingPlayers[i].id)) continue;
    
    const player1 = sortedRemainingPlayers[i];
    
    // Find a suitable opponent within tolerance
    for (let j = i + 1; j < sortedRemainingPlayers.length; j++) {
      if (usedPlayers.has(sortedRemainingPlayers[j].id)) continue;
      
      const player2 = sortedRemainingPlayers[j];
      const pointDifference = Math.abs(player1.points - player2.points);
      
      // Check if within tolerance and haven't played before
      if (pointDifference <= tournament.swissTolerance) {
        const havePlayedBefore = tournament.matches.some(match => 
          (match.player1 === player1.id && match.player2 === player2.id) ||
          (match.player1 === player2.id && match.player2 === player1.id)
        );
        
        if (!havePlayedBefore) {
          newMatches.push({
            id: nextMatchId++,
            player1: player1.id,
            player2: player2.id,
            round: nextRound,
            player1Score: null,
            player2Score: null,
            completed: false
          });
          
          usedPlayers.add(player1.id);
          usedPlayers.add(player2.id);
          console.log(`generateSwissPairings: Cross-group paired ${player1.name} (${player1.points}pts) vs ${player2.name} (${player2.points}pts)`);
          break; // Found a pairing for player1, move to next
        }
      }
    }
  }
  
  console.log(`generateSwissPairings: Generated ${newMatches.length} new matches for round ${nextRound}`);
  
  const successRate = availableForPairing.length >= 2 ? (newMatches.length * 2 / availableForPairing.length * 100) : 0;
  console.log(`generateSwissPairings: Pairing success rate: ${successRate.toFixed(1)}%`);
  
  return {
    ...tournament,
    matches: [...tournament.matches, ...newMatches]
  };
};

// Utility functions for Swiss Dashboard
export const getPlayerRecord = (playerId: number, matches: Match[]): { wins: number, losses: number } => {
  const playerMatches = matches.filter(m => 
    (m.player1 === playerId || m.player2 === playerId) && m.completed
  );
  
  let wins = 0;
  let losses = 0;
  
  playerMatches.forEach(match => {
    if (match.player1Score === null || match.player2Score === null) return;
    
    const isPlayer1 = match.player1 === playerId;
    const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
    const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
    
    if (playerScore > opponentScore) {
      wins++;
    } else {
      losses++;
    }
  });
  
  return { wins, losses };
};

export const getNextRound = (tournament: Tournament): number => {
  const availablePlayers = getAvailablePlayers(tournament);
  
  if (availablePlayers.length === 0) {
    // No available players, return current max round for display
    const maxRound = tournament.matches.length ? Math.max(...tournament.matches.map(m => m.round)) : 0;
    return Math.max(1, maxRound);
  }
  
  // Calculate next round based on minimum rounds played by available players
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

// Fisher-Yates shuffle function for randomizing pairings
const shuffle = <T>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getProposedSwissPairings = (tournament: Tournament): { player1Id: number, player2Id: number, round: number }[] => {
  const availablePlayers = getAvailablePlayers(tournament);
  
  if (availablePlayers.length < 2) {
    return [];
  }
  
  // FIXED: Use same cohorting logic as generateSwissPairings
  const targetRoundsPlayed = Math.min(...availablePlayers.map(player => getRoundsPlayed(player, tournament.matches)));
  const candidateGroup = availablePlayers.filter(player => getRoundsPlayed(player, tournament.matches) === targetRoundsPlayed);
  const nextRound = targetRoundsPlayed + 1;
  
  const proposedPairs: { player1Id: number, player2Id: number, round: number }[] = [];
  const usedPlayers = new Set<number>();
  
  // Check if this is round 1 based on targetRoundsPlayed
  const isRound1 = targetRoundsPlayed === 0;
  
  if (isRound1) {
    // Round 1: Completely randomize all available players then pair adjacent
    const shuffledPlayers = shuffle(candidateGroup);
    
    for (let i = 0; i < shuffledPlayers.length - 1; i += 2) {
      const player1 = shuffledPlayers[i];
      const player2 = shuffledPlayers[i + 1];
      
      proposedPairs.push({
        player1Id: player1.id,
        player2Id: player2.id,
        round: nextRound
      });
      usedPlayers.add(player1.id);
      usedPlayers.add(player2.id);
    }
  } else {
    // Subsequent rounds: Group by points but randomize within each group
    const playersByPoints = new Map<number, Player[]>();
    candidateGroup.forEach(player => {
      if (!playersByPoints.has(player.points)) {
        playersByPoints.set(player.points, []);
      }
      playersByPoints.get(player.points)!.push(player);
    });
    
    // Sort point groups in descending order
    const sortedPointGroups = Array.from(playersByPoints.entries()).sort((a, b) => b[0] - a[0]);
    
    // Create pairings within same score groups first (randomized within group)
    for (const [, players] of sortedPointGroups) {
      const availableInGroup = players.filter(p => !usedPlayers.has(p.id));
      const shuffledGroup = shuffle(availableInGroup);
      
      for (let i = 0; i < shuffledGroup.length - 1; i += 2) {
        const player1 = shuffledGroup[i];
        const player2 = shuffledGroup[i + 1];
        
        if (!havePlayedBefore(player1.id, player2.id, tournament.matches)) {
          proposedPairs.push({
            player1Id: player1.id,
            player2Id: player2.id,
            round: nextRound
          });
          usedPlayers.add(player1.id);
          usedPlayers.add(player2.id);
        }
      }
    }
  }
  
  // Cross-group pairing for remaining players (randomized) - only from candidate group
  const remainingPlayers = shuffle(candidateGroup.filter(p => !usedPlayers.has(p.id)));
  
  for (let i = 0; i < remainingPlayers.length - 1; i++) {
    if (usedPlayers.has(remainingPlayers[i].id)) continue;
    
    const player1 = remainingPlayers[i];
    
    // Find random eligible opponents within tolerance
    const eligibleOpponents = remainingPlayers.slice(i + 1).filter(player2 => {
      if (usedPlayers.has(player2.id)) return false;
      const pointDifference = Math.abs(player1.points - player2.points);
      return pointDifference <= tournament.swissTolerance && 
             !havePlayedBefore(player1.id, player2.id, tournament.matches);
    });
    
    if (eligibleOpponents.length > 0) {
      // Randomly select from eligible opponents
      const player2 = eligibleOpponents[Math.floor(Math.random() * eligibleOpponents.length)];
      
      proposedPairs.push({
        player1Id: player1.id,
        player2Id: player2.id,
        round: nextRound
      });
      usedPlayers.add(player1.id);
      usedPlayers.add(player2.id);
    }
  }
  
  return proposedPairs;
};