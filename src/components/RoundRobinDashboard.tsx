import React, { useState } from 'react';
import { Tournament } from '../types';
import { updateMatchResult } from '../utils/tournament';
import { calculateStandardRanking, calculateHybridRanking } from '../utils/ranking';

interface RoundRobinDashboardProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const RoundRobinDashboard: React.FC<RoundRobinDashboardProps> = ({ tournament, setTournament }) => {
  // State for score input
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [pendingScores, setPendingScores] = useState<{[key: number]: {player1Score: string, player2Score: string}}>({});
  
  // Get data for the dashboard
  const completedMatches = tournament.matches.filter(m => m.completed);
  const activeMatches = tournament.matches.filter(m => !m.completed);
  const totalMatches = tournament.matches.length;
  const completionPercentage = totalMatches > 0 ? Math.round((completedMatches.length / totalMatches) * 100) : 0;

  // Build results structure for tiebreaker calculations (same as Standings fix)
  const resultsFromMatches: Record<number, Record<number, any[]>> = {};
  
  tournament.matches.forEach(match => {
    if (match.completed && match.player1Score !== null && match.player2Score !== null) {
      // Initialize player results if not exists
      if (!resultsFromMatches[match.player1]) {
        resultsFromMatches[match.player1] = {};
      }
      if (!resultsFromMatches[match.player2]) {
        resultsFromMatches[match.player2] = {};
      }
      
      // Create result data
      const isPlayer1Winner = match.player1Score > match.player2Score;
      const resultData1 = {
        round: match.round,
        score1: match.player1Score,
        score2: match.player2Score,
        points1: isPlayer1Winner ? 3 : 1,
        points2: isPlayer1Winner ? 1 : 3
      };
      
      const resultData2 = {
        round: match.round,
        score1: match.player2Score,
        score2: match.player1Score,
        points1: isPlayer1Winner ? 1 : 3,
        points2: isPlayer1Winner ? 3 : 1
      };
      
      // Store results for both players
      if (!resultsFromMatches[match.player1][match.player2]) {
        resultsFromMatches[match.player1][match.player2] = [];
      }
      if (!resultsFromMatches[match.player2][match.player1]) {
        resultsFromMatches[match.player2][match.player1] = [];
      }
      
      resultsFromMatches[match.player1][match.player2].push(resultData1);
      resultsFromMatches[match.player2][match.player1].push(resultData2);
    }
  });

  const sortedPlayers = tournament.rankingSystem === 'hybrid' 
    ? calculateHybridRanking(tournament.players, resultsFromMatches)
    : calculateStandardRanking(tournament.players, resultsFromMatches);

  // Score input handlers
  const handleMatchClick = (matchId: number) => {
    setEditingMatch(matchId);
    if (!pendingScores[matchId]) {
      setPendingScores(prev => ({
        ...prev,
        [matchId]: { player1Score: '', player2Score: '' }
      }));
    }
  };

