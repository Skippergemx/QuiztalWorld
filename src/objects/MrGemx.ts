import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";

export default class MrGemx extends Phaser.Physics.Arcade.Sprite {
  private nameLabel: Phaser.GameObjects.Text;
  private shoutOutText: Phaser.GameObjects.Text;

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
    console.log("MrGemx: Interaction triggered");
    const player = this.getClosestPlayer();

    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      console.log("MrGemx: Distance to player:", distance);

      if (distance <= 100) {
        console.log("MrGemx: Showing dialog");
        showDialog(this.scene, [
          {
            text: "Welcome, explorer! 🌍 Have you heard about the Quiztal Metaverse?",
            avatar: "npc_mrgemx_avatar",
            options: [
              {
                text: "Tell me more!",
                callback: () => setTimeout(() => this.explainMetaverse(), 100)
              },
              {
                text: "What’s special about Quiztal World?",
                callback: () => setTimeout(() => this.explainQuiztalWorld(), 100)
              },
              {
                text: "Not right now.",
                callback: () => setTimeout(() => this.sayGoodbye(), 100)
              },
            ]
          }
        ]);
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
    console.log("Explaining Quiztal Metaverse");
    showDialog(this.scene, [
      {
        text: "The Quiztal Metaverse is a vast, solar-punk inspired world where knowledge fuels your journey! 🌱",
        avatar: "npc_mrgemx_avatar"
      },
      {
        text: "Here, you can explore, team up with friends, and earn Quiztals through quests and challenges!",
        avatar: "npc_mrgemx_avatar"
      },
      {
        text: "Want to learn more about Quiztal World specifically?",
        avatar: "npc_mrgemx_avatar",
        options: [
          {
            text: "Yes, tell me!",
            callback: () => setTimeout(() => this.explainQuiztalWorld(), 100)
          },
          {
            text: "No thanks, bye!",
            callback: () => setTimeout(() => this.sayGoodbye(), 100)
          }
        ]
      }
    ]);
  }

  private explainQuiztalWorld() {
    console.log("Explaining Quiztal World");
    showDialog(this.scene, [
      {
        text: "Quiztal World is built for curious minds. Every NPC has a quiz or quest for you! 🎓",
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
        text: "Want to hear about the bigger Quiztal Metaverse?",
        avatar: "npc_mrgemx_avatar",
        options: [
          {
            text: "Sure!",
            callback: () => setTimeout(() => this.explainMetaverse(), 100)
          },
          {
            text: "No thanks, bye!",
            callback: () => setTimeout(() => this.sayGoodbye(), 100)
          }
        ]
      }
    ]);
  }

  private sayGoodbye() {
    console.log("Saying goodbye to the player.");
    showDialog(this.scene, [
      {
        text: "No worries, adventurer! I'll be here when you're ready to learn more! ✨",
        avatar: "npc_mrgemx_avatar",
        isExitDialog: true
      }
    ]);
  }

  private startShouting(scene: Phaser.Scene) {
    console.log("Starting shouting sequence for Mr. Gemx");
    const shoutMessages = [
      "The Quiztal Metaverse awaits! 🌍",
      "Want to unlock hidden knowledge? Talk to me! 📚",
      "Explorers and thinkers, gather around! 🧠",
      "Curious about Quiztal World? Click me to learn! ✨"
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
    console.log("MrGemx shout:", message);
    this.shoutOutText.setText(message).setAlpha(1);

    this.scene.tweens.add({
      targets: this.shoutOutText,
      alpha: 0,
      duration: 2000,
      delay: 3000,
    });
  }
}
