import { Player, PlayerWithTiebreakers, Tiebreakers } from '../types';

export const calculateTiebreakers = (player: Player, allPlayers: Player[], results: Record<number, Record<number, any[]>>, tournamentType?: string): Tiebreakers => {
  const playerResults = results[player.id] || {};
  const isSwiss = tournamentType === 'rapid-swiss';
  const playerPoints = isSwiss ? (player as any).pointsEarned || 0 : player.points;

  // 1. Number of wins against players with the same number of points
  const playersWithSamePoints = allPlayers.filter(p => {
    const pPoints = isSwiss ? (p as any).pointsEarned || 0 : p.points;
    return pPoints === playerPoints && p.id !== player.id;
  });
  let winsAgainstSamePoints = 0;

  playersWithSamePoints.forEach(opponent => {
    const resultsVsOpponent = playerResults[opponent.id] || [];
    resultsVsOpponent.forEach(result => {
      if (isSwiss) {
        // Swiss: 1 point = win, 0 points = loss
        if (result.points1 === 1) {
          winsAgainstSamePoints++;
        }
      } else {
        // Round-Robin: 3 points = win
        if (result.points1 === 3) {
          winsAgainstSamePoints++;
        }
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
      const opponentPoints = isSwiss ? (opponent as any).pointsEarned || 0 : opponent.points;
      buchholzScore += opponentPoints;
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

export const calculateStandardRanking = (players: Player[], results: Record<number, Record<number, any[]>> = {}, tournamentType?: string): PlayerWithTiebreakers[] => {
  const isSwiss = tournamentType === 'rapid-swiss';

  // Calculate tiebreakers for all players
  const playersWithTiebreakers = players.map(player => ({
    ...player,
    tiebreakers: calculateTiebreakers(player, players, results, tournamentType)
  }));

  // Sort by: 1) Points, 2) Wins against same points, 3) Buchholz, 4) Goal Diff
  return playersWithTiebreakers.sort((a, b) => {
    // Primary: Total points (descending) - use pointsEarned for Swiss
    const aPoints = isSwiss ? (a as any).pointsEarned || 0 : a.points;
    const bPoints = isSwiss ? (b as any).pointsEarned || 0 : b.points;
    if (bPoints !== aPoints) return bPoints - aPoints;

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

export const calculateHybridRanking = (players: Player[], results: Record<number, Record<number, any[]>> = {}, tournamentType?: string): PlayerWithTiebreakers[] => {
  const isSwiss = tournamentType === 'rapid-swiss';

  // Calculate tiebreakers for all players
  const playersWithTiebreakers = players.map(player => ({
    ...player,
    tiebreakers: calculateTiebreakers(player, players, results, tournamentType),
    eloChange: (player.currentElo || player.startingElo) - player.startingElo
  }));

  // First, sort everyone by points to determine groups
  const sortedByPoints = [...playersWithTiebreakers].sort((a, b) => {
    const aPoints = isSwiss ? (a as any).pointsEarned || 0 : a.points;
    const bPoints = isSwiss ? (b as any).pointsEarned || 0 : b.points;
    if (bPoints !== aPoints) return bPoints - aPoints;

    // Use tiebreakers for points-based sorting
    if (b.tiebreakers.winsAgainstSamePoints !== a.tiebreakers.winsAgainstSamePoints) {
      return b.tiebreakers.winsAgainstSamePoints - a.tiebreakers.winsAgainstSamePoints;
    }
    if (b.tiebreakers.buchholzScore !== a.tiebreakers.buchholzScore) {
      return b.tiebreakers.buchholzScore - a.tiebreakers.buchholzScore;
    }
    return b.tiebreakers.goalDifference - a.tiebreakers.goalDifference;
  });

  // Sort remaining players by ELO (excluding first 2)
  const sortedByELO = [...sortedByPoints.slice(2)].sort((a, b) => {
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

  // Assign ranking method with proper alternating pattern
  const finalRanking: PlayerWithTiebreakers[] = [];
  const usedPlayerIds = new Set<number>();

  let pointsIndex = 0;
  let eloIndex = 0;

  for (let position = 0; position < sortedByPoints.length; position++) {
    if (position < 2) {
      // First 2 positions: rank by points
      const player = { ...sortedByPoints[position], rankMethod: 'points' as const };
      finalRanking.push(player);
      usedPlayerIds.add(player.id);
    } else {
      // Determine if this position should use points or ELO
      // Pattern: positions 2-3 (ELO), 4-5 (points), 6-7 (ELO), etc.
      const cyclePosition = (position - 2) % 4;
      const useELO = cyclePosition < 2;

      if (useELO) {
        // Use ELO ranking
        while (eloIndex < sortedByELO.length && usedPlayerIds.has(sortedByELO[eloIndex].id)) {
          eloIndex++;
        }
        if (eloIndex < sortedByELO.length) {
          const player = { ...sortedByELO[eloIndex], rankMethod: 'elo' as const };
          finalRanking.push(player);
          usedPlayerIds.add(player.id);
          eloIndex++;
        }
      } else {
        // Use points ranking (skip first 2 already used)
        const startFrom = pointsIndex + 2; // Skip first 2 positions
        let found = false;
        for (let i = startFrom; i < sortedByPoints.length; i++) {
          if (!usedPlayerIds.has(sortedByPoints[i].id)) {
            const player = { ...sortedByPoints[i], rankMethod: 'points' as const };
            finalRanking.push(player);
            usedPlayerIds.add(player.id);
            pointsIndex = i - 2; // Adjust for the offset
            found = true;
            break;
          }
        }
        if (!found) {
          // Fallback: use any remaining player
          for (let i = 0; i < sortedByPoints.length; i++) {
            if (!usedPlayerIds.has(sortedByPoints[i].id)) {
              const player = { ...sortedByPoints[i], rankMethod: 'points' as const };
              finalRanking.push(player);
              usedPlayerIds.add(player.id);
              break;
            }
          }
        }
      }
    }
  }

  return finalRanking;
};