  const handleScoreChange = (matchId: number, player: 'player1' | 'player2', value: string) => {
    setPendingScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [player + 'Score']: value
      }
    }));
  };

  const handleAutoComplete = (matchId: number, player: 'player1' | 'player2') => {
    const scores = pendingScores[matchId];
    if (!scores) return;

    const currentScore = player === 'player1' ? scores.player1Score : scores.player2Score;
    const otherScore = player === 'player1' ? scores.player2Score : scores.player1Score;

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
    
    if (isNaN(p1Score) || isNaN(p2Score)) return false;
    if (p1Score < 0 || p2Score < 0 || p1Score > tournament.maxPoints || p2Score > tournament.maxPoints) return false;
    if (p1Score === 0 && p2Score === 0) return false;
    
    return (p1Score === tournament.maxPoints) !== (p2Score === tournament.maxPoints);
  };

  const handleSubmitScore = (matchId: number) => {
    const scores = pendingScores[matchId];
    if (!scores || !isValidScore(matchId)) return;

    const updatedTournament = updateMatchResult(tournament, matchId, scores.player1Score, scores.player2Score);
    setTournament(updatedTournament);
    
    setEditingMatch(null);
    setPendingScores(prev => {
      const newScores = { ...prev };
      delete newScores[matchId];
      return newScores;
    });
  };

  const handleCancelScore = () => {
    setEditingMatch(null);
    setPendingScores(prev => {
      const newScores = { ...prev };
      if (editingMatch) delete newScores[editingMatch];
      return newScores;
    });
  };

  const handleEditExistingMatch = (matchId: number) => {
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match || !match.completed) return;

    setEditingMatch(matchId);
    setPendingScores(prev => ({
      ...prev,
      [matchId]: {
        player1Score: match.player1Score?.toString() || '',
        player2Score: match.player2Score?.toString() || ''
      }
    }));
  };

  return (
    <div className="round-robin-dashboard" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Tournament Progress - Top Section */}
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#495057' }}>Tournament Progress</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '14px' }}>
          <div><strong>Completed Matches:</strong> {completedMatches.length} / {totalMatches}</div>
          <div><strong>Active Matches:</strong> {activeMatches.length}</div>
          <div><strong>Completion:</strong> {completionPercentage}%</div>
          <div><strong>Tournament Rounds:</strong> {tournament.numRounds}</div>
        </div>
      </div>

      {/* 2. Tournament Matches Section */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>All Tournament Matches</h3>
        <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Round</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Match</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Score</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tournament.matches.map(match => {
                const player1 = tournament.players[match.player1];
                const player2 = tournament.players[match.player2];
                const isEditing = editingMatch === match.id;
                const scores = pendingScores[match.id];
                const isCompleted = match.completed;
                
                return (
                  <tr key={match.id} style={{ 
                    backgroundColor: isCompleted ? '#f8f9fa' : 'white',
                    opacity: isCompleted ? 0.8 : 1
                  }}>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {match.round}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {player1.name} vs {player2.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        ELO: {player1.currentElo} vs {player2.currentElo}
                      </div>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {!isEditing && isCompleted && (
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {match.player1Score} - {match.player2Score}
                        </div>
                      )}
                      {!isEditing && !isCompleted && (
                        <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Not played</span>
                      )}
                      {isEditing && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            value={scores?.player1Score || ''}
                            onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                            onFocus={() => handleAutoComplete(match.id, 'player1')}
                            placeholder="0"
                            style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #dee2e6', borderRadius: '4px' }}
                            min="0"
                            max={tournament.maxPoints}
                          />
                          <span>-</span>
                          <input
                            type="number"
                            value={scores?.player2Score || ''}
                            onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                            onFocus={() => handleAutoComplete(match.id, 'player2')}
                            placeholder="0"
                            style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #dee2e6', borderRadius: '4px' }}
                            min="0"
                            max={tournament.maxPoints}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {isCompleted ? (
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>Completed</span>
                      ) : (
                        <span style={{ color: '#ffc107', fontWeight: 'bold' }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {!isEditing && !isCompleted && (
                        <button
                          onClick={() => handleMatchClick(match.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Enter Score
                        </button>
                      )}
                      {!isEditing && isCompleted && (
                        <button
                          onClick={() => handleEditExistingMatch(match.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit Score
                        </button>
                      )}
                      {isEditing && (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleSubmitScore(match.id)}
                            disabled={!isValidScore(match.id)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: isValidScore(match.id) ? '#28a745' : '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: isValidScore(match.id) ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Submit
                          </button>
                          <button
                            onClick={handleCancelScore}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Current Standings Section */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Current Standings</h3>
        
        {/* Ranking Explanation */}
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #28a745' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>
            🏆 {tournament.rankingSystem === 'hybrid' ? 'Hybrid Ranking System' : 'Standard Ranking System'}
          </h4>
          {tournament.rankingSystem === 'hybrid' ? (
            <>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057' }}>
                <strong>Positions 1-2:</strong> Ranked by Points + Tiebreakers → 
                <strong>Positions 3-4:</strong> Ranked by ELO Improvement + Tiebreakers → 
                <strong>Continues alternating...</strong>
              </p>
              <small style={{ color: '#6c757d', fontSize: '12px' }}>
                Tiebreakers (same for both methods): 1) Wins vs same criteria players | 2) Buchholz score | 3) Goal difference
              </small>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Standings Table */}
        <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Position</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Player</th>
                {tournament.rankingSystem === 'hybrid' && <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Rank Method</th>}
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Points</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Matches</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>TB1: Same Points</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>TB2: Buchholz</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>TB3: Goal Diff</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>ELO</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const positionClass = index < 3 ? `position-${index + 1}` : '';
                return (
                  <tr key={player.id} className={positionClass} style={{
                    backgroundColor: index === 0 ? '#fff3cd' : index === 1 ? '#d1ecf1' : index === 2 ? '#d4edda' : 'white'
                  }}>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                      {player.name}
                    </td>
                    {tournament.rankingSystem === 'hybrid' && (
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
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
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>
                      {player.points}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {player.matches}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {player.tiebreakers.winsAgainstSamePoints}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {player.tiebreakers.buchholzScore}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {player.goalDiff > 0 ? '+' : ''}{player.goalDiff}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {player.currentElo || player.startingElo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoundRobinDashboard;