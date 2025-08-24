
import { Tournament } from '../types';

export const saveTournament = (tournament: Tournament): void => {
  if (!tournament.players || tournament.players.length === 0) {
    alert("No tournament to save yet!");
    return;
  }
  localStorage.setItem("backgammonTournament", JSON.stringify(tournament));
  alert("✅ Tournament saved successfully!");
};

export const loadTournament = (): Tournament | null => {
  const data = localStorage.getItem("backgammonTournament");
  if (!data) {
    alert("⚠️ No saved tournament found.");
    return null;
  }
  
  try {
    const tournament = JSON.parse(data) as Tournament;
    alert("📂 Tournament loaded!");
    return tournament;
  } catch (error) {
    alert("⚠️ Error loading tournament data.");
    return null;
  }
};

export const exportTournament = (tournament: Tournament): void => {
  if (!tournament.players || tournament.players.length === 0) {
    alert("No tournament data to export!");
    return;
  }
  
  const dataStr = JSON.stringify(tournament, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${tournament.name || 'tournament'}_${new Date().toISOString().split('T')[0]}.json`;
  
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
