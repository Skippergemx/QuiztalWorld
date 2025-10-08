import Phaser from "phaser";
import { showDialog, SimpleDialogBox } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import QuizNPC from "./QuizNPC";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';

export default class WalletSafetyFriend extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager: EnhancedQuizManager;
  private useEnhancedDialog: boolean = true;
  private readonly npcId = 'walletsafetyfriend';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "wallet_safety_friend");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    // Initialize quiz managers
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    this.createAnimations(scene);
    this.play("walletsafetyfriend-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Wallet Safety Friend", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#32cd32",
      stroke: "#006400",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#32cd32",
      stroke: "#006400",
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
    if (!scene.anims.exists("walletsafetyfriend-idle")) {
      scene.anims.create({
        key: "walletsafetyfriend-idle",
        frames: scene.anims.generateFrameNumbers("wallet_safety_friend", { start: 0, end: 23 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("WalletSafetyFriend: Dialog already open, ignoring interaction");
      return;
    }
    
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("WalletSafetyFriend: Network offline - showing offline message");
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
          console.log("WalletSafetyFriend: Player is on cooldown or has reached max attempts");
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
      console.log("WalletSafetyFriend: Interaction blocked, cannot start quiz");
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
        console.error("WalletSafetyFriend: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("WalletSafetyFriend: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Wallet Safety Friend",
        npcAvatar: "npc_walletsafetyfriend_avatar",
        theme: "Wallet Security & Safety",
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
      console.error("WalletSafetyFriend: Enhanced quiz session error:", error);
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
      this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, baseReward, "WalletSafetyFriend");
    }

    // Close current dialog
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }

    // Show result dialog after a brief delay
    this.scene.time.delayedCall(500, () => {
      if (this.isInteractionBlocked()) {
        console.log("WalletSafetyFriend: Cannot show reward dialog - interactions are blocked");
        return;
      }
      
      if (isCorrect) {
        // Generate educational content for wallet security
        const didYouKnowContent = this.generateWalletSecurityDidYouKnow();
        const tipsContent = this.generateWalletSecurityTips();
        
        // Create enhanced reward message
        const rewardMessage = `🛡️ Excellent wallet security knowledge! You earned ${baseReward.toFixed(2)} $Quiztals! (${question.difficulty} difficulty)`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Wallet Safety Friend",
          npcAvatar: "npc_walletsafetyfriend_avatar",
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
          npcName: "Wallet Safety Friend",
          npcAvatar: "npc_walletsafetyfriend_avatar",
          wrongAnswerMessage: `❌ Oops! "${selectedAnswer}" is not correct.`,
          correctAnswer: question.answer,
          explanation: question.explanation || "This question tests your understanding of key wallet security concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakes(),
          quickTips: this.generateQuickTips(),
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
    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("WalletSafetyFriend: Quiz manager not ready yet");
      return;
    }
    
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
    
    if (!questionData) {
      console.error("WalletSafetyFriend: No questions available");
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
        avatar: "npc_walletsafetyfriend_avatar",
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
          console.log("WalletSafetyFriend: Cannot show reward dialog - interactions are blocked");
          return;
        }
        
        if (isCorrect) {
          // Generate educational content for wallet security
          const didYouKnowContent = this.generateWalletSecurityDidYouKnow();
          const tipsContent = this.generateWalletSecurityTips();
          
          // Create enhanced reward message
          const rewardMessage = `🛡️ Excellent! You earned ${reward.toFixed(2)} $Quiztals for keeping your wallet secure!`;
          
          // Show optimized reward dialog
          const rewardDialogData: OptimizedRewardDialogData = {
            npcName: "Wallet Safety Friend",
            npcAvatar: "npc_walletsafetyfriend_avatar",
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
            npcName: "Wallet Safety Friend",
            npcAvatar: "npc_walletsafetyfriend_avatar",
            wrongAnswerMessage: `❌ Oops! "${selectedOption}" is not correct.`,
            correctAnswer: correctAnswer,
            explanation: "This question tests your understanding of key wallet security concepts. Review the material and try again!",
            commonMistakes: this.generateCommonMistakes(),
            quickTips: this.generateQuickTips(),
            onClose: () => {
              // Reset the dialog state when player closes the dialog
              this.resetDialogState();
            }
          };
          
          showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
        }
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
    saveQuiztalsToDatabase(playerId, reward, "WalletSafetyFriend");
    
    // Also log to local session tracker
    QuiztalRewardLog.logReward("WalletSafetyFriend", reward);
    
    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "WalletSafetyFriend", "WalletSafetyFriend");
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
      "Keep your crypto safe! I'll teach you how! 🛡️",
      "Wallet security is crucial! Learn the best practices! 🔒",
      "Don't let scammers steal your funds! Ask me about safety! 🚨",
      "Click me to earn $Quiztals while learning wallet security! 💚"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No wallet safety lessons until connection restored! 🚫📡",
      "Internet connection lost! Wallet security tips on hold! 😢🔌",
      "Offline mode: WalletSafetyFriend's lessons disabled! ⏸️",
      "No network, no security guidance! 🔌",
      "Connection error: Safety quiz unavailable! 📡"
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
      message = "🚨 Network connection lost! WalletSafetyFriend's security lessons disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! WalletSafetyFriend's security lessons available! 🌐";
    }
    
    this.showShout(message);
  }

  protected showCooldownDialog() {
    // Add a delay before showing the cooldown dialog
    // This allows players to see their reward from the third quiz
    this.scene.time.delayedCall(3000, () => { // 3 second delay
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      
      // Use personality-specific cooldown message template like other standardized NPCs
      const cooldownMessages = [
        `🛡️ Hello there! I'm currently updating my security protocols. Please return in ${formattedTime}. In the meantime, why not visit other experts around the campus? They might have knowledge to share! 🏫`,
        `🔄 I'm refreshing my knowledge on the latest wallet security threats. Come back in ${formattedTime} to test your security awareness again! 🔐`,
        `🔒 Security check in progress! I'm auditing common attack vectors and protection strategies. Return in ${formattedTime} for more safety education! 🔍`,
        `💡 Research time! I'm studying new security exploits and defense mechanisms. Check back in ${formattedTime} for fresh quiz content! 🧠`
      ];
      
      const cooldownMessage = Phaser.Utils.Array.GetRandom(cooldownMessages);

      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "Wallet Safety Friend",
        npcAvatar: "npc_walletsafetyfriend_avatar",
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

  private generateWalletSecurityDidYouKnow(): string {
    const didYouKnowPhrases = [
      "Hardware wallets (Ledger, Trezor) provide the highest level of security for storing cryptocurrencies! These devices keep your private keys offline, making them immune to online hacking attempts and malware.",
      "Never share your seed phrase with anyone, not even trusted family members! Your seed phrase is the master key to all your funds, and anyone who has it can access and steal your assets.",
      "Multi-signature wallets require multiple signatures to authorize transactions! This security feature adds an extra layer of protection by requiring approval from multiple devices or parties before funds can be moved.",
      "Phishing attacks are one of the most common ways users lose their crypto! Always verify URLs, check for SSL certificates, and never click on links from unknown sources when accessing wallet interfaces.",
      "Cold storage (offline wallets) is the safest way to store large amounts of cryptocurrency! By keeping funds completely offline, you eliminate the risk of online attacks and network-based theft."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateWalletSecurityTips(): string {
    const tipsPhrases = [
      "Enable two-factor authentication (2FA) on all your crypto accounts! Use authenticator apps like Google Authenticator or Authy instead of SMS-based 2FA for better security.",
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
  
  private generateCommonMistakes(): string {
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
  
  private generateQuickTips(): string {
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
