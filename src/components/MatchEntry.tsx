
import React, { useState } from 'react';
import { Tournament } from '../types';
import { updateMatchResult } from '../utils/tournament';

interface MatchEntryProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

interface PendingScores {
  [matchId: number]: {
    player1Score: string;
    player2Score: string;
  };
}

const MatchEntry: React.FC<MatchEntryProps> = ({ tournament, setTournament }) => {
  const [pendingScores, setPendingScores] = useState<PendingScores>({});

  const handleScoreChange = (matchId: number, player: 'player1' | 'player2', value: string) => {
    setPendingScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        player1Score: player === 'player1' ? value : (prev[matchId]?.player1Score || ''),
        player2Score: player === 'player2' ? value : (prev[matchId]?.player2Score || '')
      }
    }));
  };

  const handleAutoComplete = (matchId: number, player: 'player1' | 'player2') => {
    const scores = pendingScores[matchId];
    if (!scores) return;

    const otherPlayer = player === 'player1' ? 'player2' : 'player1';
    const currentScore = player === 'player1' ? scores.player1Score : scores.player2Score;
    const otherScore = player === 'player1' ? scores.player2Score : scores.player1Score;

    // If current score is less than max and other score is empty, auto-fill with max
    if (currentScore && parseInt(currentScore) < tournament.maxPoints && !otherScore) {
      setPendingScores(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [otherPlayer + 'Score']: tournament.maxPoints.toString()
        }
      }));
    }
  };

  const isValidScore = (matchId: number): boolean => {
    const scores = pendingScores[matchId];
    if (!scores || !scores.player1Score || !scores.player2Score) return false;
    
    const p1Score = parseInt(scores.player1Score);
    const p2Score = parseInt(scores.player2Score);
    
    // Check if scores are valid numbers
    if (isNaN(p1Score) || isNaN(p2Score)) return false;
    
    // Check if scores are within valid range
    if (p1Score < 0 || p2Score < 0 || p1Score > tournament.maxPoints || p2Score > tournament.maxPoints) return false;
    
    // Prevent 0-0 scores
    if (p1Score === 0 && p2Score === 0) return false;
    
    // One score must be the maximum, the other must be lower
    return (p1Score === tournament.maxPoints && p2Score < tournament.maxPoints) ||
           (p2Score === tournament.maxPoints && p1Score < tournament.maxPoints);
  };

  const submitScore = (matchId: number) => {
    const scores = pendingScores[matchId];
    if (!scores || !isValidScore(matchId)) return;
    
    setTournament(prev => updateMatchResult(prev, matchId, scores.player1Score, scores.player2Score));
    
    // Clear pending scores for this match
    setPendingScores(prev => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });
  };

  const editScore = (matchId: number) => {
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;
    
    // Load current scores into pending state
    setPendingScores(prev => ({
      ...prev,
      [matchId]: {
        player1Score: match.player1Score?.toString() || '',
        player2Score: match.player2Score?.toString() || ''
      }
    }));
    
    // Clear the submitted score
    setTournament(prev => updateMatchResult(prev, matchId, '', ''));
  };

  // Safety check for matches and players
  if (!tournament.matches || tournament.matches.length === 0) {
    return (
      <div>
        <h2>Enter Match Results</h2>
        <p>No matches available. Please ensure the tournament has been properly set up with players.</p>
      </div>
    );
  }

  if (!tournament.players || tournament.players.length === 0) {
    return (
      <div>
        <h2>Enter Match Results</h2>
        <p>No players available. Please set up players first.</p>
      </div>
    );
  }

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
          
          // Get current scores (either pending or submitted)
          const currentScores = pendingScores[match.id] || {
            player1Score: match.player1Score?.toString() || '',
            player2Score: match.player2Score?.toString() || ''
          };
          
          const isMatchSubmitted = match.completed;
          const canSubmit = isValidScore(match.id);
          
          return (
            <div key={match.id} className="match-input" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div>
                <label>{p1.name} ({p1.currentElo})</label>
                <small style={{ color: '#666', fontSize: '12px' }}>Expected: {expectedP1}%</small>
                <input 
                  type="number" 
                  value={currentScores.player1Score} 
                  min="0" 
                  max={tournament.maxPoints}
                  disabled={isMatchSubmitted}
                  onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                  onFocus={() => handleAutoComplete(match.id, 'player1')}
                />
              </div>
              <div className="vs-text">vs<br />Round {match.round}</div>
              <div>
                <label>{p2.name} ({p2.currentElo})</label>
                <small style={{ color: '#666', fontSize: '12px' }}>Expected: {expectedP2}%</small>
                <input 
                  type="number" 
                  value={currentScores.player2Score} 
                  min="0" 
                  max={tournament.maxPoints}
                  disabled={isMatchSubmitted}
                  onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                  onFocus={() => handleAutoComplete(match.id, 'player2')}
                />
              </div>
              <div>
                {isMatchSubmitted ? (
                  <button 
                    className="btn btn-success" 
                    onClick={() => editScore(match.id)}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Edit Score
                  </button>
                ) : (
                  <button 
                    className="btn" 
                    onClick={() => submitScore(match.id)}
                    disabled={!canSubmit}
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '14px',
                      opacity: canSubmit ? 1 : 0.5,
                      cursor: canSubmit ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Submit Score
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchEntry;
