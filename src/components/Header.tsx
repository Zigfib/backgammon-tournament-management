
import React from 'react';
import { Tournament } from '../types';
import { saveTournament, loadTournament, exportTournament, importTournament } from '../utils/storage';

interface HeaderProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
  setAppState: React.Dispatch<React.SetStateAction<'setup' | 'playerSetup' | 'tournament'>>;
}

const Header: React.FC<HeaderProps> = ({ tournament, setTournament, setAppState }) => {
  const handleSave = () => {
    saveTournament(tournament);
  };

  const handleLoad = () => {
    const loaded = loadTournament();
    if (loaded) {
      setTournament(loaded);
      setAppState('tournament');
    }
  };

  const handleExport = () => {
    exportTournament(tournament);
  };

  const handleImport = (file: File) => {
    importTournament(file, (imported) => {
      setTournament(imported);
      setAppState('tournament');
    });
  };

  return (
    <div className="header">
      <h1>🎲 Backgammon Tournament Manager</h1>
      <p>Round-robin tournament with ELO ratings</p>
      <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={handleSave}>💾 Save Tournament</button>
        <button className="btn" onClick={handleLoad}>📂 Load Tournament</button>
        <button className="btn" onClick={handleExport}>⬇️ Export JSON</button>
        <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          ⬆️ Import JSON
          <input 
            type="file" 
            accept="application/json" 
            style={{ display: 'none' }} 
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
};

export default Header;
