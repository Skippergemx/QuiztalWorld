# Walking Quiz NPC Implementation Guide for AI Agents

This guide is specifically designed for AI agents to help them implement walking quiz NPCs with minimal errors. It highlights common mistakes and provides clear, step-by-step instructions.

## Overview

A walking quiz NPC is an NPC that:
1. Moves around the game world using predefined patrol paths
2. Interacts with players to provide educational quizzes
3. Awards Quiztal rewards for correct answers
4. Integrates with the existing game systems for consistency

## Common Mistakes and How to Avoid Them

### 1. Incorrect Base Class Usage
**Mistake**: Using `QuizNPC` instead of `WalkingNPC` as the base class
**Solution**: Always extend `WalkingNPC` for walking quiz NPCs

```typescript
// ✅ Correct
import WalkingNPC from "./WalkingNPC";
export default class YourNPCName extends WalkingNPC {

// ❌ Incorrect
import QuizNPC from "./QuizNPC";
export default class YourNPCName extends QuizNPC {
```

### 2. Missing or Incorrect Animation Keys
**Mistake**: Using wrong animation keys or not creating animations at all
**Solution**: Follow the exact naming convention and frame ranges

```typescript
// Animation keys must follow this pattern:
// {npcid}-idle-{direction} and {npcid}-walk-{direction}
// Directions: right, up, left, down

// Frame ranges (24-frame spritesheet):
// Right: frames 0-5, Up: frames 6-11, Left: frames 12-17, Down: frames 18-23
```

### 3. Reward System Validation Errors
**Mistake**: Using incorrect source name in `saveQuiztalsToDatabase`
**Solution**: Match exactly with the validSources array in Database.ts

```typescript
// ✅ Correct - Must match exactly with validSources in Database.ts
saveQuiztalsToDatabase(playerId, reward, "YourNPCName");

// ❌ Incorrect - Will be rejected by validation
saveQuiztalsToDatabase(playerId, reward, "Your NPC Name");
```

### 4. Physics and Collision Issues
**Mistake**: Not setting up physics properly or making NPCs pushable
**Solution**: Set immovable and register with PhysicsManager

```typescript
// In constructor:
this.setImmovable(true);  // Prevent player from pushing the NPC

// Register with PhysicsManager:
const physicsManager = PhysicsManager.getInstance(scene);
if (physicsManager) {
  physicsManager.setupNPCCollisions(this);
}
```

## Step-by-Step Implementation

### Step 1: Create the NPC Class File

File: `src/objects/YourNPCName.ts`

```typescript
import Phaser from "phaser";
import WalkingNPC from "./WalkingNPC";
import { showDialog } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior";
import PhysicsManager from '../managers/PhysicsManager';
import yourQuizData from '../data/quizzes/npc-yournpcid.json';

export default class YourNPCName extends WalkingNPC {
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private readonly npcId = 'yournpcid';
  private hasQuizData: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // ⚠️ Important: Use the correct texture key that matches your asset
    super(scene, x, y, "npc_yournpcid");
    
    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    
    // Load quiz data
    if (yourQuizData && yourQuizData.questions && yourQuizData.questions.length > 0) {
      // ⚠️ Important: Use loadQuizData with npcId, not the data object directly
      this.quizManager.loadQuizData(this.npcId);
      this.hasQuizData = true;
    }
    
    // Add physics properties
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    // ⚠️ Critical: Set immovable to prevent player from pushing NPC
    this.setImmovable(true);
    this.setCollideWorldBounds(true);
    
    // Register with PhysicsManager
    const physicsManager = PhysicsManager.getInstance(scene);
    if (physicsManager) {
      physicsManager.setupNPCCollisions(this);
    }
    
    // Define patrol points
    const pointA = { x: x - 100, y: y };
    const pointB = { x: x + 100, y: y };
    
    // Set up the simple patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    // Create animations
    this.createAnimations(scene);
    
    // Set up UI elements
    this.nameLabel = scene.add.text(x, y - 40, "Your NPC Name", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    // Set up interactive behavior
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
    
    // Set proper depth for rendering
    this.setDepth(10);
  }
  
  // ... rest of the implementation
}
```

### Step 2: Create Animations Method

```typescript
private createAnimations(scene: Phaser.Scene) {
  // ⚠️ Important: Check if animations already exist to prevent conflicts
  if (scene.anims.exists("yournpcid-idle-down")) {
    return;
  }

  // Frame configuration (24-frame spritesheet):
  // Right: frames 0-5, Up: frames 6-11, Left: frames 12-17, Down: frames 18-23
  const animationConfig = [
    { name: 'right', idleStart: 0, idleEnd: 5, walkStart: 0, walkEnd: 5 },
    { name: 'up', idleStart: 6, idleEnd: 11, walkStart: 6, walkEnd: 11 },
    { name: 'left', idleStart: 12, idleEnd: 17, walkStart: 12, walkEnd: 17 },
    { name: 'down', idleStart: 18, idleEnd: 23, walkStart: 18, walkEnd: 23 }
  ];
  
  animationConfig.forEach(config => {
    // Idle animation
    const idleKey = `yournpcid-idle-${config.name}`;
    if (!scene.anims.exists(idleKey)) {
      const idleFrames = scene.anims.generateFrameNumbers("npc_yournpcid", {
        start: config.idleStart,
        end: config.idleEnd,
      });
      
      scene.anims.create({
        key: idleKey,
        frames: idleFrames,
        frameRate: 3,
        repeat: -1,
      });
    }

    // Walk animation
    const walkKey = `yournpcid-walk-${config.name}`;
    if (!scene.anims.exists(walkKey)) {
      const walkFrames = scene.anims.generateFrameNumbers("npc_yournpcid_walk", {
        start: config.walkStart,
        end: config.walkEnd,
      });
      
      scene.anims.create({
        key: walkKey,
        frames: walkFrames,
        frameRate: 8,
        repeat: -1,
      });
    }
  });
}
```

