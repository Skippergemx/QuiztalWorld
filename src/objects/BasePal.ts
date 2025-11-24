// BasePal.ts
import Phaser from "phaser";
import WalkingNPC from "./WalkingNPC";
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior";
import AudioManager from '../managers/AudioManager';
import { saveQuiztalsToDatabase } from "../utils/Database";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import PhysicsManager from '../managers/PhysicsManager';
import { showOptimizedRewardDialog, closeOptimizedRewardDialog, OptimizedRewardDialogData } from "../utils/OptimizedRewardDialog";
import { NPC_PERSONALITY_CONFIG } from "../config/NPCPersonalityConfig";

export default class BasePal extends WalkingNPC {
  private lectures: any[] = [];
  private currentLectureIndex: number = 0;
  private hasLectureData: boolean = false;
  private lastLectureTime: number = 0;
  private readonly lectureCooldown: number = 30000; // 30 seconds between lectures
  private playerForReward: Phaser.Physics.Arcade.Sprite | null = null; // Store player reference for reward
  private personality = NPC_PERSONALITY_CONFIG["npc_basepal"];

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
    
    // Safely play initial animation
    if (scene.anims.exists("basepal-idle-down")) {
      this.play("basepal-idle-down");
    } else {
      // Fallback to default idle animation
      if (scene.anims.exists("basepal-idle")) {
        this.play("basepal-idle");
      }
    }

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
        try {
          const idleFrames = scene.anims.generateFrameNumbers("npc_basepal", {
            start: config.idleStart,
            end: config.idleEnd,
          });
          
          // Check if frames were generated successfully
          if (idleFrames && idleFrames.length > 0) {
            scene.anims.create({
              key: idleKey,
              frames: idleFrames,
              frameRate: 3,
              repeat: -1,
            });
          }
        } catch (error) {
          console.error(`❌ BasePal: Failed to create idle animation ${idleKey}:`, error);
        }
      }

      // Walk animation
      const walkKey = `basepal-walk-${config.name}`;
      
      if (!scene.anims.exists(walkKey)) {
        try {
          const walkFrames = scene.anims.generateFrameNumbers("npc_basepal_walk", {
            start: config.walkStart,
            end: config.walkEnd,
          });
          
          // Check if frames were generated successfully
          if (walkFrames && walkFrames.length > 0) {
            scene.anims.create({
              key: walkKey,
              frames: walkFrames,
              frameRate: 8,
              repeat: -1,
            });
          }
        } catch (error) {
          console.error(`❌ BasePal: Failed to create walk animation ${walkKey}:`, error);
        }
      }
    });
    
    // Create default idle animation as fallback
    if (!scene.anims.exists("basepal-idle")) {
      try {
        const defaultFrames = scene.anims.generateFrameNumbers("npc_basepal", { start: 0, end: 23 });
        if (defaultFrames && defaultFrames.length > 0) {
          scene.anims.create({
            key: "basepal-idle",
            frames: defaultFrames,
            frameRate: 3,
            repeat: -1,
          });
        }
      } catch (error) {
        console.error("❌ BasePal: Failed to create default idle animation:", error);
      }
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

    // Check player stamina before allowing interaction
    if (!this.checkPlayerStamina()) {
      console.log("BasePal: Not enough stamina for interaction");
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
    
    // Store player reference for reward
    this.playerForReward = player;
    
    // Format lecture content for better readability
    const formattedContent = this.formatLectureContent(lecture.content);
    
    // Format key points as a bulleted list
    const formattedKeyPoints = lecture.keyPoints && lecture.keyPoints.length > 0 
      ? `🔑 Key Points:\n${lecture.keyPoints.map((point: string) => 
          `  • ${point}`).join('\n')}`
      : undefined;
    
    // Create lecture dialog using reward dialog structure
    const lectureDialogData: OptimizedRewardDialogData = {
      npcName: "BasePal",
      npcAvatar: "npc_basepal_avatar",
      rewardMessage: `🎓 ${lecture.title}\n\n${formattedContent}`,
      didYouKnow: formattedKeyPoints,
      tipsAndTricks: this.generateLectureTips(),
      rewardAmount: 0, // No reward amount for lectures
      onClose: () => {
        // Close the dialog immediately before showing reward
        closeOptimizedRewardDialog();
        this.giveLectureReward();
      }
    };

    showOptimizedRewardDialog(this.scene, lectureDialogData);
  }

  private formatLectureContent(content: string): string {
    // Split content into paragraphs for better readability
    // Handle different sentence delimiters
    const sentences = content.split(/(?<=[.!?])\s+/).filter(p => p.trim().length > 0);
    
    // Add periods back and create paragraphs with single line spacing
    return sentences.map(p => {
      // Ensure proper punctuation
      let formatted = p.trim();
      if (!/[.!?]$/.test(formatted)) {
        formatted += '.';
      }
      return formatted;
    }).join('\n\n').trim(); // Use double newline for paragraph breaks
  }

  private generateLectureTips(): string {
    // Generate tips related to learning and education
    const tips = this.personality.tipDescriptions;
    
    return Phaser.Utils.Array.GetRandom(tips);
  }

  private giveLectureReward() {
    if (!this.playerForReward) return;
    
    const player = this.playerForReward;
    const playerId = player.name || `anon_${Date.now()}`;
    
    // Simple reward without streak system - random amount between 0.01 and 0.15
    const reward = parseFloat(Phaser.Math.FloatBetween(0.01, 0.15).toFixed(2));
    
    // Play reward sound
    const audioManager = AudioManager.getInstance();
    audioManager.playCorrectSound();

    // Save reward to database
    saveQuiztalsToDatabase(playerId, reward, "BasePal");
    
    // Log reward
    QuiztalRewardLog.logReward("BasePal", reward);
    
    // Use a small delay to ensure the previous dialog is fully closed before showing the reward dialog
    this.scene.time.delayedCall(500, () => {
      // Generate Did You Know and Tips content
      const didYouKnowContent = this.generateDidYouKnow();
      const tipsContent = this.generateTipsAndTricks();
      
      // Show enhanced reward dialog with additional sections
      const rewardMessage = `🎉 Awesome job learning about Base Chain!\nYou've earned ${reward.toFixed(2)} $Niftdoods for being such a curious learner!`;
      
      const rewardDialogData: OptimizedRewardDialogData = {
        npcName: "BasePal",
        npcAvatar: "npc_basepal_avatar",
        rewardMessage: rewardMessage,
        didYouKnow: didYouKnowContent,
        tipsAndTricks: tipsContent,
        rewardAmount: reward,
        onClose: () => {
          this.playerForReward = null;
        }
      };

      showOptimizedRewardDialog(this.scene, rewardDialogData);
    });
  }
  
  private generateDidYouKnow(): string {
    // Generate detailed "Did You Know" content
    const dykPhrases = [
      "Hey, did you know Base Chain was launched by Coinbase in February 2023? It was designed to make Ethereum more accessible and affordable for everyone!",
      "Here's a cool fact: Base uses the same security model as Ethereum, making it one of the safest Layer 2 solutions available!",
      "Fun fact: Base is completely free to use - no native token required, just pay ETH gas fees! Pretty cool, right?",
      "Base is built on the OP Stack, the same technology that powers Optimism! This means it benefits from extensive development and security auditing.",
      "Guess what? Base has processed over $100 billion in transaction volume since its launch! That's some serious adoption!",
      "Base supports all Ethereum tools and wallets out of the box with zero modifications! Developers can deploy their existing Solidity smart contracts directly.",
      "Base blocks are produced every 2 seconds, making transactions lightning fast! That's way faster than Ethereum's 12-15 second block times.",
      "Base is open-source and community-driven, with contributions from developers worldwide! The code is publicly available on GitHub for anyone to review.",
      "Base has attracted major projects like OpenSea, Aave, and Curve to its ecosystem! These leading protocols chose Base for its security and low fees.",
      "Base's bridge supports instant withdrawals for ETH and stablecoins! You can move your assets back to Ethereum almost instantly, without the typical waiting period.",
      "Here's something interesting: Base was designed to be a 'superchain' compatible network, meaning it can interoperate with other OP Stack chains!",
      "Did you know that Base has a 'superchain' token bridge that allows for trustless transfers between all OP Stack chains?",
      "Fun tidbit: Base's sequencer is currently centralized but will be decentralized over time as part of their progressive decentralization plan.",
      "Cool fact: Base is one of the few Layer 2 solutions that offers instant withdrawals for ETH and stablecoins, while others require a 7-day waiting period.",
      "Here's a neat detail: Base's development is heavily influenced by the Optimism Collective, which focuses on sustainable and equitable growth."
    ];
    
    // Return a random DYK phrase
    return Phaser.Utils.Array.GetRandom(dykPhrases);
  }
  
  private generateTipsAndTricks(): string {
    // Generate detailed "Tips & Tricks" content
    const tipsPhrases = [
      "Pro tip: Use the official Base Bridge (base.org/bridge) to move assets between Ethereum and Base - it's trustless, secure, and officially supported!",
      "Here's a helpful tip: Try Base with small amounts first to get familiar with the network before moving larger funds!",
      "Check out Base's ecosystem at base.org to discover new dApps and projects! There's always something exciting happening there.",
      "Quick tip: Use Chainlist.org to easily add Base to your wallet with the correct network configuration!",
      "Base transactions are much cheaper than Ethereum - perfect for trying new dApps! Gas fees are typically 50-100x lower.",
      "Keep an eye on Base's governance proposals if you want to participate in network decisions! It's moving toward decentralization.",
      "Base supports all your favorite Ethereum wallets like MetaMask, Coinbase Wallet, and Rainbow! The transition is effortless.",
      "Explore Base's developer documentation if you're interested in building on the network! The docs at docs.base.org are really comprehensive.",
      "Use Dune Analytics to track Base network metrics and trends! It's a great way to stay informed about the network's progress.",
      "Join Base's Discord and Twitter communities to stay updated on the latest developments! Great places to get help and connect with other users.",
      "Want to save even more on gas fees? Try using a gas fee tracker to deploy your contracts when fees are lowest!",
      "When bridging assets, always use the official Base Bridge for maximum security - avoid third-party bridges when possible.",
      "If you're a developer, check out the Base Builder Kit which provides templates and tools to get your project started quickly.",
      "For NFT enthusiasts, Base has some amazing marketplaces with significantly lower minting costs than Ethereum mainnet.",
      "Remember to bookmark the Base status page (status.base.org) to check for any network issues or maintenance."
    ];
    
    // Return a random tips phrase
    return Phaser.Utils.Array.GetRandom(tipsPhrases);
  }

  private showNoLectureDialog() {
    const dialogData: OptimizedRewardDialogData = {
      npcName: "BasePal",
      npcAvatar: "npc_basepal_avatar",
      rewardMessage: "📚 Oops! I'm still preparing my lecture notes about Base Chain. Come back soon and I'll have something awesome to share with you!",
      rewardAmount: 0
    };

    showOptimizedRewardDialog(this.scene, dialogData);
  }

  private showCooldownMessage() {
    const remainingTime = this.lectureCooldown - (Date.now() - this.lastLectureTime);
    const seconds = Math.ceil(remainingTime / 1000);
    
    // Get a random cooldown message from personality config
    const cooldownTemplates = this.personality.cooldownMessageTemplates;
    const template = Phaser.Utils.Array.GetRandom(cooldownTemplates);
    const message = template.replace("{time}", `${seconds} seconds`);
    
    const dialogData: OptimizedRewardDialogData = {
      npcName: "BasePal",
      npcAvatar: "npc_basepal_avatar",
      rewardMessage: message,
      rewardAmount: 0
    };

    showOptimizedRewardDialog(this.scene, dialogData);
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
    const shoutMessages = this.personality.shoutMessageTemplates;

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
}