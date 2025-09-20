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
  
  return {
    ...tournament,
    matches: tournament.matches.map(m => m.id === matchId ? updatedMatch : m),
    players: updatedPlayers,
    results: updatedResults
  };
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
  
  // Group players by points (Swiss tournament principle)
  const playersByPoints = new Map();
  availablePlayers.forEach(player => {
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
  const currentRound = getCurrentRound(tournament) + (availablePlayers.length >= 2 ? 1 : 0);
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
          round: currentRound,
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
  
  // Handle leftover players by pairing across score groups
  const remainingPlayers = availablePlayers.filter(p => !usedPlayers.has(p.id));
  console.log(`generateSwissPairings: ${remainingPlayers.length} players remaining for cross-group pairing`);
  
  for (let i = 0; i < remainingPlayers.length - 1; i += 2) {
    const player1 = remainingPlayers[i];
    const player2 = remainingPlayers[i + 1];
    
    const havePlayedBefore = tournament.matches.some(match => 
      (match.player1 === player1.id && match.player2 === player2.id) ||
      (match.player1 === player2.id && match.player2 === player1.id)
    );
    
    if (!havePlayedBefore) {
      newMatches.push({
        id: nextMatchId++,
        player1: player1.id,
        player2: player2.id,
        round: currentRound,
        player1Score: null,
        player2Score: null,
        completed: false
      });
      
      console.log(`generateSwissPairings: Cross-group paired ${player1.name} (${player1.points}pts) vs ${player2.name} (${player2.points}pts)`);
    }
  }
  
  console.log(`generateSwissPairings: Generated ${newMatches.length} new matches for round ${currentRound}`);
  
  const successRate = availablePlayers.length >= 2 ? (newMatches.length * 2 / availablePlayers.length * 100) : 0;
  console.log(`generateSwissPairings: Pairing success rate: ${successRate.toFixed(1)}%`);
  
  return {
    ...tournament,
    matches: [...tournament.matches, ...newMatches]
  };
};