
import { Tournament } from '../types';

export const saveTournament = (tournament: Tournament, silent: boolean = false): void => {
  if (!tournament.players || tournament.players.length === 0) {
    if (!silent) alert("No tournament to save yet!");
    return;
  }
  localStorage.setItem("backgammonTournament", JSON.stringify(tournament));
  if (!silent) alert("✅ Tournament saved successfully!");
};

// Auto-save function for silent background saves
export const autoSaveTournament = (tournament: Tournament): void => {
  saveTournament(tournament, true);
};

export const loadTournament = (silent: boolean = false): Tournament | null => {
  const data = localStorage.getItem("backgammonTournament");
  if (!data) {
    if (!silent) alert("⚠️ No saved tournament found.");
    return null;
  }
  
  try {
    const tournament = JSON.parse(data) as Tournament;
    if (!silent) alert("📂 Tournament loaded!");
    return tournament;
  } catch (error) {
    if (!silent) alert("⚠️ Error loading tournament data.");
    return null;
  }
};

// Auto-load function for silent background loading
export const autoLoadTournament = (): Tournament | null => {
  return loadTournament(true);
};

export const exportTournament = (tournament: Tournament): void => {
  if (!tournament.players || tournament.players.length === 0) {
    alert("No tournament data to export!");
    return;
  }
  
  const dataStr = JSON.stringify(tournament, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const tournamentName = tournament.name && tournament.name.trim() 
    ? tournament.name.replace(/[^a-zA-Z0-9\-_]/g, '_') 
    : 'tournament';
  const exportFileDefaultName = `${tournamentName}_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importTournament = (file: File, callback: (tournament: Tournament) => void): void => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const tournament = JSON.parse(event.target?.result as string) as Tournament;
      callback(tournament);
      alert("📂 Tournament imported successfully!");
    } catch (error) {
      alert("⚠️ Error importing tournament file. Please check the file format.");
    }
  };
  reader.readAsText(file);
};
