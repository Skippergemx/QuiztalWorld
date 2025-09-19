# Walking NPC Setup Guide

This guide explains how to set up and use walking NPCs with simple patrol behavior in QuiztalWorld.

## Overview

The walking NPC system allows NPCs to move around the game world. We've implemented a simplified patrol system that moves NPCs between two predefined points without complex pathfinding.

## Components

1. **WalkingNPC** - Base class for all walking NPCs (extends QuizNPC)
2. **SimplePatrolBehavior** - Behavior that moves NPCs between two points
3. **WalkingNPCManager** - Manages all walking NPCs in the scene

## Setting Up Walking NPCs

### 1. Integration with GameScene

The GameScene has been updated to include the WalkingNPCManager:

```typescript
// In GameScene.create()
private initializeWalkingNPCs(): void {
  console.log('🚶 GameScene: Initializing walking NPCs...');

  // Initialize the WalkingNPCManager
  this.walkingNPCManager = WalkingNPCManager.getInstance(this);

  // Example: Create a patrol NPC (MrRugPull now uses this system)
  // const patrolNPC = new YourPatrolNPC(this, 400, 300, 'texture_key');
  // this.walkingNPCManager.registerWalkingNPC(patrolNPC);

  console.log('✅ GameScene: Walking NPC system initialized');
}
```

The WalkingNPCManager is also updated in the main update loop:

```typescript
update() {
  // ... other updates
  this.walkingNPCManager?.updateWalkingNPCs();
}
```

### 2. Creating a Patrol NPC

To create a new patrol NPC:

1. Create a new class that extends `WalkingNPC`
2. In the constructor, define patrol points and set the behavior:

```typescript
// Define patrol points
const pointA = { x: x - 100, y: y };
const pointB = { x: x + 100, y: y };

// Set up the simple patrol behavior
const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
this.setBehavior(patrolBehavior);
```

3. Register the NPC with the WalkingNPCManager:

```typescript
// In GameScene
const patrolNPC = new YourPatrolNPC(this, 400, 300, 'texture_key');
this.walkingNPCManager.registerWalkingNPC(patrolNPC);
```

### 3. Converting Existing NPCs (Example: MrRugPull)

MrRugPull has been converted to use the walking NPC system:

1. Changed base class from `QuizNPC` to `WalkingNPC`
2. Added patrol behavior with predefined points
3. Modified interaction handling to work with walking behavior

### 4. Customization Options

#### Adjusting Movement Speed

Modify the `moveSpeed` property in `SimplePatrolBehavior.ts`:

```typescript
private moveSpeed: number = 100; // Default speed
```

#### Adjusting Tolerance

Modify the `tolerance` property to change how close the NPC needs to be to a target before switching direction:

```typescript
private tolerance: number = 10; // Default tolerance
```

## Example Implementation

MrRugPull is now a working example of an NPC using the walking system.

## Key Benefits

1. **Simplicity**: No complex pathfinding or collision detection required
2. **Performance**: Minimal computational overhead
3. **Predictability**: NPCs follow a consistent, predictable path
4. **Ease of Use**: Simple configuration with just two points

## Limitations

1. **No Obstacle Avoidance**: NPCs will move through walls or obstacles
2. **Fixed Path**: Movement is limited to straight lines between two points
3. **No Dynamic Targets**: Points are fixed at initialization time

This system is ideal for NPCs that need to patrol a small, clear area without complex navigation requirements.