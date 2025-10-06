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

// Guide Conversation Dialog Data Interface
export interface GuideConversationDialogData {
  npcName: string;
  npcAvatar: string;
  title: string;
  content: string;
  navigationOptions: Array<{ text: string; icon?: string }>;
  onOptionSelected: (selectedOption: string, optionIndex: number) => void;
  onClose?: () => void;
}

// Singleton instance
let guideConversationSingletonInstance: GuideConversationDialog | null = null;

export class GuideConversationDialog {
  private scene: Phaser.Scene;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogWidth: number;
  private dialogHeight: number;
  private isMobile: boolean;
  private currentData: GuideConversationDialogData | null = null;
  private optionButtons: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = scene.scale.width < 768;
    
    // Optimized sizing for web view - ensure it fits screen properly
    this.dialogWidth = this.isMobile ? Math.min(scene.scale.width * 0.95, 750) : 800;
    this.dialogHeight = this.isMobile ? Math.min(scene.scale.height * 0.8, 450) : 500;
    
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

  public showConversationDialog(data: GuideConversationDialogData): void {
    this.currentData = data;
    this.createConversationDialog();
    
    // Show with fade-in animation
    this.dialogContainer.setVisible(true);
    this.dialogContainer.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.dialogContainer,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
    
    this.updatePosition();
  }

  private createConversationDialog(): void {
    if (!this.currentData) return;
    
    this.dialogContainer.removeAll(true);
    this.optionButtons = [];
    
    // Create background first
    this.createBackground();
    
    // Create header section
    this.createHeader();
    
    // Create content area
    this.createContentArea();
    
    // Create navigation options section
    this.createNavigationOptions();
    
    // Create close button last (so it's on top)
    this.createCloseButton();
  }

  private createBackground(): void {
    const background = this.scene.add.graphics();
    
    // Gradient background with conversation-friendly colors
    background.fillGradientStyle(
      UIHelpers.hexToNumber('#2c3e50'),
      UIHelpers.hexToNumber('#2c3e50'),
      UIHelpers.hexToNumber('#1a2530'),
      UIHelpers.hexToNumber('#1a2530'),
      0.95
    );
    
    background.fillRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 15);
    
