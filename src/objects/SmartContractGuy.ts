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

export default class SmartContractGuy extends QuizNPC {
  protected nameLabel: Phaser.GameObjects.Text;
  protected shoutOutText: Phaser.GameObjects.Text;

  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager: EnhancedQuizManager;
  private useEnhancedDialog: boolean = true;
  private readonly npcId = 'smartcontractguy';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "smart_contract_guy");
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    // Initialize quiz managers
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);

    this.createAnimations(scene);
    this.play("smartcontractguy-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Smart Contract Guy", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00ff41",
      stroke: "#003314",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#00ff41",
      stroke: "#003314",
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
    if (!scene.anims.exists("smartcontractguy-idle")) {
      scene.anims.create({
        key: "smartcontractguy-idle",
        frames: scene.anims.generateFrameNumbers("smart_contract_guy", { start: 0, end: 23 }),
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
        console.error("SmartContractGuy: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("SmartContractGuy: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Smart Contract Guy",
        npcAvatar: "npc_smartcontractguy_avatar",
        theme: "Smart Contracts & Development",
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
      console.error("SmartContractGuy: Enhanced quiz session error:", error);
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
      this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, baseReward, "SmartContractGuy");
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
        // Generate educational content for smart contracts
        const didYouKnowContent = this.generateSmartContractDidYouKnow();
        const tipsContent = this.generateSmartContractTips();
        
        // Create enhanced reward message
        const rewardMessage = `📝 Excellent smart contract knowledge! You earned ${baseReward.toFixed(2)} $Quiztals! (${question.difficulty} difficulty)`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Smart Contract Guy",
          npcAvatar: "npc_smartcontractguy_avatar",
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
          npcName: "Smart Contract Guy",
          npcAvatar: "npc_smartcontractguy_avatar",
          wrongAnswerMessage: `❌ Not executed correctly! "${selectedAnswer}" is not correct.`,
          correctAnswer: question.answer,
          explanation: question.explainer || "This question tests your understanding of key smart contract concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForSmartContracts(),
          quickTips: this.generateQuickTipsForSmartContracts(),
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
      console.warn("SmartContractGuy: Quiz manager not ready yet");
      return;
    }
    
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);
    
    if (!questionData) {
      console.error("SmartContractGuy: No questions available");
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
        avatar: "npc_smartcontractguy_avatar",
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
          return;
        }
        
        if (isCorrect) {
          // Generate educational content for smart contracts
          const didYouKnowContent = this.generateSmartContractDidYouKnow();
          const tipsContent = this.generateSmartContractTips();
          
          // Create enhanced reward message
          const rewardMessage = `📝 Smart! You earned ${reward.toFixed(2)} $Quiztals for your smart contract knowledge!`;
          
          // Show optimized reward dialog
          const rewardDialogData: OptimizedRewardDialogData = {
            npcName: "Smart Contract Guy",
            npcAvatar: "npc_smartcontractguy_avatar",
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
            npcName: "Smart Contract Guy",
            npcAvatar: "npc_smartcontractguy_avatar",
            wrongAnswerMessage: `❌ Not executed correctly! "${selectedOption}" is not correct.`,
            correctAnswer: correctAnswer,
            explanation: "This question tests your understanding of key smart contract concepts. Review the material and try again!",
            commonMistakes: this.generateCommonMistakesForSmartContracts(),
            quickTips: this.generateQuickTipsForSmartContracts(),
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
    saveQuiztalsToDatabase(playerId, reward, "SmartContractGuy");
    
    // Also log to local session tracker
    QuiztalRewardLog.logReward("SmartContractGuy", reward);
    
    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "SmartContractGuy", "SmartContractGuy");
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
      "Hey! Ready to code some smart contracts? 💻",
      "Decentralized automation is the future! Ask me! 🤖",
      "Smart contracts = trustless execution! Learn more! ⚙️",
      "Click me to earn $Quiztals while mastering smart contracts! 🚀"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No smart contract deployment until connection restored! 🚫📡",
      "Internet connection lost! Smart contract knowledge on hold! 😢🔌",
      "Offline mode: SmartContractGuy's tutorials disabled! ⏸️",
      "No network, no smart contract execution! 🔌",
      "Connection error: Smart contract quiz unavailable! 📡"
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
      message = "🚨 Network connection lost! SmartContractGuy's tutorials disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! SmartContractGuy's tutorials available! 🌐";
    }
    
    this.showShout(message);
  }

  private generateSmartContractDidYouKnow(): string {
    const didYouKnowPhrases = [
      "Smart contracts are self-executing contracts with terms directly written into code! They automatically enforce agreements without the need for a middleman, making transactions faster and more secure.",
      "The first smart contract was proposed by cryptographer Nick Szabo in 1994, years before Bitcoin! He envisioned a digital protocol that would facilitate and enforce contractual terms without a trusted intermediary.",
      "Ethereum was the first blockchain to implement smart contracts successfully! This innovation allowed developers to create decentralized applications (dApps) that could execute complex logic automatically.",
      "Smart contracts are immutable once deployed to the blockchain! This means they cannot be changed, which is both a strength (trustless execution) and a weakness (bugs can't be fixed easily).",
      "Gas fees are required to execute smart contracts on Ethereum! These fees compensate miners for computational resources and prevent infinite loops that could clog the network."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateSmartContractTips(): string {
    const tipsPhrases = [
      "Always test your smart contracts thoroughly on testnets before deploying to mainnet! Networks like Goerli and Sepolia allow you to test with fake ETH without risking real funds.",
      "Use established development frameworks like Hardhat or Foundry for Ethereum development! These tools provide testing environments, debugging capabilities, and deployment scripts.",
      "Implement proper error handling with require() statements to make your contracts more robust! Clear error messages help users understand what went wrong.",
      "Consider using upgradeable contracts for long-term projects to fix bugs without losing data! Proxy patterns allow you to update contract logic while preserving state.",
      "Read the documentation for libraries and frameworks carefully - small details can have big impacts! Pay special attention to security considerations and best practices."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(tipsPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateCommonMistakesForSmartContracts(): string {
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
  
  private generateQuickTipsForSmartContracts(): string {
    const quickTips = [
      "Use events (logs) in your smart contracts to track important actions and improve frontend integration!",
      "Implement proper error handling with require() statements to make your contracts more robust!",
      "Consider using upgradeable contracts for long-term projects to fix bugs without losing data!",
      "Read the documentation for libraries and frameworks carefully - small details can have big impacts!",
      "Join smart contract developer communities for support, code reviews, and learning opportunities!"
    ];
    
    const selectedTip = Phaser.Utils.Array.GetRandom(quickTips);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedTip.length > 150) {
      return selectedTip.substring(0, 147) + "...";
    }
    
    return selectedTip;
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
          text: `📝 Hello there! I'm currently reviewing the latest smart contract protocols. Please return in ${formattedTime}. In the meantime, why not visit other experts around the campus? They might have knowledge to share! 🏫`,
          avatar: "npc_smartcontractguy_avatar",
          isExitDialog: true
        }
      ]);
      
      // Set up auto-reset for the dialog after 3 seconds
      this.setupDialogAutoReset(3000);
    });
  }
}