// BaseSage.ts
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager'; // Import AudioManager
import QuizNPC from "./QuizNPC"; // Import the QuizNPC base class
import QuiztalRewardLog from '../utils/QuiztalRewardLog'; // Import reward logging

export default class BaseSage extends QuizNPC {
  private directions = ["right", "up", "left", "down"];
  private currentIndex = 0;
  private lastQuestionIndex: number = -1;
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;
  private quizQuestions = [
    { question: "What is Base?", options: ["Layer 1", "Layer 2", "DEX"], answer: "Layer 2" },
    { question: "Who built Base?", options: ["Coinbase", "Binance", "OpenSea"], answer: "Coinbase" },
    { question: "Base uses which mainnet?", options: ["Solana", "Ethereum", "Polygon"], answer: "Ethereum" },
    { question: "What's a big benefit of Base?", options: ["Low gas fees", "Free NFTs", "Mining rewards"], answer: "Low gas fees" },
    { 
      question: "What consensus mechanism does Base use?", 
      options: ["Proof of Work", "Optimistic Rollup", "Proof of Stake"], 
      answer: "Optimistic Rollup" 
    },
    { 
      question: "Which scaling solution is Base built on?", 
      options: ["Arbitrum", "Optimism", "zkSync"], 
      answer: "Optimism" 
    },
    { 
      question: "What can you do on Base?", 
      options: ["Deploy smart contracts", "Mine Bitcoin", "Create Layer 1"], 
      answer: "Deploy smart contracts" 
    },
    { 
      question: "Base transactions are secured by which network?", 
      options: ["Solana", "Ethereum", "BNB Chain"], 
      answer: "Ethereum" 
    },
    { 
      question: "What type of network is Base?", 
      options: ["Sidechain", "Layer 2", "Layer 1"], 
      answer: "Layer 2" 
    },
    { 
      question: "What's a key advantage of using Base?", 
      options: ["Lower fees than L1", "Free transactions", "Faster than Ethereum"], 
      answer: "Lower fees than L1" 
    },
    {
      question: "Which wallet can you use with Base?",
      options: ["Only Coinbase Wallet", "Any EVM wallet", "Only MetaMask"],
      answer: "Any EVM wallet"
    },
    {
      question: "What's Base's approach to decentralization?",
      options: ["Fully centralized", "Progressive decentralization", "Instant decentralization"],
      answer: "Progressive decentralization"
    },
    {
      question: "What programming language is commonly used on Base?",
      options: ["Solidity", "Python", "Java"],
      answer: "Solidity"
    },
    {
      question: "What's the average block time on Base?",
      options: ["2 seconds", "12 seconds", "1 minute"],
      answer: "2 seconds"
    },
    {
      question: "Which bridge can you use to move assets to Base?",
      options: ["Base Bridge", "Rainbow Bridge", "Polygon Bridge"],
      answer: "Base Bridge"
    },
    {
      question: "What's the native token used for gas on Base?",
      options: ["ETH", "BASE", "MATIC"],
      answer: "ETH"
    },
    {
      question: "What type of addresses does Base use?",
      options: ["Ethereum-compatible", "Solana-style", "Bitcoin-style"],
      answer: "Ethereum-compatible"
    },
    {
      question: "Which development framework works with Base?",
      options: ["Hardhat", "Unity", "Android SDK"],
      answer: "Hardhat"
    },
    {
      question: "What's Base's approach to security?",
      options: ["Inherited from Ethereum", "Independent security", "No security"],
      answer: "Inherited from Ethereum"
    },
    {
      question: "How can developers deploy on Base?",
      options: ["Using standard Ethereum tools", "Special Base tools only", "Cannot deploy"],
      answer: "Using standard Ethereum tools"
    },
    {
      question: "What's Base's primary focus?",
      options: ["Onchain accessibility", "Gaming", "Social media"],
      answer: "Onchain accessibility"
    },
    {
      question: "How does Base handle transaction finality?",
      options: ["Through Optimistic rollups", "Instant finality", "Proof of Work"],
      answer: "Through Optimistic rollups"
    },
    {
      question: "What's the challenge period on Base?",
      options: ["7 days", "1 day", "30 days"],
      answer: "7 days"
    },
    {
      question: "Which ecosystem is Base part of?",
      options: ["Ethereum", "Solana", "Cardano"],
      answer: "Ethereum"
    },
    {
      question: "What's Base's primary advantage for users?",
      options: ["Lower costs and faster txs", "Free tokens", "Better graphics"],
      answer: "Lower costs and faster txs"
    },
    {
      question: "How does Base achieve scalability?",
      options: ["Batch transactions off-chain", "More validators", "Bigger blocks"],
      answer: "Batch transactions off-chain"
    },
    {
      question: "What's Base's relationship with Ethereum?",
      options: ["Layer 2 solution", "Competitor", "No relation"],
      answer: "Layer 2 solution"
    },
    {
      question: "What can developers build on Base?",
      options: ["DApps and smart contracts", "Only NFTs", "Only DeFi"],
      answer: "DApps and smart contracts"
    },
    {
      question: "How does Base handle smart contract deployment?",
      options: ["Same as Ethereum", "Different process", "Not supported"],
      answer: "Same as Ethereum"
    },
    {
      question: "What's the main purpose of Base?",
      options: ["Scale Ethereum ecosystem", "Replace Ethereum", "Mine crypto"],
      answer: "Scale Ethereum ecosystem"
    },
    {
      question: "How does Base process transactions?",
      options: ["Batches them to Ethereum", "Independent processing", "Through mining"],
      answer: "Batches them to Ethereum"
    },
    {
      question: "What's unique about Base's development?",
      options: ["Open-source development", "Closed source", "No development"],
      answer: "Open-source development"
    }
  ];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_basesage");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);
    this.createAnimations(scene);
    this.startIdleLoop(scene);

