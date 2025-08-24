
import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import MatchEntry from './MatchEntry';
import TournamentTable from './TournamentTable';
import Standings from './Standings';
import Statistics from './Statistics';
import { calculateStats } from '../utils/tournament';

interface MainContentProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const MainContent: React.FC<MainContentProps> = ({ tournament, setTournament }) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'table' | 'standings' | 'stats'>('matches');

  // Update stats whenever tournament changes
  useEffect(() => {
    setTournament(prev => ({
      ...prev,
      players: calculateStats(prev.players, prev.matches)
    }));
  }, [tournament.matches, setTournament]);

  return (
    <div className="main-content">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Match Entry
        </button>
        <button 
          className={`tab ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          Tournament Table
        </button>
        <button 
          className={`tab ${activeTab === 'standings' ? 'active' : ''}`}
          onClick={() => setActiveTab('standings')}
        >
          Standings
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>
      
      <div className={`tab-content ${activeTab === 'matches' ? 'active' : ''}`}>
        <MatchEntry tournament={tournament} setTournament={setTournament} />
      </div>
      
      <div className={`tab-content ${activeTab === 'table' ? 'active' : ''}`}>
        <TournamentTable tournament={tournament} />
      </div>
      
      <div className={`tab-content ${activeTab === 'standings' ? 'active' : ''}`}>
        <Standings tournament={tournament} />
      </div>
      
      <div className={`tab-content ${activeTab === 'stats' ? 'active' : ''}`}>
        <Statistics tournament={tournament} />
      </div>
    </div>
  );
};

export default MainContent;
