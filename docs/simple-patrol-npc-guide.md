# Simple Patrol NPC Implementation Guide

This guide explains how to create and use simple patrol NPCs that move between two predefined points without complex pathfinding.

## Overview

The simple patrol system allows NPCs to move back and forth between two points in a straight line. This is useful for creating basic patrolling behavior without the complexity of pathfinding or collision avoidance.

## Components

1. **SimplePatrolBehavior.ts** - The behavior class that controls the patrol movement
2. **SamplePatrolNPC.ts** - An example NPC implementation using the simple patrol behavior

## How to Create a Simple Patrol NPC

### 1. Define Patrol Points

When creating an NPC, define the two points between which it should patrol:

```typescript
// Define patrol points (Point A and Point B)
const pointA = { x: x - 100, y: y };  // 100 pixels to the left
const pointB = { x: x + 100, y: y };  // 100 pixels to the right

// Set up the simple patrol behavior
const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
this.setBehavior(patrolBehavior);
```

### 2. Configure Animation

Make sure your NPC has the appropriate animations for walking and idle states in each direction:

```typescript
// Create walk animations for each direction
if (!scene.anims.exists("samplepatrolnpc-walk-right")) {
  scene.anims.create({
    key: "samplepatrolnpc-walk-right",
    frames: scene.anims.generateFrameNumbers("sample_patrol_npc", { start: 0, end: 3 }),
    frameRate: 5,
    repeat: -1
  });
}
// ... repeat for other directions
```

### 3. Integration with NPCManager

To integrate your patrol NPC with the existing NPC system, add it to the NPC configurations in `NPCManager.ts`:

```typescript
{
  id: 'samplepatrolnpc',
  name: 'Sample Patrol NPC',
  class: SamplePatrolNPC,
  position: { x: 600, y: 600 },
  interactionRange: 100
}
```

## Customization Options

### Adjusting Movement Speed

You can modify the movement speed by changing the `moveSpeed` property in `SimplePatrolBehavior.ts`:

```typescript
private moveSpeed: number = 100; // Default speed
```

### Adjusting Tolerance

The tolerance determines how close the NPC needs to be to a target point before switching direction:

```typescript
private tolerance: number = 10; // Default tolerance
```

## Usage Example

Here's a complete example of how to instantiate a patrol NPC in your scene:

```typescript
// In your scene's create method
const patrolNPC = new SamplePatrolNPC(this, 400, 300, 'sample_patrol_npc');

// The NPC will automatically start patrolling between its predefined points
```

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