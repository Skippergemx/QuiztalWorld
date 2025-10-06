// ArtizenGent.ts
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
// Remove incorrect import - quiz data is loaded via HTTP in NPCQuizManager

export default class ArtizenGent extends WalkingNPC {
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'artizengent';
  private hasQuizData: boolean = false;
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_artizengent");

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);
    
    // Load quiz data for Artizen Gent
    // Use the NPCQuizManager's loadQuizData method which now takes an npcId parameter
    this.quizManager.loadQuizData(this.npcId).then(() => {
      this.hasQuizData = true;
      // Ensure EnhancedQuizManager is also ready
    }).catch((error) => {
      console.warn('⚠️ ArtizenGent: Failed to load quiz data:', error);
    });
    
    // Add physics properties
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    // Set up physics
    this.setImmovable(true);  // Prevent player from pushing Artizen Gent around
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
    
    // Define patrol points (Point A and Point B)
    // Adjust these coordinates as needed for the desired patrol area
    const pointA = { x: x - 100, y: y };  // 100 pixels to the left
    const pointB = { x: x + 100, y: y };  // 100 pixels to the right
    
    // Set up the simple patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    this.createAnimations(scene);
    this.play("artizengent-idle-down"); // Set initial animation

    // Register with the scene as an updateable object
    scene.events.on('update', this.update, this);

    // Use the inherited nameLabel property
    this.nameLabel = scene.add.text(x, y - 40, "Artizen Gent", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00aaff", 
      stroke: "#003366",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    // Use the inherited shoutOutText property
    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#00aaff",
      stroke: "#003366",
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

  // Create animations for Artizen Gent
  private createAnimations(scene: Phaser.Scene) {
    // Check if animations already exist to prevent conflicts
    if (scene.anims.exists("artizengent-idle-down")) {
      console.log("ArtizenGent: Animations already exist, skipping creation");
      return;
    }

    console.log("ArtizenGent: Creating animations...");

    // Create animations using the exact frame order as confirmed:
    // Right: frames 0-5, Up: frames 6-11, Left: frames 12-17, Down: frames 18-23
    const animationConfig = [
      { name: 'right', idleStart: 0, idleEnd: 5, walkStart: 0, walkEnd: 5 },
      { name: 'up', idleStart: 6, idleEnd: 11, walkStart: 6, walkEnd: 11 },
      { name: 'left', idleStart: 12, idleEnd: 17, walkStart: 12, walkEnd: 17 },
      { name: 'down', idleStart: 18, idleEnd: 23, walkStart: 18, walkEnd: 23 }
    ];
    
    console.log("ArtizenGent: Animation configuration:", animationConfig);
    
    animationConfig.forEach(config => {
      console.log(`ArtizenGent: Processing ${config.name} animations`);
      
      // Idle animation
      const idleKey = `artizengent-idle-${config.name}`;
      console.log(`ArtizenGent: Checking if idle animation ${idleKey} exists: ${scene.anims.exists(idleKey)}`);
      
      if (!scene.anims.exists(idleKey)) {
        const idleFrames = scene.anims.generateFrameNumbers("npc_artizengent", {
          start: config.idleStart,
          end: config.idleEnd,
        });
        console.log(`ArtizenGent: Creating idle animation ${idleKey} with frames:`, idleFrames);
        
        scene.anims.create({
          key: idleKey,
          frames: idleFrames,
          frameRate: 3,
          repeat: -1,
        });
        console.log(`ArtizenGent: Created idle animation: ${idleKey}`);
      } else {
        console.log(`ArtizenGent: Idle animation ${idleKey} already exists`);
      }

      // Walk animation
      const walkKey = `artizengent-walk-${config.name}`;
      console.log(`ArtizenGent: Checking if walk animation ${walkKey} exists: ${scene.anims.exists(walkKey)}`);
      
      if (!scene.anims.exists(walkKey)) {
        const walkFrames = scene.anims.generateFrameNumbers("npc_artizengent_walk", {
          start: config.walkStart,
          end: config.walkEnd,
        });
        console.log(`ArtizenGent: Creating walk animation ${walkKey} with frames:`, walkFrames);
        
        scene.anims.create({
          key: walkKey,
          frames: walkFrames,
          frameRate: 8,
          repeat: -1,
        });
        console.log(`ArtizenGent: Created walk animation: ${walkKey}`);
      } else {
        console.log(`ArtizenGent: Walk animation ${walkKey} already exists`);
      }
    });
    
    // Log all created animations for debugging
    console.log("ArtizenGent: All animations created:");
    animationConfig.forEach(config => {
      const idleKey = `artizengent-idle-${config.name}`;
      const walkKey = `artizengent-walk-${config.name}`;
      console.log(`  - ${idleKey}: ${scene.anims.exists(idleKey)}`);
      console.log(`  - ${walkKey}: ${scene.anims.exists(walkKey)}`);
    });
  }
  
  public interact() {
    // Call the parent's onInteractionStart method to handle walking behavior
    this.onInteractionStart();
    
    // Check if a dialog is already open
    if (this.currentDialog) {
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

    // Check if we have quiz data
    if (!this.hasQuizData) {
      console.warn("Artizen Gent: No quiz data available, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("Artizen Gent: Quiz manager not ready yet");
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
        return;
      }

      if (isCorrect) {
        // Generate educational content for NFT art
        const didYouKnowContent = this.generateArtDidYouKnow();
        const tipsContent = this.generateArtTips();
        
        // Create enhanced reward message
        const rewardMessage = `🎨 Brilliant! You've earned ${reward.toFixed(2)} $Quiztals for your art knowledge!`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Artizen Gent",
          npcAvatar: "npc_artizengent_avatar",
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
          npcName: "Artizen Gent",
          npcAvatar: "npc_artizengent_avatar",
          wrongAnswerMessage: `🖌️ Not quite! "${selectedOption}" is not correct.`,
          correctAnswer: correctAnswer,
          explanation: "This question tests your understanding of key NFT art concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForArt(),
          quickTips: this.generateQuickTipsForArt(),
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
        console.error("ArtizenGent: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("ArtizenGent: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "Artizen Gent",
        npcAvatar: "npc_artizengent_avatar",
        theme: "NFT Art & Digital Creativity",
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
      console.error("ArtizenGent: Enhanced quiz session error:", error);
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
        // Generate educational content for NFT art
        const didYouKnowContent = this.generateArtDidYouKnow();
        const tipsContent = this.generateArtTips();
        
        // Create enhanced reward message
        const rewardMessage = `🎨 Brilliant! You've earned ${reward.toFixed(2)} $Quiztals for your art knowledge!`;
        
        // Show optimized reward dialog
        const rewardDialogData: OptimizedRewardDialogData = {
          npcName: "Artizen Gent",
          npcAvatar: "npc_artizengent_avatar",
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
        this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, reward, "ArtizenGent");
      } else {
        // Incorrect answer - show optimized wrong answer dialog
        const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
          npcName: "Artizen Gent",
          npcAvatar: "npc_artizengent_avatar",
          wrongAnswerMessage: `🖌️ Not quite! "${selectedOption}" is not correct.`,
          correctAnswer: enhancedQuestion.answer,
          explanation: enhancedQuestion.explainer || "This question tests your understanding of key NFT art concepts. Review the material and try again!",
          commonMistakes: this.generateCommonMistakesForArt(),
          quickTips: this.generateQuickTipsForArt(),
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
      console.error("Artizen Gent: No questions available");
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
      npcName: "Artizen Gent",
      npcAvatar: "npc_artizengent_avatar",
      theme: "NFT Art & Digital Creativity",
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
    saveQuiztalsToDatabase(playerId, reward, "ArtizenGent");

    // Also log to local session tracker
    QuiztalRewardLog.logReward("ArtizenGent", reward);
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Discover amazing NFT art on Artizen.fund! 🎨",
      "Support talented artists in the NFT space! 🖼️",
      "Learn about the future of digital art! 💡",
      "Find your next favorite NFT collection! 🔍",
      "Artizen.fund - where art meets blockchain! ⛓️",
      "Explore curated NFT art projects! 🌟"
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
      
      // Use optimized reward dialog for cooldown message
      const cooldownDialogData: OptimizedRewardDialogData = {
        npcName: "Artizen Gent",
        npcAvatar: "npc_artizengent_avatar",
        rewardMessage: `🎨 Hello there! I'm currently curating new art pieces. Please return in ${formattedTime}. In the meantime, why not visit other experts around the campus? They might have knowledge to share! 🏫`,
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
  
  private generateArtDidYouKnow(): string {
    const didYouKnowPhrases = [
      "Digital art has been around since the 1960s, but NFTs have revolutionized how artists can monetize their work! Artists can now sell unique digital pieces directly to collectors without intermediaries.",
      "The most expensive NFT artwork ever sold is 'The Merge' by Pak, which sold for $91.8 million in 2021! This highlights the growing market for digital art collectibles.",
      "Generative art NFTs are created using algorithms and code, making each piece unique! Popular projects like Art Blocks have gained significant attention for their algorithmic art collections.",
      "NFT art isn't limited to static images - it can include animations, interactive elements, and even virtual reality experiences! This opens up new creative possibilities for artists.",
      "Many traditional art galleries and museums are now showcasing NFT art exhibitions! Institutions like the Museum of Modern Art have begun collecting digital artworks."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateArtTips(): string {
    const tipsPhrases = [
      "Research the artist's background and previous work before purchasing NFT art! Look for artists with a consistent creative vision and active community engagement.",
      "Consider the utility and story behind an NFT artwork, not just its visual appeal! Many successful NFT projects offer additional benefits to holders.",
      "Join NFT art communities on Discord and Twitter to stay updated on new drops and artist announcements! These communities often provide early access opportunities.",
      "Start with smaller investments to learn about the NFT art market before committing significant funds! The space is volatile and constantly evolving.",
      "Verify the authenticity of NFT art by checking the official project website and social media channels! Scammers often create fake versions of popular collections."
    ];
    
    const selectedPhrase = Phaser.Utils.Array.GetRandom(tipsPhrases);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedPhrase.length > 150) {
      return selectedPhrase.substring(0, 147) + "...";
    }
    
    return selectedPhrase;
  }
  
  private generateCommonMistakesForArt(): string {
    const commonMistakes = [
      "Buying NFT art purely based on hype without understanding the artist or project! Always research before making purchases.",
      "Overlooking the importance of community and utility in NFT art projects! Successful collections often have active communities and additional benefits.",
      "Not verifying the authenticity of NFT art before purchasing! Always check official sources to avoid scams.",
      "Ignoring the environmental impact of NFTs on energy-intensive blockchains! Consider eco-friendly alternatives when possible.",
      "Failing to secure NFT art properly with hardware wallets! Digital assets can be stolen if not stored securely."
    ];
    
    const selectedMistake = Phaser.Utils.Array.GetRandom(commonMistakes);
    
    // Limit phrase length for mobile to prevent overflow and ensure dialog fits on screen
    const isMobile = this.scene.scale.width < 768;
    if (isMobile && selectedMistake.length > 150) {
      return selectedMistake.substring(0, 147) + "...";
    }
    
    return selectedMistake;
  }
  
  private generateQuickTipsForArt(): string {
    const quickTips = [
      "Follow artists on social media to stay updated on their latest works and announcements!",
      "Join NFT art Discord communities for real-time updates and discussions!",
      "Check the rarity and traits of NFT art pieces before purchasing!",
      "Use reputable NFT marketplaces like OpenSea or Foundation for trading!",
      "Always verify the official website and social media channels before buying!"
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
