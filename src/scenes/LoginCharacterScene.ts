//LoginCharacterScene.ts
import Phaser from "phaser";
import { auth, db } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

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
  private leftArrow!: Phaser.GameObjects.Container;
  private rightArrow!: Phaser.GameObjects.Container;
  private confirmButton!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "LoginCharacterScene" });
  }

  async create() {
    // Load user data
    const playerData = localStorage.getItem("quiztal-player");
    if (!playerData) {
      this.scene.start("GoogleLoginScene");
      return;
    }
    
    this.user = JSON.parse(playerData);
    this.gradientOverlay = this.add.graphics();
    this.drawGradient(0x001a33, 0x330066);
    
    // Add keyboard controls
    this.input.keyboard?.on('keydown-LEFT', this.selectPrevious.bind(this));
    this.input.keyboard?.on('keydown-RIGHT', this.selectNext.bind(this));
    this.input.keyboard?.on('keydown-A', this.selectPrevious.bind(this));
    this.input.keyboard?.on('keydown-D', this.selectNext.bind(this));
    this.input.keyboard?.on('keydown-ENTER', this.confirmSelection.bind(this));  // Add this line
    
    // Start character selection immediately
    this.startCharacterSelection();
  }

  async checkLogin() {
    const playerData = localStorage.getItem("quiztal-player");
    if (playerData) {
      this.user = JSON.parse(playerData);
      // Start wallet verification scene
      this.scene.start('WalletVerificationScene');
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

      try {
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

        // Cleanup and move to wallet verification
        button.destroy();
        this.loadingBar.destroy();
        this.loadingText.destroy();
        
        this.scene.start('WalletVerificationScene');
      } catch (error) {
        console.error("Login failed:", error);
        this.showError("Login failed. Please try again.");
      }
    });
  }

  preload() {
    // ...existing code...
    this.load.image('arrow-left', 'assets/ui/arrow-left.png');
    this.load.image('arrow-right', 'assets/ui/arrow-right.png');
    this.load.image('button-confirm', 'assets/ui/button-confirm.png');
    
    // Initialize character animations
    this.characterKeys.forEach(key => {
        this.createCharacterAnimation(key);
    });
  }

  private startCharacterSelection() {
    const isMobile = this.scale.width < 768;
    
    // Create header container
    const headerContainer = this.add.container(this.scale.width / 2, isMobile ? 60 : 100);

    // Welcome text with glow effect
    const welcomeText = this.add.text(0, 0, 
        `Welcome, ${this.user.displayName || "Traveler"}`, {
        fontSize: isMobile ? "24px" : "32px",
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add glow to welcome text
    const textGlow = this.add.graphics()
        .lineStyle(16, 0x3498db, 0.1)
        .strokeRoundedRect(
            -welcomeText.width / 2 - 20,
            -welcomeText.height / 2 - 10,
            welcomeText.width + 40,
            welcomeText.height + 20,
            10
        );

    // Select character text
    const selectText = this.add.text(0, 80, "Select Your Character", {
        fontSize: isMobile ? "20px" : "28px",
        color: "#3498db",
        fontStyle: 'bold'
    }).setOrigin(0.5);

    headerContainer.add([textGlow, welcomeText, selectText]);

    // Character display area with platform effect
    const platformWidth = isMobile ? 200 : 300;
    const platformHeight = 40;
    const platformY = this.scale.height / 2 + 80;

    // Add platform shadow
    this.add.graphics()
        .fillStyle(0x000000, 0.3)
        .fillEllipse(
            this.scale.width / 2,
            platformY + 5,
            platformWidth,
            platformHeight
        );

    // Character sprites setup
    this.characterSprites = this.characterKeys.map((key, index) => {
        const sprite = this.add.sprite(
            this.scale.width / 2,
            this.scale.height / 2,
            `player_${key}_walk_1`
        );

        sprite.setOrigin(0.5)
            .setScale(isMobile ? 1.5 : 2)
            .setVisible(index === this.currentIndex);

        if (index === this.currentIndex) {
            sprite.play(`player_${key}_walk_1`);
        }

        return sprite;
    });

    this.createTouchControls();
}

private createTouchControls() {
    const isMobile = this.scale.width < 768;
    const arrowOffset = isMobile ? 100 : 150; // Distance from character center
    
    // Create arrow buttons at character level
    this.leftArrow = this.createArrowButton(
        this.scale.width / 2 - arrowOffset,
        this.scale.height / 2,
        'arrow-left',
        this.selectPrevious.bind(this)
    ) as Phaser.GameObjects.Container;

    this.rightArrow = this.createArrowButton(
        this.scale.width / 2 + arrowOffset,
        this.scale.height / 2,
        'arrow-right',
        this.selectNext.bind(this)
    ) as Phaser.GameObjects.Container;

    // Create confirm button at bottom
    this.confirmButton = this.createConfirmButton(
        this.scale.width / 2,
        this.scale.height - (isMobile ? 80 : 100)
    ) as Phaser.GameObjects.Container;
}

private createArrowButton(x: number, y: number, key: string, callback: () => void) {
    const isMobile = this.scale.width < 768;
    const button = this.add.container(x, y);

    // Button background with gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x3498db, 0x2980b9, 0x2980b9, 0x3498db, 1);
    bg.fillCircle(0, 0, isMobile ? 25 : 30);

    const arrow = this.add.image(0, 0, key)
        .setScale(isMobile ? 0.8 : 1);

    button.add([bg, arrow]);
    button.setInteractive(
        new Phaser.Geom.Circle(0, 0, isMobile ? 25 : 30),
        Phaser.Geom.Circle.Contains
    );

    // Add button effects
    button.on('pointerdown', () => {
        button.setScale(0.9);
        callback();
    });
    button.on('pointerup', () => button.setScale(1));
    button.on('pointerout', () => button.setScale(1));

    return button;
}

private createConfirmButton(x: number, y: number) {
    const isMobile = this.scale.width < 768;
    const button = this.add.container(x, y);

    // Button background with gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2ecc71, 0x27ae60, 0x27ae60, 0x2ecc71, 1);
    bg.fillRoundedRect(
        -75,
        -20,
        150,
        40,
        10
    );

    const text = this.add.text(0, 0, 'CONFIRM', {
        fontSize: isMobile ? "16px" : "20px",
        color: "#ffffff",
        fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add([bg, text]);
    button.setInteractive(
        new Phaser.Geom.Rectangle(-75, -20, 150, 40),
        Phaser.Geom.Rectangle.Contains
    );

    // Add button effects
    button.on('pointerdown', () => {
        button.setScale(0.95);
        this.confirmSelection();
    });
    button.on('pointerup', () => button.setScale(1));
    button.on('pointerout', () => button.setScale(1));

    return button;
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


  // Show error message on screen
  private showError(message: string) {
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, message, {
      fontSize: "20px",
      color: "#ff3333",
      backgroundColor: "#fff",
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
    }).setOrigin(0.5);
  }

  // Update shutdown to clean up
  shutdown() {
    if (this.leftArrow) this.leftArrow.destroy();
    if (this.rightArrow) this.rightArrow.destroy();
    if (this.confirmButton) this.confirmButton.destroy();
    if (this.gradientOverlay) this.gradientOverlay.destroy();
  }
}
