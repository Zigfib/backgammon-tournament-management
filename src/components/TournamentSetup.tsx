
import React from 'react';
import { Tournament } from '../types';

interface TournamentSetupProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
  onGoToPlayerSetup: (numPlayers: number) => void;
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({ 
  tournament, 
  setTournament, 
  onGoToPlayerSetup 
}) => {
  const handleInputChange = (field: keyof Tournament, value: string | number) => {
    setTournament(prev => ({ ...prev, [field]: value }));
  };

  const handleGoToPlayerSetup = () => {
    const numPlayers = tournament.players.length;
    if (!numPlayers || numPlayers < 3 || numPlayers > 32) {
      alert('Please enter a valid number of players (3-32)');
      return;
    }
    onGoToPlayerSetup(numPlayers);
  };

  return (
    <div className="setup-panel">
      <h2>Tournament Setup</h2>
      <div className="setup-grid">
        <div className="input-group">
          <label htmlFor="tournamentType">Tournament Format</label>
          <select 
            id="tournamentType" 
            value={tournament.tournamentType || 'round-robin'}
            onChange={(e) => handleInputChange('tournamentType', e.target.value as 'round-robin' | 'rapid-swiss')}
          >
            <option value="round-robin">Round-Robin (Everyone plays everyone)</option>
            <option value="rapid-swiss">Rapid Swiss (Real-time pairing as matches finish)</option>
          </select>
        </div>
        
        <div className="input-group">
          <label htmlFor="tournamentName">Tournament Name</label>
          <input 
            type="text" 
            id="tournamentName" 
            value={tournament.name}
            placeholder="Enter tournament name"
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="numPlayers">Number of Players (3-32)</label>
          <input 
            type="number" 
            id="numPlayers" 
            value={tournament.players.length || ''} 
            min="3" 
            max="32"
            placeholder="Enter number of players"
            onChange={(e) => {
              const count = parseInt(e.target.value);
              if (!isNaN(count) && count > 0) {
                const newPlayers = Array.from({ length: count }, (_, i) => ({
                  id: i,
                  name: `Player ${i + 1}`,
                  startingElo: 1500,
                  currentElo: 1500,
                  email: '',
                  phone: '',
                  matches: 0,
                  points: 0,
                  goalDiff: 0
                }));
                setTournament(prev => ({ ...prev, players: newPlayers }));
              } else if (e.target.value === '') {
                setTournament(prev => ({ ...prev, players: [] }));
              }
            }}
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="maxPoints">Match To</label>
          <input 
            type="number" 
            id="maxPoints" 
            value={tournament.maxPoints} 
            min="1" 
            max="25"
            onChange={(e) => handleInputChange('maxPoints', parseInt(e.target.value))}
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="rankingSystem">Ranking System</label>
          <select 
            id="rankingSystem" 
            value={tournament.rankingSystem}
            onChange={(e) => handleInputChange('rankingSystem', e.target.value as 'standard' | 'hybrid')}
          >
            <option value="standard">Standard - All positions by points + tiebreakers</option>
            <option value="hybrid">Hybrid - Top by points, lower by ELO improvement</option>
          </select>
        </div>
        
        {(tournament.tournamentType || 'round-robin') === 'round-robin' && (
          <div className="input-group">
            <label htmlFor="numRounds">Rounds per Matchup</label>
            <select 
              id="numRounds" 
              value={tournament.numRounds}
              onChange={(e) => handleInputChange('numRounds', parseInt(e.target.value))}
            >
              <option value="1">1 Round</option>
              <option value="2">2 Rounds</option>
              <option value="3">3 Rounds</option>
            </select>
          </div>
        )}
        
        
      </div>
      
      <button className="btn" onClick={handleGoToPlayerSetup}>Setup Players →</button>
    </div>
  );
};

export default TournamentSetup;
