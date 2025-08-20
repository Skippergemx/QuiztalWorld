import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import QuizNPC from "./QuizNPC"; // Import the QuizNPC base class

export default class MintGirl extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizQuestions = [
    { 
      question: "What is Mint Club?",
      options: ["A new dance move", "A bonding curve platform", "A candy store"],
      answer: "A bonding curve platform"
    },
    { 
      question: "What can you do with Quiztals?",
      options: ["Throw them", "Eat them", "Stake them"],
      answer: "Stake them"
    },
    { 
      question: "Quiztals will eventually become...?",
      options: ["A comic book", "On-chain tokens", "NFT Art"],
      answer: "On-chain tokens"
    },
    { 
      question: "What does Mint Club use for token creation?",
      options: ["Fixed supply", "Random minting", "Bonding curves"],
      answer: "Bonding curves"
    },
    { 
      question: "What can you create on Mint Club?",
      options: ["Only NFTs", "Token & NFT", "Only games"],
      answer: "Token & NFT" 
    },
    { 
      question: "What's special about Mint Club tokens?", 
      options: ["Auto price discovery", "Fixed prices", "Manual pricing"], 
      answer: "Auto price discovery" 
    },
    { 
      question: "How does Mint Club protect users?", 
      options: ["Smart contract locks", "Trust system", "Manual verification"], 
      answer: "Smart contract locks" 
    },
    { 
      question: "What's Mint Club's token model?", 
      options: ["Fair launch curves", "ICO", "Airdrop only"], 
      answer: "Fair launch curves" 
    },
    { 
      question: "How are Mint Club tokens priced?", 
      options: ["By mathematics", "By voting", "By admins"], 
      answer: "By mathematics" 
    },
    { 
      question: "What's unique about Mint Club launches?", 
      options: ["No pre-mines", "Huge pre-mines", "Manual distribution"], 
      answer: "No pre-mines" 
    },
    { 
      question: "How does Mint Club prevent rug pulls?", 
      options: ["Locked liquidity", "Trust badges", "Community voting"], 
      answer: "Locked liquidity" 
    },
    { 
      question: "What can you stake in Mint Club?", 
      options: ["Only NFTs", "MINT tokens", "Only ETH"], 
      answer: "MINT tokens" 
    },
    { 
      question: "What's Mint Club's core feature?", 
      options: ["Gaming", "Social media", "Token creation"], 
      answer: "Token creation" 
    },
    { 
      question: "How does Mint Club pricing work?", 
      options: ["Manual setting", "Random generation", "Automatic curves"], 
      answer: "Automatic curves" 
    },
    { 
      question: "What's Mint Club's approach to fairness?", 
      options: ["Manual oversight", "Community votes", "Mathematical rules"], 
      answer: "Mathematical rules" 
    },
    { 
      question: "What can users launch on Mint Club?", 
      options: ["Only games", "Only websites", "Tokens & NFTs"], 
      answer: "Tokens & NFTs" 
    },
    { 
      question: "How are Mint Club tokens secured?", 
      options: ["Smart contracts", "Manual locks", "Community trust"], 
      answer: "Smart contracts" 
    },
    { 
      question: "What's Mint Club's token mechanism?", 
      options: ["Bonding curves", "Fixed supply", "Infinite minting"], 
      answer: "Bonding curves" 
    },
    { 
      question: "How does Mint Club ensure transparency?", 
      options: ["On-chain verification", "Manual audits", "Community reports"], 
      answer: "On-chain verification" 
    },
    { 
      question: "What's Mint Club's main innovation?", 
      options: ["Fair token launches", "Social media", "Gaming platform"], 
      answer: "Fair token launches" 
    },
    { 
      question: "How do Mint Club tokens start?", 
      options: ["Zero pre-mints", "Large pre-mines", "Manual distribution"], 
      answer: "Zero pre-mints" 
    },
    { 
      question: "What governs Mint Club prices?", 
      options: ["Smart contracts", "Admins", "Market makers"], 
      answer: "Smart contracts" 
    },
    { 
      question: "What makes Mint Club unique?", 
      options: ["Automated fairness", "Manual trading", "Centralized control"], 
      answer: "Automated fairness" 
    },
    { 
      question: "What type of LP tokens does Mint Club use?", 
      options: ["Non-transferable", "Transferable", "No LP tokens"], 
      answer: "Non-transferable" 
    },
    { 
      question: "How does Mint Club handle token burns?", 
      options: ["Automatic via curve", "Manual burns", "No burns allowed"], 
      answer: "Automatic via curve" 
    },
    { 
      question: "What's the minimum to create a token on Mint Club?", 
      options: ["Just gas fees", "1000 MINT", "5 ETH"], 
      answer: "Just gas fees" 
    },
    { 
      question: "How are token sales handled on Mint Club?", 
      options: ["Through curves", "Manual listings", "Fixed price"], 
      answer: "Through curves" 
    },
    { 
      question: "What's Mint Club's approach to token distribution?", 
      options: ["Fair launch only", "Pre-sale first", "Team allocation"], 
      answer: "Fair launch only" 
    },
    { 
      question: "How does Mint Club calculate buy price?", 
      options: ["Bonding formula", "Market makers", "Manual setting"], 
      answer: "Bonding formula" 
    },
    { 
      question: "What's locked in Mint Club smart contracts?", 
      options: ["Liquidity & Logic", "Nothing", "Only tokens"], 
      answer: "Liquidity & Logic" 
    },
    { 
      question: "How can you sell tokens on Mint Club?", 
      options: ["Through the curve", "P2P only", "Not possible"], 
      answer: "Through the curve" 
    },
    { 
      question: "What determines token price in Mint Club?", 
      options: ["Supply & Demand", "Admins", "Fixed rates"], 
      answer: "Supply & Demand" 
    },
    { 
      question: "How are NFTs priced on Mint Club?", 
      options: ["Bonding curves", "Fixed price", "Auction only"], 
      answer: "Bonding curves" 
    },
    { 
      question: "What's unique about Mint Club's NFT system?", 
      options: ["Curve-based pricing", "Random pricing", "Manual pricing"], 
      answer: "Curve-based pricing" 
    },
    { 
      question: "How does Mint Club protect traders?", 
      options: ["Automatic pricing", "Manual reviews", "Community votes"], 
      answer: "Automatic pricing" 
    },
    { 
      question: "What's Mint Club's trading mechanism?", 
      options: ["Smart contracts", "Order books", "P2P trading"], 
      answer: "Smart contracts" 
    },
    { 
      question: "How are fees handled in Mint Club?", 
      options: ["Transparent & fixed", "Variable", "No fees"], 
      answer: "Transparent & fixed" 
    },
    { 
      question: "What's Mint Club's staking model?", 
      options: ["Revenue sharing", "No rewards", "Fixed APY"], 
      answer: "Revenue sharing" 
    },
    { 
      question: "How does Mint Club handle liquidity?", 
      options: ["Auto-locked", "Manual locking", "No locking"], 
      answer: "Auto-locked" 
    },
    { 
      question: "What's special about Mint Club's UI?", 
      options: ["One-click creation", "Complex setup", "No interface"], 
      answer: "One-click creation" 
    },
    { 
      question: "How are new tokens launched on Mint Club?", 
      options: ["Fair curve launch", "ICO model", "Airdrop only"], 
      answer: "Fair curve launch" 
    },
    { 
      question: "What happens when buying on Mint Club?", 
      options: ["Price increases", "Price stays same", "Price drops"], 
      answer: "Price increases" 
    },
    { 
      question: "What's Mint Club's development focus?", 
      options: ["User simplicity", "Complex trading", "Gaming"], 
      answer: "User simplicity" 
    }
];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "mint_girl");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    this.play("mintgirl-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Mint Girl", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00ff00",
      stroke: "#003300",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#00ff00",
      stroke: "#003300",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    scene.events.on("update", () => {
      this.nameLabel.setPosition(this.x, this.y - 40);
      this.shoutOutText.setPosition(this.x, this.y - 60);
    });

    this.startShouting(scene);
    
    // Register for network status change notifications
    this.networkMonitor.addNetworkStatusChangeListener(() => {
      // Trigger a shout when network status changes
      this.triggerNetworkStatusShout();
    });
  }

  private createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists("mintgirl-idle")) {
      scene.anims.create({
        key: "mintgirl-idle",
        frames: scene.anims.generateFrameNumbers("mint_girl", { start: 0, end: 23 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("MintGirl: Dialog already open, ignoring interaction");
      return;
    }
    
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("MintGirl: Network offline - showing offline message");
      const dialog = showDialog(this.scene, [
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);
      
      // Store reference to the new dialog
      this.currentDialog = dialog;
      
      // Set up auto-reset for the dialog after 3 seconds
      // This ensures the dialog reference is cleared even if the player doesn't click
      this.setupDialogAutoReset(3000);
      return;
    }
    
    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        // Check if player is on cooldown
        const playerId = player.name || `anon_${Date.now()}`;
        // Use the checkCooldown method which properly handles expired cooldowns
        if (this.checkCooldown(playerId)) {
          console.log("MintGirl: Player is on cooldown or has reached max attempts");
          this.showCooldownDialog();
          return;
        }
        
        this.startQuiz(player);
      }
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log("MintGirl: Interaction blocked, cannot start quiz");
      return;
    }
    
    // Get random question, ensuring it's not the same as the last one
    let currentQuestionIndex: number;
    if (this.lastQuestionIndex === -1) {
      // First question, select any random question
      currentQuestionIndex = Math.floor(Math.random() * this.quizQuestions.length);
    } else {
      // Select a different question than the last one
      do {
        currentQuestionIndex = Math.floor(Math.random() * this.quizQuestions.length);
      } while (currentQuestionIndex === this.lastQuestionIndex && this.quizQuestions.length > 1);
    }
    
    // Store the index of the current question
    this.lastQuestionIndex = currentQuestionIndex;
    
    const currentQuestion = this.quizQuestions[currentQuestionIndex];
    
    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();
    
    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);
    
    showDialog(this.scene, [{
        text: currentQuestion.question,
        avatar: "npc_mintgirl_avatar",
        options: shuffledOptions.map(option => ({
            text: option,
            callback: () => {
              this.checkAnswer(option, currentQuestion.answer, player);
              // Notify QuizAntiSpamManager that the quiz has ended
              this.notifyQuizEnded();
            }
        }))
    }]);
  }

  private checkAnswer(selectedOption: string, correctAnswer: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selectedOption === correctAnswer;
    const reward = this.calculateReward(isCorrect);
    
    // Record quiz attempt regardless of whether correct or incorrect
    const playerId = player.name || `anon_${Date.now()}`;
    this.recordQuizAttempt(playerId);
    
    // Play sound based on answer
    const audioManager = AudioManager.getInstance();
    if (isCorrect) {
        audioManager.playCorrectSound();
    } else {
        audioManager.playWrongSound();
    }

    // Close the current dialog immediately
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    this.scene.time.delayedCall(500, () => {
        // Check if interactions are blocked before showing reward dialog
        if (this.isInteractionBlocked()) {
          console.log("MintGirl: Cannot show reward dialog - interactions are blocked");
          return;
        }
        
        const dialog = showDialog(this.scene, [
            {
                text: isCorrect
                    ? `🍃 Correct! You earned ${reward.toFixed(2)} $Quiztals from the Mint Club!`
                    : `🌪️ Nope! The correct answer was "${correctAnswer}". Try again later!`,
                avatar: "npc_mintgirl_avatar",
                isExitDialog: true
            }
        ]);
        
        // Store reference to the new dialog
        this.currentDialog = dialog;
        
        // Set up auto-reset for the dialog after 3 seconds
        // This ensures the dialog reference is cleared even if the player doesn't click
        this.setupDialogAutoReset(3000);
    });

    if (isCorrect) {
        this.saveRewardToDatabase(player, reward);
    }
    
    // Reset last question index so player can get the same question again in future interactions
    this.lastQuestionIndex = -1;
  }

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "MintGirl");
    
    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "MintGirl", "MintGirl");
      }
    }
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

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Hey! Ever heard of Mint Club? 🌱",
      "Want to turn Quiztals into real tokens? Ask me! 💰",
      "On-chain Quiztals are the future! 🚀",
      "Click me to earn $Quiztals! 🎉"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No token creation until connection restored! 🚫📡",
      "Internet connection lost! Quiztals on hold! 😢🔌",
      "Offline mode: MintGirl's token creation disabled! ⏸️",
      "No network, no token creation! 🔌",
      "Connection error: Token creation unavailable! 📡"
    ];

    scene.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        let randomMessage;
        
        // Check network connectivity to determine which message to show
        if (!this.networkMonitor.getIsOnline()) {
          // Network is offline, show offline message
          randomMessage = Phaser.Utils.Array.GetRandom(networkOfflineMessages);
        } else {
          // Network is online, show regular message
          randomMessage = Phaser.Utils.Array.GetRandom(shoutMessages);
        }
        
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

private triggerNetworkStatusShout(): void {
  let message: string;
  
  if (!this.networkMonitor.getIsOnline()) {
    // Network is offline
    message = "🚨 Network connection lost! MintGirl's token creation disabled! 🚫";
  } else {
    // Network is online
    message = "✅ Network connection restored! MintGirl's token creation available! 🌐";
  }
  
  this.showShout(message);
}

  
  protected showCooldownDialog() {
    const remainingTime = this.getRemainingCooldownTime();
    const formattedTime = this.formatTimeWithFractional(remainingTime);
    
    this.currentDialog = showDialog(this.scene, [
      {
        text: `🍃 Hello there! I'm taking a short break to recharge my Mint Club knowledge! Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
        avatar: "npc_mintgirl_avatar",
        isExitDialog: true
      }
    ]);
    
    // Set up auto-reset for the dialog after 3 seconds
    // This ensures the dialog reference is cleared even if the player doesn't click
    this.setupDialogAutoReset(3000);
  }
}