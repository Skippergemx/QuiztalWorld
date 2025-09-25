# Walking Quiz NPC Implementation Guide

This document provides a step-by-step guide for implementing new walking quiz NPCs in the Quiztal World game. Following these steps will ensure a consistent, error-free implementation that integrates properly with all game systems.

## Overview

Walking quiz NPCs are interactive characters that:
1. Patrol a designated area using walking behaviors
2. Provide quiz questions to players
3. Award $Quiztals for correct answers
4. Feature idle and walking animations
5. Display name labels and shout messages

## Prerequisites

Before implementing a new walking quiz NPC, ensure you have:
1. NPC artwork assets (avatar, idle spritesheet, walk spritesheet)
2. Quiz questions in JSON format
3. Knowledge of the NPC's role and positioning in the game world

## Implementation Steps

### 1. Asset Preparation

#### Required Assets
Each walking quiz NPC requires three specific assets:
- **Avatar**: A static image for dialog boxes (e.g., `npc_artizengent_avatar.png`)
- **Idle Animation**: Spritesheet for idle state (e.g., `npc_artizengent_idle_1.png`)
- **Walk Animation**: Spritesheet for walking state (e.g., `npc_artizengent_walk_1.png`)

#### Asset Placement
Place all assets in the `public/assets/npc/` directory with the naming convention:
```
public/assets/npc/
├── npc_{npcname}_avatar.png
├── npc_{npcname}_idle_1.png
└── npc_{npcname}_walk_1.png
```

### 2. Quiz Data Creation

#### JSON Structure
Create a quiz data file in `public/assets/quizzes/` with the following structure:
```json
{
  "npcId": "npcidentifier",
  "npcName": "NPC Display Name",
  "theme": "Quiz Theme",
  "description": "Brief description of quiz content",
  "questions": [
    {
      "question": "Question text?",
      "options": [
        "Option 1",
        "Option 2", 
        "Option 3",
        "Option 4"
      ],
      "answer": "Correct option",
      "feedback": {
        "correct": "Feedback for correct answer",
        "incorrect": "Feedback for incorrect answer"
      }
    }
  ]
}
```

#### File Naming
Name the file: `npc-{npcid}.json` (e.g., `npc-artizengent.json`)

### 3. BootScene Asset Loading

Add asset loading to `src/scenes/BootScene.ts`:

```typescript
// ✅ Load {NPC Name} spritesheets (idle and walk)
this.load.spritesheet("npc_{npcid}", "assets/npc/npc_{npcid}_idle_1.png", {
    frameWidth: 32,
    frameHeight: 53, // or 64 depending on sprite dimensions
});
this.load.spritesheet("npc_{npcid}_walk", "assets/npc/npc_{npcid}_walk_1.png", {
    frameWidth: 32,
    frameHeight: 53, // or 64 depending on sprite dimensions
});
```

**Important**: Note the naming pattern - the idle animation uses the key `npc_{npcid}` while the walk animation uses `npc_{npcid}_walk`. This pattern must be maintained consistently throughout the implementation.

### 4. AssetManager Configuration

Add asset configuration to `src/managers/AssetManager.ts`:

```typescript
{
  avatarKey: 'npc_{npcid}_avatar',
  avatarPath: 'assets/npc/npc_{npcid}_avatar.png',
  spriteKey: 'npc_{npcid}',
  spritePath: 'assets/npc/npc_{npcid}_idle_1.png',
  frameWidth: 32,
  frameHeight: 53 // or 64 depending on sprite dimensions
}
```

Update the walk animation loading condition:
```typescript
// Load walk animation if it exists (for walking NPCs)
if (config.spriteKey.includes('mrrugpull') || config.spriteKey.includes('{npcid}')) {
  const walkKey = config.spriteKey + '_walk';
  const walkPath = config.spritePath.replace('_idle_1', '_walk_1');
  this.scene.load.spritesheet(walkKey, walkPath, {
    frameWidth: config.frameWidth,
    frameHeight: config.frameHeight
  });
}
```

