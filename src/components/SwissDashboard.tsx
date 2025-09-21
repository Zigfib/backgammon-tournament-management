import React, { useState } from 'react';
import { Tournament, Player } from '../types';
import { getRoundsPlayed, getPlayerRecord, getNextRound, getAvailablePlayers, getProposedSwissPairings, updateMatchResult, havePlayedBefore } from '../utils/tournament';
import { calculateStandardRanking } from '../utils/ranking';

interface SwissDashboardProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const SwissDashboard: React.FC<SwissDashboardProps> = ({ tournament, setTournament }) => {
  // State for score input
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [pendingScores, setPendingScores] = useState<{[key: number]: {player1Score: string, player2Score: string}}>({});
  
  // State for manual pairing
  const [showManualPairing, setShowManualPairing] = useState(false);
  const [manualPlayer1, setManualPlayer1] = useState<number | null>(null);
  const [manualPlayer2, setManualPlayer2] = useState<number | null>(null);
  
  // Get data for the dashboard
  const activeMatches = tournament.matches.filter(m => !m.completed);
  const availablePlayers = getAvailablePlayers(tournament);
  const proposedPairings = getProposedSwissPairings(tournament);
  const nextRound = getNextRound(tournament);
  const completedMatches = tournament.matches.filter(m => m.completed).length;
  
  // Handle applying proposed pairings
  const handleApplyPairings = () => {
    if (proposedPairings.length === 0) {
      alert('No pairings available to apply');
      return;
    }
    
    // Apply the exact proposed pairings that were displayed
    const nextMatchId = Math.max(...tournament.matches.map(m => m.id), -1) + 1;
    const newMatches = proposedPairings.map((pairing, index) => ({
      id: nextMatchId + index,
      player1: pairing.player1Id,
      player2: pairing.player2Id,
      round: pairing.round,
      player1Score: null,
      player2Score: null,
      completed: false
    }));
    
    setTournament(prev => ({
      ...prev,
      matches: [...prev.matches, ...newMatches]
    }));
  };

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

  const handleSubmitScore = (matchId: number) => {
    if (!isValidScore(matchId)) {
      alert('Please enter valid scores');
      return;
    }

    const scores = pendingScores[matchId];
    const updatedTournament = updateMatchResult(tournament, matchId, 
      scores.player1Score, scores.player2Score);
    
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

  // Manual pairing handlers
  const handleManualPairSubmit = () => {
    if (!manualPlayer1 || !manualPlayer2) {
      alert('Please select both players');
      return;
    }

    if (manualPlayer1 === manualPlayer2) {
      alert('Cannot pair a player with themselves');
      return;
    }

    // Create new match
    const nextMatchId = Math.max(...tournament.matches.map(m => m.id), -1) + 1;
    const newMatch = {
      id: nextMatchId,
      player1: manualPlayer1,
      player2: manualPlayer2,
      round: nextRound,
      player1Score: null,
      player2Score: null,
      completed: false
    };

    setTournament(prev => ({
      ...prev,
      matches: [...prev.matches, newMatch]
    }));

    // Reset manual pairing state
    setShowManualPairing(false);
    setManualPlayer1(null);
    setManualPlayer2(null);
  };

  const handleManualPairCancel = () => {
    setShowManualPairing(false);
    setManualPlayer1(null);
    setManualPlayer2(null);
  };
  
  // Get player status for the bottom table
  const getPlayerStatus = (player: Player): string => {
    const playerInActiveMatch = activeMatches.find(m => 
      m.player1 === player.id || m.player2 === player.id
    );
    
    if (playerInActiveMatch) {
      return 'Playing';
    }
    
    const roundsPlayed = getRoundsPlayed(player, tournament.matches);
    if (roundsPlayed >= tournament.numRounds) {
      return 'Finished';
    }
    
    return 'Available';
  };

  return (
    <div className="swiss-dashboard" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Tournament Progress - Top Section */}
      <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#495057' }}>Round {nextRound > tournament.numRounds ? tournament.numRounds : nextRound} of {tournament.numRounds}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '14px' }}>
          <div><strong>Completed Matches:</strong> {completedMatches} / {tournament.matches.length}</div>
          <div><strong>Active Matches:</strong> {activeMatches.length}</div>
          <div><strong>Available Players:</strong> {availablePlayers.length}</div>
          <div><strong>Tolerance:</strong> ±{tournament.swissTolerance} points</div>
        </div>
        
        {/* Manual Pairing Button */}
        {availablePlayers.length >= 2 && (
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => setShowManualPairing(true)}
              disabled={showManualPairing}
              style={{
                padding: '8px 16px',
                backgroundColor: showManualPairing ? '#6c757d' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: showManualPairing ? 'not-allowed' : 'pointer'
              }}
            >
              Manual Pair
            </button>
          </div>
        )}
      </div>

