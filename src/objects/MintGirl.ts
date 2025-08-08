import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox";
import { saveQuiztalsToDatabase } from "../utils/Database";

export default class MintGirl extends Phaser.Physics.Arcade.Sprite {
  private nameLabel: Phaser.GameObjects.Text;
  private shoutOutText: Phaser.GameObjects.Text;

  private quizQuestions = [
    { question: "What is Mint Club?", options: ["A candy store", "A bonding curve platform", "A new dance move"], answer: "A bonding curve platform" },
    { question: "What can you do with Quiztals?", options: ["Eat them", "Stake them", "Throw them"], answer: "Stake them" },
    { question: "Quiztals will eventually become...?", options: ["NFT Art", "On-chain tokens", "A comic book"], answer: "On-chain tokens" }
  ];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "mint_girl", 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    this.play("mintgirl-idle");

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    this.nameLabel = scene.add.text(x, y - 40, "Mint Girl", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00ff00",
      stroke: "#003300",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5);

    this.shoutOutText = scene.add.text(x, y - 60, "", {
      fontSize: "12px",
      fontFamily: "monospace",
      color: "#00ff00",
      stroke: "#003300",
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
    if (!scene.anims.exists("mintgirl-idle")) {
      scene.anims.create({
        key: "mintgirl-idle",
        frames: scene.anims.generateFrameNumbers("mint_girl", { start: 0, end: 23 }),
        frameRate: 3,
        repeat: -1,
      });
    }
  }

  public interact() {
    const player = this.getClosestPlayer();
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        this.startQuiz(player);
      }
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    const currentQuestion = Phaser.Utils.Array.GetRandom(this.quizQuestions);
    showDialog(this.scene, [
      {
        text: currentQuestion.question,
        avatar: "npc_mintgirl_avatar",
        options: currentQuestion.options.map(option => ({
          text: option,
          callback: () => this.checkAnswer(option, currentQuestion.answer, player)
        }))
      }
    ]);
  }

  private checkAnswer(selectedOption: string, correctAnswer: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selectedOption === correctAnswer;
    const reward = this.calculateReward(isCorrect);

    this.scene.time.delayedCall(500, () => {
      showDialog(this.scene, [
        {
          text: isCorrect
            ? `🍃 Correct! You earned ${reward.toFixed(2)} $Quiztals from the Mint Club!`
            : `🌪️ Nope! The correct answer was "${correctAnswer}". Try again later!`,
          avatar: "npc_mintgirl_avatar",
          isExitDialog: true
        }
      ]);
    });

    if (isCorrect) {
      this.saveRewardToDatabase(player, reward);
    }
  }

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`;
    saveQuiztalsToDatabase(playerId, reward, "MintGirl");
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

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Hey! Ever heard of Mint Club? 🌱",
      "Want to turn Quiztals into real tokens? Ask me! 💰",
      "On-chain Quiztals are the future! 🚀",
      "Click me to earn $Quiztals! 🎉"
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
}
