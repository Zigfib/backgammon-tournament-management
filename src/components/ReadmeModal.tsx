import React from 'react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const readmeContent = `# 🎲 Backgammon Tournament Manager

A comprehensive web application for managing round-robin backgammon tournaments with ELO ratings, built with React and TypeScript.

## Features

- **Tournament Management**: Create and manage tournaments with custom names
- **Player Management**: Add 3-32 players with customizable starting ELO ratings
- **Match Tracking**: Record match results with automatic ELO calculations
- **Dual Ranking Systems**: 
  - Standard: Points-based ranking with tiebreakers
  - Hybrid: Alternating points and ELO improvement rankings
- **Data Persistence**: Save/load tournaments locally and export/import JSON files
- **Real-time Statistics**: Live tournament standings and player statistics

## How to Use

### 1. Starting a New Tournament

1. **Tournament Setup**:
   - Enter a tournament name (optional but recommended)
   - Set the number of players (3-32)
   - Choose number of rounds (default: 2)
   - Set maximum points per match (default: 11)
   - Select ranking system (Standard or Hybrid)
   - Choose score entry mode:
     - **Admin Only**: Only admins can enter scores
     - **Player Entry**: Players can enter their own scores
     - **Dual Confirm**: Both players must confirm scores
     - **Open Access**: Anyone can enter scores

2. **Player Setup**:
   - Enter player names
   - Set starting ELO ratings (default: 1500)
   - Add contact information (optional)

3. **Start Tournament**: Click "Start Tournament" to begin

### 2. During the Tournament

#### Recording Match Results
- Navigate to the **Matches** tab
- Find the match you want to record
- Enter scores for both players
- Scores are automatically validated and ELO ratings updated

#### Viewing Standings
- Check the **Standings** tab for current rankings
- Rankings update automatically as matches are completed
- See detailed tiebreaker information

#### Tournament Statistics
- View the **Statistics** tab for:
  - Match completion progress
  - Player performance metrics
  - ELO rating changes

### 3. Saving and Loading

#### Save Tournament
- Click **💾 Save Tournament** to save locally in browser storage
- Data persists between browser sessions

#### Export Tournament
- Click **⬇️ Export JSON** to download tournament data
- File is named automatically using tournament name and date
- Can be shared with others or used as backup

#### Import Tournament
- Click **⬆️ Import JSON** to load a previously exported tournament
- Select the JSON file from your device
- All tournament data will be restored

#### Load Tournament
- Click **📂 Load Tournament** to load the last saved tournament from browser storage

### 4. Ranking Systems Explained