### 5. NPCQuizManager Update

Add the NPC ID to the loading list in `src/managers/NPCQuizManager.ts`:

```typescript
private async loadAllQuizData(): Promise<void> {
    const npcIds = [
        // ... existing NPC IDs
        '{npcid}'
    ];
    // ... rest of the method
}
```

### 6. NPCManager Configuration

Add NPC configuration to `src/managers/NPCManager.ts`:

1. Import the new NPC class:
```typescript
import {NPCName} from '../objects/{NPCName}';
```

2. Add to npcConfigs array:
```typescript
{
  id: '{npcid}',
  name: '{NPC Display Name}',
  class: {NPCName},
  position: { x: X_POSITION, y: Y_POSITION },
  interactionRange: 100
}
```

### 7. GameScene Registration

Register the NPC with the WalkingNPCManager in `src/scenes/GameScene.ts`:

```typescript
// Get the {NPC Name} instance from the NPCManager and register it with the WalkingNPCManager
const {npcVariableName} = this.npcManager.getNPC('{npcid}');
if ({npcVariableName}) {
  this.walkingNPCManager.registerWalkingNPC({npcVariableName});
  console.log('✅ GameScene: {NPC Name} registered with WalkingNPCManager');
} else {
  console.warn('⚠️ GameScene: {NPC Name} not found in NPCManager, cannot register with WalkingNPCManager');
}
```

### 8. SimplePatrolBehavior Animation Handling

Add special animation handling for the new NPC in `src/managers/SimplePatrolBehavior.ts`:

1. In the playAnimation method:
```typescript
// Special handling for {NPC Name} to ensure correct animations
else if (npc.texture && npc.texture.key === 'npc_{npcid}') {
  const key = `{npcid}-${type}-${direction}`;
  // ... rest of animation handling logic
}
```

2. In the onInteractionStart method:
```typescript
// Special handling for {NPC Name} to ensure correct animations
else if (npc.texture && npc.texture.key === 'npc_{npcid}') {
  const key = `{npcid}-idle-${npc['lastDirection'] || 'down'}`;
  // ... rest of idle animation logic
}
```

### 9. WalkingNPC Animation Key Generation

Add special case for animation key generation in `src/objects/WalkingNPC.ts`:

```typescript
// Special case for {NPC Name}'s animations
if (textureKey === 'npc_{npcid}' || textureKey === 'npc_{npcid}_walk') {
  const key = `{npcid}-${type}-${direction}`;
  console.log(`Generated animation key for ${textureKey}: ${key}`);
  return key;
}
```

### 10. NPC Class Implementation

Create the NPC class in `src/objects/{NPCName}.ts` by following this template:

```typescript
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import WalkingNPC from "./WalkingNPC";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior";
import PhysicsManager from '../managers/PhysicsManager';
import {npcid}QuizData from '../data/quizzes/npc-{npcid}.json';

export default class {NPCName} extends WalkingNPC {
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private readonly npcId = '{npcid}';
  private hasQuizData: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_{npcid}");

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    
    // Load quiz data
    this.quizManager.loadQuizData(this.npcId).then(() => {
      this.hasQuizData = true;
      console.log('✅ {NPCName}: Successfully loaded quiz data');
    }).catch((error) => {
      console.warn('⚠️ {NPCName}: Failed to load quiz data:', error);
    });
    
    // Add physics properties
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setCollideWorldBounds(true);
    
    // Register with PhysicsManager
    const physicsManager = PhysicsManager.getInstance(scene);
    if (physicsManager) {
      physicsManager.setupNPCCollisions(this);
      const player = this.getClosestPlayer();
      if (player) {
        physicsManager.addCollision(this, player);
        console.log('✅ {NPCName}: Set up direct collision with player');
      }
      console.log('✅ {NPCName}: Set up collisions with environment');
    }
    
    // Define patrol points
    const pointA = { x: x - 100, y: y };
    const pointB = { x: x + 100, y: y };
    
    // Set up patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    this.createAnimations(scene);
    this.play("{npcid}-idle-down");

    // Register with scene update
    scene.events.on('update', this.update, this);

    // Create name label
    this.nameLabel = scene.add.text(x, y - 40, "{NPC Display Name}", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00aaff", 
      stroke: "#003366",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    // Create shout text
    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#00aaff",
      stroke: "#003366",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    this.startShouting(scene);
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
    this.setDepth(10);
    
    console.log('✅ {NPCName}: Initialized with physics and collisions');
  }

  // Handle world bounds collision
  private handleWorldBoundsCollision(): void {
    console.log('💥 {NPCName}: Hit world bounds, switching patrol direction');
    const currentBehavior = this.getBehavior() as SimplePatrolBehavior | null;
    
    if (currentBehavior) {
      const currentTarget = currentBehavior['currentTarget'];
      currentBehavior['currentTarget'] = (currentTarget === currentBehavior['pointA']) 
        ? currentBehavior['pointB'] 
        : currentBehavior['pointA'];
      console.log(`🔄 {NPCName}: Switched patrol direction`);
    }
  }

  // Update method
  public update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (this.body && (this.body.blocked.left || this.body.blocked.right || 
        this.body.blocked.up || this.body.blocked.down)) {
      this.handleWorldBoundsCollision();
    }
  }

  // Create animations
  private createAnimations(scene: Phaser.Scene) {
    if (scene.anims.exists("{npcid}-idle-down")) {
      console.log("{NPCName}: Animations already exist, skipping creation");
      return;
    }

    console.log("{NPCName}: Creating animations...");

    const animationConfig = [
      { name: 'right', idleStart: 0, idleEnd: 5, walkStart: 0, walkEnd: 5 },
      { name: 'up', idleStart: 6, idleEnd: 11, walkStart: 6, walkEnd: 11 },
      { name: 'left', idleStart: 12, idleEnd: 17, walkStart: 12, walkEnd: 17 },
      { name: 'down', idleStart: 18, idleEnd: 23, walkStart: 18, walkEnd: 23 }
    ];
    
    console.log("{NPCName}: Animation configuration:", animationConfig);
    
    animationConfig.forEach(config => {
      console.log(`{NPCName}: Processing ${config.name} animations`);
      
      // Idle animation
      const idleKey = `{npcid}-idle-${config.name}`;
      console.log(`{NPCName}: Checking if idle animation ${idleKey} exists: ${scene.anims.exists(idleKey)}`);
      
      if (!scene.anims.exists(idleKey)) {
        const idleFrames = scene.anims.generateFrameNumbers("npc_{npcid}", {
          start: config.idleStart,
          end: config.idleEnd,
        });
        console.log(`{NPCName}: Creating idle animation ${idleKey} with frames:`, idleFrames);
        
        scene.anims.create({
          key: idleKey,
          frames: idleFrames,
          frameRate: 3,
          repeat: -1,
        });
        console.log(`{NPCName}: Created idle animation: ${idleKey}`);
      } else {
        console.log(`{NPCName}: Idle animation ${idleKey} already exists`);
      }

      // Walk animation
      const walkKey = `{npcid}-walk-${config.name}`;
      console.log(`{NPCName}: Checking if walk animation ${walkKey} exists: ${scene.anims.exists(walkKey)}`);
      
      if (!scene.anims.exists(walkKey)) {
        const walkFrames = scene.anims.generateFrameNumbers("npc_{npcid}_walk", {
          start: config.walkStart,
          end: config.walkEnd,
        });
        console.log(`{NPCName}: Creating walk animation ${walkKey} with frames:`, walkFrames);
        
        scene.anims.create({
          key: walkKey,
          frames: walkFrames,
          frameRate: 8,
          repeat: -1,
        });
        console.log(`{NPCName}: Created walk animation: ${walkKey}`);
      } else {
        console.log(`{NPCName}: Walk animation ${walkKey} already exists`);
      }
    });
    
    console.log("{NPCName}: All animations created:");
    animationConfig.forEach(config => {
      const idleKey = `{npcid}-idle-${config.name}`;
      const walkKey = `{npcid}-walk-${config.name}`;
      console.log(`  - ${idleKey}: ${scene.anims.exists(idleKey)}`);
      console.log(`  - ${walkKey}: ${scene.anims.exists(walkKey)}`);
    });
  }
  
  // Interaction handler
  public interact() {
    this.onInteractionStart();
    
    if (this.currentDialog) {
      console.log("{NPCName}: Dialog already open, ignoring interaction");
      return;
    }

    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        const playerId = player.name || `anon_${Date.now()}`;
        if (this.checkCooldown(playerId)) {
          console.log("{NPCName}: Player is on cooldown or has reached max attempts");
          this.showCooldownDialog();
          return;
        }
        this.startQuiz(player);
      }
    }
  }

  // Start quiz
  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    if (this.isInteractionBlocked()) {
      console.log("{NPCName}: Interaction blocked, cannot start quiz");
      return;
    }

    if (!this.hasQuizData) {
      console.warn("{NPCName}: No quiz data available, cannot start quiz");
      return;
    }

    if (!this.quizManager.isReady()) {
      console.warn("{NPCName}: Quiz manager not ready yet");
      return;
    }

    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
    if (!questionData) {
      console.error("{NPCName}: No questions available");
      return;
    }

    this.lastQuestionIndex = questionData.index;
    const currentQuestion = questionData.question;
    this.notifyQuizStarted();

    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);
    showDialog(this.scene, [{
      text: currentQuestion.question,
      avatar: "npc_{npcid}_avatar",
      options: shuffledOptions.map(option => ({
        text: option,
        callback: () => {
          this.checkAnswer(option, currentQuestion.answer, player);
          this.notifyQuizEnded();
        }
      }))
    }]);
  }

  // Check answer
  private checkAnswer(selectedOption: string, correctAnswer: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selectedOption === correctAnswer;
    const reward = this.calculateReward(isCorrect);
    
    const playerId = player.name || `anon_${Date.now()}`;
    this.recordQuizAttempt(playerId);

    const audioManager = AudioManager.getInstance();
    if (isCorrect) {
      audioManager.playCorrectSound();
    } else {
      audioManager.playWrongSound();
    }

    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    this.scene.time.delayedCall(500, () => {
      if (this.isInteractionBlocked()) {
        console.log("{NPCName}: Cannot show reward dialog - interactions are blocked");
        return;
      }

      const dialog = showDialog(this.scene, [
        {
          text: isCorrect
            ? `{success message with ${reward.toFixed(2)} $Quiztals}`
            : `{failure message with correct answer "${correctAnswer}"}`,
          avatar: "npc_{npcid}_avatar",
          isExitDialog: true
        }
      ]);

      this.currentDialog = dialog;
      this.setupDialogAutoReset(3000);
    });

    if (isCorrect) {
      this.saveRewardToDatabase(player, reward);
    }

    this.lastQuestionIndex = -1;
    
    this.scene.time.delayedCall(3000, () => {
      this.onInteractionEnd();
    });
  }

  // Calculate reward
  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.05, 0.7).toFixed(2)) : 0;
  }

  // Save reward to database
  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "{NPCName}");
    QuiztalRewardLog.logReward("{NPCName}", reward);
  }

  // Start shouting messages
  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      // ... custom messages for this NPC
    ];

    scene.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        const randomMessage = Phaser.Utils.Array.GetRandom(shoutMessages);
        this.showShout(randomMessage);
        this.startShouting(scene);
      },
      loop: false
    });
  }

  // Show shout message
  private showShout(message: string) {
    this.shoutOutText.setText(message).setAlpha(1);
    this.scene.tweens.add({
      targets: this.shoutOutText,
      alpha: 0,
      duration: 2000,
      delay: 3000,
    });
  }

  // Get closest player
  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closestPlayer: Phaser.Physics.Arcade.Sprite | null = null;
    let minDistance = Number.MAX_VALUE;

    this.scene.children.each((child) => {
      if (child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.includes('player')) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestPlayer = child;
        }
      }
    });

    return closestPlayer;
  }

  // Show cooldown dialog
  protected showCooldownDialog() {
    this.scene.time.delayedCall(3000, () => {
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      
      this.currentDialog = showDialog(this.scene, [
        {
          text: `{cooldown message with ${formattedTime}}`,
          avatar: "npc_{npcid}_avatar",
          isExitDialog: true
        }
      ]);
      
      this.setupDialogAutoReset(3000);
    });
  }
}

## Patrol Behavior Implementation Best Practices

### 1. Idle Duration Configuration
**Recommended Range**: 5-20 seconds for natural variation
```typescript
private readonly minIdleDuration: number = 5000;  // 5 seconds minimum
private readonly maxIdleDuration: number = 20000; // 20 seconds maximum
```

### 2. Distance Tolerance Settings
**Recommended Value**: 25 pixels for reliable target detection
```typescript
private readonly tolerance: number = 25; // Accounts for movement speed and frame rate
```

### 3. Real-Time Timing Implementation
**Always use timestamps for critical timing**:
```typescript
// Initialization
private idleStartTime: number = 0;

