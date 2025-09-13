import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';

// Singleton instance
let singletonInstance: SimpleDialogBox | null = null;

export class SimpleDialogBox {
  private scene: Phaser.Scene;
  private dialogContainer: Phaser.GameObjects.Container;
  private dialogText: Phaser.GameObjects.Text;
  private optionsContainer: Phaser.GameObjects.Container;
  private avatar: Phaser.GameObjects.Image;
  private boxWidth: number;
  private boxHeight: number;
  private currentDialogIndex: number = 0;
  private dialogData: {
    text: string;
    avatar?: string;
    isExitDialog?: boolean;
    options?: { text: string; callback: () => void }[];
  }[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Enhanced responsive dialog sizing following memory specifications
    const isMobile = scene.scale.width < 768;
    this.boxWidth = isMobile ? scene.scale.width * 0.92 : 700; // Slightly larger for better content
    this.boxHeight = isMobile ? 220 : 200; // Improved minimum height per memory specs

    this.dialogContainer = scene.add.container(0, 0);

    // Camera movement tracking
    scene.events.once('create', () => {
      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.on('cameramove', this.updatePosition, this);
        scene.cameras.main.on('scroll', this.updatePosition, this);
      }
    });

    this.updatePosition();
    this.dialogContainer.setDepth(1000);

    scene.events.on('shutdown', () => {
      this.cleanup();
    });

