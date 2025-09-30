import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';
import { BaseDialog } from './BaseDialog';

// Singleton instance
let singletonInstance: SimpleDialogBox | null = null;

export class SimpleDialogBox extends BaseDialog {
  private dialogText!: Phaser.GameObjects.Text;
  private optionsContainer!: Phaser.GameObjects.Container;
  private avatar!: Phaser.GameObjects.Image;
  private currentDialogIndex: number = 0;
  private dialogData: {
    text: string;
    avatar?: string;
    isExitDialog?: boolean;
    options?: { text: string; callback: () => void }[];
  }[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, { 
      width: scene.scale.width < 768 ? scene.scale.width * 0.95 : 750,
      height: scene.scale.width < 768 ? 200 : 200
    });
    
    this.initializeDialogContent();
  }

  private initializeDialogContent(): void {
    // Create dialog background
    this.createStandardBackground();

    // Avatar positioning
    this.avatar = this.scene.add.image(
      UIHelpers.getResponsiveSpacing(this.isMobile, 50, 40),
      this.dialogHeight / 2,
      "npc_mintgirl_avatar"
    )
      .setDisplaySize(80, 98)
      .setOrigin(0.5)
      .setVisible(false);
    this.dialogContainer.add(this.avatar);

    // Text configuration
    const textConfig = {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: modernUITheme.colors.text.primary,
      wordWrap: { 
        width: this.isMobile ? this.dialogWidth - 120 : this.dialogWidth - 140,
        useAdvancedWrap: true 
      },
      align: "left",
      lineSpacing: UIHelpers.getResponsiveSpacing(this.isMobile, 6, 4)
    };

    this.dialogText = this.scene.add.text(
      UIHelpers.getResponsiveSpacing(this.isMobile, 100, 90),
      UIHelpers.getResponsiveSpacing(this.isMobile, 30, 25),
      "",
      textConfig
    );
    this.dialogContainer.add(this.dialogText);

    this.optionsContainer = this.scene.add.container(0, 0);
    this.dialogContainer.add(this.optionsContainer);

    this.dialogContainer.setVisible(false).setAlpha(0);
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
      let yOffset = this.isMobile ? 80 : 90;
      
      currentDialog.options.forEach((option) => {
        // Truncate very long option text
        const maxOptionLength = this.isMobile ? 50 : 70;
        const displayText = option.text.length > maxOptionLength ? 
          option.text.substring(0, maxOptionLength) + "..." : 
          option.text;
          
        const optionText = this.scene.add.text(
          this.isMobile ? 100 : 120,
          this.dialogText.y + yOffset,
          `➡️ ${displayText}`,
          {
            fontSize: this.isMobile ? "12px" : "13px",
            color: modernUITheme.colors.accent,
            fontFamily: modernUITheme.typography.fontFamily.primary,
            wordWrap: {
              width: this.isMobile ? this.dialogWidth - 120 : this.dialogWidth - 140,
              useAdvancedWrap: true
            }
          }
        ).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            option.callback();
            this.currentDialogIndex++;
            this.displayNext();
          })
          .on('pointerover', () => {
            optionText.setColor(modernUITheme.colors.primary);
          })
          .on('pointerout', () => {
            optionText.setColor(modernUITheme.colors.accent);
          });

        this.optionsContainer.add(optionText);
        yOffset += this.isMobile ? 25 : 30;
      });
    } else {
      // Continue text for dialogs without options
      const continueText = this.scene.add.text(
        this.dialogWidth - 30,
        this.dialogHeight - 25,
        "Click to continue...",
        {
          fontSize: this.isMobile ? "11px" : "12px",
          color: modernUITheme.colors.text.secondary,
          fontFamily: modernUITheme.typography.fontFamily.primary,
          fontStyle: "italic"
        }
      ).setOrigin(1, 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.currentDialogIndex++;
          this.displayNext();
        });

      this.optionsContainer.add(continueText);
    }
  }

  private setAvatar(avatarKey: string) {
    if (this.scene.textures.exists(avatarKey)) {
      this.avatar.setTexture(avatarKey);
      this.avatar.setVisible(true);
    } else {
      this.avatar.setVisible(false);
    }
  }

  private closeDialog() {
    this.dialogContainer.setVisible(false);
    if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
      window.quizAntiSpamManager.closeDialog();
    }
  }

  public cleanup() {
    super.cleanup();
    singletonInstance = null;
  }

  // Singleton accessor
  public static getInstance(scene: Phaser.Scene): SimpleDialogBox {
    if (!singletonInstance) {
      singletonInstance = new SimpleDialogBox(scene);
    }
    return singletonInstance;
  }
}

// Export function for backward compatibility
export function showDialog(scene: Phaser.Scene, dialogData: {
  text: string;
  avatar?: string;
  isExitDialog?: boolean;
  options?: { text: string; callback: () => void }[];
}[]): void {
  const dialog = SimpleDialogBox.getInstance(scene);
  dialog.showDialog(dialogData);
}