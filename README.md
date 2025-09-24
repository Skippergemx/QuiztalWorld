# QuiztalWorld

Welcome to QuiztalWorld, an educational blockchain game built with Phaser.js and Firebase!

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Game Mechanics](#game-mechanics)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

QuiztalWorld is an interactive educational game that teaches blockchain concepts through engaging gameplay. Players explore a fantasy world, interact with NPCs, answer quizzes, and collect NFT-based rewards while learning about Web3 technologies.

## Features

- **Interactive NPCs**: Engage with blockchain-themed characters who provide educational quizzes
- **NFT Integration**: Collect and display NFTs that represent your achievements and knowledge
- **Educational Content**: Learn about blockchain, cryptocurrencies, and Web3 through gameplay
- **Mobile Support**: Fully responsive design with touch controls for mobile devices
- **Progress Tracking**: Save your progress and achievements using Firebase
- **Reward System**: Earn tokens and NFTs for completing quizzes and challenges
- **Character Customization**: Choose from multiple characters with unique appearances

## Technology Stack

- **Frontend**: Phaser.js (HTML5 Game Framework)
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Blockchain**: Ethereum-compatible networks
- **Wallet Integration**: WalletConnect for secure wallet connections
- **Build Tool**: Vite.js
- **Languages**: TypeScript, HTML, CSS

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to `http://localhost:5173`

## Project Structure

```
QuiztalWorld/
├── public/                 # Static assets
│   ├── assets/             # Game assets (images, audio, maps)
│   │   ├── maps/           # Tilemap JSON files
│   │   ├── quizzes/        # NPC quiz data
│   │   └── ui/             # UI elements
│   └── index.html          # Main HTML file
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── data/               # Game data files
│   ├── managers/           # Game systems and managers
│   ├── objects/            # Game objects (NPCs, player, etc.)
│   ├── scenes/             # Game scenes
│   ├── services/           # External service integrations
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── env.d.ts            # Environment type definitions
│   └── main.ts             # Entry point
├── functions/              # Firebase Cloud Functions
├── package.json            # Project dependencies and scripts
└── vite.config.ts          # Vite configuration
```

## Game Mechanics

### Core Gameplay Loop

1. **Explore**: Navigate the world using keyboard or touch controls
2. **Interact**: Approach NPCs and press 'C' or tap the interact button to start conversations
3. **Learn**: Answer blockchain-themed quiz questions provided by NPCs
4. **Earn**: Receive tokens and NFTs for correct answers
5. **Progress**: Unlock new areas and content as you advance

### Character Movement

- **Desktop**: Arrow keys or WASD for movement
- **Mobile**: Virtual joystick for smooth, responsive movement with enhanced physics

### NPC System

The game features several blockchain-themed NPCs, each with unique personalities and quiz topics:

- **BaseSage**: Blockchain fundamentals
- **HuntBoy**: NFT hunting and trading
- **MintGirl**: Token minting and smart contracts
- **MrGemx**: Cryptocurrency concepts
- **SecurityKai**: Web3 security best practices
- **NftCyn**: NFT marketplaces and utilities
- **Moblin**: Pet companion with special abilities

### Walking NPC System

The project includes a simplified walking NPC system that allows NPCs to patrol between two predefined points without complex pathfinding:

- **SimplePatrolBehavior**: Moves NPCs between two points in a straight line
- **WalkingNPC**: Base class for all walking NPCs with animation support
- **PathfindingPatrolBehavior**: Advanced behavior for complex pathfinding (planned)

### Mobile Controls

Mobile controls have been enhanced with:

- **Velocity Smoothing**: Gradual acceleration and deceleration for natural movement
- **Immediate Stopping**: Characters stop promptly when joystick is released
- **Direction Change Delay**: Prevents rapid direction changes that cause animation flickering
- **Movement Threshold**: Minimum joystick movement required to trigger direction changes
- **Real-time Tuning**: Developer tools for adjusting movement parameters

### Reward System

Players earn rewards through:

1. **Quiz Completion**: Tokens for correct answers
2. **NFT Collection**: Special NFTs for achievements
3. **Pet System**: Moblin companion with gift-giving abilities
4. **Progression**: Unlocking new areas and content

### NFT Integration

NFTs serve multiple purposes in QuiztalWorld:

- **Status Symbols**: Display achievements and knowledge
- **Game Effects**: Certain NFTs provide in-game benefits
- **Progression**: Some areas require specific NFTs to access
- **Customization**: NFTs influence player titles and visual effects

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account for backend services

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run deploy`: Deploy to Firebase

### Code Structure

The codebase follows a modular architecture:

- **Scenes**: Handle different game states (Boot, Login, Game, etc.)
- **Managers**: Encapsulate complex systems (NPC, Player, Asset, etc.)
- **Objects**: Game entities (NPCs, Player, etc.)
- **Components**: Reusable UI elements
- **Services**: External API integrations
- **Utils**: Helper functions and utilities

### Mobile Optimization

QuiztalWorld is optimized for mobile devices with:

- **Responsive Layout**: Adapts to different screen sizes
- **Touch Controls**: Virtual joystick and buttons
- **Performance Tuning**: Reduced asset loading and optimized rendering
- **Enhanced Movement Physics**: Smooth acceleration with immediate stopping

## Deployment

1. Build the project: `npm run build`
2. Deploy to Firebase: `npm run deploy`
3. Configure Firebase environment variables
4. Set up domain and SSL certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.