    // Border with accent color
    background.lineStyle(2, UIHelpers.hexToNumber('#3498db'), 0.7);
    background.strokeRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 15);
    
    // Inner glow
    background.lineStyle(1, UIHelpers.hexToNumber('#3498db'), 0.3);
    background.strokeRoundedRect(2, 2, this.dialogWidth - 4, this.dialogHeight - 4, 13);
    
    this.dialogContainer.add(background);
  }

  private createHeader(): void {
    const headerHeight = this.isMobile ? 70 : 80;
    
    // Header background with clear boundaries
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UIHelpers.hexToNumber('#34495e'), 0.4);
    headerBg.fillRoundedRect(10, 10, this.dialogWidth - 20, headerHeight - 10, 10);
    // Add a subtle bottom border to separate from content
    headerBg.lineStyle(1, UIHelpers.hexToNumber('#3498db'), 0.3);
    headerBg.strokeRoundedRect(10, 10, this.dialogWidth - 20, headerHeight - 10, 10);
    this.dialogContainer.add(headerBg);
    
    // NPC Avatar
    if (this.scene.textures.exists(this.currentData!.npcAvatar)) {
      const avatar = this.scene.add.image(
        this.isMobile ? 45 : 55,
        headerHeight / 2 + 10,
        this.currentData!.npcAvatar
      )
      .setDisplaySize(this.isMobile ? 55 : 70, this.isMobile ? 65 : 85)
      .setOrigin(0.5);
      this.dialogContainer.add(avatar);
    }
    
    // NPC Name
    const npcText = this.scene.add.text(
      this.isMobile ? 80 : 100,
      this.isMobile ? 25 : 30,
      this.currentData!.npcName,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '18px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: '#3498db',
        fontStyle: 'bold'
      }
    );
    this.dialogContainer.add(npcText);
    
    // Title/Topic
    const titleText = this.scene.add.text(
      this.isMobile ? 80 : 100,
      this.isMobile ? 45 : 55,
      this.currentData!.title,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: '#ecf0f1',
        fontStyle: 'italic'
      }
    );
    this.dialogContainer.add(titleText);
  }

  private createContentArea(): void {
    const headerHeight = this.isMobile ? 70 : 80;
    
    // Define the layout sections - split dialog into upper (header+content) and lower (navigation) halves
    const upperSectionHeight = Math.floor(this.dialogHeight * 0.55); // 55% for header+content (slightly less to give more to navigation)
    
    // Content area positioning within upper section
    const contentY = headerHeight + 15;
    const contentHeight = upperSectionHeight - headerHeight - 30; // Leave margin at bottom
    
    // Ensure minimum content height
    const finalContentHeight = Math.max(contentHeight, 100);
    
    // Content background with clear boundaries
    const contentBg = this.scene.add.graphics();
    contentBg.fillStyle(UIHelpers.hexToNumber('#34495e'), 0.2);
    contentBg.fillRoundedRect(15, contentY, this.dialogWidth - 30, finalContentHeight, 8);
    // Add border to clearly define content area
    contentBg.lineStyle(1, UIHelpers.hexToNumber('#3498db'), 0.3);
    contentBg.strokeRoundedRect(15, contentY, this.dialogWidth - 30, finalContentHeight, 8);
    this.dialogContainer.add(contentBg);
    
    // Content text with proper word wrapping and boundaries
    const contentText = this.scene.add.text(
      25,
      contentY + 15,
      this.currentData!.content,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: '#ecf0f1',
        wordWrap: { 
          width: this.dialogWidth - 80 // Ensure proper wrapping with margins
        },
        lineSpacing: 6,
        align: 'left'
      }
    );
    
    this.dialogContainer.add(contentText);
  }

  private createNavigationOptions(): void {
    // Define the layout sections - split dialog into upper (header+content) and lower (navigation) halves
    const upperSectionHeight = Math.floor(this.dialogHeight * 0.55); // 55% for header+content
    const lowerSectionY = upperSectionHeight + 5; // Start of lower section
    const lowerSectionHeight = this.dialogHeight - upperSectionHeight - 5; // Give more space to navigation
    
    // Create a background container for navigation options to enforce boundaries
    const navSectionBg = this.scene.add.graphics();
    navSectionBg.fillStyle(UIHelpers.hexToNumber('#2c3e50'), 0.3);
    navSectionBg.fillRoundedRect(10, lowerSectionY, this.dialogWidth - 20, lowerSectionHeight, 8);
    // Add border to clearly define navigation section
    navSectionBg.lineStyle(1, UIHelpers.hexToNumber('#3498db'), 0.2);
    navSectionBg.strokeRoundedRect(10, lowerSectionY, this.dialogWidth - 20, lowerSectionHeight, 8);
    this.dialogContainer.add(navSectionBg);
    
    // Navigation options positioning within lower section
    const optionHeight = this.isMobile ? 42 : 45; // Slightly smaller to fit more
    const optionSpacing = this.isMobile ? 12 : 15; // Slightly smaller spacing
    const optionsStartY = lowerSectionY + 15; // Start 15px from top of lower section
    
    // Calculate how many buttons can fit in the available space
    const availableHeight = lowerSectionHeight - 30; // Account for top and bottom margins
    const maxButtons = Math.floor((availableHeight + optionSpacing) / (optionHeight + optionSpacing));
    
    this.currentData!.navigationOptions.forEach((option, index) => {
      // Limit the number of buttons to what can fit, but show as many as possible
      if (index < maxButtons) {
        // Always use single column layout for better control
        const y = optionsStartY + (index * (optionHeight + optionSpacing));
        const x = 20;
        const width = this.dialogWidth - 40;
        
        this.createNavigationButton(option, index, x, y, width, optionHeight);
      }
    });
    
    // If there are more options than can fit, we might want to add a scrollbar or pagination
    // For now, let's at least log this situation for debugging
    if (this.currentData!.navigationOptions.length > maxButtons) {
      console.warn(`Only ${maxButtons} of ${this.currentData!.navigationOptions.length} navigation options can be displayed`);
    }
  }

  private createNavigationButton(option: { text: string; icon?: string }, index: number, x: number, y: number, width: number, height: number): void {
    const buttonContainer = this.scene.add.container(x, y);
    
    // Button background with clear boundaries
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(UIHelpers.hexToNumber('#2980b9'), 0.7);
    buttonBg.fillRoundedRect(0, 0, width, height, 8);
    buttonBg.lineStyle(1, UIHelpers.hexToNumber('#3498db'), 0.8);
    buttonBg.strokeRoundedRect(0, 0, width, height, 8);
    
    // Icon if provided
    let textX = 15;
    let iconWidth = 0;
    if (option.icon) {
      const iconFontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '16px');
      const icon = this.scene.add.text(15, height / 2, option.icon, {
        fontSize: iconFontSize,
        fontFamily: modernUITheme.typography.fontFamily.primary
      }).setOrigin(0.5, 0.5);
      buttonContainer.add(icon);
      iconWidth = 30;
      textX = iconWidth + 10;
    }
    
    // Adjust font size based on text length to prevent overflow
    let fontSize = '13px';
    if (this.isMobile) {
      fontSize = option.text.length > 25 ? '11px' : '12px';
    } else {
      fontSize = option.text.length > 30 ? '12px' : '13px';
    }
    
    // Button text with proper wrapping and boundaries
    const buttonText = this.scene.add.text(
      textX,
      height / 2,
      option.text,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, fontSize),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: '#ffffff',
        fontStyle: 'bold',
        wordWrap: { 
          width: width - textX - 15 // Ensure text stays within button boundaries
        }
      }
    ).setOrigin(0, 0.5);
    
    buttonContainer.add([buttonBg, buttonText]);
    
    // Make interactive
    buttonContainer.setSize(width, height);
    buttonContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleOptionSelected(option.text, index))
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber('#3498db'), 0.9);
        buttonBg.fillRoundedRect(0, 0, width, height, 8);
        buttonBg.lineStyle(1, UIHelpers.hexToNumber('#ffffff'), 1);
        buttonBg.strokeRoundedRect(0, 0, width, height, 8);
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber('#2980b9'), 0.7);
        buttonBg.fillRoundedRect(0, 0, width, height, 8);
        buttonBg.lineStyle(1, UIHelpers.hexToNumber('#3498db'), 0.8);
        buttonBg.strokeRoundedRect(0, 0, width, height, 8);
      });
    
    this.dialogContainer.add(buttonContainer);
    this.optionButtons.push(buttonContainer);
  }

  private createCloseButton(): void {
    // Close button in top-right corner with proper boundaries
    const buttonX = this.dialogWidth - 35;
    const buttonY = 25;
    
    // Ensure close button stays within dialog boundaries
    if (buttonX < 0 || buttonY < 0) {
      console.warn('Close button exceeds dialog boundaries');
      return;
    }
    
    const closeButton = this.scene.add.container(buttonX, buttonY);
    
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(UIHelpers.hexToNumber('#e74c3c'), 0.8);
    closeBg.fillCircle(0, 0, 15);
    closeBg.lineStyle(1, UIHelpers.hexToNumber('#ffffff'), 0.7);
    closeBg.strokeCircle(0, 0, 15);
    
    const closeText = this.scene.add.text(0, 0, '✕', {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    closeButton.add([closeBg, closeText]);
    closeButton.setSize(30, 30);
    closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleClose())
      .on('pointerover', () => {
        closeBg.clear();
        closeBg.fillStyle(UIHelpers.hexToNumber('#c0392b'), 1);
        closeBg.fillCircle(0, 0, 15);
        closeBg.lineStyle(1, UIHelpers.hexToNumber('#ffffff'), 1);
        closeBg.strokeCircle(0, 0, 15);
      })
      .on('pointerout', () => {
        closeBg.clear();
        closeBg.fillStyle(UIHelpers.hexToNumber('#e74c3c'), 0.8);
        closeBg.fillCircle(0, 0, 15);
        closeBg.lineStyle(1, UIHelpers.hexToNumber('#ffffff'), 0.7);
        closeBg.strokeCircle(0, 0, 15);
      });
    
    this.dialogContainer.add(closeButton);
  }

  private handleOptionSelected(optionText: string, index: number): void {
    if (this.currentData?.onOptionSelected) {
      // Close dialog immediately 
      this.dialogContainer.setVisible(false);
      
      // Call the option handler
      this.currentData.onOptionSelected(optionText, index);
      
      // Clean up current data to allow re-interaction
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
      duration: 200,
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
    
    if (guideConversationSingletonInstance === this) {
      guideConversationSingletonInstance = null;
    }
    
    this.dialogContainer.destroy();
  }
}

// Factory function for guide conversation dialog
export function showGuideConversationDialog(scene: Phaser.Scene, data: GuideConversationDialogData): GuideConversationDialog | null {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showGuideConversationDialog');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!guideConversationSingletonInstance) {
      guideConversationSingletonInstance = new GuideConversationDialog(scene);
    }
    
    // Show the guide conversation dialog
    guideConversationSingletonInstance.showConversationDialog(data);
    return guideConversationSingletonInstance;

  } catch (error) {
    console.error('Error showing guide conversation dialog:', error);
    return null;
  }
}