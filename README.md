# QuiztalWorld

QuiztalWorld is a Web3-integrated interactive game or metaverse environment that combines educational quizzes with NFTs and wallet-based identity verification. It leverages blockchain technologies (Ethereum via Web3/Ethers) and Firebase for backend services.

## Features

- Interactive 2D game world using Phaser
- Wallet verification and NFT display
- NPC dialogues and quiz systems
- Reward tracking and token claiming
- Mobile controls and responsive UI
- Walking NPC system with simple patrol behavior

## Technology Stack

- **Frontend**: Phaser 3.88.2, TypeScript, Vite 6.2.0
- **Blockchain**: Ethers.js v6.15.0, WalletConnect, web3modal
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Utilities**: dotenv, process, stream-browserify, util

## Project Structure

```
.
├── functions/              # Firebase Cloud Functions
├── public/
│   ├── assets/             # Game assets (maps, NPC data)
│   └── quizzes/            # Quiz data files
├── src/
│   ├── components/         # UI components
│   ├── data/               # Dialog and quiz data
│   ├── managers/           # Game logic managers
│   ├── objects/            # Game entities (NPCs, characters)
│   ├── scenes/             # Phaser scenes
│   ├── services/           # Web3 integration
│   ├── types/              # TypeScript types
│   └── utils/              # Utility classes
├── docs/                   # Documentation
└── ...
```

## Walking NPC System

The project includes a simplified walking NPC system that allows NPCs to patrol between two predefined points without complex pathfinding:

- **SimplePatrolBehavior**: Moves NPCs between two points in a straight line
- **WalkingNPC**: Base class for all walking NPCs
- **WalkingNPCManager**: Manages all walking NPCs in the scene

Currently, MrRugPull implements walking behavior using this system.

See [Walking NPC Documentation](docs/walking-npc-setup.md) for implementation details.

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Documentation

- [Project Overview](docs/project-overview.md)
- [NPC Implementation Guide](docs/npc-implementation-guide.json)
- [Walking NPC Setup](docs/walking-npc-setup.md)
- [Simple Patrol NPC Guide](docs/simple-patrol-npc-guide.md)

## Development

- **Required Tools**: Node.js v18+, npm or yarn, TypeScript 5.7.2, Vite 6.2.0
- **Optional Tools**: Firebase CLI (for deployment)

## License

This project is proprietary and confidential.