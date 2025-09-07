import React, { useState, useEffect } from 'react';
import { Tournament, SwissTournament } from '../types';
import MatchEntry from './MatchEntry';
import TournamentTable from './TournamentTable';
import Standings from './Standings';
import Statistics from './Statistics';
import SwissDashboard from './SwissDashboard';
import { calculateStats } from '../utils/tournament';

interface MainContentProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const MainContent: React.FC<MainContentProps> = ({ tournament, setTournament }) => {
  const isSwiss = tournament.tournamentType === 'rapid-swiss';
  const [activeTab, setActiveTab] = useState<'matches' | 'table' | 'standings' | 'stats' | 'swiss'>(() => {
    return isSwiss ? 'swiss' : 'matches';
  });

  // Update stats whenever tournament changes
  useEffect(() => {
    setTournament(prev => ({
      ...prev,
      players: calculateStats(prev.players, prev.matches)
    }));
  }, [tournament.matches, setTournament]);

  // Check if matches exist, if not, show a message
  const hasMatches = tournament.matches && tournament.matches.length > 0;

  return (
    <div className="main-content">
      <div className="tabs">
        {isSwiss && (
          <button
            className={`tab ${activeTab === 'swiss' ? 'active' : ''}`}
            onClick={() => setActiveTab('swiss')}
          >
            🏆 Swiss Dashboard
          </button>
        )}
        <button
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          {isSwiss ? 'Match History' : 'Match Entry'}
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

      {isSwiss && (
        <div className={`tab-content ${activeTab === 'swiss' ? 'active' : ''}`}>
          <SwissDashboard 
            tournament={tournament as SwissTournament} 
            setTournament={setTournament as React.Dispatch<React.SetStateAction<SwissTournament>>} 
          />
        </div>
      )}
      
      <div className={`tab-content ${activeTab === 'matches' ? 'active' : ''}`}>
        {hasMatches || isSwiss ? (
          <MatchEntry tournament={tournament} setTournament={setTournament} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>No Matches Available</h2>
            <p>Tournament matches haven't been generated yet. Please make sure you've set up players and started the tournament properly.</p>
          </div>
        )}
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