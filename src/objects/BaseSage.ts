// BaseSage.ts
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";

export default class BaseSage extends Phaser.Physics.Arcade.Sprite {
  private directions = ["right", "up", "left", "down"];
  private currentIndex = 0;
  private nameLabel: Phaser.GameObjects.Text;
  private shoutOutText: Phaser.GameObjects.Text;
  private quizQuestions = [
    { question: "What is Base?", options: ["Layer 1", "Layer 2", "DEX"], answer: "Layer 2" },
    { question: "Who built Base?", options: ["Coinbase", "Binance", "OpenSea"], answer: "Coinbase" },
    { question: "Base uses which mainnet?", options: ["Solana", "Ethereum", "Polygon"], answer: "Ethereum" },
    { question: "What's a big benefit of Base?", options: ["Low gas fees", "Free NFTs", "Mining rewards"], answer: "Low gas fees" },
  ];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_basesage", 0); // Use your custom sprite here

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);
    this.createAnimations(scene);
    this.startIdleLoop(scene);

    this.nameLabel = scene.add.text(x, y - 40, "Base Sage", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#33ffcc",
      stroke: "#003366",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#33ffcc",
      stroke: "#003366",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    scene.events.on("update", () => {
      this.nameLabel.setPosition(this.x, this.y - 40);
      this.shoutOutText.setPosition(this.x, this.y - 60);
    });

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.startShouting(scene);
  }
 private createAnimations(scene: Phaser.Scene) {
    this.directions.forEach((dir, index) => {
      scene.anims.create({
        key: `basesage-idle-${dir}`,
        frames: scene.anims.generateFrameNumbers("npc_basesage", {
          start: index * 6,
          end: index * 6 + 5,
        }),
        frameRate: 3,
        repeat: -1,
      });
    });
  }

   private startIdleLoop(scene: Phaser.Scene) {
      scene.time.addEvent({
        delay: 3000,
        callback: () => {
          this.currentIndex = (this.currentIndex + 1) % this.directions.length;
          const newDirection = this.directions[this.currentIndex];
          this.play(`basesage-idle-${newDirection}`);
        },
        loop: true,
      });
    }

  public interact() {
    const player = this.getClosestPlayer();
    if (player && Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= 100) {
      this.startQuiz(player);
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    const question = Phaser.Utils.Array.GetRandom(this.quizQuestions);
    showDialog(this.scene, [
      {
        text: question.question,
        avatar: "npc_basesage_avatar",
        options: question.options.map(option => ({
          text: option,
          callback: () => this.checkAnswer(option, question.answer, player)
        }))
      }
    ]);
  }

  private checkAnswer(selected: string, correct: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selected === correct;
    const reward = isCorrect ? Phaser.Math.FloatBetween(0.1, 3) : 0;

    this.scene.time.delayedCall(500, () => {
      showDialog(this.scene, [
        {
          text: isCorrect
            ? `🌟 Correct! You earned ${reward.toFixed(2)} $Quiztals!`
            : `🙈 Nope! Correct answer was: "${correct}".`,
          avatar: "npc_basesage_avatar",
          isExitDialog: true
        }
      ]);
    });

    if (isCorrect) {
      this.saveReward(player, reward);
    }
  }

  private saveReward(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "BaseSage");
  }

  private startShouting(scene: Phaser.Scene) {
    const messages = [
      "Base is blazing fast! 🔥",
      "Click me to test your Base knowledge! 🤔",
      "Layer 2? Layer cake? Let’s find out! 🍰",
      "Onchain is the new online! 🌐"
    ];
    scene.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        this.showShout(Phaser.Utils.Array.GetRandom(messages));
        this.startShouting(scene);
      },
      loop: false
    });
  }

  private showShout(msg: string) {
    this.shoutOutText.setText(msg).setAlpha(1);
    this.scene.tweens.add({
      targets: this.shoutOutText,
      alpha: 0,
      duration: 2000,
      delay: 3000,
    });
  }

  private getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closest = null;
    let minDist = Number.MAX_VALUE;

    this.scene.children.each(child => {
      if (child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.includes("player")) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
        if (dist < minDist) {
          minDist = dist;
          closest = child;
        }
      }
    });

    return closest;
  }
}
