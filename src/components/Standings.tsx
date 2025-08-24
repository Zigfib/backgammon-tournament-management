
import React from 'react';
import { Tournament } from '../types';
import { calculateStandardRanking, calculateHybridRanking } from '../utils/ranking';

interface StandingsProps {
  tournament: Tournament;
}

const Standings: React.FC<StandingsProps> = ({ tournament }) => {
  const sortedPlayers = tournament.rankingSystem === 'hybrid' 
    ? calculateHybridRanking(tournament.players)
    : calculateStandardRanking(tournament.players);

  const getRankingExplanation = () => {
    if (tournament.rankingSystem === 'hybrid') {
      return (
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #28a745' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🏆 Hybrid Ranking System</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057' }}>
            <strong>Positions 1-2:</strong> Ranked by Points + Tiebreakers → 
            <strong>Positions 3-4:</strong> Ranked by ELO Improvement + Tiebreakers → 
            <strong>Continues alternating...</strong>
          </p>
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            Tiebreakers (same for both methods): 1) Wins vs same criteria players | 2) Buchholz score | 3) Goal difference
          </small>
        </div>
      );
    } else {
      return (
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #28a745' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🏆 Standard Ranking System</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#495057' }}>
            <strong>1.</strong> Total Points → 
            <strong>2.</strong> Wins vs Same Points → 
            <strong>3.</strong> Buchholz Score → 
            <strong>4.</strong> Goal Difference
          </p>
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            TB1: Head-to-head wins against players with equal points | 
            TB2: Sum of all opponents' points | 
            TB3: Point differential
          </small>
        </div>
      );
    }
  };

  return (
    <div>
      <h2>Current Standings</h2>
      {getRankingExplanation()}
      
      <div className="tournament-table">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Player</th>
              {tournament.rankingSystem === 'hybrid' && <th>Rank Method</th>}
              <th>Points</th>
              <th>Matches</th>
              <th>TB1: Same Points</th>
              <th>TB2: Buchholz</th>
              <th>TB3: Goal Diff</th>
              <th>ELO</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => {
              const positionClass = index < 3 ? `position-${index + 1}` : '';
              return (
                <tr key={player.id} className={positionClass}>
                  <td><strong>{index + 1}</strong></td>
                  <td>{player.name}</td>
                  {tournament.rankingSystem === 'hybrid' && (
                    <td>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: player.rankMethod === 'points' ? '#e3f2fd' : '#fff3e0',
                        color: player.rankMethod === 'points' ? '#1976d2' : '#f57c00'
                      }}>
                        {player.rankMethod === 'points' ? 'Points' : 'ELO'}
                      </span>
                    </td>
                  )}
                  <td>{player.points}</td>
                  <td>{player.matches}</td>
                  <td>{player.tiebreakers.winsAgainstSamePoints}</td>
                  <td>{player.tiebreakers.buchholzScore}</td>
                  <td>{player.goalDiff > 0 ? '+' : ''}{player.goalDiff}</td>
                  <td>{player.currentElo || player.startingElo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Standings;