#### Standard Ranking
Ranks players by:
1. **Total Points** (3 points for win, 1 for loss)
2. **Wins vs Same Points** (head-to-head against tied players)
3. **Buchholz Score** (sum of all opponents' points)
4. **Goal Difference** (total point differential)

#### Hybrid Ranking
Alternating system:
- **Positions 1-2**: Ranked by points + tiebreakers
- **Positions 3-4**: Ranked by ELO improvement + tiebreakers
- **Pattern continues**: 5-6 by points, 7-8 by ELO, etc.

### 5. Score Entry Modes

- **Admin Only**: Only users in admin mode can enter scores
- **Player Entry**: Any player can enter scores for matches they're involved in
- **Dual Confirm**: Both players must enter matching scores for confirmation
- **Open Access**: Anyone can enter any match scores

### 6. Tips for Tournament Directors

1. **Before Starting**:
   - Set appropriate ELO starting ratings based on player skill levels
   - Choose the ranking system that best fits your tournament format
   - Decide on the score entry mode based on trust level and supervision

2. **During Tournament**:
   - Regularly export tournament data as backup
   - Monitor the Statistics tab to track progress
   - Use the Standings tab to announce current positions

3. **After Tournament**:
   - Export final results as JSON for records
   - Share the tournament file with participants
   - Review ELO changes for future tournaments

## Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No installation required - runs entirely in the browser

## Browser Storage

- Tournament data is saved locally in your browser
- Data persists between sessions
- Export tournaments as JSON files for permanent storage and sharing

## Troubleshooting

**Tournament not loading?**
- Check if you have a saved tournament in browser storage
- Try importing a previously exported JSON file

**Matches not saving?**
- Ensure both scores are entered as valid numbers
- Check that you have permission based on the score entry mode

**Rankings look wrong?**
- Verify you understand the selected ranking system
- Check that all matches have been properly recorded

**Data lost?**
- Browser storage can be cleared by browser settings
- Always export important tournaments as JSON files

## Support

This tournament manager handles all standard round-robin tournament scenarios and automatically manages:
- Match generation (all players play each other the specified number of rounds)
- ELO rating calculations with margin of victory considerations
- Comprehensive tiebreaker systems
- Data persistence and sharing capabilities

For best results, export your tournament data regularly and keep JSON backups of important tournaments.`;

  // Helper function to format text with bold markdown
  const formatText = (text: string): JSX.Element[] => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Convert markdown-like content to JSX
  const renderContent = () => {
    const lines = readmeContent.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} style={{ color: '#2c3e50', marginTop: '20px', marginBottom: '10px' }}>
            {formatText(line.substring(2))}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} style={{ color: '#34495e', marginTop: '20px', marginBottom: '10px', fontSize: '20px' }}>
            {formatText(line.substring(3))}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} style={{ color: '#7f8c8d', marginTop: '15px', marginBottom: '8px', fontSize: '16px' }}>
            {formatText(line.substring(4))}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={key++} style={{ color: '#95a5a6', marginTop: '12px', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>
            {formatText(line.substring(5))}
          </h4>
        );
      } else if (line.startsWith('- ')) {
        const listItems = [];
        let j = i;
        while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('  - ') || lines[j].trim() === '')) {
          const item = lines[j];
          if (item.trim() === '') {
            j++;
            continue;
          }
          if (item.startsWith('  - ')) {
            // Nested list item
            listItems.push(
              <li key={key++} style={{ marginLeft: '20px' }}>
                {formatText(item.substring(4))}
              </li>
            );
          } else if (item.startsWith('- ')) {
            // Regular list item
            listItems.push(
              <li key={key++}>
                {formatText(item.substring(2))}
              </li>
            );
          }
          j++;
        }
        elements.push(<ul key={key++} style={{ marginBottom: '10px', paddingLeft: '20px' }}>{listItems}</ul>);
        i = j - 1;
      } else if (line.match(/^\d+\. /)) {
        const listItems = [];
        let j = i;
        while (j < lines.length && (lines[j].match(/^\d+\. /) || lines[j].trim() === '')) {
          const item = lines[j];
          if (item.trim() === '') {
            j++;
            continue;
          }
          const content = item.replace(/^\d+\. /, '');
          listItems.push(
            <li key={key++}>
              {formatText(content)}
            </li>
          );
          j++;
        }
        elements.push(<ol key={key++} style={{ marginBottom: '10px', paddingLeft: '20px' }}>{listItems}</ol>);
        i = j - 1;
      } else if (line.trim() === '') {
        // Only add break if it's not already handled by list processing
        if (i > 0 && !lines[i-1].startsWith('- ') && !lines[i-1].match(/^\d+\. /)) {
          elements.push(<div key={key++} style={{ height: '10px' }} />);
        }
      } else {
        // Regular paragraph
        if (line.trim()) {
          elements.push(
            <p key={key++} style={{ marginBottom: '8px', lineHeight: '1.6' }}>
              {formatText(line)}
            </p>
          );
        }
      }
    }

    return elements;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        maxWidth: '900px',
        maxHeight: '80vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '2px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2c3e50, #3498db)',
          color: 'white'
        }}>
          <h2 style={{ margin: 0 }}>📖 User Guide</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        <div style={{
          padding: '20px',
          overflow: 'auto',
          flex: 1,
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ReadmeModal;