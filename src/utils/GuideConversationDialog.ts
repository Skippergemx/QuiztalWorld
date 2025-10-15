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
    
    // Create background
    this.createBackground();
    
    // Create header
    this.createHeader();
    
    // Create content area
    this.createContentArea();
    
    // Create navigation options
    this.createNavigationOptions();
    
    // Create close button
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
    
    // Header background
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UIHelpers.hexToNumber('#34495e'), 0.4);
    headerBg.fillRoundedRect(10, 10, this.dialogWidth - 20, headerHeight - 10, 10);
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
    const contentY = headerHeight + 20;
    
    // Calculate actual navigation options height instead of estimating
    const navigationOptionsHeight = this.calculateNavigationOptionsHeight();
    const closeButtonHeight = 50;
    const contentHeight = this.dialogHeight - headerHeight - navigationOptionsHeight - closeButtonHeight - 30;
    
    // Ensure minimum content height
    const finalContentHeight = Math.max(contentHeight, 100);
    
    // Content background
    const contentBg = this.scene.add.graphics();
    contentBg.fillStyle(UIHelpers.hexToNumber('#34495e'), 0.2);
    contentBg.fillRoundedRect(15, contentY, this.dialogWidth - 30, finalContentHeight, 8);
    contentBg.lineStyle(1, UIHelpers.hexToNumber('#3498db'), 0.3);
    contentBg.strokeRoundedRect(15, contentY, this.dialogWidth - 30, finalContentHeight, 8);
    this.dialogContainer.add(contentBg);
    
    // Content text with proper word wrapping
    const contentText = this.scene.add.text(
      25,
      contentY + 15,
      this.currentData!.content,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: '#ecf0f1',
        wordWrap: { 
          width: this.dialogWidth - 80 // Ensure proper wrapping
        },
        lineSpacing: 6,
        align: 'left'
      }
    );
    
    this.dialogContainer.add(contentText);
  }

  private calculateNavigationOptionsHeight(): number {
    if (!this.currentData || !this.currentData.navigationOptions) {
      return this.isMobile ? 100 : 80;
    }
    
    const optionCount = this.currentData.navigationOptions.length;
    const optionHeight = this.isMobile ? 45 : 50;
    const optionSpacing = this.isMobile ? 15 : 20;
    const maxOptionsPerRow = this.isMobile ? 1 : (optionCount <= 4 ? 2 : 1);
    
    // Calculate rows needed
    const rows = Math.ceil(optionCount / maxOptionsPerRow);
    
    // Calculate total height needed
    const totalHeight = (rows * optionHeight) + ((rows - 1) * optionSpacing) + 30; // +30 for top margin
    
    return Math.max(totalHeight, this.isMobile ? 100 : 80);
  }

  private createNavigationOptions(): void {
    const headerHeight = this.isMobile ? 70 : 80;
    const optionHeight = this.isMobile ? 45 : 50;
    const optionSpacing = this.isMobile ? 15 : 20;
    const maxOptionsPerRow = this.isMobile ? 1 : (this.currentData!.navigationOptions.length <= 4 ? 2 : 1);
    
    // Calculate actual position based on content area height
    const actualContentHeight = this.dialogHeight - headerHeight - this.calculateNavigationOptionsHeight() - 80; // 80 for close button and margins
    const actualOptionsY = headerHeight + actualContentHeight + 30;
    
    this.currentData!.navigationOptions.forEach((option, index) => {
      const row = Math.floor(index / maxOptionsPerRow);
      const col = index % maxOptionsPerRow;
      
      const y = actualOptionsY + (row * (optionHeight + optionSpacing));
      const x = this.isMobile ? 20 : (col === 0 ? 20 : this.dialogWidth / 2 + 10);
      const width = this.isMobile ? this.dialogWidth - 40 : (this.dialogWidth / 2 - 30);
      
      this.createNavigationButton(option, index, x, y, width, optionHeight);
    });
  }

  private createNavigationButton(option: { text: string; icon?: string }, index: number, x: number, y: number, width: number, height: number): void {
    const buttonContainer = this.scene.add.container(x, y);
    
    // Button background
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
    
    // Button text with proper wrapping
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
          width: width - textX - 15
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
    // Close button in top-right corner
    const closeButton = this.scene.add.container(this.dialogWidth - 35, 25);
    
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