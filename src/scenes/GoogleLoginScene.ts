import Phaser from "phaser";
import { auth, db } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default class GoogleLoginScene extends Phaser.Scene {
  private gradientOverlay!: Phaser.GameObjects.Graphics;
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GoogleLoginScene" });
  }

  create() {
    // Create gradient background
    this.gradientOverlay = this.add.graphics();
    this.drawGradient(0x001a33, 0x330066);

    // Add title
    this.add.text(
      this.scale.width / 2,
      40,
      "Crystle World",
      {
        fontSize: "32px",
        color: "#ffffff",
      }
    ).setOrigin(0.5);

    this.checkLogin();
  }

  private async checkLogin() {
    const playerData = localStorage.getItem("quiztal-player");
    if (playerData) {
      // If already logged in, go to wallet verification
      this.scene.start('WalletVerificationScene');
    } else {
      this.showLoginButton();
    }
  }

  private showLoginButton() {
    const button = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "Sign in with Google",
      {
        fontSize: "24px",
        backgroundColor: "#ffffff",
        color: "#000",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      }
    )
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
          email: user.email,
          displayName: user.displayName || "Unknown Adventurer",
        };
        localStorage.setItem("quiztal-player", JSON.stringify(playerObj));

        this.updateLoadingProgress(1);

        // Clean up
        button.destroy();
        this.loadingBar.destroy();
        this.loadingText.destroy();

        // Move to wallet verification
        this.scene.start('WalletVerificationScene');
      } catch (error) {
        console.error("Login failed:", error);
        this.showError("Login failed. Please try again.");
      }
    });
  }

  // Helper methods
  private showLoadingBar() {
    this.loadingBar = this.add.graphics();
    this.loadingText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 20,  // Position text above loading bar
      "Loading...",
      {
        fontSize: "20px",
        color: "#ffffff",
      }
    ).setOrigin(0.5);
  }

  private updateLoadingProgress(percent: number) {
    const barWidth = 200;
    const barHeight = 30;
    const x = (this.scale.width - barWidth) / 2;
    const y = this.scale.height / 2 + 50;

    this.loadingBar.clear();
    // Background of the bar
    this.loadingBar.fillStyle(0xffffff, 0.2);
    this.loadingBar.fillRect(x, y, barWidth, barHeight);
    // Filled portion of the bar
    this.loadingBar.fillStyle(0x00ff00, 1);
    this.loadingBar.fillRect(x, y, barWidth * percent, barHeight);
  }

  private showError(message: string) {
    const errorText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 100,
      message,
      {
        fontSize: "20px",
        color: "#ff3333",
        backgroundColor: "#ffffff",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      }
    ).setOrigin(0.5);

    // Auto-hide error after 3 seconds
    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }

  private drawGradient(color1: number, color2: number) {
    this.gradientOverlay.clear();
    this.gradientOverlay.fillGradientStyle(color1, color1, color2, color2, 1);
    this.gradientOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  shutdown() {
    if (this.gradientOverlay) this.gradientOverlay.destroy();
    if (this.loadingBar) this.loadingBar.destroy();
    if (this.loadingText) this.loadingText.destroy();
  }
}