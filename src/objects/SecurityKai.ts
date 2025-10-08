// SecurityKai.ts
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

// SecurityKai class: Defines the SecurityKai NPC, extending the base QuizNPC class.
export default class SecurityKai extends QuizNPC {
  // Stores the index of the last asked question to avoid immediate repetition.
  private lastQuestionIndex: number = -1;
  // Manages the quiz data for all NPCs, including SecurityKai.
  private quizManager: NPCQuizManager;
  private enhancedQuizManager: EnhancedQuizManager;
  private useEnhancedDialog: boolean = true;
  // Unique identifier for this NPC, used to fetch its quiz data.
  private readonly npcId = 'securitykai';

  // Quiz data is now loaded from JSON

  // Constructor: Initializes the SecurityKai NPC.
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "securitykai");

    // Get the singleton instance of the NPCQuizManager.
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    // Set initial animation for SecurityKai.
    this.play("securitykai-idle");

    // Create the name label for SecurityKai.
    this.nameLabel = scene.add.text(x, y - 40, "Security Kai", {
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

    // Make the NPC interactive, enabling the hand cursor on hover and calling the interact method on click.
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
  }

  // createAnimations: Creates the animations for the SecurityKai NPC.
  private createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists("securitykai-idle")) {
      scene.anims.create({
        key: "securitykai-idle",
        frames: scene.anims.generateFrameNumbers("securitykai", { start: 0, end: 23 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  // interact: Handles the interaction when the player clicks on the SecurityKai NPC.
  public interact() {
    // Check if a dialog is already open to prevent overlapping dialogs.
    if (this.currentDialog) {
      console.log("SecurityKai: Dialog already open, ignoring interaction");
      return;
    }

    // Check network connectivity before allowing interactions.
    if (!this.networkMonitor.getIsOnline()) {
      console.log("SecurityKai: Network offline - showing offline message");
      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);

      // Set up auto-reset for the dialog after 3 seconds.
      // This ensures the dialog reference is cleared even if the player doesn't click.
      this.setupDialogAutoReset(3000);
      return;
    }

    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        // Check if player is on cooldown.
        const playerId = player.name || `anon_${Date.now()}`;
        // Use the checkCooldown method which properly handles expired cooldowns.
        if (this.checkCooldown(playerId)) {
          console.log("SecurityKai: Player is on cooldown or has reached max attempts");
          this.showCooldownDialog();
          return;
        }

        this.startQuiz(player);
      }
    }
  }

  // startQuiz: Starts the quiz interaction with the player.
  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Check if interactions are blocked.
    if (this.isInteractionBlocked()) {
      console.log("SecurityKai: Interaction blocked, cannot start quiz");
      return;
    }

    // Determine whether to use enhanced or simple quiz
    if (this.useEnhancedDialog) {
      this.startEnhancedQuiz(player);
    } else {
      this.startSimpleQuiz(player);
    }
  }

  private startEnhancedQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();
    
    // Start enhanced quiz session
    this.enhancedQuizManager.startQuizSession(this.npcId).then(session => {
      if (!session) {
        console.error("SecurityKai: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("SecurityKai: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Security Kai",
        npcAvatar: "npc_securitykai_avatar",
        theme: "Web3 Security & Safety",
        difficulty: currentQuestion.difficulty,
        question: currentQuestion.question,
        options: currentQuestion.options,
        explainer: currentQuestion.explanation,
        questionNumber: 1,
        totalQuestions: 1,
        onAnswer: (selectedAnswer) => this.handleEnhancedAnswer(selectedAnswer, currentQuestion, player),
        onClose: () => this.notifyQuizEnded()
      });
      
      this.currentDialog = dialog as any;
    }).catch(error => {
      console.error("SecurityKai: Enhanced quiz session error:", error);
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
      this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, baseReward, "SecurityKai");
    }

    // Close current dialog
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    // Show result dialog after a brief delay
    this.scene.time.delayedCall(500, () => {
      if (this.isInteractionBlocked()) {
        console.log("SecurityKai: Cannot show reward dialog - interactions are blocked");
        return;
      }
      
      if (isCorrect) {
        // Generate educational content for Web3 security
        const didYouKnowContent = this.generateSecurityDidYouKnow();
        const tipsContent = this.generateSecurityTips();
        
        // Create enhanced reward message
        const rewardMessage = `🛡️ Excellent security knowledge! You earned ${baseReward.toFixed(2)} $Quiztals! (${question.difficulty} difficulty)`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Security Kai",
          npcAvatar: "npc_securitykai_avatar",
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
          npcName: "Security Kai",
          npcAvatar: "npc_securitykai_avatar",
          wrongAnswerMessage: `❌ Not quite! "${selectedAnswer}" is not correct.`,
          correctAnswer: question.answer,
          explanation: question.explainer || "This question tests your understanding of key Web3 security concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForSecurity(),
          quickTips: this.generateQuickTipsForSecurity(),
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
  }

  private startSimpleQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Check if quiz manager is ready.
    if (!this.quizManager.isReady()) {
      console.warn("SecurityKai: Quiz manager not ready yet");
      return;
    }

    // Get random question using the quiz manager.
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);

    if (!questionData) {
      console.error("SecurityKai: No questions available");
      return;
    }

    // Store the index of the current question.
    this.lastQuestionIndex = questionData.index;
    const currentQuestion = questionData.question;

    // Notify QuizAntiSpamManager that a quiz has started.
    this.notifyQuizStarted();

    // Create a copy of options and shuffle them.
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);

    showDialog(this.scene, [{
      text: currentQuestion.question,
      avatar: "npc_securitykai_avatar",
      options: shuffledOptions.map(option => ({
        text: option,
        callback: () => {
          this.checkAnswer(option, currentQuestion.answer, player);
          // Notify QuizAntiSpamManager that the quiz has ended.
          this.notifyQuizEnded();
        }
      }))
    }]);
  }

  // checkAnswer: Checks the player's answer and provides feedback.
  private checkAnswer(selectedOption: string, correctAnswer: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selectedOption === correctAnswer;
    const reward = this.calculateReward(isCorrect);

    // Record quiz attempt regardless of whether correct or incorrect.
    const playerId = player.name || `anon_${Date.now()}`;
    this.recordQuizAttempt(playerId);

    // Play sound based on answer.
    const audioManager = AudioManager.getInstance();
    if (isCorrect) {
      audioManager.playCorrectSound();
    } else {
      audioManager.playWrongSound();
    }

    // Close the current dialog immediately.
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    this.scene.time.delayedCall(500, () => {
      // Check if interactions are blocked before showing reward dialog.
      if (this.isInteractionBlocked()) {
        console.log("SecurityKai: Cannot show reward dialog - interactions are blocked");
        return;
      }

      if (isCorrect) {
        // Generate educational content for Web3 security
        const didYouKnowContent = this.generateSecurityDidYouKnow();
        const tipsContent = this.generateSecurityTips();
        
        // Create enhanced reward message
        const rewardMessage = `🎉 Correct! You've earned ${reward.toFixed(2)} $Quiztals!`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Security Kai",
          npcAvatar: "npc_securitykai_avatar",
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
          npcName: "Security Kai",
          npcAvatar: "npc_securitykai_avatar",
          wrongAnswerMessage: `❌ Oops! "${selectedOption}" is not correct.`,
          correctAnswer: correctAnswer,
          explanation: "This question tests your understanding of key Web3 security concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForSecurity(),
          quickTips: this.generateQuickTipsForSecurity(),
          onClose: () => {
            // Reset the dialog state when player closes the dialog
            this.resetDialogState();
          }
        };
        
        showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
      }

      // Set up auto-reset for the dialog after 3 seconds.
      // This ensures the dialog reference is cleared even if the player doesn't click.
      this.setupDialogAutoReset(3000);
    });

    if (isCorrect) {
      this.saveRewardToDatabase(player, reward);
    }

    // Reset last question index so player can get the same question again in future interactions.
    this.lastQuestionIndex = -1;
  }

  // calculateReward: Calculates the reward for answering correctly.
  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
  }

  // saveRewardToDatabase: Saves the reward to the database and logs it.
  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "SecurityKai");

    // Also log to local session tracker.
    QuiztalRewardLog.logReward("SecurityKai", reward);

    // Log reward to reward logger.
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "SecurityKai", "SecurityKai");
      }
    }
  }

  // startShouting: Initiates the NPC's "shouting" of messages.
  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Yo anon, have you secured your web3 accounts yet? 😏",
      "Web3 security is important! Learn more from me! 🛡️",
      "Protect your digital assets! 🔒",
      "I'm Security Kai, your guide to web3 safety! 💡"
    ];

    // Network-specific shout messages.
    const networkOfflineMessages = [
      "Network down! No security tips until connection restored! 🚫📡",
      "Internet connection lost! Web3 security lessons on hold! 😢🔌",
      "Offline mode: SecurityKai's quizzes disabled! ⏸️",
      "No network, no knowledge challenges! 🔌",
      "Connection error: Quiz unavailable! 📡"
    ];

    scene.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        let randomMessage;

        // Check network connectivity to determine which message to show.
        if (!this.networkMonitor.getIsOnline()) {
          // Network is offline, show offline message.
          randomMessage = Phaser.Utils.Array.GetRandom(networkOfflineMessages);
        } else {
          // Network is online, show regular message.
          randomMessage = Phaser.Utils.Array.GetRandom(shoutMessages);
        }

        this.showShout(randomMessage);
        this.startShouting(scene);
      },
      loop: false
    });
  }

  // showShout: Displays the shout message above the NPC.
  private showShout(message: string) {
    this.shoutOutText.setText(message).setAlpha(1);
    this.scene.tweens.add({
      targets: this.shoutOutText,
      alpha: 0,
      duration: 2000,
      delay: 3000,
    });
  }

  // triggerNetworkStatusShout: Triggers a shout message based on network status changes.
  private triggerNetworkStatusShout(): void {
    let message: string;

    if (!this.networkMonitor.getIsOnline()) {
      // Network is offline.
      message = "🚨 Network connection lost! SecurityKai's quizzes disabled! 🚫";
    } else {
      // Network is online.
      message = "✅ Network connection restored! SecurityKai's quizzes available! 🌐";
    }

    this.showShout(message);
  }

  // getClosestPlayer: Determines the closest player to the NPC.
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
      
      // Use personality-specific cooldown message template like other standardized NPCs
      const cooldownMessages = [
        `🕒 Hey there! I'm taking a short break to recharge my quiz powers! Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
        `🔄 I'm updating my security protocols and threat databases. Return in ${formattedTime} to test your cybersecurity knowledge again! 🔐`,
        `🛡️ Security audit in progress! I'm checking for potential vulnerabilities in web3 platforms. Come back in ${formattedTime} for more safety education! 🔍`,
        `💡 Research time! I'm studying the latest security exploits and protection methods. Check back in ${formattedTime} for fresh quiz content! 🧠`
      ];
      
      const cooldownMessage = Phaser.Utils.Array.GetRandom(cooldownMessages);

      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "Security Kai",
        npcAvatar: "npc_securitykai_avatar",
        rewardMessage: cooldownMessage,
        rewardAmount: 0,
        onClose: () => {
          this.resetDialogState();
        }
      };
      
      showOptimizedRewardDialog(this.scene, cooldownDialogData);

      // Set up auto-reset for the dialog after 3 seconds
      this.setupDialogAutoReset(3000);
    });
  }

  private generateSecurityDidYouKnow(): string {
    const didYouKnowPhrases = [
      "Phishing attacks are the most common way users lose their crypto! Scammers create fake websites and emails that look legitimate to steal your private keys or login credentials.",
      "Hardware wallets (Ledger, Trezor) provide the highest level of security for storing cryptocurrencies! These devices keep your private keys offline, making them immune to online hacking attempts.",
      "Multi-signature wallets require multiple signatures to authorize transactions! This security feature adds an extra layer of protection by requiring approval from multiple devices or parties before funds can be moved.",
      "Never share your seed phrase with anyone, not even trusted family members! Your seed phrase is the master key to all your funds, and anyone who has it can access and steal your assets.",
      "Two-factor authentication (2FA) adds an extra layer of security to your accounts! Use authenticator apps like Google Authenticator or Authy instead of SMS-based 2FA for better protection."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateSecurityTips(): string {
    const tipsPhrases = [
      "Enable two-factor authentication (2FA) on all your crypto accounts! Use authenticator apps instead of SMS-based 2FA for better security.",
      "Regularly update your wallet software and device operating systems! Software updates often include critical security patches that protect against newly discovered vulnerabilities.",
      "Use strong, unique passwords for each wallet and exchange account! Consider using a reputable password manager to generate and store complex passwords securely.",
      "Backup your wallet and store copies in multiple secure locations! Keep backups in fireproof safes, safety deposit boxes, or other secure physical locations.",
      "Start with small amounts when using a new wallet or exchange! This minimizes potential losses while you familiarize yourself with the platform's security features."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(tipsPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateCommonMistakesForSecurity(): string {
    const commonMistakes = [
      "Storing large amounts of crypto on exchanges instead of personal wallets! Exchanges are frequent targets for hackers and may not fully compensate users in case of a breach.",
      "Using the same password across multiple platforms! If one service is compromised, hackers can use the same credentials to access your other accounts.",
      "Falling for fake wallet apps or phishing websites! Always download wallet software from official sources and verify URLs before entering sensitive information.",
      "Not backing up wallet recovery phrases properly! Store backups in multiple secure locations and never keep digital copies on internet-connected devices.",
      "Ignoring security warnings or software update notifications! These alerts often indicate critical vulnerabilities that need immediate attention."
    ];
    
    const selectedMistake = Phaser.Utils.Array.GetRandom(commonMistakes);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedMistake.length > 150) {
      return selectedMistake.substring(0, 147) + "...";
    }
    
    return selectedMistake;
  }
  
  private generateQuickTipsForSecurity(): string {
    const quickTips = [
      "Always verify transaction details before confirming! Check recipient addresses, amounts, and fees carefully to avoid costly mistakes.",
      "Use different addresses for each transaction when possible! This enhances privacy and makes it harder for others to track your financial activities.",
      "Keep your private keys absolutely private - never share them with anyone! No legitimate service will ever ask for your private keys.",
      "Enable all available security features in your wallet! Features like biometric authentication, PIN codes, and spending limits add layers of protection.",
      "Research any wallet or service before trusting it with your funds! Check reviews, security audits, and the development team's reputation."
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
