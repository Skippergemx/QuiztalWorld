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

// Optimized Reward Dialog Data Interface
export interface OptimizedRewardDialogData {
  npcName: string;
  npcAvatar: string;
  rewardMessage: string;
  didYouKnow?: string;
  tipsAndTricks?: string;
  rewardAmount: number;
  onClose?: () => void;
}

// Singleton instance
let optimizedRewardSingletonInstance: OptimizedRewardDialog | null = null;

export class OptimizedRewardDialog {
  private scene: Phaser.Scene;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogWidth: number;
  private dialogHeight: number;
  private isMobile: boolean;
  private currentData: OptimizedRewardDialogData | null = null;
  
  // @ts-ignore
  // Scroll state for the content sections
  private scrollState: {
    currentScrollY: number;
    maxScrollY: number;
    contentHeight: number;
    isScrollable: boolean;
    scrollContainer?: Phaser.GameObjects.Container;
    scrollMask?: Phaser.GameObjects.Graphics;
    topIndicator?: Phaser.GameObjects.Graphics;
    bottomIndicator?: Phaser.GameObjects.Graphics;
    interactionArea?: Phaser.GameObjects.Rectangle;
  } = {
    currentScrollY: 0,
    maxScrollY: 0,
    contentHeight: 0,
    isScrollable: false
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = scene.scale.width < 768;
    
    // Optimized sizing for web view - increased height to better accommodate educational content
    this.dialogWidth = this.isMobile ? scene.scale.width * 0.95 : 750;
    this.dialogHeight = this.isMobile ? 500 : 550; // Increased from 420/480 to 500/550
    
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

    const xPos = centerX - this.dialogWidth / 2;
    const yPos = centerY - this.dialogHeight / 2;
    
    this.dialogContainer.setPosition(xPos, yPos);
  }

