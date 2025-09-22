
# 🎲 Backgammon Tournament Manager

A comprehensive web application for managing round-robin backgammon tournaments with ELO ratings, built with React and TypeScript.

## Features

- **Tournament Management**: Create and manage tournaments with custom names
- **Player Management**: Add 3-32 players with customizable starting ELO ratings
- **Match Tracking**: Record match results with automatic ELO calculations
- **Integrated Dashboard**: Streamlined round-robin interface with all features in one view
- **Player Match Filter**: Players can filter to see only their own matches
- **Dual Ranking Systems**: 
  - Standard: Points-based ranking with tiebreakers
  - Hybrid: Alternating points and ELO improvement rankings
- **ELO Change Tracking**: Real-time display of ELO gains and losses
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

#### Round-Robin Dashboard (Recommended)
Round-robin tournaments feature a streamlined **Dashboard** interface that combines all essential features:

- **Tournament Progress**: View completion percentage, active matches, and overall stats
- **Integrated Match Table**: All matches with inline score entry
- **Player Filter**: Use the "Find Matches" dropdown to show only specific player's matches
- **Live Standings**: Real-time rankings with ELO change tracking
- **One-Screen Management**: Everything needed without switching tabs

#### Score Entry Features
- **Submit Score System**: Scores are entered and then deliberately submitted with a button
- **Smart Validation**: Only valid backgammon scores are accepted (one player reaches maximum points)
- **Auto-Completion**: When entering a score below maximum, clicking the opponent's field auto-fills the maximum score
- **Edit Capability**: Previously submitted scores can be edited if needed
- **Inline Entry**: Click "Enter Score" on any match to input results directly

#### Recording Match Results (Dashboard Method - Recommended)
1. **Find Your Match**: Use the player filter dropdown to show only your matches
2. **Enter Scores**: Click "Enter Score" button next to any match
3. **Input Results**: Enter scores for both players:
   - One score must be the tournament maximum (e.g., 11 points)
   - The other score must be lower
   - **Auto-completion**: When you enter a lower score and click the other field, the maximum score is automatically filled
4. **Submit**: Click "Submit" to record the match
   - Scores are validated and ELO ratings updated automatically
   - Rankings update immediately in the standings below

#### Alternative: Traditional Tab Interface
For other tournament types, use the separate tabs:
- **Enter Match Results**: Dedicated score entry interface
- **Standings**: Current rankings with tiebreaker details
- **Tournament Table**: Complete player statistics grid
- **Statistics**: Match completion and performance metrics

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
   - Use the integrated Dashboard for efficient round-robin management
   - Regularly export tournament data as backup
   - Encourage players to use the player filter to find their matches quickly
   - Monitor completion progress in the dashboard header

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

**Submit Score button not active?**
- Ensure both scores are entered as valid numbers
- One score must equal the tournament maximum points
- The other score must be lower than the maximum
- Zero-zero (0-0) scores are not allowed
- Check that you have permission based on the score entry mode

**Rankings look wrong?**
- Verify you understand the selected ranking system (check the explanation in the dashboard)
- Check that all matches have been properly recorded
- Note that ELO changes are displayed with color coding (green = gain, red = loss)

**Data lost?**
- Browser storage can be cleared by browser settings
- Always export important tournaments as JSON files

## Dashboard Interface Features

### Round-Robin Dashboard
The integrated dashboard provides:
- **Tournament Progress Bar**: Visual completion tracking
- **Player Match Filter**: Dropdown to show specific player's matches
- **Inline Score Entry**: Direct score input without tab switching
- **Real-time Standings**: Live rankings with ELO change indicators
- **Color-Coded ELO Changes**: Green for gains, red for losses, gray for no change

### Player Experience
- Players can easily find their matches using the filter dropdown
- Scores can be entered and edited directly in the match table
- Immediate feedback on ELO changes after each match
- Clean, distraction-free interface with all needed information

## Support

This tournament manager handles all standard round-robin tournament scenarios and automatically manages:
- Match generation (all players play each other the specified number of rounds)
- ELO rating calculations with margin of victory considerations
- Comprehensive tiebreaker systems
- Integrated dashboard interface for streamlined tournament management
- Data persistence and sharing capabilities

For best results, use the Dashboard interface for round-robin tournaments, export your tournament data regularly, and keep JSON backups of important tournaments.
