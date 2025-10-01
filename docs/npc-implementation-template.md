# NPC Implementation Template Guide

This document serves as a comprehensive template and plug-and-play guide for implementing new Walking Quiz NPCs in QuiztalWorld. By following this standardized approach, new NPCs can be implemented quickly and consistently.

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

## Implementation Template

### 1. Asset Preparation Template

#### Required Assets
Each walking quiz NPC requires three specific assets:
- **Avatar**: A static image for dialog boxes (e.g., `npc_{npcname}_avatar.png`)
- **Idle Animation**: Spritesheet for idle state (e.g., `npc_{npcname}_idle_1.png`)
- **Walk Animation**: Spritesheet for walking state (e.g., `npc_{npcname}_walk_1.png`)

#### Asset Placement Template
```
public/assets/npc/
├── npc_{npcid}_avatar.png
├── npc_{npcid}_idle_1.png
└── npc_{npcid}_walk_1.png
```

### 2. Quiz Data Template

#### JSON Structure Template
```json
{
  "npcId": "{npcid}",
  "npcName": "{NPC Display Name}",
  "theme": "{Quiz Theme}",
  "description": "{Brief description of quiz content}",
  "questions": [
    {
      "question": "{Question text?}",
      "options": [
        "{Correct option}",
        "{Incorrect option 1}",
        "{Incorrect option 2}"
      ],
      "answer": "{Correct option}",
      "explainer": "{Educational explanation of the concept (120-200 characters)}"
    }
  ]
}
```

#### File Naming Template
`npc-{npcid}.json` (e.g., `npc-artizengent.json`)

### 3. BootScene Asset Loading Template

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

### 4. AssetManager Configuration Template

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

### 5. NPCQuizManager Update Template

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

### 6. NPCManager Configuration Template

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

### 7. GameScene Registration Template

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

### 8. SimplePatrolBehavior Animation Handling Template

Add special animation handling for the new NPC in `src/managers/SimplePatrolBehavior.ts`:

1. In the playAnimation method:
```typescript
// Special handling for {NPC Name} to ensure correct animations
else if (npc.texture && npc.texture.key === 'npc_{npcid}') {
  const key = `{npcid}-${type}-{direction}`;
  // ... rest of animation handling logic
}
```

2. In the onInteractionStart method:
```typescript
// Special handling for {NPC Name} to ensure correct animations
else if (npc.texture && npc.texture.key === 'npc_{npcid}') {
  const key = `{npcid}-idle-{npc['lastDirection'] || 'down'}`;
  // ... rest of idle animation logic
}
```

### 9. WalkingNPC Animation Key Generation Template

Add special case for animation key generation in `src/objects/WalkingNPC.ts`:

```typescript
// Special case for {NPC Name}'s animations
if (textureKey === 'npc_{npcid}' || textureKey === 'npc_{npcid}_walk') {
  const key = `{npcid}-{type}-{direction}`;
  console.log(`Generated animation key for ${textureKey}: ${key}`);
  return key;
}
```

### 10. NPC Class Implementation Template

Create a new NPC class file at `src/objects/{NPCName}.ts`:

