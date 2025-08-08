//LoginCharacterScene.ts
import Phaser from "phaser";
import { auth, db } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default class LoginCharacterScene extends Phaser.Scene {
  private user: any = null;
  private selectedCharacter: string = "lsxd";
  private characterKeys: string[] = ["lsxd", "penski", "sarah", "xander"];
  private characterSprites: Phaser.GameObjects.Sprite[] = [];
  private currentIndex: number = 0;
  private gradientOverlay!: Phaser.GameObjects.Graphics;
  private colorShiftTimer: number = 0;
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;

  // Add new properties
  private leftArrow!: Phaser.GameObjects.Image;
  private rightArrow!: Phaser.GameObjects.Image;
  private confirmButton!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: "LoginCharacterScene" });
  }

  async create() {
    this.gradientOverlay = this.add.graphics();
    this.drawGradient(0x001a33, 0x330066);

    this.add
      .text(this.scale.width / 2, 40, "Quiztal World", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.checkLogin();
  }

  async checkLogin() {
    const playerData = localStorage.getItem("quiztal-player");
    if (playerData) {
      this.user = JSON.parse(playerData);
      this.startCharacterSelection();
    } else {
      this.showLoginButton();
    }
  }

  showLoginButton() {
    const button = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Sign in with Google", {
        fontSize: "24px",
        backgroundColor: "#ffffff",
        color: "#000",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", async () => {
      this.showLoadingBar();
      this.updateLoadingProgress(0.2);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      this.updateLoadingProgress(0.4);

      const user = result.user;

      const playerRef = doc(db, "players", user.uid);
      const playerSnap = await getDoc(playerRef);
      if (!playerSnap.exists()) {
        await setDoc(playerRef, {
          quiztals: 100,
          character: "",
          createdAt: Date.now(),
          displayName: user.displayName || "Unknown Adventurer",
        });
        console.log("🪙 New player created with 100 quiztals!");
      } else {
        console.log("👤 Player already exists.");
      }

      this.updateLoadingProgress(0.7);

      const playerObj = {
        uid: user.uid,
        character: this.selectedCharacter,
        email: user.email,
        displayName: user.displayName || "Unknown Adventurer",
      };
      localStorage.setItem("quiztal-player", JSON.stringify(playerObj));
      this.user = playerObj;

      this.updateLoadingProgress(1);

      button.destroy();
      this.loadingBar.destroy();
      this.loadingText.destroy();
      this.startCharacterSelection();
    });
  }

  preload() {
    // ...existing preload code...
    this.load.image('arrow-left', 'assets/ui/arrow-left.png');
    this.load.image('arrow-right', 'assets/ui/arrow-right.png');
    this.load.image('button-confirm', 'assets/ui/button-confirm.png');
  }

  startCharacterSelection() {
    this.add
      .text(this.scale.width / 2, 100, `Welcome, ${this.user.displayName || "Traveler"}`, {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 140, "Select Your Character", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.characterKeys.forEach((key) => this.createCharacterAnimation(key));

    this.characterSprites = this.characterKeys.map((key, index) => {
      const sprite = this.add.sprite(
        this.scale.width / 2,
        this.scale.height / 2 + 30,
        `player_${key}_walk_1`
      );

      sprite.setOrigin(0.5);
      sprite.setScale(2);
      sprite.setVisible(index === this.currentIndex);

      if (index === this.currentIndex) {
        sprite.play(`player_${key}_walk_1`);
      }

      return sprite;
    });

    // Remove the keyboard instructions text
    // Add touch controls instead
    this.createTouchControls();

    // Keep keyboard controls for desktop
    this.input.keyboard!.on("keydown-LEFT", this.selectPrevious, this);
    this.input.keyboard!.on("keydown-RIGHT", this.selectNext, this);
    this.input.keyboard!.on("keydown-ENTER", this.confirmSelection, this);
  }

  // Add new method for touch controls
  private createTouchControls() {
    const padding = 20;
    
    // Add left arrow
    this.leftArrow = this.add.image(padding * 2, this.scale.height - 100, 'arrow-left')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.8)
      .setScale(1.2);

    // Add right arrow
    this.rightArrow = this.add.image(this.scale.width - (padding * 2), this.scale.height - 100, 'arrow-right')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.8)
      .setScale(1.2);

    // Add confirm button
    this.confirmButton = this.add.image(this.scale.width / 2, this.scale.height - 70, 'button-confirm')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.8)
      .setScale(1.3);

    // Add touch events
    this.leftArrow.on('pointerdown', () => {
      this.selectPrevious();
      this.leftArrow.setAlpha(0.6);
    });

    this.rightArrow.on('pointerdown', () => {
      this.selectNext();
      this.rightArrow.setAlpha(0.6);
    });

    this.confirmButton.on('pointerdown', () => {
      this.confirmSelection();
      this.confirmButton.setAlpha(0.6);
    });

    // Add pointerup events to restore alpha
    this.leftArrow.on('pointerup', () => this.leftArrow.setAlpha(0.8));
    this.rightArrow.on('pointerup', () => this.rightArrow.setAlpha(0.8));
    this.confirmButton.on('pointerup', () => this.confirmButton.setAlpha(0.8));
  }

  update(_time: number, delta: number) {
    this.colorShiftTimer += delta * 0.0001;
    const color1 = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(0, 26, 51),
      new Phaser.Display.Color(51, 0, 102),
      100,
      Math.abs(Math.sin(this.colorShiftTimer)) * 100
    );
    const color2 = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(51, 0, 102),
      new Phaser.Display.Color(0, 26, 51),
      100,
      Math.abs(Math.cos(this.colorShiftTimer)) * 100
    );
    this.drawGradient(
      Phaser.Display.Color.GetColor(color1.r, color1.g, color1.b),
      Phaser.Display.Color.GetColor(color2.r, color2.g, color2.b)
    );
  }

  private drawGradient(color1: number, color2: number) {
    this.gradientOverlay.clear();
    this.gradientOverlay.fillGradientStyle(color1, color1, color2, color2, 1);
    this.gradientOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  private createCharacterAnimation(key: string) {
    this.anims.create({
      key: `player_${key}_walk_1`,
      frames: this.anims.generateFrameNumbers(`player_${key}_walk_1`, {
        start: 0,
        end: 5,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  selectPrevious() {
    this.characterSprites[this.currentIndex].setVisible(false);
    this.characterSprites[this.currentIndex].stop();
    this.currentIndex =
      (this.currentIndex - 1 + this.characterSprites.length) %
      this.characterSprites.length;
    this.characterSprites[this.currentIndex].setVisible(true);
    this.characterSprites[this.currentIndex].play(
      `player_${this.characterKeys[this.currentIndex]}_walk_1`
    );
  }

  selectNext() {
    this.characterSprites[this.currentIndex].setVisible(false);
    this.characterSprites[this.currentIndex].stop();
    this.currentIndex = (this.currentIndex + 1) % this.characterSprites.length;
    this.characterSprites[this.currentIndex].setVisible(true);
    this.characterSprites[this.currentIndex].play(
      `player_${this.characterKeys[this.currentIndex]}_walk_1`
    );
  }

  async confirmSelection() {
    this.selectedCharacter = this.characterKeys[this.currentIndex];
    console.log(`✅ Character Selected: ${this.selectedCharacter}`);

    // Display confirmation message
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, `You have selected ${this.selectedCharacter}!`, {
      fontSize: "24px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Wait before transitioning to the game scene
    this.time.delayedCall(1000, () => {
      const existing = JSON.parse(localStorage.getItem("quiztal-player") || "{}");
      const updated = {
        ...existing,
        character: this.selectedCharacter,
      };

      localStorage.setItem("quiztal-player", JSON.stringify(updated));

      const playerRef = doc(db, "players", this.user.uid);
      updateDoc(playerRef, {
        character: this.selectedCharacter,
      });

      // Transition to the game scene
      this.scene.start("GameScene", {
        selectedCharacter: this.selectedCharacter,
      });
    });
  }

  // 👇 LOADING BAR UI
  private showLoadingBar() {
    const barWidth = 300;
    const barHeight = 30;
    const x = (this.scale.width - barWidth) / 2;
    const y = this.scale.height / 2 + 80;

    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0xffffff, 0.2);
    this.loadingBar.fillRect(x, y, barWidth, barHeight);

    this.loadingText = this.add.text(this.scale.width / 2, y - 30, "Loading...", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);
  }

  private updateLoadingProgress(percent: number) {
    const barWidth = 300;
    const barHeight = 30;
    const x = (this.scale.width - barWidth) / 2;
    const y = this.scale.height / 2 + 80;

    this.loadingBar.clear();
    this.loadingBar.fillStyle(0xffffff, 0.2);
    this.loadingBar.fillRect(x, y, barWidth, barHeight);

    this.loadingBar.fillStyle(0x00ff00, 1);
    this.loadingBar.fillRect(x, y, barWidth * percent, barHeight);
  }

  // Optional: Add cleanup in scene shutdown
  shutdown() {
    // ...existing cleanup code...
    if (this.leftArrow) this.leftArrow.destroy();
    if (this.rightArrow) this.rightArrow.destroy();
    if (this.confirmButton) this.confirmButton.destroy();
  }
}
