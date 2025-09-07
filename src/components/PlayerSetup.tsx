import React from 'react';
import { Tournament, Match } from '../types';
import { createSwissTournament } from '../utils/swiss';

interface PlayerSetupProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
  onBack: () => void;
  onStartTournament: () => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({
  tournament,
  setTournament,
  onBack,
  onStartTournament
}) => {
  const handlePlayerChange = (index: number, field: string, value: string) => {
    setTournament(prev => ({
      ...prev,
      players: prev.players.map((player, i) =>
        i === index
          ? { ...player, [field]: field === 'startingElo' ? parseInt(value) || 1500 : value }
          : player
      )
    }));
  };

  const handleStartTournament = () => {
    // Validate all players have names and ELO ratings
    for (const player of tournament.players) {
      if (!player.name.trim()) {
        alert('Please enter names for all players');
        return;
      }
      if (!player.startingElo || player.startingElo < 100 || player.startingElo > 3000) {
        alert('Please enter valid ELO ratings for all players (100-3000)');
        return;
      }
    }

    setTournament(prev => {
      const updatedPlayers = prev.players.map(player => ({
        ...player,
        currentElo: player.startingElo,
        matches: 0,
        points: 0,
        goalDiff: 0
      }));

      // Check if this is a Swiss tournament
      if (prev.tournamentType === 'rapid-swiss') {
        // Create Swiss tournament - no pre-generated matches
        const swissTournament = createSwissTournament({
          ...prev,
          players: updatedPlayers
        }, 7, 1); // 7 rounds max, 1 point difference allowed
        
        console.log('Created Swiss tournament:', swissTournament);
        return swissTournament as any; // Type assertion needed due to interface differences
      }

      // Original round-robin logic
      const matches: Match[] = [];
      let matchId = 0;

      for (let round = 1; round <= prev.numRounds; round++) {
        for (let i = 0; i < updatedPlayers.length; i++) {
          for (let j = i + 1; j < updatedPlayers.length; j++) {
            matches.push({
              id: matchId++,
              player1: i,
              player2: j,
              round: round,
              player1Score: null,
              player2Score: null,
              completed: false
            });
          }
        }
      }

      console.log('Generated matches:', matches.length); // Debug log

      // Initialize results tracking using player array indices (not IDs)
      const results: Record<number, Record<number, any[]>> = {};
      for (let i = 0; i < updatedPlayers.length; i++) {
        results[i] = {};
        for (let j = 0; j < updatedPlayers.length; j++) {
          if (i !== j) {
            results[i][j] = [];
          }
        }
      }

      const newTournament = {
        ...prev,
        players: updatedPlayers,
        matches,
        results
      };

      console.log('Tournament with matches:', newTournament); // Debug log
      return newTournament;
    });

    onStartTournament();
  };

  return (
    <div className="setup-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Player Information</h2>
        <button className="btn" style={{ background: '#6c757d' }} onClick={onBack}>
          ← Back to Tournament Setup
        </button>
      </div>

      <div className="player-cards">
        {tournament.players.map((player, index) => (
          <div key={index} className="player-card">
            <h3>Player {index + 1}</h3>

            <div className="input-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={player.name}
                onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Starting ELO Rating *</label>
              <div className="elo-input">
                <input
                  type="number"
                  value={player.startingElo}
                  min="100"
                  max="3000"
                  onChange={(e) => handlePlayerChange(index, 'startingElo', e.target.value)}
                  required
                />
                <div className="elo-help" title="Typical range: 1000-2500. New players: ~1200-1500">?</div>
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={player.email}
                placeholder={`player${index + 1}@email.com`}
                onChange={(e) => handlePlayerChange(index, 'email', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={player.phone}
                placeholder="+1 (555) 123-4567"
                onChange={(e) => handlePlayerChange(index, 'phone', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button className="btn btn-success" onClick={handleStartTournament}>
          Start Tournament
        </button>
      </div>
    </div>
  );
};

export default PlayerSetup;