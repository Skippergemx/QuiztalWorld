// BasePal.ts
import Phaser from "phaser";
import { showDialog, SimpleDialogBox } from "../utils/SimpleDialogBox";
import WalkingNPC from "./WalkingNPC";
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior";
import AudioManager from '../managers/AudioManager';
import { saveQuiztalsToDatabase } from "../utils/Database";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import PhysicsManager from '../managers/PhysicsManager';

export default class BasePal extends WalkingNPC {
  protected currentDialog: any = null;
  private lectures: any[] = [];
  private currentLectureIndex: number = 0;
  private hasLectureData: boolean = false;
  private lastLectureTime: number = 0;
  private readonly lectureCooldown: number = 30000; // 30 seconds between lectures
  private playerReceivedReward: Map<string, number> = new Map(); // Track lecture count for each player
  private playerForReward: Phaser.Physics.Arcade.Sprite | null = null; // Store player reference for reward
  private lectureCompleted: boolean = false; // Track if lecture was completed

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_basepal");

    // Add physics properties
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
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
    
    // Define patrol points (Point A and Point B) - Patrol near Base Sage
    const pointA = { x: x - 100, y: y };
    const pointB = { x: x + 100, y: y };
    
    // Set up the simple patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    // Create animations
    this.createAnimations(scene);
    this.play("basepal-idle-down");

    // Register with the scene as an updateable object
    scene.events.on("update", this.update, this);

