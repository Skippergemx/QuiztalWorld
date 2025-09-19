# Walking NPC System

This directory contains the implementation of the walking NPC system for QuiztalWorld.

## Overview

The walking NPC system provides a simple way to create NPCs that move between predefined points. This is a simplified alternative to complex pathfinding systems.

## Components

1. **WalkingNPC.ts** - Base class for all walking NPCs (extends QuizNPC)
2. **SimplePatrolBehavior.ts** - Behavior that moves NPCs between two points
3. **WalkingNPCManager.ts** - Manages all walking NPCs in the scene

## Usage

To create a walking NPC:

1. Create a new class that extends `WalkingNPC`
2. In the constructor, define patrol points and set the behavior:
   ```typescript
   const pointA = { x: x - 100, y: y };
   const pointB = { x: x + 100, y: y };
   const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
   this.setBehavior(patrolBehavior);
   ```
3. Register the NPC with the WalkingNPCManager:
   ```typescript
   walkingNPCManager.registerWalkingNPC(yourNPC);
   ```

## Current Implementations

- **MrRugPull**: Now implements walking behavior using the simple patrol system

## Documentation

- [Simple Patrol NPC Guide](../../docs/simple-patrol-npc-guide.md) - Detailed guide on creating patrol NPCs
- [Walking NPC Setup](../../docs/walking-npc-setup.md) - Integration with GameScene
- [NPC Implementation Guide](../../docs/npc-implementation-guide.json) - Main NPC implementation guide

## Benefits

- **Simplicity**: No complex pathfinding required
- **Performance**: Minimal computational overhead
- **Predictability**: NPCs follow consistent paths
- **Easy Configuration**: Just define two points

## Limitations

- No obstacle avoidance
- Fixed paths (straight lines only)
- Points are fixed at initialization