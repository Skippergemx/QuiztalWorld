import Phaser from "phaser";

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
    
    // Make dialog box responsive with minimum dimensions
    const isMobile = scene.scale.width < 768;
    this.boxWidth = isMobile ? scene.scale.width * 0.9 : 650;
    this.boxHeight = isMobile ? 200 : 180; // Increased minimum height

    this.dialogContainer = scene.add.container(0, 0);

    scene.events.once('create', () => {
      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.on('cameramove', this.updatePosition, this);
        scene.cameras.main.on('scroll', this.updatePosition, this);
        scene.cameras.main.on('followupdate', this.updatePosition, this);
      }
    });

    this.updatePosition();
    this.dialogContainer.setDepth(1000);

    scene.events.on('shutdown', () => {
      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.off('cameramove', this.updatePosition);
        scene.cameras.main.off('scroll', this.updatePosition);
        scene.cameras.main.off('followupdate', this.updatePosition);
      }
    });

    // Update dialog background
    const dialogBg = scene.add.graphics();
    dialogBg.fillStyle(0x002b36, 0.95);
    dialogBg.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, isMobile ? 10 : 20);
    dialogBg.lineStyle(isMobile ? 2 : 4, 0x00ff00, 1);
    dialogBg.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, isMobile ? 10 : 20);
    this.dialogContainer.add(dialogBg);

    // Adjust avatar size for mobile
    const avatarSize = isMobile ? 70 : 90;
    this.avatar = scene.add.image(
      isMobile ? 50 : 70,
      this.boxHeight / 2,
      "npc_mintgirl_avatar"
    )
      .setDisplaySize(avatarSize, avatarSize)
      .setOrigin(0.5)
      .setVisible(false);
    this.dialogContainer.add(this.avatar);

    // Adjust text size and position for mobile with improved word wrapping
    const textConfig = {
      fontSize: isMobile ? "15px" : "17px",
      fontFamily: "monospace",
      color: "#00ff00",
      wordWrap: { 
        width: isMobile ? 
          this.boxWidth - 120 : // More space for text
          500, // Increased wrap width for desktop
        useAdvancedWrap: true 
      },
      align: "left",
      lineSpacing: isMobile ? 5 : 7, // Better line spacing
      shadow: { offsetX: 2, offsetY: 2, color: "#003300", blur: 5, fill: true }
    };

    this.dialogText = scene.add.text(
      isMobile ? 100 : 140,
      isMobile ? 15 : 20,
      "",
      textConfig
    );
    this.dialogContainer.add(this.dialogText);

    this.optionsContainer = scene.add.container(0, 0);
    this.dialogContainer.add(this.optionsContainer);

    this.dialogContainer.setVisible(false);
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

  /**
   * Calculate required dialog height based on text content and options
   */
  private calculateRequiredHeight(text: string, optionsCount: number = 0): number {
    const isMobile = this.scene.scale.width < 768;
    const minHeight = isMobile ? 200 : 180;
    
    // Estimate text height based on character count and word wrap width
    const wrapWidth = isMobile ? this.boxWidth - 100 : 440;
    const avgCharsPerLine = Math.floor(wrapWidth / (isMobile ? 9 : 10)); // Rough estimate
    const estimatedLines = Math.ceil(text.length / avgCharsPerLine);
    const textHeight = estimatedLines * (isMobile ? 20 : 24); // Line height estimate
    
    // Add space for options
    const optionsHeight = optionsCount * (isMobile ? 30 : 35);
    
    // Add padding for avatar, margins, and spacing
    const paddingHeight = isMobile ? 60 : 80;
    
    const requiredHeight = textHeight + optionsHeight + paddingHeight;
    
    return Math.max(minHeight, requiredHeight);
  }

  /**
   * Resize dialog box to fit content
   */
  private resizeDialogBox(newHeight: number): void {
    if (newHeight === this.boxHeight) return;
    
    this.boxHeight = newHeight;
    
    // Remove existing background
    const existingBg = this.dialogContainer.getAt(0);
    if (existingBg) {
      existingBg.destroy();
    }
    
    // Create new background with updated height
    const isMobile = this.scene.scale.width < 768;
    const dialogBg = this.scene.add.graphics();
    dialogBg.fillStyle(0x002b36, 0.95);
    dialogBg.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, isMobile ? 10 : 20);
    dialogBg.lineStyle(isMobile ? 2 : 4, 0x00ff00, 1);
    dialogBg.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, isMobile ? 10 : 20);
    
    // Insert background at the beginning of the container
    this.dialogContainer.addAt(dialogBg, 0);
    
    // Update avatar position to center vertically
    if (this.avatar) {
      this.avatar.setY(this.boxHeight / 2);
    }
    
    // Update position to center the resized dialog
    this.updatePosition();
  }

  /**
   * Validate and potentially truncate text that's too long for display
   */
  private validateTextLength(text: string): string {
    const isMobile = this.scene.scale.width < 768;
    const maxLength = isMobile ? 300 : 400; // Character limits
    
    if (text.length > maxLength) {
      console.warn(`Dialog text truncated: original length ${text.length}, max allowed ${maxLength}`);
      return text.substring(0, maxLength - 3) + "...";
    }
    
    return text;
  }

  private setAvatar(textureKey: string) {
    if (this.scene.textures.exists(textureKey)) {
      this.avatar.setTexture(textureKey).setVisible(true);
      console.log(`Avatar set to: ${textureKey}`);
    } else {
      this.avatar.setVisible(false);
      console.log(`No texture found for avatar: ${textureKey}`);
    }
  }

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

    console.log("Dialog triggered", dialogData);

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

  // Update displayNext method for better mobile interaction
  private displayNext() {
    if (this.currentDialogIndex >= this.dialogData.length) {
      this.closeDialog();
      return;
    }

    const currentDialog = this.dialogData[this.currentDialogIndex];
    
    // Validate and potentially truncate text length
    const validatedText = this.validateTextLength(currentDialog.text);
    
    // Calculate required height based on content
    const optionsCount = currentDialog.options ? currentDialog.options.length : 0;
    const requiredHeight = this.calculateRequiredHeight(validatedText, optionsCount);
    
    // Resize dialog if needed
    this.resizeDialogBox(requiredHeight);
    
    this.dialogText.setText(validatedText);
    this.optionsContainer.removeAll(true);

    if (currentDialog.avatar) {
      this.setAvatar(currentDialog.avatar);
    } else {
      this.avatar.setVisible(false);
    }

    // If options are present
    if (currentDialog.options) {
      const isMobile = this.scene.scale.width < 768;
      let yOffset = isMobile ? 60 : 70; // More space from main text
      
      currentDialog.options.forEach((option) => {
        // Truncate very long option text
        const maxOptionLength = isMobile ? 60 : 80;
        const displayText = option.text.length > maxOptionLength ? 
          option.text.substring(0, maxOptionLength) + "..." : 
          option.text;
          
        const optionText = this.scene.add.text(
          isMobile ? 120 : 160, // More space from left edge
          this.dialogText.y + yOffset,
          `➡️ ${displayText}`,
          {
            fontSize: isMobile ? "13px" : "15px", // Slightly smaller for options
            color: "#00ff00",
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

        // Add tap highlight for mobile
        if (isMobile) {
          optionText.on("pointerdown", () => optionText.setAlpha(0.5));
          optionText.on("pointerup", () => optionText.setAlpha(1));
        }

        this.optionsContainer.add(optionText);
        yOffset += isMobile ? 35 : 40; // Better spacing between options
      });
    } else {
      // Add tap animation for mobile
      const isMobile = this.scene.scale.width < 768;
      if (isMobile) {
        const tapHint = this.scene.add.text(
          this.boxWidth - 120,
          this.boxHeight - 35,
          "Tap to continue",
          {
            fontSize: "12px",
            color: "#00ff00"
          }
        ).setAlpha(0.7);  // Set alpha on the text object instead of in TextStyle

        this.dialogContainer.add(tapHint);
      }

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

  private closeDialog() {
    console.log("Closing dialog");

    this.dialogContainer.setVisible(false);
    this.dialogContainer.setAlpha(1);
    this.avatar.setVisible(false);

    console.log("Dialog box instantly closed.");
    
    // Notify QuizAntiSpamManager that a dialog is closed
    if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
      window.quizAntiSpamManager.closeDialog();
    }
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

    const dialog = new SimpleDialogBox(scene);
    dialog.showDialog(dialogData);
    return dialog;

  } catch (error) {
    console.error('Error showing dialog:', error);
    return null;
  }
}
