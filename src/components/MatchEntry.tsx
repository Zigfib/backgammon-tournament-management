
import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import { updateMatchResult, getCurrentRound, getActiveRounds } from '../utils/tournament';

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
  const [editingMatch, setEditingMatch] = useState<number | null>(null);

  // Swiss Tournament Display Logic (must be before any early returns)
  useEffect(() => {
    const currentRound = getCurrentRound(tournament);
    const maxRounds = tournament.numRounds;
    const activeRounds = getActiveRounds(tournament);
    
    console.log(`Display logic debug: currentRound=${currentRound}, maxRounds=${maxRounds}, activeRounds=[${activeRounds.join(',')}]`);
  }, [tournament]);

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

    const currentScore = player === 'player1' ? scores.player1Score : scores.player2Score;
    const otherScore = player === 'player1' ? scores.player2Score : scores.player1Score;

    // If the OTHER player has a score less than max and the CURRENT field is empty, auto-fill current field with max
    if (otherScore && parseInt(otherScore) < tournament.maxPoints && !currentScore) {
      setPendingScores(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [player + 'Score']: tournament.maxPoints.toString()
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
    
    // Clear pending scores and close editing
    setPendingScores(prev => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });
    setEditingMatch(null);
  };

  const handleMatchClick = (matchId: number) => {
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match || match.completed) return;
    
    setEditingMatch(matchId);
    if (!pendingScores[matchId]) {
      setPendingScores(prev => ({
        ...prev,
        [matchId]: { 
          player1Score: match.player1Score?.toString() || '', 
          player2Score: match.player2Score?.toString() || '' 
        }
      }));
    }
  };

  const handleCancelScore = () => {
    setEditingMatch(null);
    setPendingScores(prev => {
      const newScores = { ...prev };
      if (editingMatch) delete newScores[editingMatch];
      return newScores;
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

  const currentRound = getCurrentRound(tournament);
  const activeRounds = getActiveRounds(tournament);

  return (
    <div>
      <h2>Enter Match Results</h2>
      
      {/* Swiss Tournament Round Info */}
      <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>🎯 Swiss Tournament Progress</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#424242' }}>
          <strong>Current Round: {currentRound}</strong> | <strong>Max Rounds: {tournament.numRounds}</strong>
          {activeRounds.length > 0 && <span> | <strong>Active Rounds: [{activeRounds.join(', ')}]</strong></span>}
        </p>
      </div>
      
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
          const isEditing = editingMatch === match.id;
          
          return (
            <div key={match.id} style={{ marginBottom: '15px', backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
              {!isEditing && !isMatchSubmitted ? (
                <div 
                  onClick={() => handleMatchClick(match.id)}
                  style={{ 
                    padding: '15px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    borderLeft: '4px solid #007bff'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {p1.name} ({p1.points} pts) vs {p2.name} ({p2.points} pts)
                  </div>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>
                    Round {match.round} • ELO: {p1.currentElo} vs {p2.currentElo} • Expected: {expectedP1}% vs {expectedP2}% • Click to enter scores
                  </div>
                </div>
              ) : isMatchSubmitted ? (
                <div style={{ padding: '15px', backgroundColor: '#d4edda', borderLeft: '4px solid #28a745' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#155724' }}>
                    {p1.name} {match.player1Score} - {match.player2Score} {p2.name} ✓
                  </div>
                  <div style={{ fontSize: '13px', color: '#155724', marginBottom: '10px' }}>
                    Round {match.round} • Winner: {(match.player1Score || 0) > (match.player2Score || 0) ? p1.name : p2.name}
                  </div>
                  <button 
                    onClick={() => editScore(match.id)}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Score
                  </button>
                </div>
              ) : (
                <div style={{ padding: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>
                    Enter Scores - Round {match.round}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center', marginBottom: '15px' }}>
                    {/* Player 1 Input */}
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {p1.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                        ELO: {p1.currentElo} • Expected: {expectedP1}%
                      </div>
                      <input 
                        type="number" 
                        value={currentScores.player1Score} 
                        min="0" 
                        max={tournament.maxPoints}
                        onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                        onBlur={() => handleAutoComplete(match.id, 'player1')}
                        placeholder="0"
                        style={{
                          width: '80px',
                          padding: '8px',
                          border: '2px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                    
                    {/* VS divider */}
                    <div style={{ fontWeight: 'bold', color: '#6c757d' }}>vs</div>
                    
                    {/* Player 2 Input */}
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {p2.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                        ELO: {p2.currentElo} • Expected: {expectedP2}%
                      </div>
                      <input 
                        type="number" 
                        value={currentScores.player2Score} 
                        min="0" 
                        max={tournament.maxPoints}
                        onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                        onBlur={() => handleAutoComplete(match.id, 'player2')}
                        placeholder="0"
                        style={{
                          width: '80px',
                          padding: '8px',
                          border: '2px solid #dee2e6',
                          borderRadius: '4px',
                          fontSize: '16px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleCancelScore}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => submitScore(match.id)}
                      disabled={!canSubmit}
                      style={{ 
                        padding: '8px 16px',
                        backgroundColor: canSubmit ? '#28a745' : '#dee2e6',
                        color: canSubmit ? 'white' : '#6c757d',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        fontSize: '14px'
                      }}
                    >
                      Submit Score
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchEntry;
