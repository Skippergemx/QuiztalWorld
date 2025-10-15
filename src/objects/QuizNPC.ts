import Phaser from "phaser";
import { QuizAntiSpamManager } from "../managers/QuizAntiSpamManager";
import { SimpleDialogBox } from "../utils/SimpleDialogBox";
import { NetworkMonitor } from "../utils/NetworkMonitor";

export interface QuizAttempt {
  playerId: string;
  timestamp: number;
}

export default class QuizNPC extends Phaser.Physics.Arcade.Sprite {
  protected nameLabel!: Phaser.GameObjects.Text;
  protected shoutOutText!: Phaser.GameObjects.Text;
  protected cooldownIndicator!: Phaser.GameObjects.Text;
  protected dialogCooldownText!: Phaser.GameObjects.Text;
  protected currentDialog: SimpleDialogBox | null = null;
  protected quizAttempts: QuizAttempt[] = [];
  protected cooldownDuration: number = 3 * 60 * 1000; // 3 minutes in milliseconds
  protected maxAttempts: number = 3;
  protected isOnCooldown: boolean = false;
  protected cooldownEndTime: number = 0;
  protected cooldownTimerEvent: Phaser.Time.TimerEvent | null = null;
  protected headCooldownTimerEvent: Phaser.Time.TimerEvent | null = null;
  protected networkMonitor: NetworkMonitor;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 0);
    
    // Register this instance with the QuizAntiSpamManager
    const antiSpamManager = QuizAntiSpamManager.getInstance();
    antiSpamManager.registerNPC(this);
    
    // Get network monitor instance
    this.networkMonitor = NetworkMonitor.getInstance(scene);
  }

  protected checkCooldown(playerId: string): boolean {
    const now = Date.now();
    
    // Remove expired attempts (older than 3 minutes) for all players
    this.quizAttempts = this.quizAttempts.filter(attempt =>
      now - attempt.timestamp < this.cooldownDuration
    );
    
    // Check if cooldown has expired
    if (this.isOnCooldown && now >= this.cooldownEndTime) {
      // Cooldown has expired, reset the state
      this.isOnCooldown = false;
      // Reset only the current player's attempts
      this.quizAttempts = this.quizAttempts.filter(attempt => attempt.playerId !== playerId);
      if (this.cooldownIndicator) {
        this.cooldownIndicator.setVisible(false);
      }
      this.stopCooldownTimers();
      console.log("QuizNPC: Cooldown has expired, resetting state");
      // Return false to allow player to take quizzes again
      return false;
    }
    
    // If we're still on cooldown, prevent quizzes
    if (this.isOnCooldown) {
      return true;
    }
    
    // Check if player has reached max attempts
    const playerAttempts = this.quizAttempts.filter(attempt => attempt.playerId === playerId);
    
    if (playerAttempts.length >= this.maxAttempts) {
      // Enter cooldown mode
      this.isOnCooldown = true;
      this.cooldownEndTime = now + this.cooldownDuration;
      this.showCooldownIndicator();
      this.startCooldownTimers();
      return true;
    }
    
    return false;
  }

  protected recordQuizAttempt(playerId: string) {
    const now = Date.now();
    
    // Remove expired attempts
    this.quizAttempts = this.quizAttempts.filter(attempt =>
      now - attempt.timestamp < this.cooldownDuration
    );
    
    // Add new attempt
    this.quizAttempts.push({
      playerId: playerId,
      timestamp: now
    });
    
    // Check if we need to enter cooldown
    const playerAttempts = this.quizAttempts.filter(attempt => attempt.playerId === playerId);
    if (playerAttempts.length >= this.maxAttempts && !this.isOnCooldown) {
      this.isOnCooldown = true;
      this.cooldownEndTime = now + this.cooldownDuration;
      this.showCooldownIndicator();
      this.startCooldownTimers();
    }
    
    // Show remaining attempts after recording this attempt
    this.showRemainingAttempts(playerId);
  }

  protected showCooldownIndicator() {
    if (!this.cooldownIndicator) {
      const COOLDOWN_TIMER_DEPTH = 20; // Above NPCs (10) and player title (15) for maximum visibility
      
      this.cooldownIndicator = this.scene.add.text(this.x, this.y - 80, "COOLDOWN", {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#ff0000",
        stroke: "#ffffff",
        strokeThickness: 4,
        align: "center",
        fontStyle: "bold"
      }).setOrigin(0.5).setDepth(COOLDOWN_TIMER_DEPTH);
      
      console.log(`✅ QuizNPC: Cooldown indicator created with depth ${COOLDOWN_TIMER_DEPTH}`);
      
      // Add pulsing animation
      this.scene.tweens.add({
        targets: this.cooldownIndicator,
        scale: 1.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    this.cooldownIndicator.setVisible(true);
    
    // Update position in scene update loop
    this.scene.events.on("update", () => {
      if (this.cooldownIndicator && this.cooldownIndicator.visible) {
        this.cooldownIndicator.setPosition(this.x, this.y - 80);
      }
    });
    
    // Hide indicator with fade out animation when cooldown ends
    this.scene.time.delayedCall(this.cooldownDuration, () => {
      if (this.cooldownIndicator) {
        this.scene.tweens.add({
          targets: this.cooldownIndicator,
          alpha: 0,
          scale: 0.5,
          duration: 1000,
          onComplete: () => {
            if (this.cooldownIndicator) {
              this.cooldownIndicator.setVisible(false);
              this.cooldownIndicator.setAlpha(1);
              this.cooldownIndicator.setScale(1);
            }
          }
        });
      }
      this.isOnCooldown = false;
      
      // Only reset attempts for the player who triggered the cooldown
      // This ensures other players' attempts are not affected
      const playerId = this.quizAttempts.length > 0 ? this.quizAttempts[0].playerId : '';
      this.quizAttempts = this.quizAttempts.filter(attempt => attempt.playerId !== playerId);
    });
  }

  protected getRemainingCooldownTime(): number {
    const now = Date.now();
    return Math.max(0, this.cooldownEndTime - now);
  }

  protected formatTime(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
  
  protected formatTimeWithFractional(ms: number): string {
    // Show fractional seconds in the final 10 seconds
    if (ms <= 10000) {
      const totalSeconds = ms / 1000;
      return `${totalSeconds.toFixed(1)}s`;
    }
    
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
  
  protected showCooldownDialog() {
    // Add a delay before showing the cooldown dialog
    // This allows players to see their reward from the third quiz
    this.scene.time.delayedCall(3000, () => { // 3 second delay
      // This method should be overridden by subclasses to show a specific dialog
      console.log("NPC is in cooldown mode. Please try again later.");
      
      // Set a timer to reset dialog state after a delay
      this.scene.time.delayedCall(3000, () => {
        this.resetDialogState();
      });
    });
  }
  
  /**
   * Resets the dialog state by nullifying the currentDialog reference
   * This should be called after a dialog is closed to ensure the NPC can be interacted with again
   */
  protected resetDialogState(): void {
    // Check if the dialog is still visible before nullifying
    if (this.currentDialog) {
      // If the dialog is still visible, close it first
      try {
        // Use the new hide method instead of close
        this.currentDialog.hide();
      } catch (e) {
        console.log("Error hiding dialog:", e);
      }
      
      // Nullify the reference
      this.currentDialog = null;
      console.log("Dialog state reset");
    }
  }
  
  /**
   * Sets up a timer to automatically reset the dialog state after a delay
   * This is useful for dialogs with isExitDialog: true
   * @param delay The delay in milliseconds before resetting the dialog state
   */
  protected setupDialogAutoReset(delay: number = 3000): void {
    this.scene.time.delayedCall(delay, () => {
      this.resetDialogState();
    });
  }
  
  protected updateDialogCooldownText() {
    if (this.dialogCooldownText && this.dialogCooldownText.scene) {
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      this.dialogCooldownText.setText(`🕒 Please come back in ${formattedTime}`);
    }
    
    // Also update the dialog if it's currently open and has the updateDialogText method
    if (this.currentDialog && typeof (this.currentDialog as any).updateDialogText === 'function') {
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      (this.currentDialog as any).updateDialogText(`🕒 Please come back in ${formattedTime}. In the meantime, why not visit other NPCs around the map? They might have quizzes for you too! 🌍`);
    }
  }
  
  protected updateHeadCooldownText() {
    if (this.cooldownIndicator && this.cooldownIndicator.visible) {
      const remainingTime = this.getRemainingCooldownTime();
      const formattedTime = this.formatTimeWithFractional(remainingTime);
      this.cooldownIndicator.setText(formattedTime);
    }
  }
  
  protected startCooldownTimers() {
    // Clear any existing timers
    if (this.cooldownTimerEvent) {
      this.cooldownTimerEvent.remove();
    }
    if (this.headCooldownTimerEvent) {
      this.headCooldownTimerEvent.remove();
    }
    
    // Create timer to update dialog box every 100ms
    this.cooldownTimerEvent = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        this.updateDialogCooldownText();
        this.updateHeadCooldownText();
      },
      loop: true
    });
    
    // Create timer to update head display every 100ms
    this.headCooldownTimerEvent = this.scene.time.addEvent({
      delay: 100,
      callback: this.updateHeadCooldownText,
      callbackScope: this,
      loop: true
    });
    
    // Stop timers when cooldown ends
    this.scene.time.delayedCall(this.cooldownDuration, () => {
      this.stopCooldownTimers();
    });
  }
  
  protected stopCooldownTimers() {
    if (this.cooldownTimerEvent) {
      this.cooldownTimerEvent.remove();
      this.cooldownTimerEvent = null;
    }
    if (this.headCooldownTimerEvent) {
      this.headCooldownTimerEvent.remove();
      this.headCooldownTimerEvent = null;
    }
    
    // Clear the current dialog reference
    this.currentDialog = null;
  }
  
  protected isInteractionBlocked(): boolean {
    const antiSpamManager = QuizAntiSpamManager.getInstance();
    return antiSpamManager.isInteractionBlocked() || (this as any)._quizBlocked === true;
  }
  
  protected notifyQuizStarted() {
    const antiSpamManager = QuizAntiSpamManager.getInstance();
    antiSpamManager.startQuiz();
  }
  
  protected notifyQuizEnded() {
    const antiSpamManager = QuizAntiSpamManager.getInstance();
    antiSpamManager.endQuiz();
  }
  
  /**
   * Check if player has enough stamina to interact with this NPC
   * @returns true if player has enough stamina, false otherwise
   */
  protected checkPlayerStamina(): boolean {
    // Try to get PlayerManager from the scene
    let playerManager = null;
    
    // First try to get it directly from the scene
    if (this.scene && (this.scene as any).playerManager) {
      playerManager = (this.scene as any).playerManager;
    } else {
      // Try to get it from the GameScene
      try {
        const gameScene = this.scene.game.scene.getScene('GameScene');
        if (gameScene && (gameScene as any).playerManager) {
          playerManager = (gameScene as any).playerManager;
        }
      } catch (e) {
        console.warn('QuizNPC: Could not access GameScene to get playerManager', e);
      }
    }
    
    // If we have access to PlayerManager, check stamina
    if (playerManager && typeof playerManager.getCurrentStamina === 'function') {
      const currentStamina = playerManager.getCurrentStamina();
      console.log(`📱 QuizNPC: Current stamina is ${currentStamina}`);
      
      if (currentStamina < 10) {
        console.log('❌ QuizNPC: Not enough stamina to interact with NPC (minimum 10 required)');
        // Show UI feedback to player about insufficient stamina
        if (typeof playerManager.showStaminaLowFeedback === 'function') {
          playerManager.showStaminaLowFeedback();
        }
        return false;
      }
      return true;
    } else {
      console.warn('❌ QuizNPC: Could not access PlayerManager for stamina check');
      // If we can't check stamina, allow interaction (fail open)
      return true;
    }
  }
  
  public isPlayerInRange(player: Phaser.Physics.Arcade.Sprite): boolean {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    return distance <= 100;
  }
  
  public hideHeadTimer() {
    if (this.cooldownIndicator && this.cooldownIndicator.visible) {
      this.cooldownIndicator.setVisible(false);
    }
  }
  
  public showHeadTimer() {
    if (this.cooldownIndicator && !this.cooldownIndicator.visible) {
      this.cooldownIndicator.setVisible(true);
    }
  }
  
  /**
   * Gets the number of remaining quiz attempts for a player
   * @param playerId The ID of the player
   * @returns The number of remaining quiz attempts (0-3)
   */
  public getRemainingAttempts(playerId: string): number {
    // If on cooldown, return 0
    if (this.isOnCooldown) {
      return 0;
    }
    
    // Count player's attempts
    const now = Date.now();
    const playerAttempts = this.quizAttempts.filter(attempt => 
      attempt.playerId === playerId && now - attempt.timestamp < this.cooldownDuration
    ).length;
    
    // Return remaining attempts
    return Math.max(0, this.maxAttempts - playerAttempts);
  }
  
  /**
   * Shows a message to the player about their remaining quiz attempts
   * @param playerId The ID of the player
   */
  protected showRemainingAttempts(playerId: string): void {
    const remaining = this.getRemainingAttempts(playerId);
    
    if (remaining > 0 && !this.isOnCooldown) {
      const ATTEMPTS_INDICATOR_DEPTH = 18; // Above cooldown timer (20) but below UI elements
      
      // Show remaining attempts in a temporary floating text
      const attemptsText = this.scene.add.text(this.x, this.y - 100, `${remaining} quiz${remaining === 1 ? '' : 'zes'} remaining`, {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center"
      }).setOrigin(0.5).setDepth(ATTEMPTS_INDICATOR_DEPTH);
      
      console.log(`✅ QuizNPC: Attempts indicator created with depth ${ATTEMPTS_INDICATOR_DEPTH}`);
      
      // Add floating animation and fade out
      this.scene.tweens.add({
        targets: attemptsText,
        y: attemptsText.y - 20,
        alpha: 0,
        duration: 2000,
        onComplete: () => {
          if (attemptsText && !attemptsText.scene) return;
          attemptsText.destroy();
        }
      });
    }
  }
}