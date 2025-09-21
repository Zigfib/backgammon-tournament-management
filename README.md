
# 🎲 Backgammon Tournament Manager

A comprehensive web application for managing both round-robin and Swiss backgammon tournaments with ELO ratings, built with React and TypeScript.

## Features

### Tournament Types
- **Round-Robin Tournaments**: Traditional format where every player plays every other player
- **Swiss Tournaments**: Advanced pairing system with intelligent matching and tiebreakers

### Core Features
- **Tournament Management**: Create and manage tournaments with custom names
- **Player Management**: Add 3-32 players with customizable starting ELO ratings
- **Match Tracking**: Record match results with automatic ELO calculations
- **Dual Ranking Systems**: 
  - Standard: Points-based ranking with tiebreakers
  - Hybrid: Alternating points and ELO improvement rankings
- **Data Persistence**: Save/load tournaments locally and export/import JSON files
- **Real-time Statistics**: Live tournament standings and player statistics

### Swiss Tournament Features
- **Safe Pairing Algorithm**: Intelligent pairing that ensures all players can eventually be paired
- **Swiss Tiebreakers**: Proper Head-to-Head (TB1) and Buchholz (TB2) calculations
- **Manual Pairing**: One-pair-at-a-time manual control with player information display
- **Tolerance System**: Customizable point tolerance for balanced pairings
- **4-Section Dashboard**: Tournament progress, proposed pairings, playing pairs, and standings

## How to Use

### 1. Starting a New Tournament

1. **Tournament Setup**:
   - Enter a tournament name (optional but recommended)
   - **Choose Tournament Type**:
     - **Round-Robin**: Every player plays every other player (traditional format)
     - **Swiss**: Advanced pairing system with intelligent matching
   - Set the number of players (3-32)
   - Choose number of rounds (default: 2 for round-robin, calculated for Swiss)
   - Set maximum points per match (default: 11)
   - **Swiss-specific**: Set tolerance level (±1 to ±3 points for balanced pairings)
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

#### Round-Robin Tournaments

**Score Entry Features**
- **Submit Score System**: Scores are entered and then deliberately submitted with a button
- **Smart Validation**: Only valid backgammon scores are accepted (one player reaches maximum points)
- **Auto-Completion**: When entering a score below maximum, clicking the opponent's field auto-fills the maximum score
- **Edit Capability**: Previously submitted scores can be edited if needed

**Recording Match Results**
- Navigate to the **Enter Match Results** tab
- Find the match you want to record
- Enter scores for both players and click **Submit Score**
- Scores are validated and ELO ratings updated automatically

#### Swiss Tournaments

**Swiss Dashboard Overview**
The Swiss tournament interface features a 4-section dashboard:

1. **Tournament Progress**: Shows current round, completed matches, active matches, and available players
2. **Proposed Pairings**: Displays suggested pairings based on the safe pairing algorithm
3. **Playing Pairs**: Shows currently active matches grouped by round
4. **Player Standings**: Complete standings with proper Swiss tiebreakers

**Pairing Methods**

**Automatic Pairing**:
- Click **"Apply Proposed Pairings"** to use the intelligent pairing algorithm
- The system ensures all players can eventually be paired regardless of current match outcomes
- Pairings respect the tolerance setting for balanced competition

**Manual Pairing**:
- Click **"Manual Pair"** when 2+ players are available
- Select Player 1 from dropdown (shows rounds played and wins)
- Select Player 2 from filtered dropdown (excludes Player 1)
- View pairing information showing head-to-head history
- Submit or cancel the manual pairing

**Score Entry in Swiss**:
- Click on any active match in the "Playing Pairs" section
- Enter scores for both players
- Scores are validated and standings automatically updated with proper tiebreakers

#### Viewing Standings
- Check the **Standings** tab for current rankings
- Rankings update automatically as matches are completed
- **Swiss tournaments** show proper tiebreakers: Head-to-Head (TB1) and Buchholz (TB2)
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

### 4. Tournament Systems Explained

#### Swiss Tournament System
Swiss tournaments use an advanced pairing algorithm that:
- **Pairs players with similar scores** within the tolerance range
- **Avoids repeat pairings** when possible
- **Uses scenario enumeration** to ensure all players can eventually be paired
- **Provides safe pairings** only when all outcomes allow future pairing

**Swiss Tiebreakers** (in order):
1. **Points** (3 for win, 1 for loss)
2. **Head-to-Head (TB1)**: Direct results between tied players
3. **Buchholz (TB2)**: Sum of all opponents' final points
4. **Goal Difference**: Total point differential

#### Round-Robin System
Traditional format where every player plays every other player the specified number of rounds.

#### Ranking Systems

**Standard Ranking**
Ranks players by:
1. **Total Points** (3 points for win, 1 for loss)
2. **Wins vs Same Points** (head-to-head against tied players)
3. **Buchholz Score** (sum of all opponents' points)
4. **Goal Difference** (total point differential)

**Hybrid Ranking**
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

#### Before Starting

**Round-Robin Tournaments**:
- Set appropriate ELO starting ratings based on player skill levels
- Choose the ranking system that best fits your tournament format
- Decide on the score entry mode based on trust level and supervision

**Swiss Tournaments**:
- Set tolerance level based on player skill spread (±1 for even field, ±3 for mixed levels)
- Consider the total number of rounds needed for fair results
- Plan for manual pairing if specific matchups are desired

#### During Tournament

**General Management**:
- Regularly export tournament data as backup
- Monitor the Statistics tab to track progress
- Use the Standings tab to announce current positions

**Swiss-Specific**:
- Use **Apply Proposed Pairings** for most rounds to ensure fair matchups
- Use **Manual Pair** for specific matchups or when few players remain
- Monitor the tolerance to ensure balanced competition
- Check that the safe pairing algorithm is working (no pairings = potential issues)

#### After Tournament
- Export final results as JSON for records
- Share the tournament file with participants
- Review ELO changes for future tournaments
- **Swiss tournaments**: Review tiebreaker effectiveness for your player pool

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