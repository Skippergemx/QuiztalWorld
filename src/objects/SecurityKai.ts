// SecurityKai.ts
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox"; // Import dialog function
import { saveQuiztalsToDatabase } from "../utils/Database"; // Firestore save utility
import AudioManager from '../managers/AudioManager'; // Import the AudioManager
import QuizNPC from "./QuizNPC"; // Import the QuizNPC base class
import QuiztalRewardLog from '../utils/QuiztalRewardLog'; // Import reward logging
import NPCQuizManager from '../managers/NPCQuizManager';

// SecurityKai class: Defines the SecurityKai NPC, extending the base QuizNPC class.
export default class SecurityKai extends QuizNPC {
  // Stores the index of the last asked question to avoid immediate repetition.
  private lastQuestionIndex: number = -1;
  // Manages the quiz data for all NPCs, including SecurityKai.
  private quizManager: NPCQuizManager;
  // Unique identifier for this NPC, used to fetch its quiz data.
  private readonly npcId = 'securitykai';

  // Quiz data is now loaded from JSON

  // Constructor: Initializes the SecurityKai NPC.
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "securitykai");

    // Get the singleton instance of the NPCQuizManager.
    this.quizManager = NPCQuizManager.getInstance(scene);

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
      const dialog = showDialog(this.scene, [
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);

      // Store reference to the new dialog.
      this.currentDialog = dialog;

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

      const dialog = showDialog(this.scene, [
        {
          text: isCorrect
            ? `🎉 Correct! You've earned ${reward.toFixed(2)} $Quiztals!`
            : `❌ Oops! The correct answer was "${correctAnswer}". Try again later!`,
          avatar: "npc_securitykai_avatar",
          isExitDialog: true
        }
      ]);

      // Store reference to the new dialog.
      this.currentDialog = dialog;

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
    const remainingTime = this.getRemainingCooldownTime();
    const formattedTime = this.formatTimeWithFractional(remainingTime);

    this.currentDialog = showDialog(this.scene, [
      {
        text: `🕒 Hey there! I'm taking a short break to recharge my quiz powers! Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`,
        avatar: "npc_securitykai_avatar",
        isExitDialog: true
      }
    ]);

    // Set up auto-reset for the dialog after 3 seconds
    // This ensures the dialog reference is cleared even if the player doesn't click
    this.setupDialogAutoReset(3000);
  }
}