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

// Optimized Wrong Answer Dialog Data Interface
export interface OptimizedWrongAnswerDialogData {
  npcName: string;
  npcAvatar: string;
  wrongAnswerMessage: string;
  correctAnswer: string;
  explanation?: string;
  commonMistakes?: string;
  quickTips?: string;
  onClose?: () => void;
}

// Singleton instance
let optimizedWrongAnswerSingletonInstance: OptimizedWrongAnswerDialog | null = null;

export class OptimizedWrongAnswerDialog {
  private scene: Phaser.Scene;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogWidth: number;
  private dialogHeight: number;
  private isMobile: boolean;
  private currentData: OptimizedWrongAnswerDialogData | null = null;

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

  private updatePosition(): void {
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
  }

  public showWrongAnswerDialog(data: OptimizedWrongAnswerDialogData): void {
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
    
    // Wrong answer message section
    this.createWrongAnswerMessageSection();
    
    // Educational content sections
    this.createEducationalSections();
    
    // Close button
    this.createCloseButton();
  }

  private createEnhancedBackground(): void {
    const background = this.scene.add.graphics();
    
    // Enhanced gradient background with red tint for wrong answers
    background.fillGradientStyle(
      UIHelpers.hexToNumber('#2c0a0a'), // Dark red background
      UIHelpers.hexToNumber('#2c0a0a'),
      UIHelpers.hexToNumber('#1a0606'), // Even darker red
      UIHelpers.hexToNumber('#1a0606'),
      0.98
    );
    
    background.fillRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 12);
    
