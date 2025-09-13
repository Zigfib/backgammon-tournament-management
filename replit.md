# Overview

The Backgammon Tournament Manager is a comprehensive web application built with React and TypeScript for managing backgammon tournaments. It supports two tournament formats: traditional round-robin tournaments where every player plays every other player, and rapid Swiss tournaments with real-time pairing as matches finish. The application features ELO rating calculations, multiple ranking systems, score entry validation, and data persistence through local storage and JSON export/import.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern React features
- **State Management**: React hooks (useState, useEffect) for local component state management with centralized tournament state passed down through props
- **Component Structure**: Modular component architecture with clear separation of concerns:
  - Setup components for tournament configuration
  - Match entry and tournament table components for gameplay
  - Statistics and standings components for data visualization
  - Modal components for help and readme documentation
- **Styling**: CSS-in-JS with inline styles for component-specific styling and global CSS for layout and theming
- **Build System**: Create React App (react-scripts) for development server, building, and testing

## Data Storage Solutions
- **Primary Storage**: Browser localStorage for automatic tournament persistence
- **Data Export/Import**: JSON file export/import functionality for tournament backup and sharing
- **Auto-save**: Automatic background saving whenever tournament state changes
- **Data Validation**: Client-side validation for player names, ELO ratings, and match scores

## Tournament Management System
- **Tournament Types**: Support for round-robin and rapid Swiss tournament formats
- **Match Generation**: Algorithmic generation of match schedules based on tournament type
- **Score Validation**: Smart validation ensuring only valid backgammon scores are accepted
- **ELO Calculations**: Real-time ELO rating updates using standard chess/backgammon K-factor with margin of victory adjustments

## Ranking and Statistics Engine
- **Dual Ranking Systems**: 
  - Standard ranking based on points with tiebreakers
  - Hybrid ranking alternating between points-based and ELO improvement rankings
- **Tiebreaker Logic**: Multi-level tiebreakers including head-to-head records, Buchholz scores, and goal differences
- **Real-time Statistics**: Live calculation of player statistics, completion percentages, and tournament standings

## Swiss Tournament Pairing System
- **Pairing Algorithm**: Sophisticated Swiss pairing engine with permutation-based future viability checking
- **Player Status Management**: Real-time tracking of player availability (available, playing, finished)
- **Dynamic Round Management**: Flexible round progression based on match completion rather than fixed schedules
- **Match Score Display**: Round-based column layout showing all matches organized by round for easy progress tracking and opponent history visibility
- **Swiss Configuration**: Swiss tournaments limited to 3-5 rounds for optimal layout and user experience

# External Dependencies

## Core React Ecosystem
- **React**: Frontend framework for building the user interface
- **React-DOM**: DOM rendering for React components
- **TypeScript**: Static type checking and enhanced development experience

## Development and Build Tools
- **React Scripts**: Create React App toolchain for development server, building, and testing
- **Node.js**: Runtime environment for build tools and development server
- **NPX Serve**: Static file server for serving built application in production

## Browser APIs
- **localStorage**: Browser storage API for tournament data persistence
- **File API**: Browser file handling for JSON export/import functionality
- **URL/Blob APIs**: Client-side file generation for tournament data export

## Distribution and Deployment
- **NPM**: Package distribution system for easy installation and deployment
- **Static File Serving**: Built application served as static files through npx serve
- **Cross-platform Scripts**: Installation scripts for Windows (.bat) and Unix-based systems (.sh)