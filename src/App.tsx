
import React, { useState, useEffect } from 'react';
import { Tournament } from './types';
import Header from './components/Header';
import TournamentSetup from './components/TournamentSetup';
import PlayerSetup from './components/PlayerSetup';
import MainContent from './components/MainContent';
import { autoLoadTournament, autoSaveTournament } from './utils/storage';

type AppState = 'setup' | 'playerSetup' | 'tournament';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    // Auto-detect app state based on loaded tournament
    const savedTournament = autoLoadTournament();
    if (savedTournament && savedTournament.players && savedTournament.players.length > 0) {
      return 'tournament'; // Jump directly to tournament if we have saved data
    }
    return 'setup';
  });
  const [tournament, setTournament] = useState<Tournament>(() => {
    // Try to load saved tournament on app start
    const savedTournament = autoLoadTournament();
    if (savedTournament && savedTournament.players && savedTournament.players.length > 0) {
      return savedTournament;
    }
    // Default tournament if no saved data
    return {
      name: '',
      players: [],
      numRounds: 2,
      maxPoints: 11,
      matches: [],
      results: {},
      rankingSystem: 'standard',
      scoreEntryMode: 'player-entry',
      isAdmin: false
    };
  });

  // Auto-save tournament whenever it changes (but only if it has players)
  useEffect(() => {
    if (tournament.players && tournament.players.length > 0) {
      autoSaveTournament(tournament);
    }
  }, [tournament]);

  // One-time migration to fix existing completed matches
  useEffect(() => {
    if (tournament.matches && tournament.matches.length > 0) {
      const needsMigration = tournament.matches.some(match => 
        match.completed && 'isCurrentlyPlaying' in match && (match as any).isCurrentlyPlaying === true
      );
      
      if (needsMigration) {
        console.log('Migrating tournament data to fix match states...');
        const migratedTournament = {
          ...tournament,
          matches: tournament.matches.map(match => {
            if (match.completed && 'isCurrentlyPlaying' in match) {
              return { ...match, isCurrentlyPlaying: false };
            }
            return match;
          })
        };
        setTournament(migratedTournament);
      }
    }
  }, []); // Only run once on mount

  const handleGoToPlayerSetup = (numPlayers: number) => {
    setAppState('playerSetup');
  };

  const handleBackToSetup = () => {
    setAppState('setup');
  };

  const handleStartTournament = () => {
    setAppState('tournament');
  };

  // Update document title when tournament name changes
  useEffect(() => {
    if (tournament.name && tournament.name.trim()) {
      document.title = `${tournament.name} - Backgammon Tournament Manager`;
    } else {
      document.title = 'Backgammon Tournament Manager';
    }
  }, [tournament.name]);

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