    // Enhanced border with red accent
    background.lineStyle(3, UIHelpers.hexToNumber('#ff4444'), 0.8);
    background.strokeRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 12);
    
    // Inner glow
    background.lineStyle(1, UIHelpers.hexToNumber('#ffaaaa'), 0.3);
    background.strokeRoundedRect(2, 2, this.dialogWidth - 4, this.dialogHeight - 4, 10);
    
    this.dialogContainer.add(background);
  }

  private createOptimizedHeader(): void {
    const headerHeight = this.isMobile ? 60 : 70;
    
    // Header background
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UIHelpers.hexToNumber('#ff4444'), 0.2);
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
        color: '#ff6666',
        fontStyle: 'bold'
      }
    );
    this.dialogContainer.add(npcText);
    
    // Status indicator
    const statusText = this.scene.add.text(
      this.isMobile ? 65 : 85,
      this.isMobile ? 35 : 42,
      "❌ Incorrect Answer",
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: '#ff4444',
        fontStyle: 'italic'
      }
    );
    this.dialogContainer.add(statusText);
  }

  private createWrongAnswerMessageSection(): void {
    const messageY = this.isMobile ? 75 : 85;
    const messageHeight = this.isMobile ? 60 : 70;
    
    // Message background
    const messageBg = this.scene.add.graphics();
    messageBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.04);
    messageBg.fillRoundedRect(12, messageY, this.dialogWidth - 24, messageHeight, 6);
    this.dialogContainer.add(messageBg);
    
    // Wrong answer message text
    const messageText = this.scene.add.text(
      24,
      messageY + 12,
      this.currentData!.wrongAnswerMessage,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '15px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        wordWrap: { 
          width: this.dialogWidth - 60
        },
        lineSpacing: 4,
        fontStyle: 'bold'
      }
    );
    this.dialogContainer.add(messageText);
    
    // Correct answer display
    const correctAnswerText = this.scene.add.text(
      24,
      messageY + messageHeight - 20,
      `✅ Correct Answer: ${this.currentData!.correctAnswer}`,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '13px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: '#4CAF50',
        fontStyle: 'bold'
      }
    );
    this.dialogContainer.add(correctAnswerText);
  }

  private createEducationalSections(): void {
    const startY = this.isMobile ? 150 : 170;
    let currentY = startY;
    
    // Create "Common Mistakes" section if content exists
    if (this.currentData!.commonMistakes) {
      currentY = this.createEducationalSection(
        "⚠️ Common Mistakes",
        this.currentData!.commonMistakes,
        currentY,
        '#ff9800'
      );
    }
    
    // Create "Quick Tips" section if content exists
    if (this.currentData!.quickTips) {
      currentY = this.createEducationalSection(
        "💡 Quick Tips",
        this.currentData!.quickTips,
        currentY,
        '#2196F3'
      );
    }
    
    // Create explanation section if content exists
    if (this.currentData!.explanation) {
      currentY = this.createEducationalSection(
        "📚 Explanation",
        this.currentData!.explanation,
        currentY,
        '#9C27B0'
      );
    }
  }

  private createEducationalSection(title: string, content: string, startY: number, color: string): number {
    const sectionWidth = this.dialogWidth - 24;
    const contentWidth = this.dialogWidth - 60;
    
    // Calculate content height using our utility
    const fontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '12px');
    const contentHeight = TextHeightCalculator.calculateTextHeight(this.scene, {
      text: content,
      width: contentWidth,
      fontSize: fontSize,
      fontFamily: modernUITheme.typography.fontFamily.primary,
      lineSpacing: 3
    });
    
    // Section container
    const sectionContainer = this.scene.add.container(0, startY);
    
    // Section background
    const sectionBg = this.scene.add.graphics();
    sectionBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.04);
    sectionBg.fillRoundedRect(12, 0, sectionWidth, contentHeight + 40, 6);
    sectionBg.lineStyle(1, UIHelpers.hexToNumber(color), 0.4);
    sectionBg.strokeRoundedRect(12, 0, sectionWidth, contentHeight + 40, 6);
    
    // Section title
    const titleText = this.scene.add.text(
      24,
      8,
      title,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '13px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: color,
        fontStyle: 'bold'
      }
    );
    
    // Section content
    const contentText = this.scene.add.text(
      24,
      28,
      content,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        wordWrap: { 
          width: contentWidth
        },
        lineSpacing: 3,
        align: 'left'
      }
    );
    
    sectionContainer.add([sectionBg, titleText, contentText]);
    this.dialogContainer.add(sectionContainer);
    
    // Return the Y position for the next section
    return startY + contentHeight + 50;
  }

  private createCloseButton(): void {
    // Close button at the bottom center
    const closeButtonY = this.dialogHeight - 40;
    
    const closeButton = this.scene.add.container(this.dialogWidth / 2, closeButtonY);
    
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 0.7);
    closeBg.fillRoundedRect(-40, -15, 80, 30, 8);
    closeBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.5);
    closeBg.strokeRoundedRect(-40, -15, 80, 30, 8);
    
    const closeText = this.scene.add.text(0, 0, 'Close', {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    closeButton.add([closeBg, closeText]);
    closeButton.setSize(80, 30);
    closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleClose())
      .on('pointerover', () => {
        closeBg.clear();
        closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 1);
        closeBg.fillRoundedRect(-40, -15, 80, 30, 8);
        closeBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.8);
        closeBg.strokeRoundedRect(-40, -15, 80, 30, 8);
      })
      .on('pointerout', () => {
        closeBg.clear();
        closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 0.7);
        closeBg.fillRoundedRect(-40, -15, 80, 30, 8);
        closeBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.5);
        closeBg.strokeRoundedRect(-40, -15, 80, 30, 8);
      });
    
    this.dialogContainer.add(closeButton);
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
    
    if (optimizedWrongAnswerSingletonInstance === this) {
      optimizedWrongAnswerSingletonInstance = null;
    }
    
    this.dialogContainer.destroy();
  }
}

// Factory function for optimized wrong answer dialog
export function showOptimizedWrongAnswerDialog(scene: Phaser.Scene, data: OptimizedWrongAnswerDialogData): OptimizedWrongAnswerDialog | null {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showOptimizedWrongAnswerDialog');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!optimizedWrongAnswerSingletonInstance) {
      optimizedWrongAnswerSingletonInstance = new OptimizedWrongAnswerDialog(scene);
    }
    
    // Show the optimized wrong answer dialog
    optimizedWrongAnswerSingletonInstance.showWrongAnswerDialog(data);
    return optimizedWrongAnswerSingletonInstance;

  } catch (error) {
    console.error('Error showing optimized wrong answer dialog:', error);
    return null;
  }
}