// Start idle
this.idleStartTime = Date.now();

// Check completion
const elapsedTime = Date.now() - this.idleStartTime;
if (elapsedTime >= this.currentIdleDuration) {
  // Idle complete
}
```

### 4. Physics Configuration for Walking NPCs
**Critical**: Always set `setImmovable(false)` for walking NPCs
```typescript
// Set up physics for walking NPC
this.scene.add.existing(this);
this.scene.physics.add.existing(this);
this.setImmovable(false);  // CRITICAL: Allow movement for patrol behavior
this.setCollideWorldBounds(true);
```

### Horizontal Patrol (Default)
NPCs move left and right between two points:
```typescript
// Define horizontal patrol points
const pointA = { x: x - 100, y: y };  // 100 pixels to the left
const pointB = { x: x + 100, y: y };  // 100 pixels to the right
```

### Vertical Patrol
NPCs move up and down between two points:
```typescript
// Define vertical patrol points
const pointA = { x: x, y: y - 100 };  // 100 pixels up
const pointB = { x: x, y: y + 100 };  // 100 pixels down
```

### Diagonal Patrol
NPCs move diagonally between two points:
```typescript
// Define diagonal patrol points
const pointA = { x: x - 100, y: y - 100 };  // Up and left
const pointB = { x: x + 100, y: y + 100 };  // Down and right
```

### Custom Patrol Patterns
For more complex patrol patterns, you can define any two points in the game world:
```typescript
// Define custom patrol points at specific coordinates
const pointA = { x: 500, y: 300 };  // Specific location 1
const pointB = { x: 700, y: 450 };  // Specific location 2
```

When implementing patrol patterns, consider:
1. The NPC's position in the game world
2. Obstacles that might block movement
3. Player interaction points
4. Visual appeal of the patrol route

## Common Issues and Solutions

### 1. Texture Not Found Errors
**Issue**: Console shows "Texture 'npc_{npcid}_walk_1' not found"
**Solution**: Ensure the texture key used in `generateFrameNumbers()` matches exactly with the key used in BootScene asset loading.

**Key Lesson**: The most common cause of this error is inconsistency between asset loading keys and frame generation keys. Always double-check that:
- BootScene loads assets with keys like `"npc_{npcid}"` and `"npc_{npcid}_walk"`
- Animation frame generation uses the exact same keys: `"npc_{npcid}"` and `"npc_{npcid}_walk"`

### 2. Empty Animation Frames
**Issue**: Console shows "Creating walk animation {npcid}-walk-right with frames: []"
**Solution**: Verify that:
- The spritesheet asset is correctly loaded in BootScene
- The texture key in `generateFrameNumbers()` matches the BootScene key
- The frame dimensions in BootScene match the actual sprite dimensions

### 3. Animation Playback Errors
**Issue**: "Cannot read properties of undefined (reading 'frame')"
**Solution**: Ensure animations are created before attempting to play them, and that the animation keys exist.

### 4. NPCs Not Moving (Critical Physics Bug)
**Issue**: Walking NPCs appear to initialize but don't move or patrol
**Root Cause**: Setting `setImmovable(true)` in physics configuration completely prevents movement
**Solution**: 
```typescript
// ❌ WRONG - This prevents all movement
this.setImmovable(true);

