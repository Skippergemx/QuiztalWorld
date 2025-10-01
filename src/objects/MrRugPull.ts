import Phaser from "phaser";
import { showDialog, SimpleDialogBox } from "../utils/SimpleDialogBox"; // Import dialog function and class
import { saveQuiztalsToDatabase } from "../utils/Database"; // Firestore save utility
import AudioManager from '../managers/AudioManager'; // Import the AudioManager
import WalkingNPC from "./WalkingNPC"; // Import the WalkingNPC base class instead of QuizNPC
import QuiztalRewardLog from '../utils/QuiztalRewardLog'; // Import reward logging
import NPCQuizManager from '../managers/NPCQuizManager';
import { SimplePatrolBehavior } from "../managers/SimplePatrolBehavior"; // Import the SimplePatrolBehavior
import PhysicsManager from '../managers/PhysicsManager'; // Import PhysicsManager for collision handling
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import EnhancedQuizManager from '../managers/EnhancedQuizManager';

export default class MrRugPull extends WalkingNPC {
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private enhancedQuizManager!: EnhancedQuizManager;
  private readonly npcId = 'mrrugpull';
  private hasQuizData: boolean = false;
  private useEnhancedDialog: boolean = true; // Flag to toggle between dialog systems

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_mrrugpull");

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);
    this.enhancedQuizManager = EnhancedQuizManager.getInstance(scene);
    
    // Load quiz data for Mr. Rug Pull
    // NPCQuizManager will load from /public/assets/quizzes/npc-mrrugpull.json
    this.quizManager.loadQuizData(this.npcId).then(() => {
      this.hasQuizData = true;
      // Ensure EnhancedQuizManager is also ready
    }).catch((error) => {
        console.warn('⚠️ MrRugPull: Failed to load quiz data:', error);
    });
    
    // Add physics properties
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    // Set up physics
    this.setImmovable(true);  // Prevent player from pushing Mr. Rug Pull around
    this.setCollideWorldBounds(true);
    
    // Register with PhysicsManager for proper collision handling
    const physicsManager = PhysicsManager.getInstance(scene);
    if (physicsManager) {
      physicsManager.setupNPCCollisions(this);
      
      // Add specific collider for player interaction
      const player = this.getClosestPlayer();
      if (player) {
        physicsManager.addCollision(this, player);
        console.log('✅ MrRugPull: Set up direct collision with player');
      }
      console.log('✅ MrRugPull: Set up collisions with environment');
    }
    
    // Define patrol points (Point A and Point B) - Using horizontal patrol as requested
    // Adjust these coordinates as needed for the desired patrol area
    const pointA = { x: x - 100, y: y };  // 100 pixels to the left
    const pointB = { x: x + 100, y: y };  // 100 pixels to the right
    
    // Set up the simple patrol behavior
    const patrolBehavior = new SimplePatrolBehavior(pointA, pointB);
    this.setBehavior(patrolBehavior);

    this.createAnimations(scene);
    this.play("mrrugpull-idle-down"); // Set initial animation

    // Register with the scene as an updateable object
    scene.events.on('update', this.update, this);

    // Use the inherited nameLabel property
    this.nameLabel = scene.add.text(x, y - 40, "MR Rug Pull", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ff0000", 
      stroke: "#330000",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    // Use the inherited shoutOutText property
    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#ff0000",
      stroke: "#330000",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    this.startShouting(scene);

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
    
    // Set proper depth for rendering
    this.setDepth(10);
    console.log('✅ MrRugPull: Initialized with physics and collisions');
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

  // Create animations for Mr. Rug Pull
  private createAnimations(scene: Phaser.Scene) {
    // Check if animations already exist to prevent conflicts
    if (scene.anims.exists("mrrugpull-idle-down")) {
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
      const idleKey = `mrrugpull-idle-${config.name}`;
      
      if (!scene.anims.exists(idleKey)) {
        const idleFrames = scene.anims.generateFrameNumbers("npc_mrrugpull", {
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
      const walkKey = `mrrugpull-walk-${config.name}`;
      
      if (!scene.anims.exists(walkKey)) {
        const walkFrames = scene.anims.generateFrameNumbers("npc_mrrugpull_walk", {
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
      console.log("MR Rug Pull: Dialog already open, ignoring interaction");
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
          console.log("MR Rug Pull: Player is on cooldown or has reached max attempts");
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
      console.log("MR Rug Pull: Interaction blocked, cannot start quiz");
      return;
    }

    // Check if we have quiz data
    if (!this.hasQuizData) {
      console.warn("MR Rug Pull: No quiz data available, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("MR Rug Pull: Quiz manager not ready yet");
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
        console.error("MrRugPull: Failed to start enhanced quiz session");
        this.startSimpleQuiz(player);
        return;
      }
      
      const currentQuestion = this.enhancedQuizManager.getCurrentQuestion();
      if (!currentQuestion) {
        console.error("MrRugPull: No enhanced question available");
        this.startSimpleQuiz(player);
        return;
      }
      
      // Create enhanced quiz dialog
      const dialog = new OptimizedEnhancedQuizDialog(this.scene);
      
      dialog.showQuizDialog({
        npcName: "MR Rug Pull",
        npcAvatar: "npc_mrrugpull_avatar",
        theme: "Rug Pulls and Scams",
        difficulty: currentQuestion.difficulty,
        question: currentQuestion.question,
        options: currentQuestion.options,
        explainer: currentQuestion.explanation, // Pass the explanation as explainer
        questionNumber: 1,
        totalQuestions: 1,
        onAnswer: (selectedAnswer: string) => this.handleEnhancedAnswer(selectedAnswer, currentQuestion, player),
        onClose: () => this.notifyQuizEnded()
      });
      
      this.currentDialog = dialog as any;
    }).catch(error => {
      console.error("MrRugPull: Enhanced quiz session error:", error);
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
      
      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: isCorrect
            ? `🎉 Correct! You've earned ${reward.toFixed(2)} $Quiztals! You're too smart for my rug pull tricks!`
            : `😈 Haha! You fell for it! The correct answer was: "${enhancedQuestion.answer}". Better luck next time!`,
          avatar: "npc_mrrugpull_avatar",
          isExitDialog: true
        }
      ]);
      
      // Save reward using enhanced system
      if (isCorrect) {
        this.enhancedQuizManager.saveEnhancedRewardToDatabase(playerId, reward, "MrRugPull");
      }
      
      this.setupDialogAutoReset(3000);
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
      console.error("MR Rug Pull: No questions available");
      return;
    }

    // Store the index of the current question
    this.lastQuestionIndex = questionData.index;
    const currentQuestion = questionData.question;

    // Notify QuizAntiSpamManager that a quiz has started
    this.notifyQuizStarted();

    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);
    
    // Ensure exactly 3 options by adding filler options if needed
    const optionsWithFiller = [...shuffledOptions];
    while (optionsWithFiller.length < 3) {
      optionsWithFiller.push(`Extra Option ${optionsWithFiller.length + 1}`);
    }

    showDialog(this.scene, [{
      text: currentQuestion.question,
      avatar: "npc_mrrugpull_avatar",
      options: optionsWithFiller.slice(0, 3).map(option => ({
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
        console.log("MR Rug Pull: Cannot show reward dialog - interactions are blocked");
        return;
      }

      this.currentDialog = SimpleDialogBox.getInstance(this.scene);
      this.currentDialog.showDialog([
        {
          text: isCorrect
            ? `🎉 Correct! You've earned ${reward.toFixed(2)} $Quiztals! You're too smart for my rug pull tricks!`
            : `😈 Haha! You fell for it! The correct answer was: \"${correctAnswer}\". Better luck next time!`,
          avatar: "npc_mrrugpull_avatar",
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
    
    // Resume walking after interaction
    this.scene.time.delayedCall(3000, () => {
      this.onInteractionEnd();
    });
  }

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.05, 0.7).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "MrRugPull");

    // Also log to local session tracker
    QuiztalRewardLog.logReward("MrRugPull", reward);
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Step right up! I've got the hottest new token! 🚀",
      "Guaranteed 1000x returns! Just send me your private keys! 🔑",
      "Don't miss out on this once-in-a-lifetime opportunity! 💰",
      "Trust me, I'm a verified project! Check my Discord! 🛡️",
      "I'm totally not going to rug pull you... 👀",
      "Send me your crypto and I'll double it! Easy money! 💸"
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
    // Reduce delay since we fixed the root timing issue
    // Cooldown state is now activated at 3500ms, so 4000ms gives a clean 500ms buffer
    this.scene.time.delayedCall(4000, () => {
      // Double-check that we're still on cooldown before showing dialog
      if (!this.isOnCooldown) {
        return;
      }
      
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      
      // Only show dialog if we don't already have one open
      if (!this.currentDialog) {
        this.currentDialog = SimpleDialogBox.getInstance(this.scene);
        this.currentDialog.showDialog([
          {
            text: `😈 Hey there! I'm currently counting my ill-gotten gains. Please return in ${formattedTime}. In the meantime, why not visit other experts around the campus? They might have legitimate knowledge to share! 🏫`,
            avatar: "npc_mrrugpull_avatar",
            isExitDialog: true
          }
        ]);
        
        // Set up auto-reset for the dialog after 3 seconds
        this.setupDialogAutoReset(3000);
      }
    });
  }
}