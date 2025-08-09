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
    { 
      question: "What can developers do in Hunt Town?", 
      options: ["Build Web3 projects", "Hunt animals", "Play chess"], 
      answer: "Build Web3 projects" 
    },
    { 
      question: "What's Hunt Town's main focus?", 
      options: ["Web3 development", "Gaming", "Social media"], 
      answer: "Web3 development" 
    },
    { 
      question: "Which chain is Hunt Town building on?", 
      options: ["Base", "Solana", "Polygon"], 
      answer: "Base" 
    },
    { 
      question: "What's special about Hunt Town's community?", 
      options: ["Developer-focused", "Gamers only", "NFT traders only"], 
      answer: "Developer-focused" 
    },
    { 
      question: "What can you find in Hunt Town?", 
      options: ["Web3 builders", "Pokemon", "Cars"], 
      answer: "Web3 builders" 
    },
    { 
      question: "What's Hunt Town's approach to Web3?", 
      options: ["Build useful tools", "Just trade NFTs", "Only gaming"], 
      answer: "Build useful tools" 
    },
    { 
      question: "Why choose Base for Hunt Town?", 
      options: ["Low fees & ETH security", "Free tokens", "No reason"], 
      answer: "Low fees & ETH security" 
    },
    { 
      question: "What's Hunt Town's vision?", 
      options: ["Empower Web3 builders", "Just gaming", "NFT trading"], 
      answer: "Empower Web3 builders" 
    },
    { 
      question: "Who can join Hunt Town?", 
      options: ["Anyone interested in Web3", "Only experts", "Nobody"], 
      answer: "Anyone interested in Web3" 
    },
    { 
      question: "What makes Hunt Town unique?", 
      options: ["Developer community", "High gas fees", "Closed source"], 
      answer: "Developer community" 
    },
    { 
      question: "What can you learn in Hunt Town?", 
      options: ["Web3 development", "Cooking", "Farming"], 
      answer: "Web3 development" 
    },
    { 
      question: "How does Hunt Town help builders?", 
      options: ["Community support", "Free lunch", "Free hosting"], 
      answer: "Community support" 
    },
    { 
      question: "What's Hunt Town's relationship with Base?", 
      options: ["Building on Base", "Competing with Base", "No relation"], 
      answer: "Building on Base" 
    },
    { 
      question: "What tools can Hunt Town devs use?", 
      options: ["Ethereum tools", "Special tools only", "No tools"], 
      answer: "Ethereum tools" 
    },
    { 
      question: "What's Hunt Town's development approach?", 
      options: ["Open & collaborative", "Solo building", "Closed groups"], 
      answer: "Open & collaborative" 
    },
    { 
      question: "What's available in Hunt Town?", 
      options: ["Development resources", "Free tokens", "NFT airdrops"], 
      answer: "Development resources" 
    },
    { 
      question: "How does Hunt Town support builders?", 
      options: ["Community & resources", "Money only", "No support"], 
      answer: "Community & resources" 
    },
    { 
      question: "What's Hunt Town's goal?", 
      options: ["Grow Web3 ecosystem", "Quick profits", "Gaming only"], 
      answer: "Grow Web3 ecosystem" 
    },
    { 
      question: "What can you build in Hunt Town?", 
      options: ["Web3 applications", "Only games", "Only NFTs"], 
      answer: "Web3 applications" 
    },
    { 
      question: "Why join Hunt Town?", 
      options: ["Learn & build Web3", "Get rich quick", "Play games"], 
      answer: "Learn & build Web3" 
    },
    { 
      question: "What type of projects are built in Hunt Town?", 
      options: ["Web3 dApps", "Mobile games", "Desktop software"], 
      answer: "Web3 dApps" 
    },
    { 
      question: "How does Hunt Town help new developers?", 
      options: ["Mentorship & resources", "Cash rewards", "Gaming tournaments"], 
      answer: "Mentorship & resources" 
    },
    { 
      question: "What's Hunt Town's contribution to Base?", 
      options: ["Growing developer ecosystem", "Creating NFTs", "Running nodes"], 
      answer: "Growing developer ecosystem" 
    },
    { 
      question: "What's unique about Hunt Town's builders?", 
      options: ["Focus on Web3 innovation", "Trading focus", "Gaming focus"], 
      answer: "Focus on Web3 innovation" 
    },
    { 
      question: "How does Hunt Town foster collaboration?", 
      options: ["Open source projects", "Closed teams", "Solo work"], 
      answer: "Open source projects" 
    },
    { 
      question: "What's Hunt Town's development philosophy?", 
      options: ["Build & share knowledge", "Build in private", "Copy existing projects"], 
      answer: "Build & share knowledge" 
    },
    { 
      question: "How does Hunt Town support Base adoption?", 
      options: ["Building useful dApps", "Creating memes", "Trading tokens"], 
      answer: "Building useful dApps" 
    },
    { 
      question: "What's Hunt Town's community known for?", 
      options: ["Helpful developers", "Token traders", "NFT collectors"], 
      answer: "Helpful developers" 
    },
    { 
      question: "What can beginners learn in Hunt Town?", 
      options: ["Web3 development basics", "Token trading", "Gaming"], 
      answer: "Web3 development basics" 
    },
    { 
      question: "How does Hunt Town encourage learning?", 
      options: ["Community workshops", "Trading contests", "Gaming events"], 
      answer: "Community workshops" 
    },
    { 
      question: "What's Hunt Town's role in Web3?", 
      options: ["Developer education hub", "Gaming platform", "NFT marketplace"], 
      answer: "Developer education hub" 
    },
    { 
      question: "What makes Hunt Town different from other communities?", 
      options: ["Focus on building", "Focus on trading", "Focus on gaming"], 
      answer: "Focus on building" 
    },
    { 
      question: "What's Hunt Town's approach to new developers?", 
      options: ["Welcoming & supportive", "Experts only", "Closed community"], 
      answer: "Welcoming & supportive" 
    },
    { 
      question: "What kind of projects does Hunt Town encourage?", 
      options: ["Innovative Web3 solutions", "Copy trading", "Gaming only"], 
      answer: "Innovative Web3 solutions" 
    },
    { 
      question: "How does Hunt Town help Base ecosystem?", 
      options: ["Building developer tools", "Creating memes", "Trading tokens"], 
      answer: "Building developer tools" 
    },
    { 
      question: "What's Hunt Town's educational focus?", 
      options: ["Web3 development", "Traditional gaming", "Social media"], 
      answer: "Web3 development" 
    },
    { 
      question: "How does Hunt Town support innovation?", 
      options: ["Open collaboration", "Solo competition", "Closed teams"], 
      answer: "Open collaboration" 
    },
    { 
      question: "What's Hunt Town's community structure?", 
      options: ["Open & inclusive", "Hierarchical", "Invitation only"], 
      answer: "Open & inclusive" 
    },
    { 
      question: "What's Hunt Town's approach to collaboration?", 
      options: ["Knowledge sharing", "Competition", "Individual work"], 
      answer: "Knowledge sharing" 
    },
    { 
      question: "What's Hunt Town's primary contribution?", 
      options: ["Growing Web3 talent", "Creating NFTs", "Gaming"], 
      answer: "Growing Web3 talent" 
    }
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
    // Get random question
    const currentQuestion = Phaser.Utils.Array.GetRandom(this.quizQuestions);
    console.log("Starting quiz: ", currentQuestion.question);

    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);

    showDialog(this.scene, [
      {
        text: currentQuestion.question,
        avatar: "npc_huntboy_avatar",
        options: shuffledOptions.map(option => ({
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
    return isCorrect ? parseFloat(Phaser.Math.FloatBetween(0.01, 0.5).toFixed(2)) : 0;
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
