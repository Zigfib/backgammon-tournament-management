import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
        
        <div style={{ marginRight: '40px' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>🎲 How to Use the Backgammon Tournament Manager</h1>
          
          <h2 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Starting a New Tournament</h2>
          <ol style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <li><strong>Tournament Setup</strong>:
              <ul style={{ marginTop: '5px' }}>
                <li>Enter a tournament name (optional but recommended)</li>
                <li>Set the number of players (3-32)</li>
                <li>Choose number of rounds (default: 2)</li>
                <li>Set maximum points per match (default: 11)</li>
                <li>Select ranking system (Standard or Hybrid)</li>
                <li>Choose score entry mode (Admin Only, Player Entry, Dual Confirm, or Open Access)</li>
              </ul>
            </li>
            <li><strong>Player Setup</strong>:
              <ul style={{ marginTop: '5px' }}>
                <li>Enter player names</li>
                <li>Set starting ELO ratings (default: 1500)</li>
                <li>Add contact information (optional)</li>
              </ul>
            </li>
            <li><strong>Start Tournament</strong>: Click "Start Tournament" to begin</li>
          </ol>

          <h2 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Score Entry Features</h2>
          <ul style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <li><strong>Submit Score System</strong>: Scores are entered and then deliberately submitted with a button</li>
            <li><strong>Smart Validation</strong>: Only valid backgammon scores are accepted (one player reaches maximum points)</li>
            <li><strong>Auto-Completion</strong>: When entering a score below maximum, clicking the opponent's field auto-fills the maximum score</li>
            <li><strong>Edit Capability</strong>: Previously submitted scores can be edited if needed</li>
          </ul>

          <h2 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Recording Match Results</h2>
          <ol style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <li>Navigate to the <strong>"Enter Match Results"</strong> tab</li>
            <li>Find the match you want to record</li>
            <li>Enter scores for both players:
              <ul style={{ marginTop: '5px' }}>
                <li>One score must be the tournament maximum (e.g., 5 points)</li>
                <li>The other score must be lower</li>
                <li><strong>Auto-completion</strong>: When you enter a lower score and click the other field, the maximum score is automatically filled</li>
              </ul>
            </li>
            <li>Click <strong>"Submit Score"</strong> to record the match
              <ul style={{ marginTop: '5px' }}>
                <li>Scores only appear in the tournament table after submission</li>
                <li>The button changes to <strong>"Edit Score"</strong> after submission</li>
                <li>Scores are validated and ELO ratings updated automatically</li>
              </ul>
            </li>
          </ol>

          <h2 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Tournament Management</h2>
          <ul style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <li><strong>Save Tournament</strong>: Click "💾 Save Tournament" to save locally in browser storage</li>
            <li><strong>Export Tournament</strong>: Click "⬇️ Export JSON" to download tournament data</li>
            <li><strong>Import Tournament</strong>: Click "⬆️ Import JSON" to load a previously exported tournament</li>
            <li><strong>Load Tournament</strong>: Click "📂 Load Tournament" to load the last saved tournament</li>
          </ul>

          <h2 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Ranking Systems</h2>
          <h3 style={{ color: '#34495e', marginTop: '20px', marginBottom: '10px' }}>Standard Ranking</h3>
          <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>Ranks players by:</p>
          <ol style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <li><strong>Total Points</strong> (3 points for win, 1 for loss)</li>
            <li><strong>Wins vs Same Points</strong> (head-to-head against tied players)</li>
            <li><strong>Buchholz Score</strong> (sum of all opponents' points)</li>
            <li><strong>Goal Difference</strong> (total point differential)</li>
          </ol>

          <h3 style={{ color: '#34495e', marginTop: '20px', marginBottom: '10px' }}>Hybrid Ranking</h3>
          <p style={{ lineHeight: '1.6', marginBottom: '15px' }}>Alternating system:</p>
          <ul style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <li><strong>Positions 1-2</strong>: Ranked by points + tiebreakers</li>
            <li><strong>Positions 3-4</strong>: Ranked by ELO improvement + tiebreakers</li>
            <li><strong>Pattern continues</strong>: 5-6 by points, 7-8 by ELO, etc.</li>
          </ul>

          <h2 style={{ color: '#2c3e50', marginTop: '30px', marginBottom: '15px' }}>Troubleshooting</h2>
          <ul style={{ lineHeight: '1.6', marginBottom: '20px' }}>
            <li><strong>Submit Score button not active?</strong>
              <ul style={{ marginTop: '5px' }}>
                <li>Ensure both scores are entered as valid numbers</li>
                <li>One score must equal the tournament maximum points</li>
                <li>The other score must be lower than the maximum</li>
                <li>Zero-zero (0-0) scores are not allowed</li>
              </ul>
            </li>
            <li><strong>Rankings look wrong?</strong>
              <ul style={{ marginTop: '5px' }}>
                <li>Verify you understand the selected ranking system</li>
                <li>Check that all matches have been properly recorded</li>
              </ul>
            </li>
          </ul>

          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '8px', 
            marginTop: '30px',
            borderLeft: '4px solid #2196f3'
          }}>
            <h3 style={{ color: '#1976d2', marginTop: '0', marginBottom: '10px' }}>💡 Tips for Tournament Directors</h3>
            <ul style={{ lineHeight: '1.6', margin: '0' }}>
              <li>Set appropriate ELO starting ratings based on player skill levels</li>
              <li>Choose the ranking system that best fits your tournament format</li>
              <li>Regularly export tournament data as backup</li>
              <li>Monitor the Statistics tab to track progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;