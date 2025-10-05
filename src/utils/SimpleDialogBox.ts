import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';
import { BaseDialog } from './BaseDialog';

// Singleton instance
let singletonInstance: SimpleDialogBox | null = null;

// Add this interface
interface DialogData {
  text: string;
  avatar?: string;
  isExitDialog?: boolean;
  options?: { text: string; callback: () => void }[];
  onClose?: () => void; // Add onClose callback
  continueText?: string; // Add custom continue text
}

export class SimpleDialogBox extends BaseDialog {
  private dialogText!: Phaser.GameObjects.Text;
  private optionsContainer!: Phaser.GameObjects.Container;
  private avatar!: Phaser.GameObjects.Image;
  private currentDialogIndex: number = 0;
  private dialogData: DialogData[] = []; // Use the new interface
  private onCloseCallback: (() => void) | null = null; // Store onClose callback
  private continueTextElement: Phaser.GameObjects.Text | null = null; // Store continue text reference

  constructor(scene: Phaser.Scene) {
    super(scene, { 
      width: scene.scale.width < 768 ? scene.scale.width * 0.95 : 750,
      height: scene.scale.width < 768 ? 480 : 480  // Increased minimum height for mobile
    });
    
    this.initializeDialogContent();
  }

  private initializeDialogContent(): void {
    // Create dialog background
    this.createStandardBackground();

    // Avatar positioning - centered at top of dialog with upward nudge
    const avatarX = this.dialogWidth / 2;
    const avatarY = 50; // Moved upward from 60 to 50 for more space
    this.avatar = this.scene.add.image(
      avatarX,
      avatarY,
      "npc_mintgirl_avatar" // This will be overridden when setAvatar is called
    )
      .setDisplaySize(100, 120) // Larger size for prominence
      .setOrigin(0.5, 0) // Top center align the avatar
      .setVisible(false);
    this.dialogContainer.add(this.avatar);

    // Text configuration
    const textConfig = {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: modernUITheme.colors.text.primary,
      wordWrap: { 
        width: this.isMobile ? this.dialogWidth - 30 : this.dialogWidth - 60, // More space for mobile
        useAdvancedWrap: true 
      },
      align: "center", // Center align for better presentation
      lineSpacing: UIHelpers.getResponsiveSpacing(this.isMobile, 6, 6) // Reduce line spacing on mobile
    };

    this.dialogText = this.scene.add.text(
      this.dialogWidth / 2, // Center the text
      190, // Moved downward from 180 to 190 to accommodate the upward avatar shift
      "",
      textConfig
    ).setOrigin(0.5, 0); // Top center align the text
    this.dialogContainer.add(this.dialogText);

    this.optionsContainer = this.scene.add.container(0, 0);
    this.dialogContainer.add(this.optionsContainer);

    this.dialogContainer.setVisible(false).setAlpha(0);
  }

  public showDialog(dialogData: DialogData[]) { // Use the new interface
    if (!Array.isArray(dialogData) || dialogData.length === 0) {
      console.error("Invalid dialog data provided");
      return;
    }

    this.dialogData = dialogData;
    this.currentDialogIndex = 0;

    // Store onClose callback from first dialog if it exists
    this.onCloseCallback = dialogData[0].onClose || null;

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

  private displayNext() {
    if (this.currentDialogIndex >= this.dialogData.length) {
      // Call onClose callback for the last dialog if it exists before closing
      if (this.onCloseCallback) {
        this.onCloseCallback();
        this.onCloseCallback = null; // Reset callback so it's not called again
      }
      this.closeDialog();
      return;
    }

    const currentDialog = this.dialogData[this.currentDialogIndex];
    this.dialogText.setText(currentDialog.text);
    this.optionsContainer.removeAll(true);

    // Remove existing continue text if it exists
    if (this.continueTextElement) {
      this.continueTextElement.destroy();
      this.continueTextElement = null;
    }

    // Store onClose callback for current dialog
    this.onCloseCallback = currentDialog.onClose || null;

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
              width: this.isMobile ? this.dialogWidth - 120 : this.dialogWidth - 140
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
      // Continue text for dialogs without options - position at bottom
      this.continueTextElement = this.scene.add.text(
        this.dialogWidth / 2, // Center the continue text
        0, // Will be positioned after text height calculation
        currentDialog.continueText || "Click to continue...", // Use custom continue text if provided
        {
          fontSize: this.isMobile ? "11px" : "12px",
          color: modernUITheme.colors.text.secondary,
          fontFamily: modernUITheme.typography.fontFamily.primary,
          fontStyle: "italic"
        }
      ).setOrigin(0.5, 1); // Bottom center align
      
      // Position the continue button after text rendering
      this.scene.events.once('postupdate', () => {
        this.positionContinueButton();
      });
      
      this.continueTextElement.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.currentDialogIndex++;
          this.displayNext();
        });

