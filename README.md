
# 🎲 Backgammon Tournament Manager

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

For best results, export your tournament data regularly and keep JSON backups of important tournaments.
