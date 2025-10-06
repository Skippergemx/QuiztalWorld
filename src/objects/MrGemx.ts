import Phaser from "phaser";
import GuideNPC from "./GuideNPC";

export default class MrGemx extends GuideNPC {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "mr_gemx");
    
    this.npcName = "Mr. Gemx";
    this.npcAvatar = "npc_mrgemx_avatar";

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

    // For the simplified version, we don't need the complex guide topics
    // this.initializeGuideTopics();
    this.startShouting(scene);
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
    // Override the base interact method to show shortcut keys directly
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log(`${this.npcName}: Network offline - showing offline message`);
      this.showOfflineDialog();
      return;
    }
    
    const player = this.getClosestPlayer();

    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      console.log(`${this.npcName}: Distance to player:`, distance);

      if (distance <= 100) {
        console.log(`${this.npcName}: Showing shortcut keys`);
        this.showShortcutKeysDialog();
      } else {
        console.log(`${this.npcName}: Player too far away`);
      }
    }
  }

  private showShortcutKeysDialog(): void {
    const shortcutContent = 
      "Here are the essential shortcut keys for Quiztal World:\n\n" +
      "🎮 MOVEMENT CONTROLS:\n" +
      "• Arrow Keys or WASD - Move your character\n" +
      "• Virtual Joystick (Mobile) - Move character\n\n" +
      "⚡ QUICK ACTIONS:\n" +
      "• C Key - Interact with NPCs\n" +
      "• I Key - Open/Close Inventory\n" +
      "• R Key - Toggle Session Rewards Tracker\n" +
      "• G Key - Open/Close the Guide Book\n" +
      "• Interact Button (Mobile) - Talk to NPCs\n\n" +
      "💎 OTHER USEFUL SHORTCUTS:\n" +
      "• ESC - Pause/Menu\n" +
      "• M - Toggle Map\n" +
      "• +/- - Zoom In/Out";

    // Pass empty array for options since we have the X button
    this.showShortcutKeys("⌨️ Game Shortcut Keys", shortcutContent, []);
  }

  private startShouting(scene: Phaser.Scene) {
    console.log("Starting shouting sequence for Mr. Gemx");
    const shoutMessages = [
      "Need shortcut keys? Click me! ⌨️",
      "Press G for the full guide book! 📖",
      "Quiztal World shortcuts available! 🎮",
      "Click me for essential game controls! ⚡"
    ];
    
    // Network-specific shout messages
    const networkOfflineMessages = [
      "Network down! No knowledge until connection restored! 🚫📡",
      "Internet connection lost! Quiztal wisdom on hold! 😢🔌",
      "Offline mode: Mr. Gemx's wisdom disabled! ⏸️",
      "No network, no Quiztal knowledge! 🔌",
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

  protected triggerNetworkStatusShout(): void {
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