    this.nameLabel = scene.add.text(x, y - 40, "Base Sage", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#33ffcc",
      stroke: "#003366",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#33ffcc",
      stroke: "#003366",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    scene.events.on("update", () => {
      this.nameLabel.setPosition(this.x, this.y - 40);
      this.shoutOutText.setPosition(this.x, this.y - 60);
    });

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
this.startShouting(scene);

// Register for network status change notifications
this.networkMonitor.addNetworkStatusChangeListener(() => {
  // Trigger a shout when network status changes
  this.triggerNetworkStatusShout();
});
}

 private createAnimations(scene: Phaser.Scene) {
    this.directions.forEach((dir, index) => {
      scene.anims.create({
        key: `basesage-idle-${dir}`,
        frames: scene.anims.generateFrameNumbers("npc_basesage", {
          start: index * 6,
          end: index * 6 + 5,
        }),
        frameRate: 3,
        repeat: -1,
      });
    });
  }

   private startIdleLoop(scene: Phaser.Scene) {
      scene.time.addEvent({
        delay: 3000,
        callback: () => {
          this.currentIndex = (this.currentIndex + 1) % this.directions.length;
          const newDirection = this.directions[this.currentIndex];
          this.play(`basesage-idle-${newDirection}`);
        },
        loop: true,
      });
    }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("BaseSage: Dialog already open, ignoring interaction");
      return;
    }
    
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("BaseSage: Network offline - showing offline message");
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
    if (player && Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= 100) {
      // Check if player is on cooldown
      const playerId = player.name || `anon_${Date.now()}`;
      // Use the checkCooldown method which properly handles expired cooldowns
      if (this.checkCooldown(playerId)) {
        console.log("BaseSage: Player is on cooldown or has reached max attempts");
        this.showCooldownDialog();
        return;
      }
      
      this.startQuiz(player);
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log("BaseSage: Interaction blocked, cannot start quiz");
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

    showDialog(this.scene, [
      {
        text: currentQuestion.question,
        avatar: "npc_basesage_avatar",
        options: shuffledOptions.map(option => ({
          text: option,
          callback: () => {
            this.checkAnswer(option, currentQuestion.answer, player);
            // Notify QuizAntiSpamManager that the quiz has ended
            this.notifyQuizEnded();
          }
        }))
      }
    ]);
  }

  private checkAnswer(selected: string, correct: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selected === correct;
    const reward = isCorrect ? Phaser.Math.FloatBetween(0.01, 0.5) : 0;
    
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
        console.log("BaseSage: Cannot show reward dialog - interactions are blocked");
        return;
      }
      
      const dialog = showDialog(this.scene, [
        {
          text: isCorrect
            ? `🌟 Correct! You earned ${reward.toFixed(2)} $Quiztals!`
            : `🙈 Nope! Correct answer was: "${correct}".`,
          avatar: "npc_basesage_avatar",
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
      this.saveReward(player, reward);
    }
    
    // Reset last question index so player can get the same question again in future interactions
    this.lastQuestionIndex = -1;
  }

  private saveReward(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "BaseSage");
    
    // Log reward to local storage for session tracking
    QuiztalRewardLog.logReward("BaseSage", reward);
    
    // Log reward to reward logger (keeping existing functionality)
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "BaseSage", "BaseSage");
      }
    }
  }

  private startShouting(scene: Phaser.Scene) {
    const messages = [
      "Base is blazing fast! 🔥",
      "Click me to test your Base knowledge! 🤔",
      "Layer 2? Layer cake? Let's find out! 🍰",
      "Onchain is the new online! 🌐"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No Base knowledge until connection restored! 🚫📡",
      "Internet connection lost! Base wisdom on hold! 😢🔌",
      "Offline mode: BaseSage's wisdom disabled! ⏸️",
      "No network, no Base knowledge! 🔌",
      "Connection error: Base wisdom unavailable! 📡"
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
          randomMessage = Phaser.Utils.Array.GetRandom(messages);
        }
        
        this.showShout(randomMessage);
        this.startShouting(scene);
      },
      loop: false
    });
  }
private showShout(msg: string) {
  this.shoutOutText.setText(msg).setAlpha(1);
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
    message = "🚨 Network connection lost! BaseSage's wisdom disabled! 🚫";
  } else {
    // Network is online
    message = "✅ Network connection restored! BaseSage's wisdom available! 🌐";
  }
  
  this.showShout(message);
}


  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closest = null;
    let minDist = Number.MAX_VALUE;

    this.scene.children.each(child => {
      if (child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.includes("player")) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
        if (dist < minDist) {
          minDist = dist;
          closest = child;
        }
      }
    });

    return closest;
  }
  
  protected showCooldownDialog() {
    const remainingTime = this.getRemainingCooldownTime();
    const formattedTime = this.formatTimeWithFractional(remainingTime);
    
    this.currentDialog = showDialog(this.scene, [
      {
        text: `🕒 Greetings, explorer! I'm currently recharging my Base knowledge. Please return in ${formattedTime} to continue your learning journey. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
        avatar: "npc_basesage_avatar",
        isExitDialog: true
      }
    ]);
    
    // Set up auto-reset for the dialog after 3 seconds
    // This ensures the dialog reference is cleared even if the player doesn't click
    this.setupDialogAutoReset(3000);
  }
}