// ✅ CORRECT - This allows patrol movement
this.setImmovable(false);
```
**Key Lesson**: In Phaser.js, `setImmovable(true)` is intended for static obstacles like walls and platforms. Setting this on walking NPCs blocks all velocity-based movement, preventing patrol behavior entirely.

### 5. NPCs Not Entering Idle Mode
**Issue**: NPCs reach patrol points but don't enter idle state
**Root Cause**: Distance detection tolerance too small or target coordinates incorrect
**Solution**: 
```typescript
// Set appropriate tolerance for target detection
private readonly tolerance: number = 25; // 25 pixels is usually sufficient

// Ensure patrol points are correctly defined
const pointA = { x: x - 100, y: y };  // Horizontal patrol
const pointB = { x: x + 100, y: y };
```
**Key Lesson**: Target tolerance should be large enough to account for NPC movement speed and frame rate variations.

### 6. Inconsistent Idle Duration (Critical Timing Bug)
**Issue**: NPCs idle for much shorter time than configured (e.g., 3-4 seconds instead of 10-15 seconds)
**Root Cause**: DeltaTime accumulation issues, especially with browser tab switching
**Solution**: Use real-time timestamps instead of deltaTime accumulation
```typescript
// ❌ PROBLEMATIC - deltaTime accumulation
private idleTimer: number = 0;
this.idleTimer += deltaTime;
if (this.idleTimer >= this.currentIdleDuration) { /* ... */ }

