// AlchemyMan.ts
import Phaser from "phaser";
import { saveQuiztalsToDatabase } from "../utils/Database"; // Firestore save utility
import AudioManager from '../managers/AudioManager'; // Import the AudioManager
import WalkingNPC from "./WalkingNPC"; // Import the WalkingNPC base class instead of QuizNPC
import QuiztalRewardLog from '../utils/QuiztalRewardLog'; // Import reward logging
import NPCQuizManager from '../managers/NPCQuizManager';
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior"; // Import the SimplePatrolBehavior
import PhysicsManager from '../managers/PhysicsManager'; // Import PhysicsManager for collision handling
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';

export default class AlchemyMan extends WalkingNPC {
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'alchemyman';
  private hasQuizData: boolean = false;
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_alchemyman");

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);
    
    // Load quiz data for Alchemy Man
    this.quizManager.loadQuizData(this.npcId).then(() => {
      this.hasQuizData = true;
      // Ensure EnhancedQuizManager is also ready
    }).catch((error) => {
      console.warn('⚠️ AlchemyMan: Failed to load quiz data:', error);
    });
    
    // Add physics properties
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    // Set up physics
    this.setImmovable(true);  // Prevent player from pushing Alchemy Man around
    this.setCollideWorldBounds(true);
    
    // Register with PhysicsManager for proper collision handling
    const physicsManager = PhysicsManager.getInstance(scene);
    if (physicsManager) {
      physicsManager.setupNPCCollisions(this);
      
      // Add specific collider for player interaction
      const player = this.getClosestPlayer();
      if (player) {
        physicsManager.addCollision(this, player);
      }
    }
    
    // Define vertical patrol points (Point A and Point B)
    // Adjust these coordinates as needed for the desired patrol area
    const pointA = { x: x, y: y - 100 };  // 100 pixels up
    const pointB = { x: x, y: y + 100 };  // 100 pixels down
    
    // Set up the simple patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    this.createAnimations(scene);
    this.play("alchemyman-idle-down"); // Set initial animation

    // Register with the scene as an updateable object
    scene.events.on('update', this.update, this);

    // Use the inherited nameLabel property
    this.nameLabel = scene.add.text(x, y - 40, "Alchemy Man", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#9932cc", 
      stroke: "#4b0082",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    // Use the inherited shoutOutText property
    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#9932cc",
      stroke: "#4b0082",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    this.startShouting(scene);

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
    
    // Set proper depth for rendering
    this.setDepth(10);
  }

  // Handle world bounds collision by switching patrol direction
  private handleWorldBoundsCollision(): void {
    const currentBehavior = this.getBehavior() as SimplePatrolBehavior | null;
    
    if (currentBehavior) {
      // Get current target
      const currentTarget = currentBehavior['currentTarget'];
      
      // Switch to the opposite point
      currentBehavior['currentTarget'] = (currentTarget === currentBehavior['pointA']) 
        ? currentBehavior['pointB'] 
        : currentBehavior['pointA'];
    }
  }

  // Override the update method to handle world bounds collision
  public update(deltaTime: number): void {
    // Call the parent update method to ensure walking behavior is updated
    super.update(deltaTime);
    
    // Check if we've hit the world bounds
    if (this.body && (this.body.blocked.left || this.body.blocked.right || 
        this.body.blocked.up || this.body.blocked.down)) {
      this.handleWorldBoundsCollision();
    }
  }

  // Create animations for Alchemy Man
  private createAnimations(scene: Phaser.Scene) {
    // Check if animations already exist to prevent conflicts
    if (scene.anims.exists("alchemyman-idle-down")) {
      return;
    }

    // Create animations using the exact frame order as confirmed:
    // Right: frames 0-5, Up: frames 6-11, Left: frames 12-17, Down: frames 18-23
    const animationConfig = [
      { name: 'right', idleStart: 0, idleEnd: 5, walkStart: 0, walkEnd: 5 },
      { name: 'up', idleStart: 6, idleEnd: 11, walkStart: 6, walkEnd: 11 },
      { name: 'left', idleStart: 12, idleEnd: 17, walkStart: 12, walkEnd: 17 },
      { name: 'down', idleStart: 18, idleEnd: 23, walkStart: 18, walkEnd: 23 }
    ];
    
    animationConfig.forEach(config => {
      // Idle animation
      const idleKey = `alchemyman-idle-${config.name}`;
      
      if (!scene.anims.exists(idleKey)) {
        const idleFrames = scene.anims.generateFrameNumbers("npc_alchemyman", {
          start: config.idleStart,
          end: config.idleEnd,
        });
        
        scene.anims.create({
          key: idleKey,
          frames: idleFrames,
          frameRate: 3,
          repeat: -1,
        });
      }

      // Walk animation
      const walkKey = `alchemyman-walk-${config.name}`;
      
      if (!scene.anims.exists(walkKey)) {
        const walkFrames = scene.anims.generateFrameNumbers("npc_alchemyman_walk", {
          start: config.walkStart,
          end: config.walkEnd,
        });
        
        scene.anims.create({
          key: walkKey,
          frames: walkFrames,
          frameRate: 8,
          repeat: -1,
        });
      }
    });
  }
  
  public interact() {
    // Call the parent's onInteractionStart method to handle walking behavior
    this.onInteractionStart();
    
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("Alchemy Man: Dialog already open, ignoring interaction");
      return;
    }

    // Check player stamina before allowing interaction
    if (!this.checkPlayerStamina()) {
      console.log("Alchemy Man: Not enough stamina for interaction");
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
          console.log("Alchemy Man: Player is on cooldown or has reached max attempts");
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
      console.log("Alchemy Man: Interaction blocked, cannot start quiz");
      return;
    }

    // Check if we have quiz data
    if (!this.hasQuizData) {
      console.warn("Alchemy Man: No quiz data available, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("Alchemy Man: Quiz manager not ready yet");
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
        console.log("Alchemy Man: Cannot show reward dialog - interactions are blocked");
        return;
      }

      if (isCorrect) {
        // Generate educational content for blockchain infrastructure
        const didYouKnowContent = this.generateBlockchainDidYouKnow();
        const tipsContent = this.generateBlockchainTips();
        
        // Create enhanced reward message
        const rewardMessage = `🔮 Brilliant! You've earned ${reward.toFixed(2)} $Niftdoods for your blockchain knowledge!`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Alchemy Man",
          npcAvatar: "npc_alchemyman_avatar",
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
          npcName: "Alchemy Man",
          npcAvatar: "npc_alchemyman_avatar",
          wrongAnswerMessage: `🧪 Not quite! "${selectedOption}" is not correct.`,
          correctAnswer: correctAnswer,
          explanation: "This question tests your understanding of key blockchain infrastructure concepts. Review the material and try again!",
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
    
    // Resume walking after interaction
    this.scene.time.delayedCall(3000, () => {
      this.onInteractionEnd();
    });
  }

  private startEnhancedQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();
    
    // Start enhanced quiz session
    this.enhancedQuizManager.startQuizSession(this.npcId).then(session => {
      if (!session) {
        console.error("AlchemyMan: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("AlchemyMan: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Alchemy Man",
        npcAvatar: "npc_alchemyman_avatar",
        theme: "Blockchain Infrastructure & Alchemy",
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
      console.error("AlchemyMan: Enhanced quiz session error:", error);
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
        // Generate educational content for blockchain infrastructure
        const didYouKnowContent = this.generateBlockchainDidYouKnow();
        const tipsContent = this.generateBlockchainTips();
        
        // Create enhanced reward message
        const rewardMessage = `🔮 Brilliant! You've earned ${reward.toFixed(2)} $Niftdoods for your blockchain knowledge!`;

        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Alchemy Man",
          npcAvatar: "npc_alchemyman_avatar",
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
        this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, reward, "AlchemyMan");
      } else {
        // Incorrect answer - show optimized wrong answer dialog
        const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
          npcName: "Alchemy Man",
          npcAvatar: "npc_alchemyman_avatar",
          wrongAnswerMessage: `🧪 Not quite! "${selectedOption}" is not correct.`,
          correctAnswer: enhancedQuestion.answer,
          explanation: enhancedQuestion.explainer || "This question tests your understanding of key blockchain infrastructure concepts. Review the material and try again!",
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
    
    // Resume walking after interaction
    this.scene.time.delayedCall(3500, () => {
      this.lastQuestionIndex = -1;
      this.onInteractionEnd();
    });
  }

  private startSimpleQuiz(player: Phaser.Physics.Arcade.Sprite) {
    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);

    if (!questionData) {
      console.error("Alchemy Man: No questions available");
      return;
    }

    // Store the index of the current question
    this.lastQuestionIndex = questionData.index;
    const currentQuestion = questionData.question;

    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();

    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);
    
    // Ensure exactly 3 options by selecting first 3 (since some questions have 4 options)
    const optionsLimited = shuffledOptions.slice(0, 3);

    // Use optimized enhanced quiz dialog instead of simple dialog
    const dialog = new OptimizedEnhancedQuizDialog(this.scene);
    
    dialog.showQuizDialog({
      npcName: "Alchemy Man",
      npcAvatar: "npc_alchemyman_avatar",
      theme: "Blockchain Infrastructure & Alchemy",
      question: currentQuestion.question,
      options: optionsLimited,
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
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.05, 0.7).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "AlchemyMan");

    // Also log to local session tracker
    QuiztalRewardLog.logReward("AlchemyMan", reward);
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Unlock the power of blockchain with Alchemy! 🔮",
      "Build Web3 applications with reliable infrastructure! ⚡",
      "Explore the future of decentralized technology! 🌐",
      "Alchemy - Your gateway to the blockchain universe! ⛓️",
      "Scale your dApps with enterprise-grade infrastructure! 🚀",
      "Learn about the most powerful blockchain platform! 💎"
    ];

    scene.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        const randomMessage = Phaser.Utils.Array.GetRandom(shoutMessages);
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

  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closestPlayer: Phaser.Physics.Arcade.Sprite | null = null;
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
    this.scene.time.delayedCall(3000, () => {
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      
      // Use personality-specific cooldown message template like other standardized NPCs
      const cooldownMessages = [
        `🔮 Hello there! I'm currently brewing up some blockchain magic. Please return in ${formattedTime}. In the meantime, why not visit other experts around the campus? They might have knowledge to share! 🏫`,
        `🔄 I'm compiling the latest blockchain infrastructure developments and API improvements. Come back in ${formattedTime} to test your knowledge again! ⚡`,
        `🛡️ Security check in progress! I'm auditing smart contracts and checking for potential vulnerabilities. Return in ${formattedTime} for more blockchain education! 🔍`,
        `💡 Research time! I'm studying the latest developments in blockchain scaling and infrastructure. Check back in ${formattedTime} for fresh quiz content! 🧠`
      ];
      
      const cooldownMessage = Phaser.Utils.Array.GetRandom(cooldownMessages);

      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "Alchemy Man",
        npcAvatar: "npc_alchemyman_avatar",
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
  
  private generateBlockchainDidYouKnow(): string {
    const didYouKnowPhrases = [
      "Alchemy is a blockchain development platform that provides powerful APIs and tools for building Web3 applications! It simplifies blockchain data access and infrastructure management for developers.",
      "Blockchain nodes are the backbone of decentralized networks, storing and validating transaction data! Running your own node gives you direct access to blockchain data without relying on third parties.",
      "Smart contracts are self-executing contracts with terms directly written into code! They automatically enforce agreements without the need for a middleman, making transactions faster and more secure.",
      "Decentralized applications (dApps) run on blockchain networks rather than traditional servers! This eliminates single points of failure and gives users more control over their data and assets.",
      "Consensus mechanisms like Proof of Stake ensure network security and agreement on transaction validity! Different blockchains use various consensus algorithms with different trade-offs in security, energy efficiency, and scalability."
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
      "Start with established development platforms like Alchemy or Infura when building Web3 applications! These services provide reliable infrastructure and powerful APIs to simplify blockchain integration.",
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
  
  private generateCommonMistakesForBlockchain(): string {
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
  
  private generateQuickTipsForBlockchain(): string {
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
