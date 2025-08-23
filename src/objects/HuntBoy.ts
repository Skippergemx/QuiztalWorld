// HuntBoy.ts
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox"; // Import dialog function
import { saveQuiztalsToDatabase } from "../utils/Database"; // Firestore save utility
import AudioManager from '../managers/AudioManager'; // Import the AudioManager
import QuizNPC from "./QuizNPC"; // Import the QuizNPC base class
import QuiztalRewardLog from '../utils/QuiztalRewardLog'; // Import reward logging

export default class HuntBoy extends QuizNPC {
  private directions = ["right", "up", "left", "down"];
  private currentIndex = 0;
  private lastQuestionIndex: number = -1;

  // Quiz data
  private quizQuestions = [
    { question: "What is Base?", options: ["Layer 2 Ethereum", "Bitcoin Wallet", "Game Token"], answer: "Layer 2 Ethereum" },
    { question: "What is Hunt Town?", options: ["A Web3 City", "A Developer Community", "A Blockchain Network"], answer: "A Developer Community" },
    { 
      question: "What can developers do in Hunt Town?", 
      options: ["Build Web3 projects", "Hunt animals", "Play chess"], 
      answer: "Build Web3 projects" 
    },
    { 
      question: "What's Hunt Town's main focus?", 
      options: ["Web3 development", "Gaming", "Social media"], 
      answer: "Web3 development" 
    },
    { 
      question: "Which chain is Hunt Town building on?", 
      options: ["Base", "Solana", "Polygon"], 
      answer: "Base" 
    },
    { 
      question: "What's special about Hunt Town's community?", 
      options: ["Developer-focused", "Gamers only", "NFT traders only"], 
      answer: "Developer-focused" 
    },
    { 
      question: "What can you find in Hunt Town?", 
      options: ["Web3 builders", "Pokemon", "Cars"], 
      answer: "Web3 builders" 
    },
    { 
      question: "What's Hunt Town's approach to Web3?", 
      options: ["Build useful tools", "Just trade NFTs", "Only gaming"], 
      answer: "Build useful tools" 
    },
    { 
      question: "Why choose Base for Hunt Town?", 
      options: ["Low fees & ETH security", "Free tokens", "No reason"], 
      answer: "Low fees & ETH security" 
    },
    { 
      question: "What's Hunt Town's vision?", 
      options: ["Empower Web3 builders", "Just gaming", "NFT trading"], 
      answer: "Empower Web3 builders" 
    },
    { 
      question: "Who can join Hunt Town?", 
      options: ["Anyone interested in Web3", "Only experts", "Nobody"], 
      answer: "Anyone interested in Web3" 
    },
    { 
      question: "What makes Hunt Town unique?", 
      options: ["Developer community", "High gas fees", "Closed source"], 
      answer: "Developer community" 
    },
    { 
      question: "What can you learn in Hunt Town?", 
      options: ["Web3 development", "Cooking", "Farming"], 
      answer: "Web3 development" 
    },
    { 
      question: "How does Hunt Town help builders?", 
      options: ["Community support", "Free lunch", "Free hosting"], 
      answer: "Community support" 
    },
    { 
      question: "What's Hunt Town's relationship with Base?", 
      options: ["Building on Base", "Competing with Base", "No relation"], 
      answer: "Building on Base" 
    },
    { 
      question: "What tools can Hunt Town devs use?", 
      options: ["Ethereum tools", "Special tools only", "No tools"], 
      answer: "Ethereum tools" 
    },
    { 
      question: "What's Hunt Town's development approach?", 
      options: ["Open & collaborative", "Solo building", "Closed groups"], 
      answer: "Open & collaborative" 
    },
    { 
      question: "What's available in Hunt Town?", 
      options: ["Development resources", "Free tokens", "NFT airdrops"], 
      answer: "Development resources" 
    },
    { 
      question: "How does Hunt Town support builders?", 
      options: ["Community & resources", "Money only", "No support"], 
      answer: "Community & resources" 
    },
    { 
      question: "What's Hunt Town's goal?", 
      options: ["Grow Web3 ecosystem", "Quick profits", "Gaming only"], 
      answer: "Grow Web3 ecosystem" 
    },
    { 
      question: "What can you build in Hunt Town?", 
      options: ["Web3 applications", "Only games", "Only NFTs"], 
      answer: "Web3 applications" 
    },
    { 
      question: "Why join Hunt Town?", 
      options: ["Learn & build Web3", "Get rich quick", "Play games"], 
      answer: "Learn & build Web3" 
    },
    { 
      question: "What type of projects are built in Hunt Town?", 
      options: ["Web3 dApps", "Mobile games", "Desktop software"], 
      answer: "Web3 dApps" 
    },
    { 
      question: "How does Hunt Town help new developers?", 
      options: ["Mentorship & resources", "Cash rewards", "Gaming tournaments"], 
      answer: "Mentorship & resources" 
    },
    { 
      question: "What's Hunt Town's contribution to Base?", 
      options: ["Growing developer ecosystem", "Creating NFTs", "Running nodes"], 
      answer: "Growing developer ecosystem" 
    },
    { 
      question: "What's unique about Hunt Town's builders?", 
      options: ["Focus on Web3 innovation", "Trading focus", "Gaming focus"], 
      answer: "Focus on Web3 innovation" 
    },
    { 
      question: "How does Hunt Town foster collaboration?", 
      options: ["Open source projects", "Closed teams", "Solo work"], 
      answer: "Open source projects" 
    },
    { 
      question: "What's Hunt Town's development philosophy?", 
      options: ["Build & share knowledge", "Build in private", "Copy existing projects"], 
      answer: "Build & share knowledge" 
    },
    { 
      question: "How does Hunt Town support Base adoption?", 
      options: ["Building useful dApps", "Creating memes", "Trading tokens"], 
      answer: "Building useful dApps" 
    },
    { 
      question: "What's Hunt Town's community known for?", 
      options: ["Helpful developers", "Token traders", "NFT collectors"], 
      answer: "Helpful developers" 
    },
    { 
      question: "What can beginners learn in Hunt Town?", 
      options: ["Web3 development basics", "Token trading", "Gaming"], 
      answer: "Web3 development basics" 
    },
    { 
      question: "How does Hunt Town encourage learning?", 
      options: ["Community workshops", "Trading contests", "Gaming events"], 
      answer: "Community workshops" 
    },
    { 
      question: "What's Hunt Town's role in Web3?", 
      options: ["Developer education hub", "Gaming platform", "NFT marketplace"], 
      answer: "Developer education hub" 
    },
    { 
      question: "What makes Hunt Town different from other communities?", 
      options: ["Focus on building", "Focus on trading", "Focus on gaming"], 
      answer: "Focus on building" 
    },
    { 
      question: "What's Hunt Town's approach to new developers?", 
      options: ["Welcoming & supportive", "Experts only", "Closed community"], 
      answer: "Welcoming & supportive" 
    },
    { 
      question: "What kind of projects does Hunt Town encourage?", 
      options: ["Innovative Web3 solutions", "Copy trading", "Gaming only"], 
      answer: "Innovative Web3 solutions" 
    },
    { 
      question: "How does Hunt Town help Base ecosystem?", 
      options: ["Building developer tools", "Creating memes", "Trading tokens"], 
      answer: "Building developer tools" 
    },
    { 
      question: "What's Hunt Town's educational focus?", 
      options: ["Web3 development", "Traditional gaming", "Social media"], 
      answer: "Web3 development" 
    },
    { 
      question: "How does Hunt Town support innovation?", 
      options: ["Open collaboration", "Solo competition", "Closed teams"], 
      answer: "Open collaboration" 
    },
    { 
      question: "What's Hunt Town's community structure?", 
      options: ["Open & inclusive", "Hierarchical", "Invitation only"], 
      answer: "Open & inclusive" 
    },
    { 
      question: "What's Hunt Town's approach to collaboration?", 
      options: ["Knowledge sharing", "Competition", "Individual work"], 
      answer: "Knowledge sharing" 
    },
    { 
      question: "What's Hunt Town's primary contribution?", 
      options: ["Growing Web3 talent", "Creating NFTs", "Gaming"], 
      answer: "Growing Web3 talent" 
    }
  ];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_huntboy");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    this.startIdleLoop(scene);

