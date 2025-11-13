import Phaser from "phaser";

import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import QuizNPC from "./QuizNPC"; // Import the QuizNPC base class
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';
import { baseSagePersonality } from '../config/NPCPersonalityConfig';

export default class BaseSage extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'basesage';
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "base_sage");

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    this.createAnimations(scene);
    this.play("basesage-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Base Sage", {
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
    if (!scene.anims.exists("basesage-idle")) {
      scene.anims.create({
        key: "basesage-idle",
        frames: scene.anims.generateFrameNumbers("base_sage", { start: 0, end: 23 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("BaseSage: Dialog already open, ignoring interaction");
      return;
    }

    // Check player stamina before allowing interaction
    if (!this.checkPlayerStamina()) {
      console.log("BaseSage: Not enough stamina for interaction");
      return;
    }

    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("BaseSage: Network offline - showing offline message");
      // Use optimized reward dialog for network offline message
      const offlineDialogData: OptimizedRewardDialogData = {
        npcName: "Base Sage",
        npcAvatar: "npc_basesage_avatar",
        rewardMessage: "🚫 Network connection lost! Please check your internet connection to continue playing.",
        rewardAmount: 0,
        onClose: () => {
          this.resetDialogState();
        }
      };
      
      showOptimizedRewardDialog(this.scene, offlineDialogData);

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
          console.log("BaseSage: Player is on cooldown or has reached max attempts");
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
      console.log("BaseSage: Interaction blocked, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("BaseSage: Quiz manager not ready yet");
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
          console.log("BaseSage: Cannot show reward dialog - interactions are blocked");
          return;
        }

        if (isCorrect) {
          // Generate educational content for Base Layer 2
          const didYouKnowContent = this.generateBaseDidYouKnow();
          const tipsContent = this.generateBaseTips();
          
          // Create enhanced reward message with personality
          const rewardPrefix = Phaser.Utils.Array.GetRandom(baseSagePersonality.correctAnswerPrefixes);
          const rewardMessage = `${rewardPrefix} ${reward.toFixed(2)} $Niftdoods from the Base Sage!`;
          
          // Show optimized reward dialog
          const rewardDialogData: OptimizedRewardDialogData = {
            npcName: "Base Sage",
            npcAvatar: "npc_basesage_avatar",
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
          // Incorrect answer - show optimized wrong answer dialog with personality
          const wrongAnswerPrefix = Phaser.Utils.Array.GetRandom(baseSagePersonality.wrongAnswerPrefixes);
          const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
            npcName: "Base Sage",
            npcAvatar: "npc_basesage_avatar",
            wrongAnswerMessage: `${wrongAnswerPrefix} "${selectedOption}" is not correct.`,
            correctAnswer: correctAnswer,
            explanation: "This question tests your understanding of key Base Layer 2 concepts. Review the material and try again!",
            commonMistakes: this.generateCommonMistakesForBase(),
            quickTips: this.generateQuickTipsForBase(),
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
        console.error("BaseSage: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("BaseSage: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Base Sage",
        npcAvatar: "npc_basesage_avatar",
        theme: "Base Layer 2 & Ethereum Scaling",
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
      console.error("BaseSage: Enhanced quiz session error:", error);
      this.startSimpleQuiz(player);
    });
  }
  
  // Enhanced answer handler using proper Enhanced Quiz Manager session
  private handleEnhancedAnswer(selectedOption: string, enhancedQuestion: any, player: Phaser.Physics.Arcade.Sprite) {
    const playerId = player.name || `anon_${Date.now()}`;
    
    // Submit answer through Enhanced Quiz Manager session (requires timeSpent parameter)
    const isCorrect = this.enhancedQuizManager.submitAnswer(selectedOption, 0, playerId);
    
    // Calculate reward using enhanced system
    const reward = this.enhancedQuizManager.calculateEnhancedReward(isCorrect, enhancedQuestion.difficulty);
    
    // Record quiz attempt for cooldown tracking
    this.recordQuizAttempt(playerId);
    
    // Play enhanced audio feedback
    this.enhancedQuizManager.playRewardAudio(isCorrect);
    
    // Complete the quiz session
    this.enhancedQuizManager.completeQuizSession();
    
    // End quiz notification to unblock interactions
    this.notifyQuizEnded();
    
    // Show reward dialog after delay
    this.scene.time.delayedCall(500, () => {
      if (this.isInteractionBlocked()) {
        return;
      }
      
      if (isCorrect) {
        // Generate educational content for Base Layer 2
        const didYouKnowContent = this.generateBaseDidYouKnow();
        const tipsContent = this.generateBaseTips();
        
        // Create enhanced reward message with personality
        const rewardPrefix = Phaser.Utils.Array.GetRandom(baseSagePersonality.correctAnswerPrefixes);
        const rewardMessage = `${rewardPrefix} ${reward.toFixed(2)} $Niftdoods from the Base Sage!`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Base Sage",
          npcAvatar: "npc_basesage_avatar",
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
        
        // Save reward using enhanced system
        this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, reward, "BaseSage");
      } else {
        // Incorrect answer - show optimized wrong answer dialog with personality
        const wrongAnswerPrefix = Phaser.Utils.Array.GetRandom(baseSagePersonality.wrongAnswerPrefixes);
        const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
          npcName: "Base Sage",
          npcAvatar: "npc_basesage_avatar",
          wrongAnswerMessage: `${wrongAnswerPrefix} "${selectedOption}" is not correct.`,
          correctAnswer: enhancedQuestion.answer,
          explanation: enhancedQuestion.explainer || "This question tests your understanding of key Base Layer 2 concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForBase(),
          quickTips: this.generateQuickTipsForBase(),
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
      }
    });
    
    // Reset and cleanup
    this.scene.time.delayedCall(3500, () => {
      this.lastQuestionIndex = -1;
    });
  }

  private startSimpleQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);

    if (!questionData) {
      console.error("BaseSage: No questions available");
      return;
    }

    // Store the index of the current question
    this.lastQuestionIndex = questionData.index;
    const currentQuestion = questionData.question;

    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();

    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);

    // Use optimized enhanced quiz dialog instead of simple dialog
    const dialog = new OptimizedEnhancedQuizDialog(this.scene);
    
    dialog.showQuizDialog({
      npcName: "Base Sage",
      npcAvatar: "npc_basesage_avatar",
      theme: "Base Layer 2 & Ethereum Scaling",
      question: currentQuestion.question,
      options: shuffledOptions,
      explainer: currentQuestion.explainer,
      onAnswer: (selectedOption: string) => {
        this.checkAnswer(selectedOption, currentQuestion.answer, player);
        // Notify QuizAntiSpamManager that the quiz has ended
        this.notifyQuizEnded();
      },
      onClose: () => {
        this.resetDialogState();
      }
    });
    
    this.currentDialog = dialog as any;
  }

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "BaseSage");

    // Also log to local session tracker
    QuiztalRewardLog.logReward("BaseSage", reward);

    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "BaseSage", "BaseSage");
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
    const shoutMessages = baseSagePersonality.shoutMessageTemplates;

    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No quizzes until connection restored! 🚫📡",
      "Internet connection lost! Base knowledge on hold! 😢🔌",
      "Offline mode: Base Sage quizzes disabled! ⏸️",
      "No network, no quizzes! 🔌",
      "Connection error: Quizzes unavailable! 📡"
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
      message = "🚨 Network connection lost! Base Sage quizzes disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! Base Sage quizzes available! 🌐";
    }

    this.showShout(message);
  }

  private generateBaseDidYouKnow(): string {
    const didYouKnowPhrases = [
      "Base is a Layer 2 scaling solution built on Ethereum that uses Optimism's OP Stack! This technology enables faster and cheaper transactions while maintaining Ethereum's security.",
      "Base was launched by Coinbase in August 2023 and quickly became one of the most popular Ethereum Layer 2 networks! It's designed to bring billions of people onchain.",
      "Base has a unique feature called 'superchain' compatibility, which means it can interoperate with other OP Stack chains! This creates a network effect across the ecosystem.",
      "Unlike some other Layer 2 solutions, Base is completely permissionless and open-source! Anyone can build, deploy, and use applications on Base without restrictions.",
      "Base uses optimistic rollups for transaction processing, which means transactions are batched and submitted to Ethereum for final settlement! This dramatically reduces gas costs."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateBaseTips(): string {
    const tipsPhrases = [
      "Use BaseScan (basescan.org) to verify transactions and smart contract details! This blockchain explorer provides comprehensive information about Base network activity.",
      "Bridge assets to Base using the official Base Bridge for the most secure and cost-effective transfers! The bridge is designed specifically for Ethereum to Base transfers.",
      "Check gas fees on Base before executing transactions - while generally much lower than Ethereum, they can still vary based on network congestion!",
      "Explore the Base ecosystem through BaseHub (base.org/ecosystem) to discover new dApps and projects! This curated directory showcases the best of Base.",
      "Stay updated with Base development by following the official Base Twitter account and joining the Discord community for announcements and support!"
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(tipsPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  protected showCooldownDialog() {
    // Add a delay before showing the cooldown dialog
    // This allows players to see their reward from the third quiz
    this.scene.time.delayedCall(3000, () => { // 3 second delay
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      
      // Use personality-specific cooldown message
      const cooldownTemplate = Phaser.Utils.Array.GetRandom(baseSagePersonality.cooldownMessageTemplates);
      const cooldownMessage = cooldownTemplate.replace("{time}", formattedTime);

      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "Base Sage",
        npcAvatar: "npc_basesage_avatar",
        rewardMessage: cooldownMessage,
        rewardAmount: 0,
        onClose: () => {
          this.resetDialogState();
        }
      };
      
      showOptimizedRewardDialog(this.scene, cooldownDialogData);

      // Set up auto-reset for the dialog after 3 seconds
      // This ensures the dialog reference is cleared even if the player doesn't click
      this.setupDialogAutoReset(3000);
    });
  }

  private generateCommonMistakesForBase(): string {
    const commonMistakes = baseSagePersonality.mistakeDescriptions;
    
    const selectedMistake = Phaser.Utils.Array.GetRandom(commonMistakes);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedMistake.length > 150) {
      return selectedMistake.substring(0, 147) + "...";
    }
    
    return selectedMistake;
  }
  
  private generateQuickTipsForBase(): string {
    const quickTips = baseSagePersonality.tipDescriptions;
    
    const selectedTip = Phaser.Utils.Array.GetRandom(quickTips);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedTip.length > 150) {
      return selectedTip.substring(0, 147) + "...";
    }
    
    return selectedTip;
  }
}