  public showRewardDialog(data: OptimizedRewardDialogData): void {
    this.currentData = data;
    this.createOptimizedDialog();
    
    // Show with fade-in animation (quick like original)
    this.dialogContainer.setVisible(true);
    this.dialogContainer.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.dialogContainer,
      alpha: 1,
      duration: 200, // Fast like original
      ease: 'Power2',
      onComplete: () => {
        // Fade-in completed
      }
    });
    
    this.updatePosition();
  }

  private createOptimizedDialog(): void {
    if (!this.currentData) return;
    
    this.dialogContainer.removeAll(true);
    
    // Enhanced background
    this.createEnhancedBackground();
    
    // Header with NPC info and reward
    this.createOptimizedHeader();
    
    // Reward message section
    this.createRewardMessageSection();
    
    // Educational content sections
    this.createEducationalSections();
    
    // Close button
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
    
    // Reward amount (right side) - only show if there's a reward amount
    if (this.currentData!.rewardAmount > 0) {
      const rewardText = this.scene.add.text(
        this.dialogWidth - 20,
        this.isMobile ? 25 : 30,
        `💰 ${this.currentData!.rewardAmount.toFixed(2)} $Quiztals`,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.accent,
          fontStyle: 'bold'
        }
      ).setOrigin(1, 0);
      this.dialogContainer.add(rewardText);
    } else {
      // For lectures, show a learning message instead
      const learningText = this.scene.add.text(
        this.dialogWidth - 20,
        this.isMobile ? 25 : 30,
        "🎓 Knowledge Session",
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.accent,
          fontStyle: 'bold'
        }
      ).setOrigin(1, 0);
      this.dialogContainer.add(learningText);
    }
  }

  private createRewardMessageSection(): void {
    const messageY = this.isMobile ? 75 : 85;
    
    // Dynamically calculate height based on content
    const contentWidth = this.dialogWidth - 60;
    const fontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '15px');
    
    // Calculate required height for the message content
    const contentHeight = TextHeightCalculator.calculateTextHeight(this.scene, {
      text: this.currentData!.rewardMessage,
      width: contentWidth,
      fontSize: fontSize,
      fontFamily: modernUITheme.typography.fontFamily.primary,
      lineSpacing: 2  // Single line spacing
    });
    
    // Ensure minimum height
    const messageHeight = Math.max(this.isMobile ? 80 : 100, contentHeight + 24);
    
    // Message background
    const messageBg = this.scene.add.graphics();
    messageBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.04);
    messageBg.fillRoundedRect(12, messageY, this.dialogWidth - 24, messageHeight, 6);
    this.dialogContainer.add(messageBg);
    
    // Reward message text
    const messageText = this.scene.add.text(
      24,
      messageY + 12,
      this.currentData!.rewardMessage,
      {
        fontSize: fontSize,
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        wordWrap: { 
          width: contentWidth
        },
        lineSpacing: 2,  // Single line spacing
        fontStyle: 'bold'
      }
    );
    this.dialogContainer.add(messageText);
  }

  private createEducationalSections(): void {
    // Calculate the starting Y position after the main content section
    // Get the height of the main content section to position educational sections correctly
    const messageY = this.isMobile ? 75 : 85;
    const contentWidth = this.dialogWidth - 60;
    const fontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '15px');
    
    // Calculate required height for the message content
    const contentHeight = TextHeightCalculator.calculateTextHeight(this.scene, {
      text: this.currentData!.rewardMessage,
      width: contentWidth,
      fontSize: fontSize,
      fontFamily: modernUITheme.typography.fontFamily.primary,
      lineSpacing: 6
    });
    
    // Ensure minimum height
    const messageHeight = Math.max(this.isMobile ? 80 : 100, contentHeight + 24);
    
    // Calculate startY based on the actual height of the main content section
    const startY = messageY + messageHeight + 20; // 20px spacing between sections
    
    // Safety check: ensure we have enough space for educational sections
    const closeButtonY = this.dialogHeight - 40;
    const availableHeight = closeButtonY - startY;
    
    if (availableHeight < 100) {
      // Not enough space, log a warning and adjust positioning
      console.warn("Not enough space for educational sections, available height:", availableHeight);
      // In this case, we might want to consider making the dialog scrollable or reducing content
    }
    
    let currentY = startY;
    
    // Create "Did You Know?" section if content exists
    if (this.currentData!.didYouKnow) {
      // Check if we have enough space for this section
      const dykContentHeight = TextHeightCalculator.calculateTextHeight(this.scene, {
        text: this.formatEducationalContent(this.currentData!.didYouKnow),
        width: contentWidth,
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        lineSpacing: 4
      });
      
      // Ensure we have enough space for this section including padding and margin
      const dykSectionHeight = dykContentHeight + 60;
      if (currentY + dykSectionHeight < closeButtonY - 20) { // Extra 20px buffer
        currentY = this.createEducationalSection(
          "🧠 DID YOU KNOW?",
          this.currentData!.didYouKnow,
          currentY,
          modernUITheme.colors.primary
        );
      } else {
        console.warn("Not enough space for 'Did You Know?' section");
      }
    }
    
    // Create "Tips & Tricks" section if content exists
    if (this.currentData!.tipsAndTricks) {
      // Check if we have enough space for this section
      const tipsContentHeight = TextHeightCalculator.calculateTextHeight(this.scene, {
        text: this.formatEducationalContent(this.currentData!.tipsAndTricks),
        width: contentWidth,
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        lineSpacing: 4
      });
      
      // Ensure we have enough space for this section including padding and margin
      const tipsSectionHeight = tipsContentHeight + 60;
      if (currentY + tipsSectionHeight < closeButtonY - 20) { // Extra 20px buffer
        currentY = this.createEducationalSection(
          "💡 TIPS & TRICKS",
          this.currentData!.tipsAndTricks,
          currentY,
          modernUITheme.colors.accent
        );
      } else {
        console.warn("Not enough space for 'Tips & Tricks' section");
      }
    }
  }

  private createEducationalSection(title: string, content: string, startY: number, color: string): number {
    const sectionWidth = this.dialogWidth - 24;
    const contentWidth = this.dialogWidth - 60;
    
    // Format content for better readability
    const formattedContent = this.formatEducationalContent(content);
    
    // Calculate content height using our utility
    const fontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '12px');
    const contentHeight = TextHeightCalculator.calculateTextHeight(this.scene, {
      text: formattedContent,
      width: contentWidth,
      fontSize: fontSize,
      fontFamily: modernUITheme.typography.fontFamily.primary,
      lineSpacing: 1 // Single line spacing
    });
    
    // Calculate section height with proper padding
    const sectionHeight = Math.max(60, contentHeight + 40); // Minimum 60px height
    
    // Safety check: ensure the section doesn't overlap with the close button
    const closeButtonY = this.dialogHeight - 40;
    const sectionBottom = startY + sectionHeight + 20; // Include spacing for next section
    
    if (sectionBottom >= closeButtonY) {
      // Adjust the section height to fit within the available space
      console.warn("Educational section is too tall, it may overlap with close button");
    }
    
    // Section container
    const sectionContainer = this.scene.add.container(0, startY);
    
    // Section background
    const sectionBg = this.scene.add.graphics();
    sectionBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.04);
    sectionBg.fillRoundedRect(12, 0, sectionWidth, sectionHeight, 6);
    sectionBg.lineStyle(1, UIHelpers.hexToNumber(color), 0.4);
    sectionBg.strokeRoundedRect(12, 0, sectionWidth, sectionHeight, 6);
    
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
      formattedContent,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        wordWrap: { 
          width: contentWidth
        },
        lineSpacing: 1, // Single line spacing
        align: 'left'
      }
    );
    
    sectionContainer.add([sectionBg, titleText, contentText]);
    this.dialogContainer.add(sectionContainer);
    
    // Return the Y position for the next section
    return startY + sectionHeight + 20; // 20px spacing between sections
  }
  
  private formatEducationalContent(content: string): string {
    // Split content into sentences for better readability
    const sentences = content.split('. ').filter(s => s.trim().length > 0);
    
    // Add periods back and create better formatted content with single line spacing
    return sentences.map(s => 
      s.trim() + (s.endsWith('.') ? '' : '.')
    ).join(' ').trim();
  }

  private createCloseButton(): void {
    // Close button at the bottom center with enhanced styling
    const closeButtonY = this.dialogHeight - 40;
    
    const closeButton = this.scene.add.container(this.dialogWidth / 2, closeButtonY);
    
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
    closeBg.fillRoundedRect(-50, -18, 100, 36, 8);
    closeBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.6);
    closeBg.strokeRoundedRect(-50, -18, 100, 36, 8);
    
    const closeText = this.scene.add.text(0, 0, 'Continue', {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    closeButton.add([closeBg, closeText]);
    closeButton.setSize(100, 36);
    closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleClose())
      .on('pointerover', () => {
        closeBg.clear();
        closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 1);
        closeBg.fillRoundedRect(-50, -18, 100, 36, 8);
        closeBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.9);
        closeBg.strokeRoundedRect(-50, -18, 100, 36, 8);
      })
      .on('pointerout', () => {
        closeBg.clear();
        closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
        closeBg.fillRoundedRect(-50, -18, 100, 36, 8);
        closeBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.6);
        closeBg.strokeRoundedRect(-50, -18, 100, 36, 8);
      });
    
    this.dialogContainer.add(closeButton);
  }

  private handleClose(): void {
    if (this.currentData?.onClose) {
      this.currentData.onClose();
    }
    // Use immediate close for transitions to prevent conflicts with new dialog showing
    this.closeImmediate();
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

  public closeImmediate(): void {
    // Stop any running tweens on the dialogContainer
    this.scene.tweens.killTweensOf(this.dialogContainer);
    
    // Immediately hide the dialog
    this.dialogContainer.setVisible(false);
    this.dialogContainer.setAlpha(0);
    this.currentData = null;
  }

  private cleanup(): void {
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.off('cameramove', this.updatePosition, this);
      this.scene.cameras.main.off('scroll', this.updatePosition, this);
    }
    
    // Clean up text height calculator
    TextHeightCalculator.cleanup();
    
    // Clean up scroll state
    this.scrollState = {
      currentScrollY: 0,
      maxScrollY: 0,
      contentHeight: 0,
      isScrollable: false
    };
    
    if (optimizedRewardSingletonInstance === this) {
      optimizedRewardSingletonInstance = null;
    }
    
    this.dialogContainer.destroy();
  }
}

// Factory function for optimized reward dialog
export function showOptimizedRewardDialog(scene: Phaser.Scene, data: OptimizedRewardDialogData): OptimizedRewardDialog | null {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showOptimizedRewardDialog');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!optimizedRewardSingletonInstance) {
      optimizedRewardSingletonInstance = new OptimizedRewardDialog(scene);
    }
    
    // Show the optimized reward dialog
    optimizedRewardSingletonInstance.showRewardDialog(data);
    return optimizedRewardSingletonInstance;

  } catch (error) {
    console.error('Error showing optimized reward dialog:', error);
    return null;
  }
}

// Function to close the current reward dialog immediately
export function closeOptimizedRewardDialog(): void {
  if (optimizedRewardSingletonInstance) {
    optimizedRewardSingletonInstance.closeImmediate();
  }
}