// ✅ ROBUST - Real timestamp comparison
private idleStartTime: number = 0;
this.idleStartTime = Date.now();
const elapsedTime = Date.now() - this.idleStartTime;
if (elapsedTime >= this.currentIdleDuration) { /* ... */ }
```
**Key Lesson**: Browser tab switching and performance hiccups can cause massive deltaTime spikes (60+ seconds), breaking deltaTime-based timers. Real timestamps are immune to these issues.

### 7. Large DeltaTime Warnings
**Issue**: Console spam with "Extremely large deltaTime detected: 66000ms"
**Root Cause**: Browser tab becomes inactive, causing huge frame gaps
**Solution**: 
```typescript
// Don't cap deltaTime too aggressively, and use timestamps for critical timing
if (deltaTime > 1000) { // Only cap extreme cases
  console.warn(`⚠️ Large deltaTime detected: ${deltaTime}ms, capping to 1000ms`);
  deltaTime = 1000;
}
```
**Key Lesson**: Large deltaTime values are normal when browser tabs become inactive. The key is using appropriate timing methods rather than aggressive capping.

### 8. Animation System Debugging
**Issue**: NPCs appear to enter idle mode but animations don't change
**Solution**: Add comprehensive animation debugging:
```typescript
private playAnimation(npc: WalkingNPC, type: string, direction: string): void {
  const key = `{npcid}-${type}-${direction}`;
  console.log(`🎬 ${npcName}: Attempting to play animation '${key}'`);
  
  if (npc.scene.anims.exists(key)) {
    const currentAnim = npc.anims ? npc.anims.currentAnim : null;
    const currentKey = currentAnim ? currentAnim.key : 'none';
    console.log(`🎭 ${npcName}: Animation '${key}' exists. Current: '${currentKey}'`);
    
    if (!currentAnim || currentAnim.key !== key) {
      console.log(`▶️ ${npcName}: Playing animation '${key}'`);
      npc.play(key, true);
    } else {
      console.log(`⏸️ ${npcName}: Animation '${key}' already playing`);
    }
  } else {
    console.error(`❌ ${npcName}: Animation '${key}' does NOT exist!`);
  }
}
```
**Key Lesson**: Animation debugging should verify animation existence, current state, and playback status.

## Advanced Debugging Techniques

### 1. Real-Time Idle Progress Monitoring
```typescript
// Enhanced idle logging with percentage progress
const progress = (elapsedIdleTime / this.currentIdleDuration) * 100;
console.log(`🕰️ ${npcName}: Idle progress - ${(elapsedIdleTime / 1000).toFixed(1)}s / ${(this.currentIdleDuration / 1000).toFixed(1)}s (${progress.toFixed(1)}%)`);
```

### 2. Patrol Point Verification
```typescript
// Log patrol configuration on initialization
console.log(`🎯 SimplePatrolBehavior: Created with Point A (${pointA.x}, ${pointA.y}) and Point B (${pointB.x}, ${pointB.y})`);
console.log(`🔢 SimplePatrolBehavior: Idle range configured: ${this.minIdleDuration / 1000}-${this.maxIdleDuration / 1000} seconds`);
```

### 3. Movement State Tracking
```typescript
// Continuous movement logging for debugging
if (this.getNPCName(npc) === 'Debug Target') {
  console.log(`🚶 ${npcName} MOVING: (${npc.x.toFixed(1)}, ${npc.y.toFixed(1)}) → (${this.currentTarget.x}, ${this.currentTarget.y}) | Distance: ${distanceToTarget.toFixed(1)}px`);
}
```

### 4. Velocity Verification
```typescript
// Verify velocity is actually being set during idle
if (npc && npc.body && typeof npc.setVelocity === 'function') {
  npc.setVelocity(0, 0);
  const currentVel = npc.body.velocity;
  console.log(`🛑 ${npcName}: Velocity set to (${currentVel.x}, ${currentVel.y})`);
}
```

## Best Practices

### Code Quality
1. **Consistent Naming**: Use consistent naming conventions for all assets and identifiers
2. **Error Handling**: Implement proper error handling for asset loading and quiz data retrieval
3. **Logging**: Add comprehensive console logging for debugging purposes
4. **Code Reuse**: Inherit from existing classes (WalkingNPC) to leverage existing functionality
5. **Performance**: Load assets efficiently and clean up resources when no longer needed
6. **Key Consistency**: Maintain absolute consistency between asset loading keys and frame generation keys

### Physics and Movement
7. **Physics Configuration**: Always use `setImmovable(false)` for walking NPCs to enable movement
8. **Velocity Management**: Set velocity to `(0, 0)` during idle periods and maintain throughout idle duration
9. **Target Tolerance**: Use appropriate distance tolerance (25px recommended) for reliable patrol point detection
10. **Boundary Handling**: Implement world bounds collision detection to prevent NPCs from getting stuck

### Timing and State Management
11. **Real-Time Timing**: Use `Date.now()` timestamps instead of deltaTime accumulation for critical timing
12. **Idle Randomization**: Implement random idle durations (5-20 seconds) for natural behavior variation
13. **State Verification**: Add comprehensive logging to verify state transitions and timing accuracy
14. **DeltaTime Handling**: Cap extreme deltaTime values but don't be overly aggressive (1000ms cap recommended)

### Animation System
15. **Animation Debugging**: Include extensive animation logging to verify existence, state, and playback
16. **Direction Tracking**: Properly track and maintain last movement direction for correct idle animations
17. **Animation Keys**: Ensure animation key generation matches exactly with asset loading keys
18. **Frame Configuration**: Verify spritesheet frame dimensions match actual asset dimensions

### Debugging and Monitoring
19. **Progress Tracking**: Implement detailed progress logging with percentage completion for long operations
20. **State Visualization**: Add clear logging for all major state transitions (moving → idle → moving)
21. **Error Prevention**: Add safety checks for null/undefined objects before method calls
22. **Performance Monitoring**: Log and monitor deltaTime values to detect performance issues

## Testing Checklist

Before deploying a new walking quiz NPC, verify:

### Basic Functionality
- [ ] All required assets exist in the correct locations
- [ ] BootScene loads all NPC assets correctly
- [ ] NPC appears in the game world at the correct position
- [ ] Player can interact with NPC to start quiz
- [ ] Quiz questions load and display correctly
- [ ] Correct answers award $Quiztals
- [ ] Incorrect answers provide appropriate feedback
- [ ] Cooldown system works correctly
- [ ] No console errors during normal operation

### Patrol Behavior (Critical)
- [ ] NPC physics configured with `setImmovable(false)`
- [ ] NPC patrols correctly between defined points (Point A ↔ Point B)
- [ ] NPC reaches patrol endpoints within tolerance (25px)
- [ ] NPC enters idle mode when reaching patrol points
- [ ] Idle duration is random between configured range (5-20 seconds)
- [ ] Idle timing is accurate and consistent (use real timestamps)
- [ ] NPC resumes movement after idle period completes
- [ ] Target switching works correctly (A → B → A)

### Animation System
- [ ] Idle animations play correctly in all directions (up, down, left, right)
- [ ] Walking animations play correctly in all directions
- [ ] Animation transitions work smoothly (walk → idle → walk)
- [ ] Direction tracking maintains correct last direction for idle animations
- [ ] No animation errors in console logs

### Timing and Performance
- [ ] Large deltaTime values handled gracefully (browser tab switching)
- [ ] Idle timing remains accurate despite performance variations
- [ ] No excessive console logging in production builds
- [ ] NPC behavior remains consistent at different frame rates

### Edge Cases
- [ ] NPC behavior when browser tab becomes inactive
- [ ] NPC response to world boundary collisions
- [ ] Multiple NPC interactions don't interfere with each other
- [ ] NPC state recovery after game pause/resume

## Conclusion

Following this guide will ensure consistent, error-free implementation of walking quiz NPCs. The most critical lessons learned from recent implementations:

### 🚨 **Critical Issues to Avoid**:
1. **Physics Misconfiguration**: Never use `setImmovable(true)` on walking NPCs - it completely prevents movement
2. **Timing System Failures**: Always use real timestamps (`Date.now()`) instead of deltaTime accumulation for critical timing
3. **Animation Key Mismatches**: Maintain absolute consistency between asset loading keys and animation generation keys
4. **Target Detection Issues**: Use appropriate tolerance values (25px) for reliable patrol point detection

### ✅ **Success Patterns**:
1. **Robust Timing**: Real-time timestamp comparisons immune to browser performance issues
2. **Comprehensive Debugging**: Extensive logging for all state transitions and timing operations
3. **Proper Physics Setup**: Correct immovable settings and collision configuration
4. **Natural Behavior**: Random idle durations (5-20 seconds) for realistic NPC behavior

### 🔧 **Development Workflow**:
1. **Start with Physics**: Ensure correct `setImmovable(false)` configuration first
2. **Implement Basic Patrol**: Get movement working before adding complexity
3. **Add Timing System**: Use timestamp-based idle detection
4. **Test Extensively**: Verify behavior across different performance conditions
5. **Add Debugging**: Comprehensive logging for troubleshooting

Always test thoroughly and verify all systems work together before deploying to production. Pay special attention to physics configuration, timing accuracy, and animation consistency. The investment in proper debugging and logging will save significant development time when issues arise.

**Reference Documents**:
- `docs/artizengent-implementation-lessons-learned.md` - Specific implementation issues and solutions
- `src/managers/SimplePatrolBehavior.ts` - Current robust patrol behavior implementation
- `src/objects/MrRugPull.ts` - Reference implementation with proper physics configuration
```