import Phaser from "phaser";

export class QuizAntiSpamManager {
  private static instance: QuizAntiSpamManager;
  private scene: Phaser.Scene;
  private isQuizActive: boolean = false;
  private isDialogOpen: boolean = false;
  private blockedInteractions: number = 0;
  private npcInstances: Array<any> = []; // Array to hold references to NPC instances

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public static getInstance(scene?: Phaser.Scene): QuizAntiSpamManager {
    if (!QuizAntiSpamManager.instance) {
      if (!scene) {
        throw new Error("Scene is required to create QuizAntiSpamManager instance");
      }
      QuizAntiSpamManager.instance = new QuizAntiSpamManager(scene);
    }
    return QuizAntiSpamManager.instance;
  }

  public registerNPC(npc: any) {
    if (!this.npcInstances.includes(npc)) {
      this.npcInstances.push(npc);
      console.log("QuizAntiSpamManager: Registered NPC instance");
    }
  }

  public unregisterNPC(npc: any) {
    const index = this.npcInstances.indexOf(npc);
    if (index !== -1) {
      this.npcInstances.splice(index, 1);
      console.log("QuizAntiSpamManager: Unregistered NPC instance");
    }
  }

  public startQuiz() {
    if (!this.isQuizActive) {
      this.isQuizActive = true;
      this.blockInteractions();
      console.log("QuizAntiSpamManager: Quiz started, blocking interactions");
      
      // Set a timeout to automatically end the quiz after 30 seconds as a failsafe
      this.scene.time.delayedCall(30000, () => {
        if (this.isQuizActive) {
          console.warn("QuizAntiSpamManager: Failsafe triggered - quiz timeout");
          this.endQuiz();
        }
      });
    }
  }

  public endQuiz() {
    if (this.isQuizActive) {
      this.isQuizActive = false;
      this.unblockInteractions();
      console.log("QuizAntiSpamManager: Quiz ended, unblocking interactions");
    }
  }

  public openDialog() {
    if (!this.isDialogOpen) {
      this.isDialogOpen = true;
      this.blockInteractions();
      console.log("QuizAntiSpamManager: Dialog opened, blocking interactions");
      
      // Set a timeout to automatically close the dialog after 30 seconds as a failsafe
      this.scene.time.delayedCall(30000, () => {
        if (this.isDialogOpen) {
          console.warn("QuizAntiSpamManager: Failsafe triggered - dialog timeout");
          this.closeDialog();
        }
      });
    }
  }

  public closeDialog() {
    if (this.isDialogOpen) {
      this.isDialogOpen = false;
      this.unblockInteractions();
      console.log("QuizAntiSpamManager: Dialog closed, unblocking interactions");
    }
  }

  private blockInteractions() {
    // Only block new NPC interactions, not existing dialog interactions
    // The quiz dialog should still be interactive while preventing new quiz starts
    this.blockedInteractions = 0;
    this.npcInstances.forEach((npc, index) => {
      // Store original pointerdown handler instead of disabling all input
      if (npc.listeners && npc.listeners('pointerdown').length > 0) {
        // Mark NPC as blocked but don't disable input entirely
        npc._quizBlocked = true;
        this.blockedInteractions++;
      }
    });
    
    console.log(`QuizAntiSpamManager: Blocked ${this.blockedInteractions} NPC interactions`);
  }

  private unblockInteractions() {
    // Only unblock if neither quiz nor dialog is active
    if (!this.isQuizActive && !this.isDialogOpen) {
      // Restore NPC interactions
      this.npcInstances.forEach((npc, index) => {
        if (npc._quizBlocked) {
          npc._quizBlocked = false;
        }
      });
      
      console.log("QuizAntiSpamManager: Unblocked NPC interactions");
      this.blockedInteractions = 0;
    } else {
      console.log("QuizAntiSpamManager: Not unblocking interactions - quiz or dialog still active");
    }
  }

  public isInteractionBlocked(): boolean {
    return this.isQuizActive || this.isDialogOpen;
  }

  // Failsafe mechanism to reset blocked states
  public resetBlockedState() {
    console.log("QuizAntiSpamManager: Resetting blocked state (failsafe)");
    this.isQuizActive = false;
    this.isDialogOpen = false;
    this.unblockInteractions();
  }

  // Manual reset method for external use
  public forceReset() {
    console.warn("QuizAntiSpamManager: Force reset triggered");
    this.resetBlockedState();
  }

  // Cleanup method to prevent memory leaks
  public destroy() {
    this.resetBlockedState();
    this.npcInstances = [];
    QuizAntiSpamManager.instance = null as any;
    console.log("QuizAntiSpamManager: Destroyed");
  }
}

// Extend the Phaser.Scene interface to add our manager
declare global {
  interface Window {
    quizAntiSpamManager?: QuizAntiSpamManager;
  }
}

export default QuizAntiSpamManager;