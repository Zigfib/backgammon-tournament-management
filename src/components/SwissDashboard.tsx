import React, { useState, useEffect } from 'react';
import { 
  SwissTournament, 
  PairingSuggestion, 
  PairingScenario 
} from '../types';
import { 
  initiatePairingProcess, 
  implementPairing, 
  getPlayerStatus 
} from '../utils/swiss';

interface SwissDashboardProps {
  tournament: SwissTournament;
  setTournament: React.Dispatch<React.SetStateAction<SwissTournament>>;
}

const SwissDashboard: React.FC<SwissDashboardProps> = ({ tournament, setTournament }) => {
  const [pairingSuggestions, setPairingSuggestions] = useState<PairingSuggestion[]>([]);
  const [scenario, setScenario] = useState<PairingScenario | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update pairing suggestions when tournament changes
  useEffect(() => {
    if (autoRefresh) {
      const result = initiatePairingProcess(tournament);
      setPairingSuggestions(result.suggestions);
      setScenario(result.scenario);
    }
  }, [tournament, autoRefresh]);

  const handleImplementAllPairings = () => {
    if (pairingSuggestions.length > 0) {
      // Implement ALL pairing suggestions to create complete round
      let updatedTournament = tournament;
      for (const pairing of pairingSuggestions) {
        updatedTournament = implementPairing(updatedTournament, pairing);
      }
      setTournament(updatedTournament);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ready-to-pair': return '#28a745'; // Green
      case 'playing': return '#ffc107'; // Yellow
      case 'finished': return '#6c757d'; // Gray
      case 'waiting': return '#17a2b8'; // Blue
      default: return '#dee2e6';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'ready-to-pair': return '🟢';
      case 'playing': return '🟡';
      case 'finished': return '⚫';
      case 'waiting': return '🔵';
      default: return '⚪';
    }
  };

  const currentMatches = tournament.matches.filter(m => m.isCurrentlyPlaying);
  const completedMatches = tournament.matches.filter(m => m.completed);
  
  // Update player statuses dynamically
  const playersWithStatus = tournament.players.map(player => ({
    ...player,
    status: getPlayerStatus(player, tournament)
  }));

  // Determine if we're starting a new round or adding matches mid-round
  const isNewRound = currentMatches.length === 0 && completedMatches.length > 0;
  const isFirstRound = completedMatches.length === 0;
  
  const getButtonText = () => {
    const matchCount = pairingSuggestions.length;
    
    if (isFirstRound) {
      return `🚀 Start Tournament (${matchCount} match${matchCount > 1 ? 'es' : ''})`;
    } else if (isNewRound) {
      const nextRound = Math.max(...completedMatches.map(m => m.round)) + 1;
      return `🚀 Start Round ${nextRound} (${matchCount} match${matchCount > 1 ? 'es' : ''})`;
    } else {
      return `▶️ Start Match${matchCount > 1 ? 'es' : ''} (${matchCount})`;
    }
  };

  const statusCounts = playersWithStatus.reduce((counts, player) => {
    counts[player.status] = (counts[player.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🏆 Rapid Swiss Tournament Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh pairings
          </label>
          <button 
            className="btn"
            onClick={() => {
              const result = initiatePairingProcess(tournament);
              setPairingSuggestions(result.suggestions);
              setScenario(result.scenario);
            }}
          >
            🔄 Refresh Pairings
          </button>
        </div>
      </div>

      {/* Tournament Status Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6' 
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Tournament Progress</h4>
          <p><strong>Round:</strong> {tournament.currentRound} / {tournament.maxRounds}</p>
          <p><strong>Matches:</strong> {completedMatches.length} completed, {currentMatches.length} playing</p>
        </div>

        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          border: '1px solid #dee2e6' 
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Player Status</h4>
          {Object.entries(statusCounts).map(([status, count]) => (
            <p key={status} style={{ margin: '5px 0' }}>
              {getStatusIcon(status)} <strong>{status.replace('-', ' ')}:</strong> {count}
            </p>
          ))}
        </div>

        {scenario && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #dee2e6' 
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Algorithm Validation</h4>
            <p><strong>Success Rate:</strong> {Math.round(scenario.probabilityOfSuccess * 100)}% 
              {scenario.probabilityOfSuccess === 1.0 && ' ✅'}
            </p>
            <p><strong>Active Matches:</strong> {scenario.currentMatches.length}</p>
            <p><strong>Scenarios Tested:</strong> {scenario.possibleOutcomes.length || 'None (no active matches)'}</p>
          </div>
        )}
      </div>

      {/* Round Pairing Section */}
      {pairingSuggestions.length > 0 && (
        <div style={{ 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#155724' }}>Complete Round Ready</h4>
              <p style={{ margin: '0', color: '#155724' }}>
                {pairingSuggestions.length} pairing{pairingSuggestions.length > 1 ? 's' : ''} available for this round
              </p>
            </div>
            <button 
              className="btn"
              style={{ 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none',
                padding: '12px 20px',
                fontSize: '1em',
                fontWeight: 'bold'
              }}
              onClick={handleImplementAllPairings}
            >
              {getButtonText()}
            </button>
          </div>
          
          {/* Show all pairings */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '10px' 
          }}>
            {pairingSuggestions.map((suggestion, index) => {
              const player1 = tournament.players.find(p => p.id === suggestion.player1Id);
              const player2 = tournament.players.find(p => p.id === suggestion.player2Id);
              return (
                <div key={`${suggestion.player1Id}-${suggestion.player2Id}`} style={{ 
                  background: '#f8fff9', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #c3e6cb',
                  fontSize: '0.9em'
                }}>
                  <strong>{player1?.name}</strong> vs <strong>{player2?.name}</strong>
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '3px' }}>
                    {suggestion.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Matches */}
      {currentMatches.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>🟡 Current Matches in Progress</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '15px' 
          }}>
            {currentMatches.map(match => {
              const player1 = tournament.players.find(p => p.id === match.player1);
              const player2 = tournament.players.find(p => p.id === match.player2);
              return (
                <div key={match.id} style={{ 
                  background: '#fff3cd', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: '1px solid #ffeaa7' 
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Round {match.round}</h4>
                  <p><strong>{player1?.name}</strong> vs <strong>{player2?.name}</strong></p>
                  <p style={{ fontSize: '0.9em', color: '#666' }}>
                    Started: {match.startTime ? new Date(match.startTime).toLocaleTimeString() : 'Unknown'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Player Status Grid */}
      <div>
        <h3>👥 Player Status Overview</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '10px' 
        }}>
          {playersWithStatus.map(player => (
            <div key={player.id} style={{ 
              background: '#f8f9fa',
              padding: '12px', 
              borderRadius: '8px', 
              border: `2px solid ${getStatusColor(player.status)}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{player.name}</strong>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  Round: {player.currentRound} | Points: {player.pointsEarned} | ELO: {player.currentElo}
                </div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  Record: {player.totalWins}W-{player.totalLosses}L
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2em' }}>{getStatusIcon(player.status)}</div>
                <div style={{ 
                  fontSize: '0.8em', 
                  fontWeight: 'bold',
                  color: getStatusColor(player.status),
                  textTransform: 'capitalize'
                }}>
                  {player.status.replace('-', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SwissDashboard;