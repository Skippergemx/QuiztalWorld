import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';

// Content height calculation utility for text measurement
interface TextMeasurementConfig {
  text: string;
  width: number;
  fontSize: string;
  fontFamily: string;
  lineSpacing: number;
}

class TextHeightCalculator {
  private static tempText: Phaser.GameObjects.Text | null = null;
  
  /**
   * Calculate the height required for given text configuration
   */
  static calculateTextHeight(scene: Phaser.Scene, config: TextMeasurementConfig): number {
    // Create temporary text object for measurement
    if (!this.tempText) {
      this.tempText = scene.add.text(0, 0, '', {
        fontSize: config.fontSize,
        fontFamily: config.fontFamily,
        wordWrap: { 
          width: config.width
        },
        lineSpacing: config.lineSpacing
      });
      this.tempText.setVisible(false);
    }
    
    // Update temp text with new configuration
    this.tempText.setStyle({
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      wordWrap: { 
        width: config.width
      },
      lineSpacing: config.lineSpacing
    });
    
    // Set text and measure
    this.tempText.setText(config.text);
    const height = this.tempText.height;
    
    // Clean up
    this.tempText.setText('');
    
    return height;
  }
  
  /**
   * Clean up the temporary text object
   */
  static cleanup(): void {
    if (this.tempText) {
      this.tempText.destroy();
      this.tempText = null;
    }
  }
}

// Optimized Guide Dialog Data Interface
export interface OptimizedGuideDialogData {
  npcName: string;
  npcAvatar: string;
  title: string;
  content: string;
  options: string[];
  onOptionSelected: (selectedOption: string, optionIndex: number) => void;
  onClose?: () => void;
}

// Singleton instance
let optimizedGuideSingletonInstance: OptimizedGuideDialog | null = null;

export class OptimizedGuideDialog {
  private scene: Phaser.Scene;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogWidth: number;
  private dialogHeight: number;
  private isMobile: boolean;
  private currentData: OptimizedGuideDialogData | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = scene.scale.width < 768;
    
    // Optimized sizing for web view - reduced height to avoid UI Scene blocking
    this.dialogWidth = this.isMobile ? scene.scale.width * 0.95 : 750;
    this.dialogHeight = this.isMobile ? 420 : 480; // Reduced from 500/600 to fit between UIScene panels
    