    // Create dialog background
    const dialogBg = scene.add.graphics();
    dialogBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.card), 0.95);
    dialogBg.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, 
      UIHelpers.getResponsiveSpacing(isMobile, modernUITheme.borderRadius.lg, modernUITheme.borderRadius.md));
    dialogBg.lineStyle(
      UIHelpers.getResponsiveSpacing(isMobile, 3, 2), 
      UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
    dialogBg.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight,
      UIHelpers.getResponsiveSpacing(isMobile, modernUITheme.borderRadius.lg, modernUITheme.borderRadius.md));
    
    this.dialogContainer.add(dialogBg);

    // Avatar
    const avatarSize = UIHelpers.getResponsiveSpacing(isMobile, 80, 60);
    this.avatar = scene.add.image(
      UIHelpers.getResponsiveSpacing(isMobile, 60, 45),
      this.boxHeight / 2,
      "npc_mintgirl_avatar"
    )
      .setDisplaySize(avatarSize, avatarSize)
      .setOrigin(0.5)
      .setVisible(false);
    this.dialogContainer.add(this.avatar);

    // Text configuration
    const textConfig = {
      fontSize: UIHelpers.getResponsiveFontSize(isMobile, modernUITheme.typography.fontSize.md),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: modernUITheme.colors.accent,
      wordWrap: { 
        width: isMobile ? this.boxWidth - 140 : 520,
        useAdvancedWrap: true 
      },
      align: "left",
      lineSpacing: UIHelpers.getResponsiveSpacing(isMobile, 8, 6),
      shadow: { 
        offsetX: 2, 
        offsetY: 2, 
        color: modernUITheme.colors.background.primary, 
        blur: 6, 
        fill: true 
      }
    };

    this.dialogText = scene.add.text(
      UIHelpers.getResponsiveSpacing(isMobile, 120, 100),
      UIHelpers.getResponsiveSpacing(isMobile, 20, 16),
      "",
      textConfig
    );
    this.dialogContainer.add(this.dialogText);

    this.optionsContainer = scene.add.container(0, 0);
    this.dialogContainer.add(this.optionsContainer);

    this.dialogContainer.setVisible(false).setAlpha(0);
  }

  private updatePosition = () => {
    if (!this.scene?.cameras?.main || !this.dialogContainer) {
      return;
    }

    const camera = this.scene.cameras.main;
    const centerX = (camera.scrollX + camera.width / 2) || 0;
    const centerY = (camera.scrollY + camera.height / 2) || 0;

    this.dialogContainer.setPosition(
      centerX - this.boxWidth / 2,
      centerY - this.boxHeight / 2
    );
  };

  public showDialog(dialogData: {
    text: string;
    avatar?: string;
    isExitDialog?: boolean;
    options?: { text: string; callback: () => void }[];
  }[]) {
    if (!Array.isArray(dialogData) || dialogData.length === 0) {
      console.error("Invalid dialog data provided");
      return;
    }

    this.dialogData = dialogData;
    this.currentDialogIndex = 0;

    this.updatePosition();
    this.dialogContainer.setAlpha(1);
    this.dialogContainer.setVisible(true);
    this.dialogContainer.setDepth(1000);

    const firstDialog = dialogData[0];
    if (firstDialog && firstDialog.avatar) {
      this.setAvatar(firstDialog.avatar);
    } else {
      this.avatar.setVisible(false);
    }

    this.displayNext();
    
    // Notify QuizAntiSpamManager that a dialog is open
    if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
      window.quizAntiSpamManager.openDialog();
    }
  }
  
  public updateDialogText(newText: string) {
    this.dialogText.setText(newText);
  }

  private displayNext() {
    if (this.currentDialogIndex >= this.dialogData.length) {
      this.closeDialog();
      return;
    }

    const currentDialog = this.dialogData[this.currentDialogIndex];
    this.dialogText.setText(currentDialog.text);
    this.optionsContainer.removeAll(true);

    if (currentDialog.avatar) {
      this.setAvatar(currentDialog.avatar);
    } else {
      this.avatar.setVisible(false);
    }

    // If options are present
    if (currentDialog.options) {
      const isMobile = this.scene.scale.width < 768;
      let yOffset = isMobile ? 60 : 70;
      
      currentDialog.options.forEach((option) => {
        // Truncate very long option text
        const maxOptionLength = isMobile ? 60 : 80;
        const displayText = option.text.length > maxOptionLength ? 
          option.text.substring(0, maxOptionLength) + "..." : 
          option.text;
          
        const optionText = this.scene.add.text(
          isMobile ? 120 : 160,
          this.dialogText.y + yOffset,
          `➡️ ${displayText}`,
          {
            fontSize: isMobile ? "13px" : "15px",
            color: "#ffa500",
            fontFamily: "monospace",
            wordWrap: {
              width: isMobile ? this.boxWidth - 140 : 460,
              useAdvancedWrap: true
            },
            shadow: { offsetX: 2, offsetY: 2, color: "#003300", blur: 5, fill: true }
          }
        )
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          option.callback();
          this.closeDialog();
        })
        .on("pointerover", () => optionText.setAlpha(0.7))
        .on("pointerout", () => optionText.setAlpha(1));

        this.optionsContainer.add(optionText);
        yOffset += isMobile ? 35 : 40;
      });
    } else {
      this.dialogContainer
        .setInteractive(new Phaser.Geom.Rectangle(0, 0, this.boxWidth, this.boxHeight), 
          Phaser.Geom.Rectangle.Contains)
        .once("pointerdown", () => {
          this.dialogContainer.disableInteractive();
          this.currentDialogIndex++;
          this.displayNext();
        });
    }
  }

  private setAvatar(textureKey: string) {
    if (this.scene.textures.exists(textureKey)) {
      this.avatar.setTexture(textureKey).setVisible(true);
    } else {
      this.avatar.setVisible(false);
    }
  }

  private closeDialog() {
    this.dialogContainer.setVisible(false);
    this.dialogContainer.setAlpha(0);
    this.avatar.setVisible(false);
    this.dialogText.setText("");
    this.optionsContainer.removeAll(true);
    this.dialogData = [];
    this.currentDialogIndex = 0;

    // Notify QuizAntiSpamManager that a dialog is closed
    if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
      window.quizAntiSpamManager.closeDialog();
    }
  }

  private cleanup() {
    // Remove camera listeners
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.off('cameramove', this.updatePosition, this);
      this.scene.cameras.main.off('scroll', this.updatePosition, this);
    }
    
    // Clean up the singleton reference
    if (singletonInstance === this) {
      singletonInstance = null;
    }
    
    // Destroy the container and all its children
    this.dialogContainer.destroy();
  }

  public close() {
    this.closeDialog();
  }
}

export function showDialog(scene: Phaser.Scene, dialogData: {
  text: string;
  avatar?: string;
  isExitDialog?: boolean;
  options?: { text: string; callback: () => void }[];
}[]) {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showDialog');
      return null;
    }

    if (!Array.isArray(dialogData) || dialogData.length === 0) {
      console.error('Invalid or empty dialog data provided');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!singletonInstance) {
      singletonInstance = new SimpleDialogBox(scene);
    }
    
    // Show the dialog
    singletonInstance.showDialog(dialogData);
    return singletonInstance;

  } catch (error) {
    console.error('Error showing dialog:', error);
    return null;
  }
}