# Overview

The Backgammon Tournament Manager is a comprehensive web application built with React and TypeScript for managing round-robin backgammon tournaments. The application features ELO rating calculations, multiple ranking systems, and complete tournament management capabilities. It supports 3-32 players, customizable tournament settings, and provides real-time match tracking with automatic statistics calculation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Create React App for build tooling and project structure.

**Component Structure**: Modular component design with clear separation of concerns:
- `App.tsx` serves as the main application state manager with three distinct phases: setup, player setup, and tournament execution
- Component hierarchy includes Header, TournamentSetup, PlayerSetup, and MainContent with specialized sub-components
- State management uses React hooks (useState, useEffect) for local state management without external state libraries

**UI Design**: CSS-based styling with gradient backgrounds, responsive grid layouts, and tabbed navigation for different tournament views.

## Data Management

**Local Storage**: Client-side persistence using browser localStorage for tournament data retention between sessions.

**File Operations**: Import/export functionality for tournament data using JSON format, enabling tournament backup and sharing capabilities.

**Data Flow**: Unidirectional data flow from parent components down to children, with callback functions for state updates.

## Core Business Logic

**Tournament System**: Round-robin tournament generation supporting multiple rounds and customizable point systems (default 11 points per match).

**ELO Rating System**: Mathematical ELO calculation with K-factor of 32, margin of victory adjustments, and real-time rating updates after each match.

**Ranking Systems**: 
- Standard ranking based on points with sophisticated tiebreaker hierarchy
- Hybrid ranking alternating between points-based and ELO improvement-based positions

**Match Management**: Complete match lifecycle from generation through score entry with validation and automatic statistics calculation.

## Score Entry Modes

**Multiple Access Levels**: Four distinct score entry modes (admin-only, player-entry, dual-confirm, open-access) to accommodate different tournament management styles.

**Validation System**: Smart score validation ensuring only valid backgammon results are accepted, with auto-completion features for user convenience.

# External Dependencies

**Core Framework Dependencies**:
- React 18.2.0 and React DOM for UI framework
- TypeScript 4.9.0 for type safety and development experience
- @types packages for TypeScript definitions

**Build and Development Tools**:
- React Scripts 5.0.1 for build tooling, development server, and testing framework
- Create React App ecosystem for project configuration and build optimization

**Runtime Environment**:
- Node.js runtime requirement for development and build processes
- NPX serve for production build serving via the included binary launcher

**Browser APIs**:
- Local Storage API for client-side data persistence
- File API for import/export functionality
- Standard DOM APIs for user interface interactions

**No External Services**: The application operates entirely client-side with no backend services, databases, or external API dependencies required.