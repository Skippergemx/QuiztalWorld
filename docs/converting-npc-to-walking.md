# Converting an Existing NPC to a Walking NPC

This guide explains how to convert an existing static NPC to a walking NPC using the simple patrol behavior.

## Overview

You can convert any existing NPC that extends `QuizNPC` to a walking NPC by making it extend `WalkingNPC` instead and adding the patrol behavior.

## Steps to Convert an NPC

### 1. Change the Base Class

Change the NPC to extend `WalkingNPC` instead of `QuizNPC`:

```typescript
// Before
import QuizNPC from "./QuizNPC";

export default class MyNPC extends QuizNPC {
  // ...
}

// After
import WalkingNPC from "./WalkingNPC";

export default class MyNPC extends WalkingNPC {
  // ...
}
```

### 2. Update the Constructor

Modify the constructor to work with the WalkingNPC base class:

```typescript
constructor(scene: Phaser.Scene, x: number, y: number) {
  // Call the parent constructor with the texture key
  super(scene, x, y, "my_npc_texture");
  
  // Add all existing initialization code here
  scene.add.existing(this);
  scene.physics.add.existing(this);
  // Note: Remove this.setImmovable(true) to allow movement
  this.setDepth(10);
  
  // ... rest of your existing constructor code
}
```

### 3. Add Patrol Behavior

Define patrol points and set up the simple patrol behavior:

```typescript
// Define patrol points (adjust coordinates as needed)
const pointA = { x: x - 100, y: y };  // 100 pixels to the left
const pointB = { x: x + 100, y: y };  // 100 pixels to the right

// Set up the simple patrol behavior
const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
this.setBehavior(patrolBehavior);
```

### 4. Update Interaction Handling

Modify the interact method to work with the walking behavior:

```typescript
public interact() {
  // Call the parent's onInteractionStart method to handle walking behavior
  this.onInteractionStart();
  
  // ... existing interaction code ...
  
  // Resume walking after interaction (optional, depending on your needs)
  this.scene.time.delayedCall(3000, () => {
    this.onInteractionEnd();
  });
}
```

### 5. Register with WalkingNPCManager

In the GameScene, register the NPC with the WalkingNPCManager:

```typescript
// In GameScene.create() method
const myNPC = new MyNPC(this, 400, 300);
this.walkingNPCManager.registerWalkingNPC(myNPC);
```

## Example Conversion: MrRugPull

MrRugPull has been successfully converted to use the walking NPC system. Here are the key changes made:

1. **Base Class**: Changed from `QuizNPC` to `WalkingNPC`
2. **Movement**: Removed `this.setImmovable(true)` to allow movement
3. **Patrol Behavior**: Added simple patrol between two points
4. **Interaction Handling**: Updated to work with walking behavior
5. **Registration**: Registered with WalkingNPCManager in GameScene

## Important Considerations

1. **Animation Keys**: Make sure your NPC has both walk and idle animations for all directions
2. **Texture Keys**: Ensure the texture key in the constructor matches the loaded spritesheet
3. **Depth Management**: Walking NPCs should have appropriate depth values to render correctly
4. **Performance**: The WalkingNPCManager updates all walking NPCs each frame, so be mindful of the number of walking NPCs
5. **Collision Handling**: Walking NPCs should have proper physics setup to interact with the game world

## Benefits of Conversion

1. **Enhanced Gameplay**: Adds movement and life to previously static NPCs
2. **Consistent System**: Integrates with the existing walking NPC management system
3. **Simple Implementation**: Uses the simplified patrol behavior without complex pathfinding
4. **Easy Customization**: Patrol points can be easily adjusted

This conversion process allows you to easily add movement to existing NPCs while maintaining all their existing functionality.