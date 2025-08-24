
import React from 'react';
import { Tournament } from '../types';

interface TournamentTableProps {
  tournament: Tournament;
}

const TournamentTable: React.FC<TournamentTableProps> = ({ tournament }) => {
  const players = tournament.players;
  
  const statRows = [
    { label: 'Current ELO', key: 'currentElo' as const },
    { label: 'ELO Improvement', key: 'eloImprovement' as const },
    { label: 'Goal Difference', key: 'goalDiff' as const },
    { label: 'Total Points', key: 'points' as const },
    { label: '% of Possible Points', key: 'pointsPercent' as const },
    { label: 'Total Matches', key: 'matches' as const },
    { label: 'Remaining Matches', key: 'remainingMatches' as const }
  ];

  const getStatValue = (player: any, key: string) => {
    switch (key) {
      case 'currentElo':
        return player.currentElo || player.startingElo;
      case 'eloImprovement':
        const improvement = (player.currentElo || player.startingElo) - player.startingElo;
        return (improvement > 0 ? '+' : '') + improvement;
      case 'pointsPercent':
        return player.matches > 0 ? Math.round((player.points / (player.matches * 3)) * 100) + '%' : '0%';
      case 'remainingMatches':
        const totalMatches = (tournament.players.length - 1) * tournament.numRounds;
        return totalMatches - player.matches;
      default:
        return player[key] || 0;
    }
  };

  return (
    <div>
      <h2>Tournament Table</h2>
      <div className="tournament-table">
        <table>
          <thead>
            <tr>
              <th>Stats / Player</th>
              {players.map(player => (
                <th key={player.id} className="player-header">{player.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statRows.map(stat => (
              <tr key={stat.key} className="stats-row">
                <td><strong>{stat.label}</strong></td>
                {players.map(player => (
                  <td key={player.id}>{getStatValue(player, stat.key)}</td>
                ))}
              </tr>
            ))}
            
            {players.map((player, i) => (
              <tr key={player.id}>
                <td className="player-header">{player.name}</td>
                {players.map((opponent, j) => {
                  if (i === j) {
                    return <td key={opponent.id} className="diagonal-cell">—</td>;
                  } else {
                    const results = tournament.results?.[i]?.[j] || [];
                    const cellContent = results.map(result => result.points1).join(', ');
                    return <td key={opponent.id}>{cellContent || '—'}</td>;
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TournamentTable;
