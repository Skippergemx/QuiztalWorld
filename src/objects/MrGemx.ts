import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";
import { NetworkMonitor } from "../utils/NetworkMonitor";


export default class MrGemx extends Phaser.Physics.Arcade.Sprite {
  private nameLabel: Phaser.GameObjects.Text;
  private shoutOutText: Phaser.GameObjects.Text;
  private networkMonitor: NetworkMonitor;
  private currentDialog: any = null; // Add this property to track current dialog

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "mr_gemx", 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    this.play("mrgemx-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Mr. Gemx", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00ffff",
      stroke: "#003366",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#00ffff",
      stroke: "#003366",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    scene.events.on("update", () => {
      this.nameLabel.setPosition(this.x, this.y - 40);
      this.shoutOutText.setPosition(this.x, this.y - 60);
    });

    this.startShouting(scene);
    
    // Get network monitor instance
    this.networkMonitor = NetworkMonitor.getInstance(scene);
    
    // Register for network status change notifications
    this.networkMonitor.addNetworkStatusChangeListener(() => {
      // Trigger a shout when network status changes
      this.triggerNetworkStatusShout();
    });
  }

  private createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists("mrgemx-idle")) {
      scene.anims.create({
        key: "mrgemx-idle",
        frames: scene.anims.generateFrameNumbers("mr_gemx", { start: 0, end: 11 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  public interact() {
    // Check if a dialog is already open
    if (this.currentDialog) {
      console.log("MrGemx: Dialog already open, ignoring interaction");
      return;
    }
    
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log("MrGemx: Network offline - showing offline message");
      const dialog = showDialog(this.scene, [
        {
          text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
          isExitDialog: true
        }
      ]);
      
      // Store reference to the new dialog
      this.currentDialog = dialog;
      return;
    }
    
    console.log("MrGemx: Interaction triggered");
    const player = this.getClosestPlayer();

    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      console.log("MrGemx: Distance to player:", distance);

      if (distance <= 100) {
        console.log("MrGemx: Showing dialog");
        const dialog = showDialog(this.scene, [
          {
            text: "Welcome, explorer! 🌍 Have you heard about the Crystle Metaverse?",
            avatar: "npc_mrgemx_avatar",
            options: [
              {
                text: "Tell me more!",
                callback: () => {
                  // Clear current dialog reference before showing new dialog
                  this.currentDialog = null;
                  setTimeout(() => this.explainMetaverse(), 100);
                }
              },
              {
                text: "What’s special about Crystle World?",
                callback: () => {
                  // Clear current dialog reference before showing new dialog
                  this.currentDialog = null;
                  setTimeout(() => this.explainCrystleWorld(), 100);
                }
              },
              {
                text: "Not right now.",
                callback: () => {
                  // Clear current dialog reference before showing new dialog
                  this.currentDialog = null;
                  setTimeout(() => this.sayGoodbye(), 100);
                }
              },
            ]
          }
        ]);
        
        // Store reference to the new dialog
        this.currentDialog = dialog;
      } else {
        console.log("MrGemx: Player too far away");
      }
    }
  }

  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closestPlayer = null;
    let minDistance = Number.MAX_VALUE;

    this.scene.children.each((child) => {
      if (child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.includes("player")) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestPlayer = child;
        }
      }
    });

    return closestPlayer;
  }

  private explainMetaverse() {
    console.log("Explaining Crystle Metaverse");
    const dialog = showDialog(this.scene, [
      {
        text: "The Crystle Metaverse is a vast, solar-punk inspired world where knowledge fuels your journey! 🌱",
        avatar: "npc_mrgemx_avatar"
      },
      {
        text: "Here, you can explore, team up with friends, and earn Quiztals through quests and challenges!",
        avatar: "npc_mrgemx_avatar"
      },
      {
        text: "Want to learn more about Crystle World specifically?",
        avatar: "npc_mrgemx_avatar",
        options: [
          {
            text: "Yes, tell me!",
            callback: () => {
              // Clear current dialog reference before showing new dialog
              this.currentDialog = null;
              setTimeout(() => this.explainCrystleWorld(), 100);
            }
          },
          {
            text: "No thanks, bye!",
            callback: () => {
              // Clear current dialog reference before showing new dialog
              this.currentDialog = null;
              setTimeout(() => this.sayGoodbye(), 100);
            }
          }
        ]
      }
    ]);
    
    // Store reference to the new dialog
    this.currentDialog = dialog;
  }

  private explainCrystleWorld() {
    console.log("Explaining Crystle World");
    const dialog = showDialog(this.scene, [
      {
        text: "Crystle World is built for curious minds. Every NPC has a quiz or quest for you! 🎓",
        avatar: "npc_mrgemx_avatar"
      },
      {
        text: "By answering quizzes correctly, you gain XP, unlock rewards, and level up your character!",
        avatar: "npc_mrgemx_avatar"
      },
      {
        text: "Some NPCs even hold rare knowledge that unlocks new paths and abilities! 🚀",
        avatar: "npc_mrgemx_avatar"
      },
      {
        text: "Want to hear about the bigger Crystle Metaverse?",
        avatar: "npc_mrgemx_avatar",
        options: [
          {
            text: "Sure!",
            callback: () => {
              // Clear current dialog reference before showing new dialog
              this.currentDialog = null;
              setTimeout(() => this.explainMetaverse(), 100);
            }
          },
          {
            text: "No thanks, bye!",
            callback: () => {
              // Clear current dialog reference before showing new dialog
              this.currentDialog = null;
              setTimeout(() => this.sayGoodbye(), 100);
            }
          }
        ]
      }
    ]);
    
    // Store reference to the new dialog
    this.currentDialog = dialog;
  }

  private sayGoodbye() {
    console.log("Saying goodbye to the player.");
    const dialog = showDialog(this.scene, [
      {
        text: "No worries, adventurer! I'll be here when you're ready to learn more! ✨",
        avatar: "npc_mrgemx_avatar",
        isExitDialog: true
      }
    ]);
    
    // Store reference to the new dialog
    this.currentDialog = dialog;
  }

  private startShouting(scene: Phaser.Scene) {
    console.log("Starting shouting sequence for Mr. Gemx");
    const shoutMessages = [
      "The Crystle Metaverse awaits! 🌍",
      "Want to unlock hidden knowledge? Talk to me! 📚",
      "Explorers and thinkers, gather around! 🧠",
      "Curious about Crystle World? Click me to learn! ✨"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No knowledge until connection restored! 🚫📡",
      "Internet connection lost! Crystle wisdom on hold! 😢🔌",
      "Offline mode: Mr. Gemx's wisdom disabled! ⏸️",
      "No network, no Crystle knowledge! 🔌",
      "Connection error: Knowledge unavailable! 📡"
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
  console.log("MrGemx shout:", message);
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
    message = "🚨 Network connection lost! Mr. Gemx's knowledge disabled! 🚫";
  } else {
    // Network is online
    message = "✅ Network connection restored! Mr. Gemx's knowledge available! 🌐";
  }
  
  this.showShout(message);
}

}
