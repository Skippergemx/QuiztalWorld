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
    { 
      question: "What consensus mechanism does Base use?", 
      options: ["Proof of Work", "Optimistic Rollup", "Proof of Stake"], 
      answer: "Optimistic Rollup" 
    },
    { 
      question: "Which scaling solution is Base built on?", 
      options: ["Arbitrum", "Optimism", "zkSync"], 
      answer: "Optimism" 
    },
    { 
      question: "What can you do on Base?", 
      options: ["Deploy smart contracts", "Mine Bitcoin", "Create Layer 1"], 
      answer: "Deploy smart contracts" 
    },
    { 
      question: "Base transactions are secured by which network?", 
      options: ["Solana", "Ethereum", "BNB Chain"], 
      answer: "Ethereum" 
    },
    { 
      question: "What type of network is Base?", 
      options: ["Sidechain", "Layer 2", "Layer 1"], 
      answer: "Layer 2" 
    },
    { 
      question: "What's a key advantage of using Base?", 
      options: ["Lower fees than L1", "Free transactions", "Faster than Ethereum"], 
      answer: "Lower fees than L1" 
    },
    {
      question: "Which wallet can you use with Base?",
      options: ["Only Coinbase Wallet", "Any EVM wallet", "Only MetaMask"],
      answer: "Any EVM wallet"
    },
    {
      question: "What's Base's approach to decentralization?",
      options: ["Fully centralized", "Progressive decentralization", "Instant decentralization"],
      answer: "Progressive decentralization"
    },
    {
      question: "What programming language is commonly used on Base?",
      options: ["Solidity", "Python", "Java"],
      answer: "Solidity"
    },
    {
      question: "What's the average block time on Base?",
      options: ["2 seconds", "12 seconds", "1 minute"],
      answer: "2 seconds"
    },
    {
      question: "Which bridge can you use to move assets to Base?",
      options: ["Base Bridge", "Rainbow Bridge", "Polygon Bridge"],
      answer: "Base Bridge"
    },
    {
      question: "What's the native token used for gas on Base?",
      options: ["ETH", "BASE", "MATIC"],
      answer: "ETH"
    },
    {
      question: "What type of addresses does Base use?",
      options: ["Ethereum-compatible", "Solana-style", "Bitcoin-style"],
      answer: "Ethereum-compatible"
    },
    {
      question: "Which development framework works with Base?",
      options: ["Hardhat", "Unity", "Android SDK"],
      answer: "Hardhat"
    },
    {
      question: "What's Base's approach to security?",
      options: ["Inherited from Ethereum", "Independent security", "No security"],
      answer: "Inherited from Ethereum"
    },
    {
      question: "How can developers deploy on Base?",
      options: ["Using standard Ethereum tools", "Special Base tools only", "Cannot deploy"],
      answer: "Using standard Ethereum tools"
    },
    {
      question: "What's Base's primary focus?",
      options: ["Onchain accessibility", "Gaming", "Social media"],
      answer: "Onchain accessibility"
    },
    {
      question: "How does Base handle transaction finality?",
      options: ["Through Optimistic rollups", "Instant finality", "Proof of Work"],
      answer: "Through Optimistic rollups"
    },
    {
      question: "What's the challenge period on Base?",
      options: ["7 days", "1 day", "30 days"],
      answer: "7 days"
    },
    {
      question: "Which ecosystem is Base part of?",
      options: ["Ethereum", "Solana", "Cardano"],
      answer: "Ethereum"
    },
    {
      question: "What's Base's primary advantage for users?",
      options: ["Lower costs and faster txs", "Free tokens", "Better graphics"],
      answer: "Lower costs and faster txs"
    },
    {
      question: "How does Base achieve scalability?",
      options: ["Batch transactions off-chain", "More validators", "Bigger blocks"],
      answer: "Batch transactions off-chain"
    },
    {
      question: "What's Base's relationship with Ethereum?",
      options: ["Layer 2 solution", "Competitor", "No relation"],
      answer: "Layer 2 solution"
    },
    {
      question: "What can developers build on Base?",
      options: ["DApps and smart contracts", "Only NFTs", "Only DeFi"],
      answer: "DApps and smart contracts"
    },
    {
      question: "How does Base handle smart contract deployment?",
      options: ["Same as Ethereum", "Different process", "Not supported"],
      answer: "Same as Ethereum"
    },
    {
      question: "What's the main purpose of Base?",
      options: ["Scale Ethereum ecosystem", "Replace Ethereum", "Mine crypto"],
      answer: "Scale Ethereum ecosystem"
    },
    {
      question: "How does Base process transactions?",
      options: ["Batches them to Ethereum", "Independent processing", "Through mining"],
      answer: "Batches them to Ethereum"
    },
    {
      question: "What's unique about Base's development?",
      options: ["Open-source development", "Closed source", "No development"],
      answer: "Open-source development"
    }
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
    // Get random question
    const currentQuestion = Phaser.Utils.Array.GetRandom(this.quizQuestions);
    
    // Create a copy of options and shuffle them
    const shuffledOptions = Phaser.Utils.Array.Shuffle([...currentQuestion.options]);

    showDialog(this.scene, [
      {
        text: currentQuestion.question,
        avatar: "npc_basesage_avatar",
        options: shuffledOptions.map(option => ({
          text: option,
          callback: () => this.checkAnswer(option, currentQuestion.answer, player)
        }))
      }
    ]);
}

  private checkAnswer(selected: string, correct: string, player: Phaser.Physics.Arcade.Sprite) {
    const isCorrect = selected === correct;
    const reward = isCorrect ? Phaser.Math.FloatBetween(0.01, 0.5) : 0;

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