      {/* Manual Pairing Form */}
      {showManualPairing && (
        <div style={{ marginBottom: '25px' }}>
          <div style={{ padding: '20px', backgroundColor: '#e7f3ff', border: '1px solid #bee5eb', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>Manual Pairing</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Player 1 Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                  Player 1:
                </label>
                <select
                  value={manualPlayer1 !== null ? manualPlayer1 + 1 : ''}
                  onChange={(e) => {
                    setManualPlayer1(e.target.value !== '' ? parseInt(e.target.value) - 1 : null);
                    setManualPlayer2(null); // Reset player 2 when player 1 changes
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Player 1...</option>
                  {availablePlayers.map(player => {
                    const record = getPlayerRecord(player.id, tournament.matches);
                    const roundsPlayed = getRoundsPlayed(player, tournament.matches);
                    return (
                      <option key={player.id} value={player.id + 1}>
                        {player.name} (R: {roundsPlayed}, W: {record.wins})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Player 2 Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                  Player 2:
                </label>
                <select
                  value={manualPlayer2 !== null ? manualPlayer2 + 1 : ''}
                  onChange={(e) => setManualPlayer2(e.target.value !== '' ? parseInt(e.target.value) - 1 : null)}
                  disabled={!manualPlayer1}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: !manualPlayer1 ? '#f8f9fa' : 'white',
                    cursor: !manualPlayer1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Select Player 2...</option>
                  {manualPlayer1 && availablePlayers
                    .filter(player => player.id !== manualPlayer1)
                    .map(player => {
                      const record = getPlayerRecord(player.id, tournament.matches);
                      const roundsPlayed = getRoundsPlayed(player, tournament.matches);
                      return (
                        <option key={player.id} value={player.id + 1}>
                          {player.name} (R: {roundsPlayed}, W: {record.wins})
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {/* Player Information Display */}
            {manualPlayer1 && manualPlayer2 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#495057' }}>Pairing Information:</div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Head-to-Head:</strong> {
                      havePlayedBefore(manualPlayer1, manualPlayer2, tournament.matches)
                        ? '⚠️ These players have played before'
                        : '✅ These players have not played before'
                    }
                  </div>
                  <div>
                    <strong>Round:</strong> This will be Round {nextRound}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleManualPairSubmit}
                disabled={!manualPlayer1 || !manualPlayer2}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (!manualPlayer1 || !manualPlayer2) ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!manualPlayer1 || !manualPlayer2) ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Submit Pairing
              </button>
              <button
                onClick={handleManualPairCancel}
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
            </div>
          </div>
        </div>
      )}

      {/* 2. Playing Pairs Section */}
      {activeMatches.length > 0 && (
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#dc3545' }}>Playing Pairs</h3>
          <div style={{ backgroundColor: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '15px' }}>
            {(() => {
              // Group matches by round and add visual separation
              const matchesByRound = new Map<number, typeof activeMatches>();
              activeMatches.forEach(match => {
                if (!matchesByRound.has(match.round)) {
                  matchesByRound.set(match.round, []);
                }
                matchesByRound.get(match.round)!.push(match);
              });
              
              // Sort rounds
              const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
              
              return sortedRounds.map((round, roundIndex) => (
                <div key={round}>
                  {/* Add spacing between different rounds */}
                  {roundIndex > 0 && <div style={{ height: '20px' }} />}
                  
                  {/* Round header (only show if there are multiple rounds) */}
                  {sortedRounds.length > 1 && (
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '14px', 
                      color: '#495057', 
                      marginBottom: '8px',
                      paddingLeft: '5px'
                    }}>
                      Round {round}
                    </div>
                  )}
                  
                  {/* Matches for this round */}
                  {matchesByRound.get(round)!.map(match => {
                    const player1 = tournament.players[match.player1];
                    const player2 = tournament.players[match.player2];
                    const isEditing = editingMatch === match.id;
                    const scores = pendingScores[match.id];
                    
                    return (
                      <div key={match.id} style={{ marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                        {!isEditing ? (
                          <div 
                            onClick={() => handleMatchClick(match.id)}
                            style={{ 
                              padding: '10px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {player1.name} ({player1.points} pts) vs {player2.name} ({player2.points} pts)
                            </div>
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>
                              Round {match.round} • ELO: {player1.currentElo} vs {player2.currentElo} • Click to enter scores
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '15px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                              Enter Scores - Round {match.round}
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                              {/* Player 1 Score Input */}
                              <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                  {player1.name}
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max={tournament.maxPoints}
                                  value={scores?.player1Score || ''}
                                  onChange={(e) => handleScoreChange(match.id, 'player1', e.target.value)}
                                  onFocus={() => handleAutoComplete(match.id, 'player1')}
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
                              
                              {/* Player 2 Score Input */}
                              <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                  {player2.name}
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max={tournament.maxPoints}
                                  value={scores?.player2Score || ''}
                                  onChange={(e) => handleScoreChange(match.id, 'player2', e.target.value)}
                                  onFocus={() => handleAutoComplete(match.id, 'player2')}
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
                                onClick={() => handleSubmitScore(match.id)}
                                disabled={!isValidScore(match.id)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: isValidScore(match.id) ? '#28a745' : '#dee2e6',
                                  color: isValidScore(match.id) ? 'white' : '#6c757d',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: isValidScore(match.id) ? 'pointer' : 'not-allowed',
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
              ));
            })()}
          </div>
        </div>
      )}

      {/* 3. Proposed Pairings Section - Show if there are pairings OR waiting message */}
      {(proposedPairings.length > 0 || (availablePlayers.length > 0 && activeMatches.length > 0)) && (
        <div style={{ marginBottom: '25px' }}>
          {proposedPairings.length > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#28a745' }}>Proposed Pairings</h3>
                <button
                  onClick={handleApplyPairings}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Apply Pairings
                </button>
              </div>
              <div style={{ backgroundColor: '#f5fff5', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '15px' }}>
                {proposedPairings.map((pairing, index) => {
                  const player1 = tournament.players[pairing.player1Id];
                  const player2 = tournament.players[pairing.player2Id];
                  return (
                    <div key={index} style={{ padding: '10px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #e9ecef' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {player1.name} ({player1.points} pts) vs {player2.name} ({player2.points} pts)
                      </div>
                      <div style={{ fontSize: '13px', color: '#6c757d' }}>
                        Round {pairing.round} • ELO: {player1.currentElo} vs {player2.currentElo}
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: '13px', color: '#28a745', fontStyle: 'italic', marginTop: '10px' }}>
                  ✓ All proposed pairings are guaranteed to allow valid pairings for remaining players
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 15px 0', color: '#ffc107' }}>Waiting for Safe Pairings</h3>
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#856404' }}>
                  ⏳ No safe pairings available right now
                </div>
                <div style={{ fontSize: '14px', color: '#856404', marginBottom: '8px' }}>
                  The system is waiting for active matches to complete before proposing new pairings.
                  This ensures all players can be paired fairly regardless of match outcomes.
                </div>
                <div style={{ fontSize: '13px', color: '#856404', fontStyle: 'italic' }}>
                  Safe pairings will appear automatically when matches finish.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. All Players Table - Bottom Section */}
      <div>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>All Players</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Rounds</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Wins</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Losses</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>Points</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>TB1</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>TB2</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>ELO</th>
              </tr>
            </thead>
            <tbody>
              {calculateStandardRanking(tournament.players, tournament.results)
                .map(player => {
                  const record = getPlayerRecord(player.id, tournament.matches);
                  const roundsPlayed = getRoundsPlayed(player, tournament.matches);
                  const status = getPlayerStatus(player);
                  
                  return (
                    <tr key={player.id} style={{ 
                      backgroundColor: status === 'Playing' ? '#fff3cd' : 
                                      status === 'Finished' ? '#e7f3e7' : 'white'
                    }}>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', fontWeight: 'bold' }}>
                        {player.name}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        {status}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        {roundsPlayed}/{tournament.numRounds}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        {record.wins}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        {record.losses}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>
                        {player.points}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#6c757d' }} title="Head-to-Head: Wins vs players with same points">
                          {player.tiebreakers.winsAgainstSamePoints}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#6c757d' }} title="Buchholz: Sum of opponents' points">
                          {player.tiebreakers.buchholzScore}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        {player.currentElo}
                        {player.currentElo !== player.startingElo && (
                          <span style={{ fontSize: '12px', color: player.currentElo > player.startingElo ? '#28a745' : '#dc3545' }}>
                            ({player.currentElo >= player.startingElo ? '+' : ''}{player.currentElo - player.startingElo})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SwissDashboard;