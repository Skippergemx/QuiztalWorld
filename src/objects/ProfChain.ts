import Phaser from "phaser";
import { showDialog, SimpleDialogBox } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import QuizNPC from "./QuizNPC";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';

export default class ProfChain extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager: EnhancedQuizManager;
  private useEnhancedDialog: boolean = true;
  private readonly npcId = 'profchain';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "prof_chain");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    // Initialize quiz managers
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    this.createAnimations(scene);
    this.play("profchain-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Prof Chain", {
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
  }

  private createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists("profchain-idle")) {
      scene.anims.create({
        key: "profchain-idle",
        frames: scene.anims.generateFrameNumbers("prof_chain", { start: 0, end: 23 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      return;
    }
    
    // Check player stamina before allowing interaction
    if (!this.checkPlayerStamina()) {
      console.log("ProfChain: Not enough stamina for interaction");
      return;
    }

    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
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
        console.error("ProfChain: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("ProfChain: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Prof Chain",
        npcAvatar: "npc_profchain_avatar",
        theme: "Blockchain & Decentralization",
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
      console.error("ProfChain: Enhanced quiz session error:", error);
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
      this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, baseReward, "ProfChain");
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
        // Generate educational content for blockchain
        const didYouKnowContent = this.generateBlockchainDidYouKnow();
        const tipsContent = this.generateBlockchainTips();
        
        // Create enhanced reward message
        const rewardMessage = `⛓️ Excellent blockchain knowledge! You earned ${baseReward.toFixed(2)} $Quiztals! (${question.difficulty} difficulty)`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Prof Chain",
          npcAvatar: "npc_profchain_avatar",
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
          npcName: "Prof Chain",
          npcAvatar: "npc_profchain_avatar",
          wrongAnswerMessage: `❌ Not quite! "${selectedAnswer}" is not correct.`,
          correctAnswer: question.answer,
          explanation: question.explainer || "This question tests your understanding of key blockchain concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForBlockchain(),
          quickTips: this.generateQuickTipsForBlockchain(),
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
      console.warn("ProfChain: Quiz manager not ready yet");
      return;
    }
    
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
    
    if (!questionData) {
      console.error("ProfChain: No questions available");
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
        avatar: "npc_profchain_avatar",
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
          console.log("ProfChain: Cannot show reward dialog - interactions are blocked");
          return;
        }
        
        if (isCorrect) {
          // Generate educational content for blockchain
          const didYouKnowContent = this.generateBlockchainDidYouKnow();
          const tipsContent = this.generateBlockchainTips();
          
          // Create enhanced reward message
          const rewardMessage = `⛓️ Excellent! You earned ${reward.toFixed(2)} $Quiztals for your blockchain knowledge!`;
          
          // Show optimized reward dialog
          const rewardDialogData: OptimizedRewardDialogData = {
            npcName: "Prof Chain",
            npcAvatar: "npc_profchain_avatar",
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
            npcName: "Prof Chain",
            npcAvatar: "npc_profchain_avatar",
            wrongAnswerMessage: `❌ Not quite! "${selectedOption}" is not correct.`,
            correctAnswer: correctAnswer,
            explanation: "This question tests your understanding of key blockchain concepts. Review the material and try again!",
            commonMistakes: this.generateCommonMistakesForBlockchain(),
            quickTips: this.generateQuickTipsForBlockchain(),
            onClose: () => {
              // Reset the dialog state when player closes the dialog
              this.resetDialogState();
            }
          };
          
          showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
        }
        
        // Set up auto-reset for the dialog after 3 seconds
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
    saveQuiztalsToDatabase(playerId, reward, "ProfChain");
    
    // Also log to local session tracker
    QuiztalRewardLog.logReward("ProfChain", reward);
    
    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "ProfChain", "ProfChain");
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
      "Greetings! Ready to explore blockchain technology? 🔗",
      "Blockchain is the foundation of Web3! Ask me about it! ⛓️",
      "Decentralization awaits! Let's discuss blockchain! 🌐",
      "Click me to earn $Quiztals while learning blockchain! 🎓"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No blockchain lessons until connection restored! 🚫📡",
      "Internet connection lost! Blockchain knowledge on hold! 😢🔌",
      "Offline mode: Prof Chain's lectures disabled! ⏸️",
      "No network, no blockchain wisdom sharing! 🔌",
      "Connection error: Blockchain quiz unavailable! 📡"
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
      message = "🚨 Network connection lost! Prof Chain's lectures disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! Prof Chain's lectures available! 🌐";
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
        `🕒 Greetings, student! I'm currently preparing my next blockchain lecture. Please return in ${formattedTime}. In the meantime, why not visit other professors around the campus? They might have knowledge to share! 🏫`,
        `🔄 I'm researching the latest blockchain innovations and consensus mechanisms. Come back in ${formattedTime} to test your knowledge again! 🔗`,
        `🛡️ Security check in progress! I'm auditing smart contracts and checking for potential vulnerabilities. Return in ${formattedTime} for more blockchain education! 🔍`,
        `💡 Research time! I'm studying the latest developments in decentralized technology. Check back in ${formattedTime} for fresh quiz content! 🧠`
      ];
      
      const cooldownMessage = Phaser.Utils.Array.GetRandom(cooldownMessages);

      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "Prof Chain",
        npcAvatar: "npc_profchain_avatar",
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

  private generateCommonMistakesForBlockchain(): string {
    const commonMistakes = [
      "Confusing blockchain with cryptocurrency - blockchain is the technology, cryptocurrency is just one application!",
      "Thinking all blockchains are the same - each has different consensus mechanisms, speeds, and use cases!",
      "Overlooking transaction fees - gas fees can vary dramatically between networks!",
      "Forgetting about scalability limitations - most blockchains can only process a limited number of transactions per second!",
      "Misunderstanding decentralization levels - some blockchains are more centralized than others!"
    ];
    
    const selectedMistake = Phaser.Utils.Array.GetRandom(commonMistakes);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedMistake.length > 150) {
      return selectedMistake.substring(0, 147) + "...";
    }
    
    return selectedMistake;
  }
  
  private generateQuickTipsForBlockchain(): string {
    const quickTips = [
      "Always verify transaction details before confirming - you can't reverse blockchain transactions!",
      "Use layer-2 solutions when available to save on gas fees!",
      "Research consensus mechanisms - Proof of Stake is generally more energy-efficient than Proof of Work!",
      "Keep your private keys secure - never share them with anyone!",
      "Diversify across multiple blockchains for different use cases!"
    ];
    
    const selectedTip = Phaser.Utils.Array.GetRandom(quickTips);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedTip.length > 150) {
      return selectedTip.substring(0, 147) + "...";
    }
    
    return selectedTip;
  }

  private generateBlockchainDidYouKnow(): string {
    const didYouKnowPhrases = [
      "The Bitcoin blockchain was the first successful implementation of a decentralized digital currency! Created by the mysterious Satoshi Nakamoto in 2009, it solved the double-spending problem without requiring a central authority.",
      "Ethereum was the first blockchain to introduce smart contracts! This innovation allowed developers to create decentralized applications (dApps) that could execute complex logic automatically.",
      "Proof of Stake consensus mechanisms are much more energy-efficient than Proof of Work! While Bitcoin mining consumes as much energy as entire countries, Proof of Stake blockchains can operate with a fraction of that energy.",
      "Blockchain transactions are irreversible by design! Once confirmed, transactions cannot be reversed, which is why it's crucial to verify all details before sending.",
      "The concept of blockchain was first described in 1991 by Stuart Haber and W. Scott Stornetta! They proposed a cryptographically secured chain of blocks to timestamp digital documents."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateBlockchainTips(): string {
    const tipsPhrases = [
      "Start with established blockchains like Ethereum or Solana when learning to develop dApps! These platforms have extensive documentation and developer communities.",
      "Always research the consensus mechanism of a blockchain before investing! Proof of Stake is generally more energy-efficient than Proof of Work.",
      "Use blockchain explorers to verify transactions and smart contract details! These tools provide transparency and help you confirm information independently.",
      "Keep track of gas fees and network congestion when transacting! Performing transactions during low-traffic periods can save you significant costs.",
      "Understand the difference between custodial and non-custodial wallets! Non-custodial wallets give you full control over your private keys and funds."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(tipsPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }

}