```typescript
import Phaser from "phaser";
import { showDialog, SimpleDialogBox } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import WalkingNPC from "./WalkingNPC";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior";
import PhysicsManager from '../managers/PhysicsManager';
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';

export default class {NPCName} extends WalkingNPC {
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = '{npcid}';
  private hasQuizData: boolean = false;
  private useEnhancedDialog: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_{npcid}");

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);
    
    // Load quiz data for {NPC Name}
    this.quizManager.loadQuizData(this.npcId).then(() => {
      this.hasQuizData = true;
    }).catch((error) => {
        console.warn('⚠️ {NPCName}: Failed to load quiz data:', error);
    });
    
    // Add physics properties
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    // Set up physics
    this.setImmovable(true);
    this.setCollideWorldBounds(true);
    
    // Register with PhysicsManager for proper collision handling
    const physicsManager = PhysicsManager.getInstance(scene);
    if (physicsManager) {
      physicsManager.setupNPCCollisions(this);
      
      // Add specific collider for player interaction
      const player = this.getClosestPlayer();
      if (player) {
        physicsManager.addCollision(this, player);
      }
    }
    
    // Define patrol points
    const pointA = { x: x - 100, y: y };
    const pointB = { x: x + 100, y: y };
    
    // Set up the simple patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    this.createAnimations(scene);
    this.play("{npcid}-idle-down");

    // Register with the scene as an updateable object
    scene.events.on('update', this.update, this);

    // Use the inherited nameLabel property
    this.nameLabel = scene.add.text(x, y - 40, "{NPC Display Name}", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#{color}", 
      stroke: "#{strokeColor}",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    // Use the inherited shoutOutText property
    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#{color}",
      stroke: "#{strokeColor}",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    this.startShouting(scene);

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
    
    // Set proper depth for rendering
    this.setDepth(10);
  }

  private handleWorldBoundsCollision(): void {
    const currentBehavior = this.getBehavior() as SimplePatrolBehavior | null;
    
    if (currentBehavior) {
      const currentTarget = currentBehavior['currentTarget'];
      currentBehavior['currentTarget'] = (currentTarget === currentBehavior['pointA']) 
        ? currentBehavior['pointB'] 
        : currentBehavior['pointA'];
    }
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (this.body && (this.body.blocked.left || this.body.blocked.right || 
        this.body.blocked.up || this.body.blocked.down)) {
      this.handleWorldBoundsCollision();
    }
  }

  private createAnimations(scene: Phaser.Scene) {
    if (scene.anims.exists("{npcid}-idle-down")) {
      return;
    }

    const animationConfig = [
      { name: 'right', idleStart: 0, idleEnd: 5, walkStart: 0, walkEnd: 5 },
      { name: 'up', idleStart: 6, idleEnd: 11, walkStart: 6, walkEnd: 11 },
      { name: 'left', idleStart: 12, idleEnd: 17, walkStart: 12, walkEnd: 17 },
      { name: 'down', idleStart: 18, idleEnd: 23, walkStart: 18, walkEnd: 23 }
    ];
    
    animationConfig.forEach(config => {
      // Idle animation
      const idleKey = `{npcid}-idle-${config.name}`;
      
      if (!scene.anims.exists(idleKey)) {
        const idleFrames = scene.anims.generateFrameNumbers("npc_{npcid}", {
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
      const walkKey = `{npcid}-walk-${config.name}`;
      
      if (!scene.anims.exists(walkKey)) {
        const walkFrames = scene.anims.generateFrameNumbers("npc_{npcid}_walk", {
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
  
  public interact() {
    this.onInteractionStart();
    
    if (this.currentDialog) {
      return;
    }

    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      
      if (distance <= 100) {
        const playerId = player.name || `anon_${Date.now()}`;
        
        if (this.checkCooldown(playerId)) {
          this.showCooldownDialog();
          return;
        }

        this.startQuiz(player);
      }
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    if (this.isInteractionBlocked()) {
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

    if (this.useEnhancedDialog) {
      this.startEnhancedQuiz(player);
    } else {
      this.startSimpleQuiz(player);
    }
  }

  private startEnhancedQuiz(player: Phaser.Physics.Arcade.Sprite) {
    this.notifyQuizStarted();
    
    this.enhancedQuizManager.startQuizSession(this.npcId).then(session => {
      if (!session) {
        console.error("{NPCName}: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("{NPCName}: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "{NPC Display Name}",
        npcAvatar: "npc_{npcid}_avatar",
        theme: session.theme,
        difficulty: currentQuestion.difficulty,
        question: currentQuestion.question,
        options: currentQuestion.options,
        explainer: currentQuestion.explanation,
        questionNumber: 1,
        totalQuestions: 1,
        onAnswer: (selectedAnswer: string) => this.handleEnhancedAnswer(selectedAnswer, currentQuestion, player),
        onClose: () => this.notifyQuizEnded()
      });
      
      this.currentDialog = dialog as any;
    }).catch(error => {
      console.error("{NPCName}: Enhanced quiz session error:", error);
      this.startSimpleQuiz(player);
    });
  }

  private handleEnhancedAnswer(selectedOption: string, enhancedQuestion: any, player: Phaser.Physics.Arcade.Sprite) {
    const playerId = player.name || `anon_${Date.now()}`;
    
    const isCorrect = this.enhancedQuizManager.submitAnswer(selectedOption, 0, playerId);
    const reward = this.enhancedQuizManager.calculateEnhancedReward(isCorrect, enhancedQuestion.difficulty);
    
    this.recordQuizAttempt(playerId);
    this.enhancedQuizManager.playRewardAudio(isCorrect);
    this.enhancedQuizManager.completeQuizSession();
    this.notifyQuizEnded();
    
    this.scene.time.delayedCall(500, () => {
      if (this.isInteractionBlocked()) {
        return;
      }
      
      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: isCorrect
            ? `{🎉|✅|🎨|🔮|💎} Correct! You've earned ${reward.toFixed(2)} $Quiztals! {Custom success message}`
            : `{😈|❌|🖌️|🧪|⚠️} Not quite! The correct answer was: "${enhancedQuestion.answer}". {Custom failure message}`,
          avatar: "npc_{npcid}_avatar",
          isExitDialog: true
        }
      ]);
      
      if (isCorrect) {
        this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, reward, "{NPCName}");
      }
      
      this.setupDialogAutoReset(3000);
    });
    
    this.scene.time.delayedCall(3500, () => {
      this.lastQuestionIndex = -1;
      this.onInteractionEnd();
    });
  }

  private startSimpleQuiz(player: Phaser.Physics.Arcade.Sprite) {
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
        return;
      }

      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: isCorrect
            ? `{🎉|✅|🎨|🔮|💎} Correct! You've earned ${reward.toFixed(2)} $Quiztals! {Custom success message}`
            : `{😈|❌|🖌️|🧪|⚠️} Not quite! The correct answer was: "${correctAnswer}". {Custom failure message}`,
          avatar: "npc_{npcid}_avatar",
          isExitDialog: true
        }
      ]);

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

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.05, 0.7).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "{NPCName}");

    QuiztalRewardLog.logReward("{NPCName}", reward);
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "{Custom shout message 1} 🎨",
      "{Custom shout message 2} 🔮",
      "{Custom shout message 3} 💎",
      "{Custom shout message 4} 🚀",
      "{Custom shout message 5} ⛓️",
      "{Custom shout message 6} 🌟"
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

  private showShout(message: string) {
    this.shoutOutText.setText(message).setAlpha(1);
    this.scene.tweens.add({
      targets: this.shoutOutText,
      alpha: 0,
      duration: 2000,
      delay: 3000,
    });
  }

  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closestPlayer = null;
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

  protected showCooldownDialog() {
    this.scene.time.delayedCall(3000, () => {
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      
      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: `{🎨|🔮|💎} Hello there! {Custom cooldown message} Please return in ${formattedTime}. In the meantime, why not visit other experts around the campus? They might have knowledge to share! 🏫`,
          avatar: "npc_{npcid}_avatar",
          isExitDialog: true
        }
      ]);
      
      this.setupDialogAutoReset(3000);
    });
  }
}
```

## Quick Implementation Checklist

### Asset Preparation
- [ ] Create avatar image (`npc_{npcid}_avatar.png`)
- [ ] Create idle spritesheet (`npc_{npcid}_idle_1.png`)
- [ ] Create walk spritesheet (`npc_{npcid}_walk_1.png`)
- [ ] Place assets in `public/assets/npc/`

### Quiz Data
- [ ] Create quiz JSON file (`npc-{npcid}.json`)
- [ ] Add 5-10 questions with 3 options each
- [ ] Include educational explainers for each question
- [ ] Place in `public/assets/quizzes/`

### Code Implementation
- [ ] Add asset loading to BootScene.ts
- [ ] Add configuration to AssetManager.ts
- [ ] Add NPC ID to NPCQuizManager.ts
- [ ] Add configuration to NPCManager.ts
- [ ] Register NPC in GameScene.ts
- [ ] Add animation handling to SimplePatrolBehavior.ts
- [ ] Add animation key generation to WalkingNPC.ts
- [ ] Create NPC class file

### Testing
- [ ] Verify asset loading
- [ ] Test animations
- [ ] Test quiz functionality
- [ ] Test reward system
- [ ] Test cooldown system
- [ ] Test mobile responsiveness

## Common Customization Points

### Visual Customization
- **Colors**: Update name label and shout text colors
- **Shout Messages**: Customize messages to match NPC theme
- **Success/Failure Messages**: Personalize reward messages
- **Avatar**: Use unique avatar image

### Behavioral Customization
- **Patrol Pattern**: Modify patrol points for different movement patterns
- **Shout Frequency**: Adjust timing of shout messages
- **Reward Range**: Customize reward calculation
- **Cooldown Duration**: Modify cooldown timing

### Thematic Customization
- **Theme**: Match quiz content to NPC role
- **Emojis**: Use theme-appropriate emojis in messages
- **Terminology**: Use domain-specific language
- **Examples**: Include relevant examples in questions

## Troubleshooting Guide

### Common Issues
1. **Texture Not Found**: Verify asset paths and filenames
2. **Animation Not Playing**: Check frame numbers and key names
3. **Quiz Not Loading**: Verify quiz JSON structure and NPC ID
4. **Dialog Not Showing**: Check dialog implementation pattern
5. **Rewards Not Saving**: Verify database integration

### Debug Tools
- Browser console for error messages
- Network tab to verify asset loading
- LocalStorage inspection for quiz data
- Phaser debugger for animation issues

## Best Practices

1. **Consistency**: Follow naming conventions and patterns
2. **Performance**: Optimize assets and code for mobile
3. **Accessibility**: Ensure adequate touch targets
4. **Education**: Focus on educational value in questions
5. **Engagement**: Create interesting, relevant content
6. **Testing**: Test thoroughly on multiple devices
7. **Documentation**: Keep implementation notes updated

This template provides a plug-and-play approach to NPC implementation, allowing for rapid development while maintaining consistency and quality across all NPCs in QuiztalWorld.