    this.initializeDialog();
    this.setupEventListeners();
  }

  private initializeDialog(): void {
    this.dialogContainer = this.scene.add.container(0, 0);
    this.dialogContainer.setDepth(2000);
    this.dialogContainer.setVisible(false);
    this.updatePosition();
  }

  private setupEventListeners(): void {
    this.scene.events.once('create', () => {
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.on('cameramove', this.updatePosition, this);
        this.scene.cameras.main.on('scroll', this.updatePosition, this);
      }
    });

    this.scene.events.on('shutdown', () => {
      this.cleanup();
    });
  }

  private updatePosition = (): void => {
    if (!this.scene?.cameras?.main || !this.dialogContainer) {
      return;
    }

    const camera = this.scene.cameras.main;
    const centerX = (camera.scrollX + camera.width / 2) || 0;
    const centerY = (camera.scrollY + camera.height / 2) || 0;

    this.dialogContainer.setPosition(
      centerX - this.dialogWidth / 2,
      centerY - this.dialogHeight / 2
    );
  };

  public showGuideDialog(data: OptimizedGuideDialogData): void {
    this.currentData = data;
    this.createOptimizedDialog();
    
    // Show with fade-in animation (quick like original)
    this.dialogContainer.setVisible(true);
    this.dialogContainer.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.dialogContainer,
      alpha: 1,
      duration: 200, // Fast like original
      ease: 'Power2'
    });
    
    this.updatePosition();
  }

  private createOptimizedDialog(): void {
    if (!this.currentData) return;
    
    this.dialogContainer.removeAll(true);
    
    // Enhanced background
    this.createEnhancedBackground();
    
    // Header with NPC info
    this.createOptimizedHeader();
    
    // Content section
    this.createContentSection();
    
    // Options with enhanced styling
    this.createEnhancedOptions();
    
    // Optional close button
    this.createCloseButton();
  }

  private createEnhancedBackground(): void {
    const background = this.scene.add.graphics();
    
    // Enhanced gradient background
    background.fillGradientStyle(
      UIHelpers.hexToNumber(modernUITheme.colors.background.card),
      UIHelpers.hexToNumber(modernUITheme.colors.background.card),
      UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
      UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
      0.98
    );
    
    background.fillRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 12);
    
    // Enhanced border
    background.lineStyle(3, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
    background.strokeRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 12);
    
    // Inner glow
    background.lineStyle(1, UIHelpers.hexToNumber('#ffffff'), 0.3);
    background.strokeRoundedRect(2, 2, this.dialogWidth - 4, this.dialogHeight - 4, 10);
    
    this.dialogContainer.add(background);
  }

  private createOptimizedHeader(): void {
    const headerHeight = this.isMobile ? 60 : 70;
    
    // Header background
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.08);
    headerBg.fillRoundedRect(8, 8, this.dialogWidth - 16, headerHeight - 8, 6);
    this.dialogContainer.add(headerBg);
    
    // NPC Avatar
    if (this.scene.textures.exists(this.currentData!.npcAvatar)) {
      const avatar = this.scene.add.image(
        this.isMobile ? 35 : 45,
        headerHeight / 2 + 8,
        this.currentData!.npcAvatar
      )
      .setDisplaySize(this.isMobile ? 50 : 65, this.isMobile ? 61 : 80)
      .setOrigin(0.5);
      this.dialogContainer.add(avatar);
    }
    
    // NPC Name
    const npcText = this.scene.add.text(
      this.isMobile ? 65 : 85,
      this.isMobile ? 18 : 22,
      this.currentData!.npcName,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.accent,
        fontStyle: 'bold'
      }
    );
    this.dialogContainer.add(npcText);
    
    // Title
    const titleText = this.scene.add.text(
      this.isMobile ? 65 : 85,
      this.isMobile ? 35 : 42,
      this.currentData!.title,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        fontStyle: 'italic'
      }
    );
    this.dialogContainer.add(titleText);
  }

  private createContentSection(): void {
    const contentY = this.isMobile ? 75 : 85;
    const contentHeight = this.isMobile ? 150 : 180;
    
    // Content background
    const contentBg = this.scene.add.graphics();
    contentBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.04);
    contentBg.fillRoundedRect(12, contentY, this.dialogWidth - 24, contentHeight, 6);
    this.dialogContainer.add(contentBg);
    
    // Content text
    const contentText = this.scene.add.text(
      24,
      contentY + 12,
      this.currentData!.content,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '15px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        wordWrap: { 
          width: this.dialogWidth - 60
        },
        lineSpacing: 4
      }
    );
    this.dialogContainer.add(contentText);
  }

  private createEnhancedOptions(): void {
    const optionsY = this.isMobile ? 240 : 280;
    const optionHeight = this.isMobile ? 32 : 38;
    const optionSpacing = this.isMobile ? 38 : 44;
    
    this.currentData!.options.forEach((option, index) => {
      const y = optionsY + (index * optionSpacing);
      this.createEnhancedOptionButton(option, index, y, optionHeight);
    });
  }

  private createEnhancedOptionButton(option: string, index: number, y: number, height: number): void {
    const buttonContainer = this.scene.add.container(0, y);
    const buttonWidth = this.dialogWidth - 32;
    
    // Enhanced button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.card), 0.6);
    buttonBg.fillRoundedRect(16, 0, buttonWidth, height, 6);
    buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.5);
    buttonBg.strokeRoundedRect(16, 0, buttonWidth, height, 6);
    
    // Option letter circle (A, B, C)
    const optionLetter = String.fromCharCode(65 + index);
    const letterCircle = this.scene.add.graphics();
    letterCircle.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
    letterCircle.fillCircle(32, height / 2, 10);
    
    const letterText = this.scene.add.text(32, height / 2, optionLetter, {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Option text
    const optionText = this.scene.add.text(
      48,
      height / 2,
      option,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '13px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        wordWrap: { 
          width: buttonWidth - 50
        }
      }
    ).setOrigin(0, 0.5);
    
    buttonContainer.add([buttonBg, letterCircle, letterText, optionText]);
    
    // Make interactive with enhanced hover effects
    buttonContainer.setSize(buttonWidth, height);
    buttonContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleOptionSelected(option, index))
      .on('pointerover', () => {
        // Enhanced hover effect
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.15);
        buttonBg.fillRoundedRect(16, 0, buttonWidth, height, 6);
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
        buttonBg.strokeRoundedRect(16, 0, buttonWidth, height, 6);
        
        letterCircle.clear();
        letterCircle.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 1.0);
        letterCircle.fillCircle(32, height / 2, 10);
      })
      .on('pointerout', () => {
        // Reset to normal state
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.card), 0.6);
        buttonBg.fillRoundedRect(16, 0, buttonWidth, height, 6);
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.5);
        buttonBg.strokeRoundedRect(16, 0, buttonWidth, height, 6);
        
        letterCircle.clear();
        letterCircle.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
        letterCircle.fillCircle(32, height / 2, 10);
      });
    
    this.dialogContainer.add(buttonContainer);
  }

  private createCloseButton(): void {
    // Small close button in top-right corner (position adjusted for taller dialog)
    const closeButton = this.scene.add.container(this.dialogWidth - 30, 20);
    
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 0.7);
    closeBg.fillCircle(0, 0, 12);
    closeBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.5);
    closeBg.strokeCircle(0, 0, 12);
    
    const closeText = this.scene.add.text(0, 0, '✕', {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '10px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: modernUITheme.colors.text.primary
    }).setOrigin(0.5);
    
    closeButton.add([closeBg, closeText]);
    closeButton.setSize(24, 24);
    closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleClose())
      .on('pointerover', () => closeButton.setAlpha(0.8))
      .on('pointerout', () => closeButton.setAlpha(1));
    
    this.dialogContainer.add(closeButton);
  }

  private handleOptionSelected(option: string, index: number): void {
    if (this.currentData?.onOptionSelected) {
      // Close dialog immediately 
      this.dialogContainer.setVisible(false);
      
      // Call the option handler
      this.currentData.onOptionSelected(option, index);
      
      // Clean up current data
      this.currentData = null;
    }
  }

  private handleClose(): void {
    if (this.currentData?.onClose) {
      this.currentData.onClose();
    }
    this.close();
  }

  public close(): void {
    this.scene.tweens.add({
      targets: this.dialogContainer,
      alpha: 0,
      duration: 150, // Fast close like original
      onComplete: () => {
        this.dialogContainer.setVisible(false);
        this.currentData = null;
      }
    });
  }

  private cleanup(): void {
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.off('cameramove', this.updatePosition, this);
      this.scene.cameras.main.off('scroll', this.updatePosition, this);
    }
    
    // Clean up text height calculator
    TextHeightCalculator.cleanup();
    
    if (optimizedGuideSingletonInstance === this) {
      optimizedGuideSingletonInstance = null;
    }
    
    this.dialogContainer.destroy();
  }
}

// Factory function for optimized guide dialog
export function showOptimizedGuideDialog(scene: Phaser.Scene, data: OptimizedGuideDialogData): OptimizedGuideDialog | null {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showOptimizedGuideDialog');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!optimizedGuideSingletonInstance) {
      optimizedGuideSingletonInstance = new OptimizedGuideDialog(scene);
    }
    
    // Show the optimized guide dialog
    optimizedGuideSingletonInstance.showGuideDialog(data);
    return optimizedGuideSingletonInstance;

  } catch (error) {
    console.error('Error showing optimized guide dialog:', error);
    return null;
  }
}