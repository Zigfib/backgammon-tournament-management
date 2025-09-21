
import { Player, PlayerWithTiebreakers, Tiebreakers } from '../types';

export const calculateTiebreakers = (player: Player, allPlayers: Player[], results: Record<number, Record<number, any[]>>): Tiebreakers => {
  const playerResults = results[player.id] || {};
  
  // 1. Number of wins against players with the same number of points
  const playersWithSamePoints = allPlayers.filter(p => p.points === player.points && p.id !== player.id);
  let winsAgainstSamePoints = 0;
  
  playersWithSamePoints.forEach(opponent => {
    const resultsVsOpponent = playerResults[opponent.id] || [];
    resultsVsOpponent.forEach(result => {
      if (result.points1 === 3) { // Player won this match
        winsAgainstSamePoints++;
      }
    });
  });
  
  // 2. Modified Buchholz - sum of points of all opponents played
  let buchholzScore = 0;
  const opponentsPlayed = new Set<number>();
  
  // Check all results where this player participated
  Object.keys(playerResults).forEach(opponentId => {
    const resultsList = playerResults[parseInt(opponentId)];
    if (resultsList.length > 0) {
      opponentsPlayed.add(parseInt(opponentId));
    }
  });
  
  // Also check results where this player was the opponent
  allPlayers.forEach(otherPlayer => {
    if (otherPlayer.id !== player.id) {
      const otherResults = results[otherPlayer.id] || {};
      const resultsVsThisPlayer = otherResults[player.id] || [];
      if (resultsVsThisPlayer.length > 0) {
        opponentsPlayed.add(otherPlayer.id);
      }
    }
  });
  
  // Sum up the points of all opponents played
  opponentsPlayed.forEach(opponentId => {
    const opponent = allPlayers.find(p => p.id === opponentId);
    if (opponent) {
      buchholzScore += opponent.points;
    }
  });
  
  // 3. Goal Difference (already calculated)
  const goalDifference = player.goalDiff;
  
  return {
    winsAgainstSamePoints,
    buchholzScore,
    goalDifference
  };
};

export const calculateStandardRanking = (players: Player[], results: Record<number, Record<number, any[]>> = {}): PlayerWithTiebreakers[] => {
  // Calculate tiebreakers for all players
  const playersWithTiebreakers = players.map(player => ({
    ...player,
    tiebreakers: calculateTiebreakers(player, players, results)
  }));
  
  // Sort by: 1) Points, 2) Wins against same points, 3) Buchholz, 4) Goal Diff
  return playersWithTiebreakers.sort((a, b) => {
    // Primary: Total points (descending)
    if (b.points !== a.points) return b.points - a.points;
    
    // Tiebreaker 1: Wins against players with same points (descending)
    if (b.tiebreakers.winsAgainstSamePoints !== a.tiebreakers.winsAgainstSamePoints) {
      return b.tiebreakers.winsAgainstSamePoints - a.tiebreakers.winsAgainstSamePoints;
    }
    
    // Tiebreaker 2: Modified Buchholz (descending)
    if (b.tiebreakers.buchholzScore !== a.tiebreakers.buchholzScore) {
      return b.tiebreakers.buchholzScore - a.tiebreakers.buchholzScore;
    }
    
    // Tiebreaker 3: Goal Difference (descending)
    return b.tiebreakers.goalDifference - a.tiebreakers.goalDifference;
  });
};

