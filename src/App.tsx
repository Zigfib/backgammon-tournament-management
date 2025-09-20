import React, { useState, useEffect } from "react";
import { Tournament } from "./types";
import Header from "./components/Header";
import TournamentSetup from "./components/TournamentSetup";
import PlayerSetup from "./components/PlayerSetup";
import MainContent from "./components/MainContent";

type AppState = "setup" | "playerSetup" | "tournament";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>("setup");
  const [tournament, setTournament] = useState<Tournament>({
    name: "",
    players: [],
    numRounds: 2,
    maxPoints: 11,
    matches: [],
    results: {},
    rankingSystem: "standard",
    scoreEntryMode: "player-entry",
    isAdmin: false,
    tournamentType: "rapid-swiss",
    swissTolerance: 1,
  });

  const handleGoToPlayerSetup = (numPlayers: number) => {
    setAppState("playerSetup");
  };

  const handleBackToSetup = () => {
    setAppState("setup");
  };

  const handleStartTournament = () => {
    setAppState("tournament");
  };

  // Update document title when tournament name changes
  useEffect(() => {
    if (tournament.name && tournament.name.trim()) {
      document.title = `${tournament.name} - Backgammon Tournament Manager`;
    } else {
      document.title = "Backgammon Tournament Manager";
    }
  }, [tournament.name]);

  return (
    <div className="container">
      <Header
        tournament={tournament}
        setTournament={setTournament}
        setAppState={setAppState}
      />

      {appState === "setup" && (
        <TournamentSetup
          tournament={tournament}
          setTournament={setTournament}
          onGoToPlayerSetup={handleGoToPlayerSetup}
        />
      )}

      {appState === "playerSetup" && (
        <PlayerSetup
          tournament={tournament}
          setTournament={setTournament}
          onBack={handleBackToSetup}
          onStartTournament={handleStartTournament}
        />
      )}

      {appState === "tournament" && (
        <MainContent tournament={tournament} setTournament={setTournament} />
      )}
    </div>
  );
};

export default App;
