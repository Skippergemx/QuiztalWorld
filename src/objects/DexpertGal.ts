import Phaser from "phaser";
import { showDialog, SimpleDialogBox } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import QuizNPC from "./QuizNPC";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { showOptimizedEnhancedQuizDialog, OptimizedQuizDialogData } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';

export default class DexpertGal extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'dexpertgal';
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "dexpert_gal");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    this.createAnimations(scene);
    this.play("dexpertgal-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Dexpert Gal", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ff6b9d",
      stroke: "#660033",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#ff6b9d",
      stroke: "#660033",
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
    if (!scene.anims.exists("dexpertgal-idle")) {
      scene.anims.create({
        key: "dexpertgal-idle",
        frames: scene.anims.generateFrameNumbers("dexpert_gal", { start: 0, end: 23 }),
        frameRate: 1,
        repeat: -1,
      });
    }
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("DexpertGal: Dialog already open, ignoring interaction");
      return;
    }
    
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("DexpertGal: Network offline - showing offline message");
      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);
      
      // Set up auto-reset for the dialog after 3 seconds
      this.setupDialogAutoReset(3000);
      return;
    }
    
    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        // Check if player is on cooldown
        const playerId = player.name || `anon_${Date.now()}`;
        if (this.checkCooldown(playerId)) {
          console.log("DexpertGal: Player is on cooldown or has reached max attempts");
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
      console.log("DexpertGal: Interaction blocked, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("DexpertGal: Quiz manager not ready yet");
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
          console.log("DexpertGal: Cannot show reward dialog - interactions are blocked");
          return;
        }
        
        this.currentDialog = SimpleDialogBox.getInstance(this.scene);
        this.currentDialog.showDialog([
            {
                text: isCorrect
                    ? `🔄 Excellent trade! You earned ${reward.toFixed(2)} $Quiztals for your DEX knowledge!`
                    : `❌ Trade failed! The correct answer was "${correctAnswer}". Study the market and try again!`,
                avatar: "npc_dexpertgal_avatar",
                isExitDialog: true
            }
        ]);
        
        // Set up auto-reset for the dialog after 3 seconds
        this.setupDialogAutoReset(3000);
    });

    if (isCorrect) {
        this.saveRewardToDatabase(player, reward);
    }
    
    // Reset last question index so player can get the same question again in future interactions
    this.lastQuestionIndex = -1;
  }

  private async startEnhancedQuiz(player: Phaser.Physics.Arcade.Sprite) {
    try {
      // Get random question using the quiz manager
      const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
      
      if (!questionData) {
        console.error("DexpertGal: No questions available");
        return;
      }
      
      // Store the index of the current question
      this.lastQuestionIndex = questionData.index;
      const currentQuestion = questionData.question;
      
      // Notify QuizAntiSpamManager that a quiz has started
      this.notifyQuizStarted();
      
      // Create enhanced question from basic question
      const enhancedQuestion = {
        ...currentQuestion,
        difficulty: this.determineDifficulty(currentQuestion),
        explainer: currentQuestion.explainer || `This question relates to fundamental concepts about ${this.npcId} topic.`
      };
      
      // Shuffle options
      const shuffledOptions = Phaser.Utils.Array.Shuffle([...enhancedQuestion.options]);
      
      // Prepare optimized enhanced quiz dialog data
      const quizData: OptimizedQuizDialogData = {
        npcName: "Dexpert Gal",
        npcAvatar: "npc_dexpertgal_avatar",
        question: enhancedQuestion.question,
        options: shuffledOptions,
        theme: "Decentralized Exchanges & DeFi Trading",
        difficulty: enhancedQuestion.difficulty,
        questionNumber: 1, // Single question per interaction
        totalQuestions: 1, // Single question per interaction
        explainer: enhancedQuestion.explainer,
        onAnswer: (selectedOption: string) => {
          this.handleEnhancedAnswer(selectedOption, enhancedQuestion, player);
        },
        onClose: () => {
          // Quiz is already ended in handleEnhancedAnswer
        }
      };

      // Show optimized enhanced quiz dialog
      showOptimizedEnhancedQuizDialog(this.scene, quizData);

    } catch (error) {
      console.error("DexpertGal: Error starting enhanced quiz:", error);
      // Fallback to simple quiz
      this.startSimpleQuiz(player);
    }
  }
  
  // Helper method to determine difficulty
  private determineDifficulty(question: any): 'Easy' | 'Medium' | 'Hard' {
    const questionLength = question.question.length;
    const optionsLength = question.options.reduce((sum: number, opt: string) => sum + opt.length, 0);
    
    if (questionLength < 50 && optionsLength < 100) {
      return 'Easy';
    } else if (questionLength < 100 && optionsLength < 200) {
      return 'Medium';
    } else {
      return 'Hard';
    }
  }

  // Enhanced answer handler
  private handleEnhancedAnswer(selectedOption: string, enhancedQuestion: any, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selectedOption === enhancedQuestion.answer;
    
    // Get player ID for tracking
    const playerId = player.name || `anon_${Date.now()}`;
    
    // Calculate reward using enhanced system by difficulty
    const reward = this.enhancedQuizManager.calculateEnhancedReward(isCorrect, enhancedQuestion.difficulty);
    
    // Check if this will be the 3rd attempt BEFORE recording
    const playerAttempts = this.quizAttempts.filter(attempt => attempt.playerId === playerId);
    const willTriggerCooldown = (playerAttempts.length + 1) >= this.maxAttempts;
    
    // Record quiz attempt - but delay cooldown activation if this is 3rd attempt
    if (willTriggerCooldown) {
      // For 3rd attempt: record without triggering cooldown immediately
      this.quizAttempts.push({
        playerId: playerId,
        timestamp: Date.now()
      });
      // Show remaining attempts
      this.showRemainingAttempts(playerId);
    } else {
      // For 1st and 2nd attempts: use normal recording
      this.recordQuizAttempt(playerId);
    }
    
    // Play sound using enhanced audio system
    this.enhancedQuizManager.playRewardAudio(isCorrect);
    
    // End the quiz immediately to unblock interactions for reward dialog
    this.notifyQuizEnded();
    
    // Delayed feedback (500ms delay):
    this.scene.time.delayedCall(500, () => {
      // Check if interactions blocked
      if (this.isInteractionBlocked()) {
        console.log("DexpertGal: Cannot show reward dialog - interactions are blocked");
        return;
      }
      
      // Show reward dialog with result message
      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: isCorrect
            ? `🔄 Excellent trade! You earned ${reward.toFixed(2)} $Quiztals for your DEX knowledge!`
            : `❌ Trade failed! The correct answer was: "${enhancedQuestion.answer}". Study the market and try again!`,
          avatar: "npc_dexpertgal_avatar",
          isExitDialog: true
        }
      ]);
      
      // Save enhanced reward if correct
      if (isCorrect) {
        this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, reward, "DexpertGal");
      }
      
      // Set up auto-reset for the dialog after 3 seconds
      this.setupDialogAutoReset(3000);
      
      // If this was the 3rd attempt, activate cooldown AFTER reward dialog
      if (willTriggerCooldown) {
        // Activate cooldown after reward dialog is fully processed
        this.scene.time.delayedCall(3500, () => {
          const now = Date.now();
          this.isOnCooldown = true;
          this.cooldownEndTime = now + this.cooldownDuration;
          this.showCooldownIndicator();
        });
      }
    });
    
    // Cleanup
    this.scene.time.delayedCall(3500, () => {
      // Reset question index so player can get the same question again in future interactions
      this.lastQuestionIndex = -1;
    });
  }

  private startSimpleQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
    
    if (!questionData) {
      console.error("DexpertGal: No questions available");
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
        avatar: "npc_dexpertgal_avatar",
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
    saveQuiztalsToDatabase(playerId, reward, "DexpertGal");
    
    // Also log to local session tracker
    QuiztalRewardLog.logReward("DexpertGal", reward);
    
    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "DexpertGal", "DexpertGal");
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
      "Ready to trade on DEXs? I'll teach you everything! 🔄",
      "Decentralized exchanges are the future of trading! 💱",
      "No KYC, just pure DeFi trading! Ask me how! 🚀",
      "Click me to earn $Quiztals while mastering DEX trading! 📈"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No DEX trading until connection restored! 🚫📡",
      "Internet connection lost! DEX knowledge on hold! 😢🔌",
      "Offline mode: DexpertGal's trading lessons disabled! ⏸️",
      "No network, no decentralized trading! 🔌",
      "Connection error: DEX quiz unavailable! 📡"
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
      message = "🚨 Network connection lost! DexpertGal's trading lessons disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! DexpertGal's trading lessons available! 🌐";
    }
    
    this.showShout(message);
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
          text: `🕒 Hey trader! I'm currently analyzing the latest market trends and DEX protocols. Please return in ${formattedTime}. In the meantime, why not check out other experts in the DeFi space? They might have trading insights to share! 📊`,
          avatar: "npc_dexpertgal_avatar",
          isExitDialog: true
        }
      ]);
      
      // Set up auto-reset for the dialog after 3 seconds
      this.setupDialogAutoReset(3000);
    });
  }
}