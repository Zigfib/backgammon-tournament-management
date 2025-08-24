
import React, { useState } from 'react';
import { Tournament } from './types';
import Header from './components/Header';
import TournamentSetup from './components/TournamentSetup';
import PlayerSetup from './components/PlayerSetup';
import MainContent from './components/MainContent';

type AppState = 'setup' | 'playerSetup' | 'tournament';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('setup');
  const [tournament, setTournament] = useState<Tournament>({
    name: '',
    players: [],
    numRounds: 2,
    maxPoints: 11,
    matches: [],
    results: {},
    rankingSystem: 'standard',
    scoreEntryMode: 'player-entry',
    isAdmin: false
  });

  const handleGoToPlayerSetup = (numPlayers: number) => {
    setAppState('playerSetup');
  };

  const handleBackToSetup = () => {
    setAppState('setup');
  };

  const handleStartTournament = () => {
    setAppState('tournament');
  };

  return (
    <div className="container">
      <Header 
        tournament={tournament}
        setTournament={setTournament}
        setAppState={setAppState}
      />
      
      {appState === 'setup' && (
        <TournamentSetup 
          tournament={tournament}
          setTournament={setTournament}
          onGoToPlayerSetup={handleGoToPlayerSetup}
        />
      )}
      
      {appState === 'playerSetup' && (
        <PlayerSetup 
          tournament={tournament}
          setTournament={setTournament}
          onBack={handleBackToSetup}
          onStartTournament={handleStartTournament}
        />
      )}
      
      {appState === 'tournament' && (
        <MainContent 
          tournament={tournament}
          setTournament={setTournament}
        />
      )}
    </div>
  );
};

export default App;
