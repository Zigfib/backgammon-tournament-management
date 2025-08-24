import React from 'react';
import { Tournament } from '../types';

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
    // Validate required fields
    for (let i = 0; i < tournament.players.length; i++) {
      const player = tournament.players[i];
      if (!player.name.trim()) {
        alert(`Please enter a name for Player ${i + 1}`);
        return;
      }
      if (!player.startingElo || player.startingElo < 100 || player.startingElo > 3000) {
        alert(`Please enter a valid ELO rating for ${player.name} (100-3000)`);
        return;
      }
    }

    // Update tournament with matches
    setTournament(prev => {
      const updatedPlayers = prev.players.map(player => ({
        ...player,
        currentElo: player.startingElo
      }));

      const tournamentWithPlayers = { ...prev, players: updatedPlayers };
      const matches = tournamentWithPlayers.matches || [];

      // Initialize results tracking
      const results: Record<number, Record<number, any[]>> = {};
      updatedPlayers.forEach(p1 => {
        results[p1.id] = {};
        updatedPlayers.forEach(p2 => {
          if (p1.id !== p2.id) {
            results[p1.id][p2.id] = [];
          }
        });
      });

      return {
        ...prev,
        players: updatedPlayers,
        matches,
        results
      };
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