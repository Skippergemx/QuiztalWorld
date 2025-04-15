// HuntBoy.ts
import Phaser from "phaser";
import { showDialog } from "../utils/SimpleDialogBox"; // Import dialog function
import { saveQuiztalsToDatabase } from "../utils/Database"; // Firestore save utility

export default class HuntBoy extends Phaser.Physics.Arcade.Sprite {
  private directions = ["right", "up", "left", "down"];
  private currentIndex = 0;
  private nameLabel: Phaser.GameObjects.Text;
  private shoutOutText: Phaser.GameObjects.Text;

  // Quiz data
  private quizQuestions = [
    { question: "What is Base?", options: ["Layer 2 Ethereum", "Bitcoin Wallet", "Game Token"], answer: "Layer 2 Ethereum" },
    { question: "What is Hunt Town?", options: ["A Web3 City", "A Developer Community", "A Blockchain Network"], answer: "A Developer Community" },
    // Add more questions if needed
  ];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "npc_huntboy", 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setDepth(1);

    this.createAnimations(scene);
    this.startIdleLoop(scene);

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

    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());
  }

  private createAnimations(scene: Phaser.Scene) {
    this.directions.forEach((dir, index) => {
      scene.anims.create({
        key: `huntboy-idle-${dir}`,
        frames: scene.anims.generateFrameNumbers("npc_huntboy", {
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
        this.play(`huntboy-idle-${newDirection}`);
      },
      loop: true,
    });
  }

  public interact() {
    console.log("HuntBoy: Interaction triggered");
    const player = this.getClosestPlayer();
    
    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (distance <= 100) {
        console.log("HuntBoy: Player is close enough, starting quiz");
        this.startQuiz(player);
      } else {
        console.log("HuntBoy: Player is too far away");
      }
    } else {
      console.log("HuntBoy: No player found");
    }
  }

  private startQuiz(player: Phaser.Physics.Arcade.Sprite) {
    const currentQuestion = Phaser.Utils.Array.GetRandom(this.quizQuestions);
    console.log("Starting quiz: ", currentQuestion.question);

    showDialog(this.scene, [
      {
        text: currentQuestion.question,
        avatar: "npc_huntboy_avatar",
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

    console.log(isCorrect ? "Correct answer!" : "Wrong answer.");

    // Delay reward dialog just enough for a smoother transition
    this.scene.time.delayedCall(500, () => {
      showDialog(this.scene, [
        {
          text: isCorrect 
            ? `🎉 Correct! You’ve earned ${reward.toFixed(2)} $Quiztals!`
            : `❌ Oops! Correct answer was: "${correctAnswer}". Better luck next time.`,
          avatar: "npc_huntboy_avatar",
          isExitDialog: true
        }
      ]);
    });

    if (isCorrect) {
      this.saveRewardToDatabase(player, reward);
    }
  }

  private calculateReward(isCorrect: boolean): number {
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.1, 3).toFixed(2)) : 0;
  }

  private saveRewardToDatabase(player: Phaser.Physics.Arcade.Sprite, reward: number) {
    const playerId = player.name || `anon_${Date.now()}`; // Fallback in case name is missing
    saveQuiztalsToDatabase(playerId, reward);
  }

  private startShouting(scene: Phaser.Scene) {
    const shoutMessages = [
      "Yo anon, have you bridged to Base yet? 😏",
      "Base gas fees? What gas fees? Almost free! 💨",
      "Web3 builders, join Hunt Town! 🏗️",
      "Hunt Town = Web3 dev paradise! 🌍"
    ];

    scene.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        const randomMessage = Phaser.Utils.Array.GetRandom(shoutMessages);
        this.showShout(randomMessage);
        console.log(`Hunt Boy Shouting: ${randomMessage}`);
        this.startShouting(scene); // Loop again
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
}
