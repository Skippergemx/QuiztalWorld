# QuiztalWorld Game Systems Documentation

This document provides a comprehensive overview of the QuiztalWorld game systems for AI agents working with the codebase.

## 1. Project Overview

QuiztalWorld is a blockchain-integrated, interactive 2D game built with Phaser, Vite, and TypeScript. It combines educational quizzes with NFT and Web3 functionalities to create an engaging learning experience about blockchain technology.

### Key Features:
- Interactive game world with character selection and exploration
- Quiz-based learning and reward system
- Wallet verification and NFT display
- Mobile controls and UI/UX optimized for both desktop and mobile
- Firebase integration for backend services

## 2. System Architecture

### Architecture Overview
- **Frontend Framework:** Vite + TypeScript
- **Game Engine:** Phaser v3.88.2
- **Blockchain Integration:** Ethers.js and Web3Modal
- **Backend:** Firebase (Authentication, Firestore, Functions)

### Architecture Patterns:
- **Module Pattern:** TypeScript modules for code organization
- **Singleton Pattern:** Used in managers (e.g., `AssetManager`, `Web3Service`)
- **Observer Pattern:** For event-driven systems
- **Scene Management:** Phaser's scene system for modular game states

## 3. Core Game Systems

### 3.1 GameScene
Main game world management system that coordinates:
- Scene initialization
- Core systems initialization (AssetManager, PhysicsManager)
- Player initialization
- NPC initialization
- World physics setup
- Mobile controls management

### 3.2 PhysicsManager
Handles tilemap physics and collision system with features:
- Layer configuration (Ground, Furniture, Deco Furniture, Bushes, Houses)
- Collision detection using property-based system
- Depth management based on layer creation order
- Debug information about physics setup

### 3.3 AssetManager
Centralized asset loading and management system that:
- Organizes assets into logical groups (NPCs, players, UI, audio, pets)
- Ensures consistent asset keys and configurations
- Validates asset loading completeness
- Loads all required asset types with proper configurations

### 3.4 PlayerManager
Player character handling system that manages:
- Player initialization and controls
- Player animations (walking, idle)
- Player UI (title, name, glow)
- Player depth management for rendering
- Player movement handling

### 3.5 NPCManager
Non-player character management system that:
- Initializes all NPCs
- Manages NPC proximity detection
- Handles NPC depth management
- Provides debug information about NPCs

### 3.6 PetManager
Companion pet system that:
- Manages pet initialization
- Handles pet system updates
- Provides debug information about pets

## 4. Quiz & Reward Systems

### 4.1 NPCQuizManager
Quiz question handling system that:
- Uses singleton pattern
- Loads quiz data from JSON files
- Validates questions
- Handles random question selection
- Manages answer validation

### 4.2 QuizAntiSpamManager
Anti-spam protection system for quizzes that:
- Prevents quiz spamming
- Manages cooldown periods
- Tracks player attempts

### 4.3 QuiztalRewardTracker
Real-time reward display component that:
- Shows session stats
- Displays reward animations
- Tracks duration and total rewards

### 4.4 QuiztalRewardLog
Reward tracking and persistence system that:
- Manages session statistics
- Tracks recent rewards
- Provides event-driven updates

## 5. Blockchain & Wallet Systems

### 5.1 Web3Service
Blockchain integration system that:
- Handles wallet connectivity
- Manages NFT ownership
- Provides blockchain data

### 5.2 WalletVerificationScene
Wallet connection management system that:
- Implements wallet verification flow
- Handles mobile-specific UI
- Manages NFT display

### 5.3 WalletUIManager
Enhanced wallet UI system with crystal theme that:
- Provides progressive loading
- Implements smooth animations
- Supports multiple wallet types

### 5.4 NFT-Based Progression
System that uses NFT ownership to unlock visual enhancements and interactive features:
- Player titles based on NFT ownership
- Animated titles with effects
- Positioning synchronized with player

## 6. Mobile Support Systems

### 6.1 MobileControlsManager
Touch-based control system that:
- Creates joystick UI
- Manages button interactions
- Handles resize events
- Provides debug information

### 6.2 MobileHandler
Mobile-specific UI management system that:
- Handles responsive design
- Manages mobile UI visibility
- Implements touch interactions

## 7. User Interface Systems

### 7.1 UIScene
Main UI management system that:
- Manages scene transitions
- Handles input blocking
- Implements z-index management

### 7.2 LoadingOverlay
Loading state visualization system that:
- Shows loading indicators
- Manages progress bars
- Implements smooth animations

### 7.3 SimpleDialogBox
Dialog system for interactions that:
- Implements dynamic sizing
- Manages text wrapping
- Handles z-order management
- Provides smooth animations

## 8. Data Management Systems

### 8.1 Database
Firebase integration system that:
- Manages user data
- Handles NFT data
- Provides real-time updates

### 8.2 NetworkMonitor
Connectivity check system that:
- Monitors online status
- Handles network changes
- Provides connection indicators

## 9. Character & Animation Systems

### 9.1 BaseSage
Base character class implementation that:
- Defines common character properties
- Implements basic animations
- Provides interaction handling

### 9.2 WalkingNPC
NPC movement system that:
- Implements walking animations
- Manages movement patterns
- Handles interaction states

### 9.3 PathfindingPatrolBehavior
NPC pathfinding system that:
- Manages patrol behavior
- Implements boundary checking
- Handles movement direction

### 9.4 CharacterSelectionScene
Character selection UI system that:
- Displays available characters
- Handles selection input
- Manages character preview

## 10. Utility & Support Systems

### 10.1 TitleUtils
Player title management system that:
- Determines player titles
- Creates animated titles
- Manages title positioning

### 10.2 UITheme
UI styling and theming system that:
- Defines color schemes
- Implements visual effects
- Manages responsive design

### 10.3 Firebase
Backend integration system that:
- Handles authentication
- Manages database operations
- Implements cloud functions

## 11. Implementation Standards

### 11.1 NPC Implementation
- All NPCs should extend QuizNPC base class
- Implement proper physics and interactions
- Use NPCQuizManager for question handling
- Display name labels and show messages

### 11.2 Animation Implementation
- Create direction-specific animation keys
- Use correct sprite sheets
- Define proper frame ranges

### 11.3 Pathfinding Initialization
- Register all NPCs before initializing pathfinding
- Initialize PathfindingManager with map data
- Set pathfinding manager for all walking NPCs

### 11.4 GameScene Updates
- Call WalkingNPCManager.updateWalkingNPCs() in GameScene.update()
- Handle interaction blocking during dialogues
- Manage scene transitions properly

## 12. Development Environment

### 12.1 Required Tools
- Node.js (v18+)
- npm or yarn
- TypeScript
- Vite
- Firebase CLI

### 12.2 Setup Commands
```bash
npm install
npm run dev
```

### 12.3 Build Command
```bash
npm run build
```

### 12.4 Deployment
- Deploy to Firebase Hosting or any static hosting service
- Firebase Functions deployed separately via `firebase deploy`
