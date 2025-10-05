// HuntBoy.ts
import Phaser from "phaser";
import { showDialog, SimpleDialogBox } from "../utils/SimpleDialogBox"; // Import dialog function and class
import { saveQuiztalsToDatabase } from "../utils/Database"; // Firestore save utility
import AudioManager from '../managers/AudioManager'; // Import the AudioManager
import QuizNPC from "./QuizNPC"; // Import the QuizNPC base class
import QuiztalRewardLog from '../utils/QuiztalRewardLog'; // Import reward logging
import NPCQuizManager from '../managers/NPCQuizManager';
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';

export default class HuntBoy extends QuizNPC {
  private directions = ["right", "up", "left", "down"];
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'huntboy';
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  // Quiz data is now loaded from JSON

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_huntboy");

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    this.play("huntboy-idle-down"); // Set initial animation

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
      const animKey = `huntboy-idle-${dir}`;
      // Check if animation already exists before creating it
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers("npc_huntboy", {
            start: index * 6,
            end: index * 6 + 5,
          }),
          frameRate: 3,
          repeat: -1,
        });
      }
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
      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);

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
          console.log("HuntBoy: Player is on cooldown or has reached max attempts");
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
      console.log("HuntBoy: Interaction blocked, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("HuntBoy: Quiz manager not ready yet");
      return;
    }

    // Use enhanced quiz system if enabled
    if (this.useEnhancedDialog) {
      this.startEnhancedQuiz(player);
    } else {
      this.startSimpleQuiz(player);
    }
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
        console.log("HuntBoy: Cannot show reward dialog - interactions are blocked");
        return;
      }

      if (isCorrect) {
        // Generate educational content for Web3 development
        const didYouKnowContent = this.generateWeb3DidYouKnow();
        const tipsContent = this.generateWeb3Tips();
        
        // Create enhanced reward message
        const rewardMessage = `🎉 Correct! You've earned ${reward.toFixed(2)} $Quiztals!`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Hunt Boy",
          npcAvatar: "npc_huntboy_avatar",
          rewardMessage: rewardMessage,
          didYouKnow: didYouKnowContent,
          tipsAndTricks: tipsContent,
          rewardAmount: reward,
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedRewardDialog(this.scene, rewardDialogData);
      } else {
        // Incorrect answer - show optimized wrong answer dialog
        const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
          npcName: "Hunt Boy",
          npcAvatar: "npc_huntboy_avatar",
          wrongAnswerMessage: `❌ Oops! "${selectedOption}" is not correct.`,
          correctAnswer: correctAnswer,
          explanation: "This question tests your understanding of key Web3 development concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForWeb3(),
          quickTips: this.generateQuickTipsForWeb3(),
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
      }

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

  private startEnhancedQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();
    
    // Start enhanced quiz session
    this.enhancedQuizManager.startQuizSession(this.npcId).then(session => {
      if (!session) {
        console.error("HuntBoy: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("HuntBoy: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Hunt Boy",
        npcAvatar: "npc_huntboy_avatar",
        theme: "Web3 Development & Hunt Town",
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
      console.error("HuntBoy: Enhanced quiz session error:", error);
      this.startSimpleQuiz(player);
    });
  }


  private handleEnhancedAnswer(selectedAnswer: string, question: any, player: Phaser.Physics.Arcade.Sprite) {
    const playerId = player.name || `anon_${Date.now()}`;
    this.recordQuizAttempt(playerId);
    
    // Submit answer to enhanced quiz manager
    const isCorrect = this.enhancedQuizManager.submitAnswer(selectedAnswer, 1000, playerId);
    
    // Notify QuizAntiSpamManager that the quiz has ended
    this.notifyQuizEnded();
    
    // Play enhanced audio feedback
    this.enhancedQuizManager.playRewardAudio(isCorrect);

    // Calculate enhanced reward
    const baseReward = this.enhancedQuizManager.calculateEnhancedReward(isCorrect, question.difficulty);
    
    if (isCorrect && baseReward > 0) {
      // Use enhanced reward saving system
      this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, baseReward, "HuntBoy");
    }

    // Close current dialog
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    // Show result dialog after a brief delay
    this.scene.time.delayedCall(500, () => {
      if (this.isInteractionBlocked()) {
        return;
      }
      
      if (isCorrect) {
        // Generate educational content for Web3 development
        const didYouKnowContent = this.generateWeb3DidYouKnow();
        const tipsContent = this.generateWeb3Tips();
        
        // Create enhanced reward message
        const rewardMessage = `🗡️ Nice hunt! You earned ${baseReward.toFixed(2)} $Quiztals for your Web3 knowledge! (${question.difficulty} difficulty)`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Hunt Boy",
          npcAvatar: "npc_huntboy_avatar",
          rewardMessage: rewardMessage,
          didYouKnow: didYouKnowContent,
          tipsAndTricks: tipsContent,
          rewardAmount: baseReward,
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedRewardDialog(this.scene, rewardDialogData);
      } else {
        // Incorrect answer - show optimized wrong answer dialog
        const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
          npcName: "Hunt Boy",
          npcAvatar: "npc_huntboy_avatar",
          wrongAnswerMessage: `🎯 Missed the target! "${selectedAnswer}" is not correct.`,
          correctAnswer: question.answer,
          explanation: question.explainer || "This question tests your understanding of key Web3 development concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForWeb3(),
          quickTips: this.generateQuickTipsForWeb3(),
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
      }
    });

    // Complete the enhanced quiz session
    this.enhancedQuizManager.completeQuizSession();
    
    // Reset last question index so player can get the same question again in future interactions
    this.lastQuestionIndex = -1;
  }

  private startSimpleQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);

    if (!questionData) {
      console.error("HuntBoy: No questions available");
      return;
    }

    // Store the index of the current question
    this.lastQuestionIndex = questionData.index;
    const currentQuestion = questionData.question;

    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();

    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);

    showDialog(this.scene, [{
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
    }]);
  }

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "HuntBoy");

    // Also log to local session tracker
    QuiztalRewardLog.logReward("HuntBoy", reward);

    // Log reward to reward logger
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
    // Add a delay before showing the cooldown dialog
    // This allows players to see their reward from the third quiz
    this.scene.time.delayedCall(3000, () => { // 3 second delay
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);

      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: `🕒 Hey there! I'm taking a short break to recharge my quiz powers! Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
          avatar: "npc_huntboy_avatar",
          isExitDialog: true
        }
      ]);

      // Set up auto-reset for the dialog after 3 seconds
      // This ensures the dialog reference is cleared even if the player doesn't click
      this.setupDialogAutoReset(3000);
    });
  }

  private generateWeb3DidYouKnow(): string {
    const didYouKnowPhrases = [
      "Web3 development is built on decentralized networks like Ethereum, where no single entity controls the entire system! This creates a trustless environment where users can interact directly without intermediaries.",
      "Smart contracts are self-executing contracts with terms directly written into code! They automatically enforce agreements without the need for a middleman, making transactions faster and more secure.",
      "The term 'dApp' stands for decentralized application, which runs on a blockchain network rather than a central server! Popular dApps include Uniswap, OpenSea, and Compound.",
      "Web3 developers use languages like Solidity for Ethereum smart contracts and Rust for Solana programs! These languages are specifically designed for blockchain development and security.",
      "Non-fungible tokens (NFTs) are unique digital assets that represent ownership of items like art, collectibles, or real estate! Each NFT has a distinct identity and cannot be replicated."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateWeb3Tips(): string {
    const tipsPhrases = [
      "Start with simple projects like a basic token or voting system when learning Web3 development! Building small projects helps you understand core concepts before tackling complex dApps.",
      "Always test your smart contracts thoroughly on testnets before deploying to mainnet! Networks like Goerli and Sepolia allow you to test with fake ETH without risking real funds.",
      "Use established development frameworks like Hardhat or Foundry for Ethereum development! These tools provide testing environments, debugging capabilities, and deployment scripts.",
      "Keep your private keys and mnemonic phrases secure - never share them with anyone! Consider using hardware wallets for storing valuable assets and development keys.",
      "Stay updated with the latest Web3 trends and security practices! The space evolves rapidly, and staying informed helps you build better and more secure applications."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(tipsPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateCommonMistakesForWeb3(): string {
    const commonMistakes = [
      "Forgetting to handle gas optimization in smart contracts - inefficient code can be extremely expensive to execute!",
      "Not validating user inputs in smart contracts - this can lead to security vulnerabilities and unexpected behavior!",
      "Deploying untested code to mainnet - always use testnets first to avoid losing real funds!",
      "Confusing wallet addresses with contract addresses - sending tokens to the wrong address can result in permanent loss!",
      "Ignoring network fees when designing dApps - high gas costs can make your application unusable for users!"
    ];
    
    const selectedMistake = Phaser.Utils.Array.GetRandom(commonMistakes);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedMistake.length > 150) {
      return selectedMistake.substring(0, 147) + "...";
    }
    
    return selectedMistake;
  }
  
  private generateQuickTipsForWeb3(): string {
    const quickTips = [
      "Use events (logs) in your smart contracts to track important actions and improve frontend integration!",
      "Implement proper error handling with require() statements to make your contracts more robust!",
      "Consider using upgradeable contracts for long-term projects to fix bugs without losing data!",
      "Read the documentation for libraries and frameworks carefully - small details can have big impacts!",
      "Join Web3 developer communities for support, code reviews, and learning opportunities!"
    ];
    
    const selectedTip = Phaser.Utils.Array.GetRandom(quickTips);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedTip.length > 150) {
      return selectedTip.substring(0, 147) + "...";
    }
    
    return selectedTip;
  }

}