    // Create name label
    this.nameLabel = scene.add.text(x, y - 40, "BasePal", {
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

    // Load lecture data
    this.loadLectureData();

    // Start shouting
    this.startShouting(scene);

    // Set up interactive behavior
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
    
    // Set proper depth for rendering
    this.setDepth(10);
    
    // Listen for dialog close events
    scene.events.on("update", () => {
      this.checkDialogClosed();
    });
  }

  private checkDialogClosed() {
    // Check if dialog was closed and lecture was completed
    if (this.lectureCompleted && !this.isDialogOpen()) {
      this.lectureCompleted = false;
      if (this.playerForReward) {
        this.giveLectureReward(this.playerForReward);
        this.playerForReward = null;
      }
    }
  }

  private isDialogOpen(): boolean {
    // Check if any dialog is currently open
    const dialog = SimpleDialogBox.getInstance(this.scene);
    return dialog && dialog['dialogContainer'] && dialog['dialogContainer'].visible;
  }

  private createAnimations(scene: Phaser.Scene) {
    // Check if animations already exist to prevent conflicts
    if (scene.anims.exists("basepal-idle-down")) {
      return;
    }

    // Create animations using the exact frame order as confirmed:
    // Right: frames 0-5, Up: frames 6-11, Left: frames 12-17, Down: frames 18-23
    const animationConfig = [
      { name: 'right', idleStart: 0, idleEnd: 5, walkStart: 0, walkEnd: 5 },
      { name: 'up', idleStart: 6, idleEnd: 11, walkStart: 6, walkEnd: 11 },
      { name: 'left', idleStart: 12, idleEnd: 17, walkStart: 12, walkEnd: 17 },
      { name: 'down', idleStart: 18, idleEnd: 23, walkStart: 18, walkEnd: 23 }
    ];
    
    animationConfig.forEach(config => {
      // Idle animation
      const idleKey = `basepal-idle-${config.name}`;
      
      if (!scene.anims.exists(idleKey)) {
        const idleFrames = scene.anims.generateFrameNumbers("npc_basepal", {
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
      const walkKey = `basepal-walk-${config.name}`;
      
      if (!scene.anims.exists(walkKey)) {
        const walkFrames = scene.anims.generateFrameNumbers("npc_basepal_walk", {
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
    
    // Create default idle animation as fallback
    if (!scene.anims.exists("basepal-idle")) {
      scene.anims.create({
        key: "basepal-idle",
        frames: scene.anims.generateFrameNumbers("npc_basepal", { start: 0, end: 23 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  private async loadLectureData() {
    try {
      const response = await fetch('assets/quizzes/npc-basepal.json');
      const lectureData = await response.json();
      this.lectures = lectureData.lectures || [];
      this.hasLectureData = this.lectures.length > 0;
    } catch (error) {
      console.error("❌ BasePal: Failed to load lecture data:", error);
      this.hasLectureData = false;
    }
  }

  public interact() {
    // Call parent's interaction start method to handle walking behavior
    this.onInteractionStart();

    // Check if a dialog is already open
    if (this.currentDialog) {
      return;
    }

    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        // Check if we're in cooldown period
        const currentTime = Date.now();
        if (currentTime - this.lastLectureTime < this.lectureCooldown) {
          this.showCooldownMessage();
          return;
        }

        // Start the lecture
        this.startLecture(player);
      }
    }
  }

  private startLecture(player: Phaser.Physics.Arcade.Sprite) {
    if (!this.hasLectureData || this.lectures.length === 0) {
      this.showNoLectureDialog();
      return;
    }

    // Update last lecture time
    this.lastLectureTime = Date.now();

    // Get current lecture
    const lecture = this.lectures[this.currentLectureIndex];
    
    // Create lecture dialog with key points
    let dialogText = `🎓 ${lecture.title}\n\n${lecture.content}`;
    
    // Add key points if they exist
    if (lecture.keyPoints && lecture.keyPoints.length > 0) {
      const keyPointsText = lecture.keyPoints.map((point: string, index: number) => 
        `${index + 1}. ${point}`
      ).join('\n');
      
      dialogText += `\n\n🔑 Key Points:\n${keyPointsText}`;
    }
    
    // Store player reference for reward
    this.playerForReward = player;
    this.lectureCompleted = true;
    
    const dialogContent = [
      {
        text: dialogText,
        avatar: "npc_basepal_avatar",
        // Add onClose callback to give reward when dialog is closed
        onClose: () => {
          this.giveLectureReward(player);
        }
      }
    ];

    showDialog(this.scene, dialogContent);
  }

  private giveLectureReward(player: Phaser.Physics.Arcade.Sprite) {
    const playerId = player.name || `anon_${Date.now()}`;
    
    // Track lecture completion count for each player
    let lectureCount = 0;
    if (this.playerReceivedReward.has(playerId)) {
      lectureCount = this.playerReceivedReward.get(playerId) || 0;
    }
    
    // Increment lecture count
    lectureCount++;
    this.playerReceivedReward.set(playerId, lectureCount);
    
    // Calculate progressive reward (increases with each lecture)
    // Base reward + bonus for consecutive lectures
    const baseReward = parseFloat(Phaser.Math.FloatBetween(0.01, 0.15).toFixed(2));
    const bonusReward = parseFloat((0.01 * (lectureCount - 1)).toFixed(2)); // +0.01 for each additional lecture
    const totalReward = parseFloat((baseReward + bonusReward).toFixed(2));
    
    // Cap reward at 0.30 to prevent it from getting too high
    const reward = Math.min(totalReward, 0.30);
    
    // Play reward sound
    const audioManager = AudioManager.getInstance();
    audioManager.playCorrectSound();

    // Save reward to database
    saveQuiztalsToDatabase(playerId, reward, "BasePal");
    
    // Log reward
    QuiztalRewardLog.logReward("BasePal", reward);
    
    // Show reward dialog with progress feedback
    let rewardMessage = `🎉 Great job learning about Base Chain! You've earned ${reward.toFixed(2)} $Quiztals for your curiosity!`;
    
    if (lectureCount > 1) {
      rewardMessage += ` 🔥 Streak bonus: ${lectureCount} lectures completed!`;
    }
    
    const rewardDialogContent = [
      {
        text: rewardMessage,
        avatar: "npc_basepal_avatar",
        isExitDialog: true
      }
    ];

    showDialog(this.scene, rewardDialogContent);
  }

  private showNoLectureDialog() {
    const dialogContent = [
      {
        text: "📚 Oops! I'm still preparing my lecture notes about Base Chain. Please come back later!",
        avatar: "npc_basepal_avatar",
        isExitDialog: true
      }
    ];

    showDialog(this.scene, dialogContent);
  }

  private showCooldownMessage() {
    const remainingTime = this.lectureCooldown - (Date.now() - this.lastLectureTime);
    const seconds = Math.ceil(remainingTime / 1000);
    
    const dialogContent = [
      {
        text: `⏳ I just gave a lecture! Please wait ${seconds} seconds before the next one.`,
        avatar: "npc_basepal_avatar",
        isExitDialog: true
      }
    ];

    showDialog(this.scene, dialogContent);
  }

  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closestPlayer = null;
    let minDistance = Number.MAX_VALUE;

    this.scene.children.each((child) => {
      if (child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.includes("player")) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestPlayer = child;
        }
      }
    });

    return closestPlayer;
  }

  // Handle world bounds collision by switching patrol direction
  private handleWorldBoundsCollision(): void {
    const currentBehavior = this.getBehavior() as SimplePatrolBehavior | null;
    
    if (currentBehavior) {
      // Get current target
      const currentTarget = currentBehavior['currentTarget'];
      
      // Switch to the opposite point
      currentBehavior['currentTarget'] = (currentTarget === currentBehavior['pointA']) 
        ? currentBehavior['pointB'] 
        : currentBehavior['pointA'];
    }
  }

  // Override the update method to handle world bounds collision
  public update(deltaTime: number): void {
    // Call the parent update method to ensure walking behavior is updated
    super.update(deltaTime);
    
    // Check if we've hit the world bounds
    if (this.body && (this.body.blocked.left || this.body.blocked.right || 
        this.body.blocked.up || this.body.blocked.down)) {
      this.handleWorldBoundsCollision();
    }
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Learn about Base Chain with me! 📚",
      "Want to know about Layer 2 scaling? Click me! 🚀",
      "Base Chain lectures available here! 🎓",
      "Earn $Quiztals for learning about Base! 💰"
    ];

    scene.time.addEvent({
      delay: Phaser.Math.Between(8000, 15000),
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

  // Override the getAnimationKey method to handle BasePal's animations
  public getAnimationKey(type: string, direction: string): string {
    const textureKey = this.texture.key;
    
    // Handle BasePal's animations with proper direction support
    if (textureKey === 'npc_basepal' || textureKey === 'npc_basepal_walk') {
      return `basepal-${type}-${direction}`;
    }
    
    // Fall back to parent implementation
    return super.getAnimationKey(type, direction);
  }
}