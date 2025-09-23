// HuntBoy.ts
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox"; // Import dialog function
import { saveQuiztalsToDatabase } from "../utils/Database"; // Firestore save utility
import AudioManager from '../managers/AudioManager'; // Import the AudioManager
import QuizNPC from "./QuizNPC"; // Import the QuizNPC base class
import QuiztalRewardLog from '../utils/QuiztalRewardLog'; // Import reward logging
import NPCQuizManager from '../managers/NPCQuizManager';

export default class HuntBoy extends QuizNPC {
  private directions = ["right", "up", "left", "down"];
  private lastQuestionIndex: number = -1;
  private quizManager: NPCQuizManager;
  private readonly npcId = 'huntboy';

  // Quiz data is now loaded from JSON

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_huntboy");

    // Initialize quiz manager
    this.quizManager = NPCQuizManager.getInstance(scene);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    this.play("huntboy-idle-down"); // Set initial animation

    this.nameLabel = scene.add.text(x, y - 40, "Hunt Boy", {
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

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
  }


  private createAnimations(scene: Phaser.Scene) {
    this.directions.forEach((dir, index) => {
      const animKey = `huntboy-idle-${dir}`;
      // Check if animation already exists before creating it
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers("npc_huntboy", {
            start: index * 6,
            end: index * 6 + 5,
          }),
          frameRate: 3,
          repeat: -1,
        });
      }
    });
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("HuntBoy: Dialog already open, ignoring interaction");
      return;
    }

    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("HuntBoy: Network offline - showing offline message");
      const dialog = showDialog(this.scene, [
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);

      // Store reference to the new dialog
      this.currentDialog = dialog;

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
          console.log("HuntBoy: Player is on cooldown or has reached max attempts");
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
      console.log("HuntBoy: Interaction blocked, cannot start quiz");
      return;
    }

    // Check if quiz manager is ready
    if (!this.quizManager.isReady()) {
      console.warn("HuntBoy: Quiz manager not ready yet");
      return;
    }

    // Get random question using the quiz manager
    const questionData = this.quizManager.getRandomQuestion(this.npcId, this.lastQuestionIndex);

    if (!questionData) {
      console.error("HuntBoy: No questions available");
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
      avatar: "npc_huntboy_avatar",
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
        console.log("HuntBoy: Cannot show reward dialog - interactions are blocked");
        return;
      }

      const dialog = showDialog(this.scene, [
        {
          text: isCorrect
            ? `🎉 Correct! You've earned ${reward.toFixed(2)} $Quiztals!`
            : `❌ Oops! The correct answer was "${correctAnswer}". Try again later!`,
          avatar: "npc_huntboy_avatar",
          isExitDialog: true
        }
      ]);

      // Store reference to the new dialog
      this.currentDialog = dialog;

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
    saveQuiztalsToDatabase(playerId, reward, "HuntBoy");

    // Also log to local session tracker
    QuiztalRewardLog.logReward("HuntBoy", reward);

    // Log reward to reward logger
    if (typeof window !== 'undefined' && (window as any).game) {
      const game = (window as any).game;
      const loggerScene = game.scene.getScene('LoggerScene');
      if (loggerScene && loggerScene.addReward) {
        loggerScene.addReward(reward, "HuntBoy", "HuntBoy");
      }
    }
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Yo anon, have you bridged to Base yet? 😏",
      "Base gas fees? What gas fees? Almost free! 💨",
      "Web3 builders, join Hunt Town! 🏗️",
      "Hunt Town = Web3 dev paradise! 🌍"
    ];

    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No quizzes until connection restored! 🚫📡",
      "Internet connection lost! Quiztals on hold! 😢🔌",
      "Offline mode: HuntBoy's quizzes disabled! ⏸️",
      "No network, no knowledge challenges! 🔌",
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
      message = "🚨 Network connection lost! HuntBoy's quizzes disabled! 🚫";
    } else {
      // Network is online
      message = "✅ Network connection restored! HuntBoy's quizzes available! 🌐";
    }

    this.showShout(message);
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
    // Add a delay before showing the cooldown dialog
    // This allows players to see their reward from the third quiz
    this.scene.time.delayedCall(3000, () => { // 3 second delay
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);

      this.currentDialog = showDialog(this.scene, [
        {
          text: `🕒 Hey there! I'm taking a short break to recharge my quiz powers! Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
          avatar: "npc_huntboy_avatar",
          isExitDialog: true
        }
      ]);

      // Set up auto-reset for the dialog after 3 seconds
      // This ensures the dialog reference is cleared even if the player doesn't click
      this.setupDialogAutoReset(3000);
    });
  }
}