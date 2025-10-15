import Phaser from "phaser";
import { saveQuiztalsToDatabase } from "../utils/Database";
import AudioManager from '../managers/AudioManager';
import QuizNPC from "./QuizNPC";
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import NPCQuizManager from '../managers/NPCQuizManager';
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';

export default class NftCyn extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'nftcyn';
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "nftcyn");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    this.createAnimations(scene);
    this.play("nftcyn-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "NFT Cyn", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ff69b4",
      stroke: "#33001a",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#ff69b4",
      stroke: "#33001a",
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
    if (!scene.anims.exists("nftcyn-idle")) {
      scene.anims.create({
        key: "nftcyn-idle",
        frames: scene.anims.generateFrameNumbers("nft_cyn", { start: 0, end: 23 }),
        frameRate: 1,
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
      console.log("NftCyn: Not enough stamina for interaction");
      return;
    }

    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      // Use optimized reward dialog for network offline message
      const offlineDialogData: OptimizedRewardDialogData = {
        npcName: "NFT Cyn",
        npcAvatar: "npc_nftcyn_avatar",
        rewardMessage: "🚫 Network connection lost! Please check your internet connection to continue playing.",
        rewardAmount: 0,
        onClose: () => {
          this.resetDialogState();
        }
      };
      
      showOptimizedRewardDialog(this.scene, offlineDialogData);

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
        // Use the checkCooldown method which properly handles expired cooldowns
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

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("NftCyn: Quiz manager not ready yet");
      return;
    }
    
    // Use enhanced quiz system if enabled
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
        console.error("NftCyn: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("NftCyn: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "NFT Cyn",
        npcAvatar: "npc_nftcyn_avatar",
        theme: "NFTs & Digital Art",
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
      console.error("NftCyn: Enhanced quiz session error:", error);
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
      this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, baseReward, "NftCyn");
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
        // Generate educational content for NFTs
        const didYouKnowContent = this.generateNFTDidYouKnow();
        const tipsContent = this.generateNFTTips();
        
        // Create enhanced reward message
        const rewardMessage = `🎨 Amazing! You earned ${baseReward.toFixed(2)} $Quiztals for your NFT knowledge! (${question.difficulty} difficulty)`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "NFT Cyn",
          npcAvatar: "npc_nftcyn_avatar",
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
          npcName: "NFT Cyn",
          npcAvatar: "npc_nftcyn_avatar",
          wrongAnswerMessage: `🖼️ Not quite! "${selectedAnswer}" is not correct.`,
          correctAnswer: question.answer,
          explanation: question.explainer || "This question tests your understanding of key NFT concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForNFT(),
          quickTips: this.generateQuickTipsForNFT(),
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
      console.error("NftCyn: No questions available");
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
      npcName: "NFT Cyn",
      npcAvatar: "npc_nftcyn_avatar",
      theme: "NFTs & Digital Art",
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
          return;
        }
        
        if (isCorrect) {
          // Generate educational content for NFTs
          const didYouKnowContent = this.generateNFTDidYouKnow();
          const tipsContent = this.generateNFTTips();
          
          // Create enhanced reward message
          const rewardMessage = `🎨 Correct! You earned ${reward.toFixed(2)} $Quiztals for your NFT knowledge!`;
          
          // Show optimized reward dialog
          const rewardDialogData: OptimizedRewardDialogData = {
            npcName: "NFT Cyn",
            npcAvatar: "npc_nftcyn_avatar",
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
            npcName: "NFT Cyn",
            npcAvatar: "npc_nftcyn_avatar",
            wrongAnswerMessage: `❌ Nope! "${selectedOption}" is not correct.`,
            correctAnswer: correctAnswer,
            explanation: "This question tests your understanding of key NFT concepts. Review the material and try again!",
            commonMistakes: this.generateCommonMistakesForNFT(),
            quickTips: this.generateQuickTipsForNFT(),
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

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "NftCyn");
    
    // Also log to local session tracker
    QuiztalRewardLog.logReward("NftCyn", reward);
    
    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "NftCyn", "NftCyn");
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
      "Hey! Want to learn about NFTs? I'm your guide! 🎨",
      "NFTs are more than just digital art! Ask me! 💡",
      "Blockchain for creators! Talk to me! 🧑‍🎨",
      "Click me to earn $Quiztals while learning NFTs! 🎉"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No NFT lessons until connection restored! 🚫📡",
      "Internet connection lost! NFT knowledge on hold! 😢🔌",
      "Offline mode: NftCyn's quizzes disabled! ⏸️",
      "No network, no NFT knowledge sharing! 🔌",
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
      message = "🚨 Network connection lost! NftCyn's quizzes disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! NftCyn's quizzes available! 🌐";
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
        `🕒 Hello there! I'm taking a short break to recharge my NFT knowledge! Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
        `🔄 I'm researching the latest NFT trends and marketplace innovations. Come back in ${formattedTime} to test your knowledge again! 🎨`,
        `🛡️ Security check in progress! I'm auditing smart contracts and checking for potential vulnerabilities. Return in ${formattedTime} for more NFT education! 🔍`,
        `💡 Research time! I'm studying the latest developments in digital art and collectibles. Check back in ${formattedTime} for fresh quiz content! 🧠`
      ];
      
      const cooldownMessage = Phaser.Utils.Array.GetRandom(cooldownMessages);

      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "NFT Cyn",
        npcAvatar: "npc_nftcyn_avatar",
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

  private generateNFTDidYouKnow(): string {
    const didYouKnowPhrases = [
      "The first NFT was created in 2014 on Namecoin blockchain, predating Ethereum! This early NFT was a digital artwork called 'Quantum' by Kevin McCoy.",
      "NFTs can represent ownership of both digital and physical assets! From artwork to real estate, NFTs are being used to tokenize various types of property.",
      "Most NFTs are minted on Ethereum, but other blockchains like Solana and Polygon are gaining popularity! These alternatives often have lower fees and faster transactions.",
      "The term 'minting' comes from the traditional process of creating physical coins! Just like a government mint produces currency, NFT minting creates unique digital assets.",
      "Smart contracts automatically enforce NFT ownership and transfer rules! These self-executing contracts eliminate the need for intermediaries in digital asset transactions."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateNFTTips(): string {
    const tipsPhrases = [
      "Research the project team and community before minting NFTs! Legitimate projects have transparent teams and active communities.",
      "Set a maximum gas fee (Gwei) to avoid overpaying for Ethereum transactions! Most wallets allow you to set spending limits for protection.",
      "Use testnets to practice minting before spending real money! Ethereum testnets like Rinkeby let you experiment with NFTs using fake ETH.",
      "Verify the smart contract address before purchasing NFTs! Scammers often create fake NFTs with similar names to popular collections.",
      "Consider the environmental impact of NFTs on energy-intensive blockchains! Look for projects on eco-friendly networks like Polygon or Tezos."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(tipsPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateCommonMistakesForNFT(): string {
    const commonMistakes = [
      "Confusing NFTs with cryptocurrencies - remember NFTs are unique digital assets, not currencies!",
      "Thinking all NFTs are valuable - most NFTs have no real-world value, be selective!",
      "Overlooking gas fees for minting - Ethereum gas fees can be extremely expensive!",
      "Forgetting to research the project - always verify the team and roadmap before investing!",
      "Minting without understanding royalties - creators earn ongoing commissions from secondary sales!"
    ];
    
    const selectedMistake = Phaser.Utils.Array.GetRandom(commonMistakes);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedMistake.length > 150) {
      return selectedMistake.substring(0, 147) + "...";
    }
    
    return selectedMistake;
  }
  
  private generateQuickTipsForNFT(): string {
    const quickTips = [
      "Always verify the smart contract address before purchasing NFTs to avoid scams!",
      "Check the project's social media activity and community engagement before investing!",
      "Use testnets to practice minting before spending real money on gas fees!",
      "Store valuable NFTs in hardware wallets for maximum security!",
      "Diversify your NFT portfolio across different projects and categories!"
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
