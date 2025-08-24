
import React from 'react';
import { Tournament } from '../types';
import { updateMatchResult } from '../utils/tournament';

interface MatchEntryProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const MatchEntry: React.FC<MatchEntryProps> = ({ tournament, setTournament }) => {
  const handleScoreChange = (matchId: number, player1Score: string, player2Score: string) => {
    setTournament(prev => updateMatchResult(prev, matchId, player1Score, player2Score));
  };

  return (
    <div>
      <h2>Enter Match Results</h2>
      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>📊 ELO Rating System Active</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#424242' }}>
          ELO ratings will update automatically after each match. Larger victories have slightly more impact on rating changes.
          <strong> K-Factor: 32</strong> | <strong>Margin Bonus: Up to 2x</strong>
        </p>
      </div>
      
      <div>
        {tournament.matches.map(match => {
          const p1 = tournament.players[match.player1];
          const p2 = tournament.players[match.player2];
          
          // Calculate expected outcome for display
          const expectedP1 = (1 / (1 + Math.pow(10, (p2.currentElo - p1.currentElo) / 400)) * 100).toFixed(0);
          const expectedP2 = (100 - parseInt(expectedP1)).toString();
          
          return (
            <div key={match.id} className="match-input">
              <div>
                <label>{p1.name} ({p1.currentElo})</label>
                <small style={{ color: '#666', fontSize: '12px' }}>Expected: {expectedP1}%</small>
                <input 
                  type="number" 
                  value={match.player1Score ?? ''} 
                  min="0" 
                  max={tournament.maxPoints}
                  onChange={(e) => handleScoreChange(match.id, e.target.value, match.player2Score?.toString() ?? '')}
                />
              </div>
              <div className="vs-text">vs<br />Round {match.round}</div>
              <div>
                <label>{p2.name} ({p2.currentElo})</label>
                <small style={{ color: '#666', fontSize: '12px' }}>Expected: {expectedP2}%</small>
                <input 
                  type="number" 
                  value={match.player2Score ?? ''} 
                  min="0" 
                  max={tournament.maxPoints}
                  onChange={(e) => handleScoreChange(match.id, match.player1Score?.toString() ?? '', e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchEntry;