      this.optionsContainer.add(this.continueTextElement);
    }
    
    // Adjust dialog height based on content for mobile
    if (this.isMobile) {
      this.scene.events.once('postupdate', () => {
        this.adjustDialogHeightForMobile();
      });
    }
  }
  
  private positionContinueButton() {
    if (!this.continueTextElement) return;
    
    // Get the bounds of the text to determine its height
    const textBounds = this.dialogText.getBounds();
    
    // Position the continue button below the text with some padding
    const buttonY = Math.max(
      this.minHeight - 30, // Minimum position based on minimum height
      190 + textBounds.height + 30 // Position below text with padding
    );
    
    this.continueTextElement.setY(buttonY);
  }
  
  private adjustDialogHeightForMobile() {
    if (!this.continueTextElement) return;
    
    // Get the bounds of all content to determine the required height
    const continueButtonBounds = this.continueTextElement.getBounds();
    
    // Calculate required height with more padding for mobile
    const requiredHeight = Math.max(
      this.minHeight, // Ensure minimum height
      continueButtonBounds.y + continueButtonBounds.height + 40 // Increased padding for continue button
    );
    
    // Update dialog height if needed
    if (requiredHeight > this.dialogHeight) {
      this.dialogHeight = requiredHeight;
      // Recreate background with new height
      this.createStandardBackground();
      // Re-add all children to the new background
      this.dialogContainer.add(this.avatar);
      this.dialogContainer.add(this.dialogText);
      this.dialogContainer.add(this.optionsContainer);
    }
    
    // Update position after height change to ensure it's within screen bounds
    this.updatePosition();
  }

  private setAvatar(avatarKey: string) {
    if (this.scene.textures.exists(avatarKey)) {
      this.avatar.setTexture(avatarKey);
      this.avatar.setVisible(true);
    } else {
      // Fallback to default avatar if specific one doesn't exist
      if (this.scene.textures.exists("npc_mintgirl_avatar")) {
        this.avatar.setTexture("npc_mintgirl_avatar");
        this.avatar.setVisible(true);
      } else {
        this.avatar.setVisible(false);
      }
    }
  }

  private closeDialog() {
    // Call onClose callback if it exists
    if (this.onCloseCallback) {
      this.onCloseCallback();
      this.onCloseCallback = null; // Reset callback so it's not called again
    }
    
    this.dialogContainer.setVisible(false);
    if (typeof window !== 'undefined' && window.quizAntiSpamManager) {
      window.quizAntiSpamManager.closeDialog();
    }
  }

  public close() {
    this.closeDialog();
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

  protected updatePosition = (): void => {
    if (!this.scene?.cameras?.main || !this.dialogContainer) {
      return;
    }

    const camera = this.scene.cameras.main;
    const centerX = (camera.scrollX + camera.width / 2) || 0;
    let centerY = (camera.scrollY + camera.height / 2) || 0;

    // For mobile devices, ensure the dialog doesn't go above the screen
    if (this.isMobile) {
      const minY = camera.scrollY + 20; // Minimum Y position with some padding
      const maxY = camera.scrollY + camera.height - this.dialogHeight - 20; // Maximum Y position with padding
      
      // Ensure dialog is within visible bounds
      centerY = Math.max(minY, Math.min(centerY, maxY));
    }

    this.dialogContainer.setPosition(
      centerX - this.dialogWidth / 2,
      centerY - this.dialogHeight / 2
    );
  };
}

// Update the showDialog function to use the new interface
export function showDialog(scene: Phaser.Scene, dialogData: DialogData[]): void { // Use the new interface
  const dialog = SimpleDialogBox.getInstance(scene);
  dialog.showDialog(dialogData);
}