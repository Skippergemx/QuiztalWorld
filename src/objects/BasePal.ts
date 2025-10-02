// BasePal.ts
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";
import WalkingNPC from "./WalkingNPC";
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior";
import AudioManager from '../managers/AudioManager';
import { saveQuiztalsToDatabase } from "../utils/Database";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import PhysicsManager from '../managers/PhysicsManager';

export default class BasePal extends WalkingNPC {
  private lectures: any[] = [];
  private currentLectureIndex: number = 0;
  private hasLectureData: boolean = false;
  private lastLectureTime: number = 0;
  private readonly lectureCooldown: number = 30000; // 30 seconds between lectures
  private playerForReward: Phaser.Physics.Arcade.Sprite | null = null; // Store player reference for reward

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
    
    // Create a callback to give reward after dialog is closed
    const onLectureComplete = () => {
      this.giveLectureReward();
    };
    
    const dialogContent = [
      {
        text: dialogText,
        avatar: "npc_basepal_avatar",
        onClose: onLectureComplete
      }
    ];

    showDialog(this.scene, dialogContent);
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
    
    // Generate Did You Know and Tips content
    const didYouKnowContent = this.generateDidYouKnow();
    const tipsContent = this.generateTipsAndTricks();
    
    // Show enhanced reward dialog with additional sections
    const rewardMessage = `🎉 Great job learning about Base Chain!\nYou've earned ${reward.toFixed(2)} $Quiztals for your curiosity!`;
    
    // Create a more detailed dialog with multiple sections
    let enhancedDialogText = `${rewardMessage}\n\n`;
    
    if (didYouKnowContent) {
      enhancedDialogText += `🧠 DID YOU KNOW?\n${didYouKnowContent}\n\n`;
    }
    
    if (tipsContent) {
      enhancedDialogText += `💡 TIPS & TRICKS\n${tipsContent}`;
    }
    
    const rewardDialogContent = [
      {
        text: enhancedDialogText,
        avatar: "npc_basepal_avatar"
        // Removed isExitDialog: true to make it non-auto closing
      }
    ];

    // Use a small delay to ensure the previous dialog is fully closed before showing the reward dialog
    this.scene.time.delayedCall(100, () => {
      showDialog(this.scene, rewardDialogContent);
    });
    
    // Clear player reference
    this.playerForReward = null;
  }
  
  private generateDidYouKnow(): string {
    // Generate detailed "Did You Know" content
    const dykPhrases = [
      "Base Chain was launched by Coinbase in February 2023 as a Layer 2 scaling solution for Ethereum! It was designed to make Ethereum more accessible and affordable for everyone, with a focus on driving global crypto adoption through simplicity and low transaction costs.",
      "Base uses the same security model as Ethereum, making it one of the safest Layer 2 solutions available! Unlike some other Layer 2 solutions that introduce new security assumptions, Base inherits Ethereum's battle-tested security while dramatically reducing gas fees.",
      "Base is completely free to use - no native token required, just pay ETH gas fees! This 'no-native-token' approach means there's no additional token you need to acquire or manage, making it simpler and more accessible for new users to get started.",
      "Base is built on the OP Stack, the same technology that powers Optimism! This means Base benefits from the extensive development and security auditing that has gone into the OP Stack, while also being part of a growing ecosystem of interoperable Layer 2 solutions.",
      "Base has processed over $100 billion in transaction volume since its launch! This rapid adoption shows the strong demand for affordable, secure Ethereum transactions, and Base's success in meeting that demand with its user-friendly approach.",
      "Base supports all Ethereum tools and wallets out of the box with zero modifications! Developers can deploy their existing Solidity smart contracts directly to Base without any changes, and users can connect with their favorite Ethereum wallets like MetaMask, Coinbase Wallet, and Rainbow.",
      "Base blocks are produced every 2 seconds, making transactions lightning fast! This is significantly faster than Ethereum's 12-15 second block times, providing a much smoother user experience for dApps and transactions.",
      "Base is open-source and community-driven, with contributions from developers worldwide! The code is publicly available on GitHub, allowing anyone to review, contribute, or even fork the code to create their own Layer 2 solution based on Base's technology.",
      "Base has attracted major projects like OpenSea, Aave, and Curve to its ecosystem! These leading DeFi and NFT protocols have chosen Base for its combination of security, low fees, and Ethereum compatibility, creating a thriving ecosystem for users.",
      "Base's bridge supports instant withdrawals for ETH and stablecoins! This unique feature allows users to move their ETH and popular stablecoins (USDC, USDT, DAI) from Base back to Ethereum almost instantly, without the typical 7-day waiting period required by other Layer 2 solutions."
    ];
    
    // Return a random DYK phrase
    return Phaser.Utils.Array.GetRandom(dykPhrases);
  }
  
  private generateTipsAndTricks(): string {
    // Generate detailed "Tips & Tricks" content
    const tipsPhrases = [
      "Use the official Base Bridge (base.org/bridge) to move assets between Ethereum and Base - it's trustless, secure, and officially supported by Coinbase! The bridge leverages Ethereum's security for asset transfers and offers instant withdrawals for ETH and major stablecoins.",
      "Try Base with small amounts first to get familiar with the network before moving larger funds! Start by bridging a small amount of ETH or stablecoins, then try interacting with a simple dApp to get comfortable with the faster, cheaper transaction experience.",
      "Check out Base's ecosystem at base.org to discover new dApps and projects! The ecosystem page showcases the latest and greatest projects building on Base, from DeFi protocols to NFT marketplaces to gaming applications.",
      "Use Chainlist.org to easily add Base to your wallet with the correct network configuration! Simply search for 'Base' on Chainlist, then click 'Add to Wallet' to automatically configure your wallet with the correct RPC URL, chain ID, and other network parameters.",
      "Base transactions are much cheaper than Ethereum - perfect for trying new dApps! With gas fees typically 50-100x lower than Ethereum mainnet, Base is ideal for experimenting with new protocols, playing blockchain games, or minting NFTs without worrying about high costs.",
      "Keep an eye on Base's governance proposals if you want to participate in network decisions! While Base is currently centralized, it's moving toward decentralization through a progressive roadmap. Following the governance process allows you to stay informed about future changes and potentially participate in decision-making.",
      "Base supports all your favorite Ethereum wallets like MetaMask, Coinbase Wallet, and Rainbow! Since Base is EVM-compatible, any wallet that works with Ethereum will work seamlessly with Base, making the transition effortless for existing Ethereum users.",
      "Explore Base's developer documentation if you're interested in building on the network! The comprehensive docs at docs.base.org provide everything you need to get started building, from quick start guides to detailed API references and best practices for Base-specific features.",
      "Use Dune Analytics to track Base network metrics and trends! Dune dashboards provide insights into Base's growth, user activity, transaction volume, and ecosystem development, helping you stay informed about the network's progress and opportunities.",
      "Join Base's Discord and Twitter communities to stay updated on the latest developments! These communities are great places to get help, share feedback, learn about new projects, and connect with other Base users and developers building the future of Ethereum scaling."
    ];
    
    // Return a random tips phrase
    return Phaser.Utils.Array.GetRandom(tipsPhrases);
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
}