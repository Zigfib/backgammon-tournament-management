import React from "react";
import { Tournament, Player, Match } from "../types";
import { generateSwissPairings, getCurrentRound } from "../utils/tournament";

interface SwissDashboardProps {
  tournament: Tournament;
  setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

interface PlayerStatus {
  player: Player;
  status: "playing" | "available" | "finished";
  currentMatch?: Match;
}

const SwissDashboard: React.FC<SwissDashboardProps> = ({
  tournament,
  setTournament,
}) => {
  // Get current player statuses
  const getPlayerStatuses = (): PlayerStatus[] => {
    const activeMatches = tournament.matches.filter((m) => !m.completed);
    const playersInActiveMatches = new Set<number>();

    // Track players currently playing
    activeMatches.forEach((match) => {
      playersInActiveMatches.add(match.player1);
      playersInActiveMatches.add(match.player2);
    });

    return tournament.players.map((player) => {
      // Find if player is in an active match
      const currentMatch = activeMatches.find(
        (m) => m.player1 === player.id || m.player2 === player.id
      );

      if (currentMatch) {
        return { player, status: "playing", currentMatch };
      }

      // Check if player has completed all rounds
      const playerMatches = tournament.matches.filter(
        (m) =>
          (m.player1 === player.id || m.player2 === player.id) && m.completed
      );

      if (playerMatches.length >= tournament.numRounds) {
        return { player, status: "finished" };
      }

      return { player, status: "available" };
    });
  };

  const playerStatuses = getPlayerStatuses();
  const playingPlayers = playerStatuses.filter((ps) => ps.status === "playing");
  const availablePlayers = playerStatuses.filter(
    (ps) => ps.status === "available"
  );
  const finishedPlayers = playerStatuses.filter(
    (ps) => ps.status === "finished"
  );
  const currentRound = getCurrentRound(tournament);

  // Handle generating new pairings
  const handleGeneratePairings = () => {
    if (availablePlayers.length < 2) {
      alert("Need at least 2 available players to generate pairings");
      return;
    }

    const updatedTournament = generateSwissPairings(tournament);
    setTournament(updatedTournament);
  };

  // Check if we can generate new pairings
  const canGeneratePairings = availablePlayers.length >= 2;

  return (
    <div className="swiss-dashboard">
      <div style={{ marginBottom: "20px" }}>
        <h2>Swiss Tournament Dashboard</h2>
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "5px",
          }}
        >
          <strong>
            Round {currentRound} of {tournament.numRounds}
          </strong>
          <span style={{ marginLeft: "20px" }}>
            Tolerance: ±{tournament.swissTolerance} points
          </span>
        </div>
      </div>

      {/* Generate Pairings Section */}
      {availablePlayers.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handleGeneratePairings}
            disabled={!canGeneratePairings}
            style={{
              padding: "10px 20px",
              backgroundColor: canGeneratePairings ? "#4CAF50" : "#cccccc",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: canGeneratePairings ? "pointer" : "not-allowed",
            }}
          >
            Generate New Pairings ({availablePlayers.length} available)
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Currently Playing */}
        <div className="status-section">
          <h3 style={{ color: "#ff6b6b", marginBottom: "10px" }}>
            Currently Playing ({playingPlayers.length})
          </h3>
          <div
            style={{
              backgroundColor: "#fff5f5",
              padding: "15px",
              borderRadius: "5px",
              border: "1px solid #ffcccb",
            }}
          >
            {playingPlayers.length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                No matches in progress
              </p>
            ) : (
              playingPlayers.map(({ player, currentMatch }) => (
                <div
                  key={player.id}
                  style={{
                    marginBottom: "10px",
                    padding: "8px",
                    backgroundColor: "white",
                    borderRadius: "3px",
                  }}
                >
                  <strong>{player.name}</strong> ({player.points} pts)
                  {currentMatch && (
                    <div style={{ fontSize: "0.9em", color: "#666" }}>
                      vs{" "}
                      {
                        tournament.players.find(
                          (p) =>
                            p.id ===
                            (currentMatch.player1 === player.id
                              ? currentMatch.player2
                              : currentMatch.player1)
                        )?.name
                      }{" "}
                      - Round {currentMatch.round}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available for Pairing */}
        <div className="status-section">
          <h3 style={{ color: "#4CAF50", marginBottom: "10px" }}>
            Available for Pairing ({availablePlayers.length})
          </h3>
          <div
            style={{
              backgroundColor: "#f5fff5",
              padding: "15px",
              borderRadius: "5px",
              border: "1px solid #ccffcc",
            }}
          >
            {availablePlayers.length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                No players waiting
              </p>
            ) : (
              <div>
                {availablePlayers.map(({ player }) => (
                  <div
                    key={player.id}
                    style={{
                      marginBottom: "8px",
                      padding: "8px",
                      backgroundColor: "white",
                      borderRadius: "3px",
                    }}
                  >
                    <strong>{player.name}</strong> ({player.points} pts)
                    <div style={{ fontSize: "0.9em", color: "#666" }}>
                      ELO: {player.currentElo}
                    </div>
                  </div>
                ))}

                {availablePlayers.length >= 2 && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "10px",
                      backgroundColor: "#e8f5e8",
                      borderRadius: "3px",
                    }}
                  >
                    <strong>Proposed Pairings:</strong>
                    <div style={{ marginTop: "5px", fontSize: "0.9em" }}>
                      {/* Group by points for pairing preview */}
                      {(() => {
                        const byPoints = availablePlayers.reduce((acc, ps) => {
                          const points = ps.player.points;
                          if (!acc[points]) acc[points] = [];
                          acc[points].push(ps.player);
                          return acc;
                        }, {} as Record<number, Player[]>);

                        return Object.entries(byPoints)
                          .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                          .map(([points, players]) => (
                            <div key={points} style={{ marginBottom: "5px" }}>
                              <span style={{ fontWeight: "bold" }}>
                                {points} pts:
                              </span>{" "}
                              {players.map((p) => p.name).join(" vs ")}
                            </div>
                          ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tournament Complete */}
        {finishedPlayers.length > 0 && (
          <div className="status-section">
            <h3 style={{ color: "#666", marginBottom: "10px" }}>
              Tournament Complete ({finishedPlayers.length})
            </h3>
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            >
              {finishedPlayers.map(({ player }) => (
                <div
                  key={player.id}
                  style={{
                    marginBottom: "8px",
                    padding: "8px",
                    backgroundColor: "white",
                    borderRadius: "3px",
                  }}
                >
                  <strong>{player.name}</strong> ({player.points} pts)
                  <div style={{ fontSize: "0.9em", color: "#666" }}>
                    Final ELO: {player.currentElo} (
                    {player.currentElo >= player.startingElo ? "+" : ""}
                    {player.currentElo - player.startingElo})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tournament Progress */}
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#f0f8ff",
          borderRadius: "5px",
          border: "1px solid #add8e6",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>Tournament Progress</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            <strong>Completed Matches:</strong>
            <br />
            {tournament.matches.filter((m) => m.completed).length} /{" "}
            {tournament.matches.length}
          </div>
          <div>
            <strong>Players Finished:</strong>
            <br />
            {finishedPlayers.length} / {tournament.players.length}
          </div>
          <div>
            <strong>Average Points:</strong>
            <br />
            {(
              tournament.players.reduce((sum, p) => sum + p.points, 0) /
              tournament.players.length
            ).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwissDashboard;
