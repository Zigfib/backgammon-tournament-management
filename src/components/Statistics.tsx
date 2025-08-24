
import React from 'react';
import { Tournament } from '../types';

interface StatisticsProps {
  tournament: Tournament;
}

const Statistics: React.FC<StatisticsProps> = ({ tournament }) => {
  return (
    <div>
      <h2>Player Statistics</h2>
      <div className="stats-grid">
        {tournament.players.map(player => {
          const completionPercent = player.matches > 0 
            ? Math.round((player.matches / ((tournament.players.length - 1) * tournament.numRounds)) * 100) 
            : 0;
          const eloChange = (player.currentElo || player.startingElo) - player.startingElo;
          
          return (
            <div key={player.id} className="stat-card">
              <h3>{player.name}</h3>
              <p><strong>Current Points:</strong> {player.points}</p>
              <p><strong>Matches Played:</strong> {player.matches}</p>
              <p><strong>Completion:</strong> {completionPercent}%</p>
              <p><strong>Goal Difference:</strong> {player.goalDiff > 0 ? '+' : ''}{player.goalDiff}</p>
              <p><strong>Starting ELO:</strong> {player.startingElo}</p>
              <p><strong>Current ELO:</strong> {player.currentElo || player.startingElo}</p>
              <p><strong>ELO Change:</strong> {eloChange > 0 ? '+' : ''}{eloChange}</p>
              <p><strong>Email:</strong> {player.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> {player.phone || 'Not provided'}</p>
              <p><strong>Points Per Match:</strong> {player.matches > 0 ? (player.points / player.matches).toFixed(1) : '0'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Statistics;