### Step 3: Implement Reward System

```typescript
private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
  const playerId = player.name || `anon_${Date.now()}`;
  
  // ⚠️ Critical: Source name must match exactly with validSources in Database.ts
  saveQuiztalsToDatabase(playerId, reward, "YourNPCName");

  // Also log to local session tracker
  QuiztalRewardLog.logReward("YourNPCName", reward);
}
```

### Step 4: Create Quiz Data File

File: `src/data/quizzes/npc-yournpcid.json`

```json
{
  "npcId": "yournpcid",
  "npcName": "Your NPC Name",
  "theme": "Educational Theme",
  "description": "Description of NPC expertise",
  "questions": [
    {
      "question": "Question text here?",
      "options": [
        "Option 1",
        "Option 2", 
        "Option 3"
      ],
      "answer": "Option 1"
    }
  ]
}
```

### Step 5: Update GameScene Integration

In `src/scenes/GameScene.ts`:

1. Import your NPC:
```typescript
import YourNPCName from "../objects/YourNPCName";
```

2. Declare the property:
```typescript
private yourNPCName!: YourNPCName;
```

3. Instantiate and register:
```typescript
// In create method:
this.yourNPCName = new YourNPCName(this, x_coordinate, y_coordinate);
this.walkingNPCManager.registerWalkingNPC(this.yourNPCName);
this.quizAntiSpamManager.registerNPC(this.yourNPCName);
```

### Step 6: Add Assets

In `GameScene.preload`:
```typescript
this.load.image("npc_yournpcid_avatar", "assets/npc/npc_yournpcid_avatar.png");
this.load.spritesheet("npc_yournpcid", "assets/npc/npc_yournpcid_idle_1.png", {
  frameWidth: 32,
  frameHeight: 53,
});
this.load.spritesheet("npc_yournpcid_walk", "assets/npc/npc_yournpcid_walk_1.png", {
  frameWidth: 32,
  frameHeight: 53,
});
```

## Validation Checklist for AI Agents

Before submitting your implementation, verify all these points:

### Critical Issues (Must Fix)
- [ ] NPC extends `WalkingNPC` (not `QuizNPC`)
- [ ] `this.setImmovable(true)` is set in constructor
- [ ] PhysicsManager collision setup is implemented
- [ ] Animation keys follow `{npcid}-{type}-{direction}` pattern
- [ ] Source name in `saveQuiztalsToDatabase` matches validSources
- [ ] Texture keys match between constructor, animations, and asset loading
- [ ] NPC registered with both WalkingNPCManager and QuizAntiSpamManager

### Common Issues (Should Fix)
- [ ] Quiz data file exists with correct structure
- [ ] NPC ID added to NPCQuizManager load list
- [ ] Assets properly loaded in GameScene.preload
- [ ] Proper depth setting (usually 10 for NPCs)
- [ ] Correct frame ranges in animations (0-5, 6-11, 12-17, 18-23)
- [ ] Interaction distance check (usually 100 pixels)
- [ ] Proper cooldown implementation

### Best Practices (Recommended)
- [ ] Meaningful NPC name and theme
- [ ] At least 25-30 quality quiz questions
- [ ] Consistent naming conventions
- [ ] Proper error handling and logging
- [ ] Appropriate colors for NPC name and shout messages
- [ ] Balanced reward amounts (0.05-0.7 Quiztals)

## Troubleshooting Common Issues

### NPC Not Moving
1. Check that patrol points are properly defined
2. Verify that `setBehavior()` is called with SimplePatrolBehavior
3. Ensure WalkingNPCManager is properly initialized and updated

### Animations Not Playing
1. Verify animation keys match exactly
2. Check that `createAnimations()` is called in constructor
3. Confirm frame ranges are correct for your spritesheet
4. Ensure texture keys match loaded assets

### Quiz Not Working
1. Verify quiz data file exists and is properly formatted
2. Check that NPC ID is added to NPCQuizManager
3. Confirm `loadQuizData()` is called with correct parameters
4. Ensure `hasQuizData` flag is set properly

### Rewards Not Saving
1. Check that source name matches validSources in Database.ts
2. Verify `saveQuiztalsToDatabase` is called with correct parameters
3. Confirm network connectivity for Firestore operations

## Example Working Implementation

Refer to `MrRugPull.ts` for a complete working example that demonstrates:
- Proper walking behavior implementation
- Correct animation setup
- Working quiz system integration
- Proper reward handling
- Correct GameScene integration

This guide should help AI agents implement walking quiz NPCs with fewer errors by highlighting the most common mistakes and providing clear, actionable solutions.