export const calculateHybridRanking = (players: Player[], results: Record<number, Record<number, any[]>> = {}): PlayerWithTiebreakers[] => {
  // Calculate tiebreakers for all players
  const playersWithTiebreakers = players.map(player => ({
    ...player,
    tiebreakers: calculateTiebreakers(player, players, results),
    eloChange: (player.currentElo || player.startingElo) - player.startingElo
  }));
  
  // First, sort everyone by points to determine groups
  const sortedByPoints = [...playersWithTiebreakers].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    
    // Use tiebreakers for points-based sorting
    if (b.tiebreakers.winsAgainstSamePoints !== a.tiebreakers.winsAgainstSamePoints) {
      return b.tiebreakers.winsAgainstSamePoints - a.tiebreakers.winsAgainstSamePoints;
    }
    if (b.tiebreakers.buchholzScore !== a.tiebreakers.buchholzScore) {
      return b.tiebreakers.buchholzScore - a.tiebreakers.buchholzScore;
    }
    return b.tiebreakers.goalDifference - a.tiebreakers.goalDifference;
  });
  
  // Assign ranking method: first 2 by points, next 2 by ELO, etc.
  const finalRanking: PlayerWithTiebreakers[] = [];
  let position = 0;
  
  while (position < sortedByPoints.length) {
    if (position < 2) {
      // First 2 positions: rank by points
      const player = { ...sortedByPoints[position], rankMethod: 'points' as const };
      finalRanking.push(player);
    } else if (position < 4) {
      // Next 2 positions: rank by ELO improvement
      const remainingPlayers = sortedByPoints.slice(2);
      const sortedByELO = remainingPlayers.sort((a, b) => {
        if (b.eloChange !== a.eloChange) return b.eloChange! - a.eloChange!;
        
        // Use same tiebreakers for ELO-based sorting
        if (b.tiebreakers.winsAgainstSamePoints !== a.tiebreakers.winsAgainstSamePoints) {
          return b.tiebreakers.winsAgainstSamePoints - a.tiebreakers.winsAgainstSamePoints;
        }
        if (b.tiebreakers.buchholzScore !== a.tiebreakers.buchholzScore) {
          return b.tiebreakers.buchholzScore - a.tiebreakers.buchholzScore;
        }
        return b.tiebreakers.goalDifference - a.tiebreakers.goalDifference;
      });
      
      if (position - 2 < sortedByELO.length) {
        const player = { ...sortedByELO[position - 2], rankMethod: 'elo' as const };
        finalRanking.push(player);
      }
    } else {
      // Continue alternating pattern: positions 5-6 by points, 7-8 by ELO, etc.
      const cyclePosition = (position - 4) % 4;
      const usePoints = cyclePosition < 2;
      
      const remainingPlayers = sortedByPoints.slice(4);
      
      if (usePoints) {
        // Rank by points
        const pointsRanked = remainingPlayers.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.tiebreakers.winsAgainstSamePoints !== a.tiebreakers.winsAgainstSamePoints) {
            return b.tiebreakers.winsAgainstSamePoints - a.tiebreakers.winsAgainstSamePoints;
          }
          if (b.tiebreakers.buchholzScore !== a.tiebreakers.buchholzScore) {
            return b.tiebreakers.buchholzScore - a.tiebreakers.buchholzScore;
          }
          return b.tiebreakers.goalDifference - a.tiebreakers.goalDifference;
        });
        
        const pointsIndex = Math.floor((position - 4) / 2);
        if (pointsIndex < pointsRanked.length) {
          const player = { ...pointsRanked[pointsIndex], rankMethod: 'points' as const };
          finalRanking.push(player);
        }
      } else {
        // Rank by ELO
        const eloRanked = remainingPlayers.sort((a, b) => {
          if (b.eloChange !== a.eloChange) return b.eloChange! - a.eloChange!;
          if (b.tiebreakers.winsAgainstSamePoints !== a.tiebreakers.winsAgainstSamePoints) {
            return b.tiebreakers.winsAgainstSamePoints - a.tiebreakers.winsAgainstSamePoints;
          }
          if (b.tiebreakers.buchholzScore !== a.tiebreakers.buchholzScore) {
            return b.tiebreakers.buchholzScore - a.tiebreakers.buchholzScore;
          }
          return b.tiebreakers.goalDifference - a.tiebreakers.goalDifference;
        });
        
        const eloIndex = Math.floor((position - 4) / 2);
        if (eloIndex < eloRanked.length) {
          const player = { ...eloRanked[eloIndex], rankMethod: 'elo' as const };
          finalRanking.push(player);
        }
      }
    }
    position++;
  }
  
  return finalRanking;
};