    this.nameLabel = scene.add.text(x, y - 40, "Hunt Boy", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00bfff", 
      stroke: "#003366",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#00bfff",
      stroke: "#003366",
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

this.setInteractive({ useHandCursor: true });
this.on("pointerdown", () => this.interact());
}


  private createAnimations(scene: Phaser.Scene) {
    this.directions.forEach((dir, index) => {
      scene.anims.create({
        key: `huntboy-idle-${dir}`,
        frames: scene.anims.generateFrameNumbers("npc_huntboy", {
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
        this.play(`huntboy-idle-${newDirection}`);
      },
      loop: true,
    });
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("HuntBoy: Dialog already open, ignoring interaction");
      return;
    }
    
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("HuntBoy: Network offline - showing offline message");
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
    
    console.log("HuntBoy: Interaction triggered");
    
    const player = this.getClosestPlayer();
    
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        // Check if player is on cooldown
        const playerId = player.name || `anon_${Date.now()}`;
        // Use the checkCooldown method which properly handles expired cooldowns
        if (this.checkCooldown(playerId)) {
          console.log("HuntBoy: Player is on cooldown or has reached max attempts");
          this.showCooldownDialog();
          return;
        }
        
        console.log("HuntBoy: Player is close enough, starting quiz");
        this.startQuiz(player);
      } else {
        console.log("HuntBoy: Player is too far away");
      }
    } else {
      console.log("HuntBoy: No player found");
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log("HuntBoy: Interaction blocked, cannot start quiz");
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
    console.log("Starting quiz: ", currentQuestion.question);
    
    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();

    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);

    showDialog(this.scene, [
      {
        text: currentQuestion.question,
        avatar: "npc_huntboy_avatar",
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

    console.log(isCorrect ? "Correct answer!" : "Wrong answer.");

    // Close the current dialog immediately
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    // Delay reward dialog just enough for a smoother transition
    this.scene.time.delayedCall(500, () => {
      // Check if interactions are blocked before showing reward dialog
      if (this.isInteractionBlocked()) {
        console.log("HuntBoy: Cannot show reward dialog - interactions are blocked");
        return;
      }
      
      const dialog = showDialog(this.scene, [
        {
          text: isCorrect
            ? `🎉 Correct! You've earned ${reward.toFixed(2)} $Quiztals!`
            : `❌ Oops! Correct answer was: "${correct}". Better luck next time.`,
          avatar: "npc_huntboy_avatar",
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
    const playerId = player.name || `anon_${Date.now()}`; // Fallback in case name is missing
    saveQuiztalsToDatabase(playerId, reward, "HuntBoy");
    
    // Log reward to local storage for session tracking
    QuiztalRewardLog.logReward("HuntBoy", reward);
    
    // Log reward to reward logger (keeping existing functionality)
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "HuntBoy", "HuntBoy");
      }
    }
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Yo anon, have you bridged to Base yet? 😏",
      "Base gas fees? What gas fees? Almost free! 💨",
      "Web3 builders, join Hunt Town! 🏗️",
      "Hunt Town = Web3 dev paradise! 🌍"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No quizzes until connection restored! 🚫📡",
      "Internet connection lost! Quiztals on hold! 😢🔌",
      "Offline mode: HuntBoy's quizzes disabled! ⏸️",
      "No network, no knowledge challenges! 🔌",
      "Connection error: Quiz unavailable! 📡"
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
        console.log(`Hunt Boy Shouting: ${randomMessage}`);
        this.startShouting(scene); // Loop again
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
    message = "🚨 Network connection lost! HuntBoy's quizzes disabled! 🚫";
  } else {
    // Network is online
    message = "✅ Network connection restored! HuntBoy's quizzes available! 🌐";
  }
  
  this.showShout(message);
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
    const remainingTime = this.getRemainingCooldownTime();
    const formattedTime = this.formatTimeWithFractional(remainingTime);
    
    this.currentDialog = showDialog(this.scene, [
      {
        text: `🕒 Hey there! I'm taking a short break to recharge my quiz powers! Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
        avatar: "npc_huntboy_avatar",
        isExitDialog: true
      }
    ]);
    
    // Set up auto-reset for the dialog after 3 seconds
    // This ensures the dialog reference is cleared even if the player doesn't click
    this.setupDialogAutoReset(3000);
  }
}