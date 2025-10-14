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

// Optimized Enhanced Quiz Dialog Data Interface
export interface OptimizedQuizDialogData {
  npcName: string;
  npcAvatar: string;
  question: string;
  options: string[];
  theme: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  questionNumber?: number;
  totalQuestions?: number;
  explainer?: string; // Educational context/explanation for the question
  onAnswer: (selectedOption: string) => void;
  onClose?: () => void;
}

// Singleton instance
let optimizedSingletonInstance: OptimizedEnhancedQuizDialog | null = null;

export class OptimizedEnhancedQuizDialog {
  private scene: Phaser.Scene;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogWidth: number;
  private dialogHeight: number;
  private isMobile: boolean;
  private currentData: OptimizedQuizDialogData | null = null;
  
  // Scroll state for the explainer section
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
    
    // Optimized sizing for web view - increased height to better accommodate lecture content
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

  public showQuizDialog(data: OptimizedQuizDialogData): void {
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
    
    // Header with NPC info and progress
    this.createOptimizedHeader();
    
    // Question section
    this.createQuestionSection();
    
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
    
    // NPC Name and Theme
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
    
    const themeText = this.scene.add.text(
      this.isMobile ? 65 : 85,
      this.isMobile ? 35 : 42,
      this.currentData!.theme,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        fontStyle: 'italic'
      }
    );
    this.dialogContainer.add(themeText);
    
    // Progress indicator (right side)
    if (this.currentData!.questionNumber && this.currentData!.totalQuestions) {
      const progressText = this.scene.add.text(
        this.dialogWidth - 20,
        this.isMobile ? 25 : 30,
        `${this.currentData!.questionNumber}/${this.currentData!.totalQuestions}`,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary,
          fontStyle: 'bold'
        }
      ).setOrigin(1, 0);
      this.dialogContainer.add(progressText);
    }
    
    // Difficulty badge
    if (this.currentData!.difficulty) {
      this.createDifficultyBadge(this.dialogWidth - 20, this.isMobile ? 45 : 52);
    }
  }

  private createDifficultyBadge(x: number, y: number): void {
    const colors = {
      'Easy': '#4CAF50',
      'Medium': '#FF9800', 
      'Hard': '#F44336'
    };
    
    const difficulty = this.currentData!.difficulty!;
    const color = colors[difficulty];
    
    const badge = this.scene.add.graphics();
    badge.fillStyle(UIHelpers.hexToNumber(color), 0.8);
    badge.fillRoundedRect(x - 30, y - 8, 60, 16, 8);
    
    const badgeText = this.scene.add.text(x, y, difficulty, {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '9px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.dialogContainer.add([badge, badgeText]);
  }

  private createQuestionSection(): void {
    const questionY = this.isMobile ? 75 : 85;
    const questionHeight = this.isMobile ? 60 : 70;
    
    // Question background
    const questionBg = this.scene.add.graphics();
    questionBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.04);
    questionBg.fillRoundedRect(12, questionY, this.dialogWidth - 24, questionHeight, 6);
    this.dialogContainer.add(questionBg);
    
    // Question text
    const questionText = this.scene.add.text(
      24,
      questionY + 12,
      this.currentData!.question,
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
    this.dialogContainer.add(questionText);
  }

  private createEnhancedOptions(): void {
    const optionsY = this.isMobile ? 150 : 170;
    const optionHeight = this.isMobile ? 32 : 38;
    const optionSpacing = this.isMobile ? 38 : 44;
    
    this.currentData!.options.forEach((option, index) => {
      const y = optionsY + (index * optionSpacing);
      this.createEnhancedOptionButton(option, index, y, optionHeight);
    });
    
    // Add explainer section at the bottom, with proper spacing to avoid overlap
    if (this.currentData!.explainer) {
      // Calculate the Y position after the last option button
      const lastOptionY = optionsY + (this.currentData!.options.length * optionSpacing);
      // Add extra spacing to prevent overlap
      const explainerStartY = lastOptionY + (this.isMobile ? 20 : 30);
      
      // Pass the calculated start Y position to the explainer section
      this.createExplainerSection(explainerStartY);
    }
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
      .on('pointerdown', () => this.handleOptionSelected(option))
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

  private createExplainerSection(startY?: number): void {
    if (!this.currentData?.explainer) return;
    
    // Use the provided start Y position or calculate as before
    const optionsEndY = startY !== undefined ? startY : 
      (this.isMobile ? 150 + (this.currentData.options.length * 38) + 10 : 170 + (this.currentData.options.length * 44) + 10);
    
    // Container dimensions - increased to fit in larger dialog
    const containerHeight = this.isMobile ? 120 : 150;
    
    // Safety check: ensure explainer fits within dialog bounds
    const maxAllowedY = this.dialogHeight - containerHeight - 20; // 20px margin
    const finalY = Math.min(optionsEndY, maxAllowedY);
    
    // Explainer container
    const explainerContainer = this.scene.add.container(0, finalY);
    
    // Container dimensions - use calculated height or adjusted height
    const containerWidth = this.dialogWidth - 24;
    const contentWidth = this.dialogWidth - 60;
    
    // Format explainer content for better readability
    const formattedExplainer = this.formatExplainerContent(this.currentData.explainer);
    
    // Calculate content height using our utility
    const fontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '11px');
    const contentHeight = TextHeightCalculator.calculateTextHeight(this.scene, {
      text: formattedExplainer,
      width: contentWidth,
      fontSize: fontSize,
      fontFamily: modernUITheme.typography.fontFamily.primary,
      lineSpacing: 4 // Increased line spacing for better readability
    });
    
    // Check if scrolling is needed - add small buffer to prevent unnecessary scrolling
    const availableHeight = containerHeight - 28; // Account for icon/label space
    const scrollThreshold = 5; // Pixels buffer to prevent micro-scrolling
    const isScrollable = contentHeight > (availableHeight + scrollThreshold);
    
    // Update scroll state
    this.scrollState = {
      currentScrollY: 0,
      maxScrollY: isScrollable ? Math.max(0, contentHeight - availableHeight) : 0,
      contentHeight: contentHeight,
      isScrollable: isScrollable
    };
    
    // Explainer background
    const explainerBg = this.scene.add.graphics();
    explainerBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.06);
    explainerBg.fillRoundedRect(12, 0, containerWidth, containerHeight, 6);
    explainerBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.4);
    explainerBg.strokeRoundedRect(12, 0, containerWidth, containerHeight, 6);
    
    // Explainer icon and label
    const iconText = this.scene.add.text(
      24,
      8,
      '📚 Study Notes:',
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.accent,
        fontStyle: 'bold'
      }
    );
    
    if (isScrollable) {
      // Create scrollable content
      this.createScrollableContent(explainerContainer, contentHeight, availableHeight, containerWidth, formattedExplainer);
    } else {
      // Simple non-scrollable content
      const explainerText = this.scene.add.text(
        24,
        28,
        formattedExplainer,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '11px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary,
          wordWrap: { 
            width: contentWidth
          },
          lineSpacing: 4, // Increased line spacing for better readability
          align: 'left',
          fontStyle: 'bold'
        }
      );
      
      explainerContainer.add(explainerText);
    }
    
    explainerContainer.add([explainerBg, iconText]);
    this.dialogContainer.add(explainerContainer);
  }
  
  private formatExplainerContent(content: string): string {
    // Split content into bullet points if it contains numbered points
    if (content.includes('\n')) {
      // Already formatted with line breaks
      return content;
    } else if (content.includes('. ')) {
      // Split into sentences and format as bullet points
      const points = content.split('. ').filter(p => p.trim().length > 0);
      return points.map((point, index) => 
        `${index + 1}. ${point.trim()}${point.trim().endsWith('.') ? '' : '.'}`
      ).join('\n');
    }
    return content;
  }
  
  private createScrollableContent(container: Phaser.GameObjects.Container, _contentHeight: number, availableHeight: number, containerWidth: number, content: string): void {
    // Create scroll container for the content
    const scrollContainer = this.scene.add.container(0, 28);
    this.scrollState.scrollContainer = scrollContainer;
    
    // Create the text content
    const fontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '11px');
    const explainerText = this.scene.add.text(
      24,
      0,
      content,
      {
        fontSize: fontSize,
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        wordWrap: { 
          width: this.dialogWidth - 60
        },
        lineSpacing: 4, // Increased line spacing for better readability
        align: 'left',
        fontStyle: 'bold'
      }
    );
    
    scrollContainer.add(explainerText);
    
    // Create mask for content clipping
    const maskGraphics = this.scene.add.graphics();
    maskGraphics.fillRect(12, 28, containerWidth, availableHeight);
    this.scrollState.scrollMask = maskGraphics;
    
    // Apply mask to scroll container
    const mask = maskGraphics.createGeometryMask();
    scrollContainer.setMask(mask);
    
    container.add([scrollContainer, maskGraphics]);
    
    // Add scroll indicators if needed
    if (this.scrollState.isScrollable) {
      this.createScrollIndicators(container, containerWidth, availableHeight);
      // Set up scroll controls
      this.setupScrollControls(container, containerWidth, availableHeight);
    }
  }
  
  private createScrollIndicators(container: Phaser.GameObjects.Container, containerWidth: number, availableHeight: number): void {
    // Create subtle scroll indicators
    const indicatorColor = UIHelpers.hexToNumber(modernUITheme.colors.accent);
    
    // Top scroll indicator (fade in when scrolled down)
    const topIndicator = this.scene.add.graphics();
    topIndicator.fillGradientStyle(indicatorColor, indicatorColor, 0x000000, 0x000000, 0.3, 0);
    topIndicator.fillRect(12, 28, containerWidth, 8);
    topIndicator.setAlpha(0); // Initially hidden
    
    // Bottom scroll indicator (fade in when more content below)
    const bottomIndicator = this.scene.add.graphics();
    bottomIndicator.fillGradientStyle(0x000000, 0x000000, indicatorColor, indicatorColor, 0, 0.3);
    bottomIndicator.fillRect(12, 28 + availableHeight - 8, containerWidth, 8);
    bottomIndicator.setAlpha(1); // Initially visible since there's content below
    
    container.add([topIndicator, bottomIndicator]);
    
    // Store references for scroll updates
    this.scrollState.topIndicator = topIndicator;
    this.scrollState.bottomIndicator = bottomIndicator;
  }
  
  private setupScrollControls(container: Phaser.GameObjects.Container, containerWidth: number, availableHeight: number): void {
    // Create invisible interaction area for scroll input
    const scrollInteractionArea = this.scene.add.rectangle(
      12 + containerWidth / 2, 
      28 + availableHeight / 2, 
      containerWidth, 
      availableHeight, 
      0x000000, 
      0 // Fully transparent
    );
    scrollInteractionArea.setInteractive();
    
    // Mouse wheel support (desktop)
    scrollInteractionArea.on('wheel', (_pointer: any, _deltaX: number, deltaY: number) => {
      this.handleScroll(deltaY * 0.5); // Scale down scroll speed
    });
    
    // Touch/pointer support (mobile and desktop)
    let isDragging = false;
    let lastPointerY = 0;
    
    scrollInteractionArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastPointerY = pointer.y;
    });
    
    scrollInteractionArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const deltaY = lastPointerY - pointer.y; // Inverted for natural touch feel
        this.handleScroll(deltaY);
        lastPointerY = pointer.y;
      }
    });
    
    scrollInteractionArea.on('pointerup', () => {
      isDragging = false;
    });
    
    scrollInteractionArea.on('pointerout', () => {
      isDragging = false;
    });
    
    container.add(scrollInteractionArea);
    
    // Store reference for cleanup
    this.scrollState.interactionArea = scrollInteractionArea;
  }
  
  private handleScroll(deltaY: number): void {
    if (!this.scrollState.isScrollable || !this.scrollState.scrollContainer) {
      return;
    }
    
    // Performance optimization: only update if movement is significant
    if (Math.abs(deltaY) < 0.5) {
      return;
    }
    
    // Calculate new scroll position
    const newScrollY = Phaser.Math.Clamp(
      this.scrollState.currentScrollY + deltaY,
      0,
      this.scrollState.maxScrollY
    );
    
    // Only update if position changed significantly
    if (Math.abs(newScrollY - this.scrollState.currentScrollY) > 0.5) {
      this.scrollState.currentScrollY = newScrollY;
      
      // Update scroll container position
      this.scrollState.scrollContainer.setY(28 - newScrollY);
      
      // Update scroll indicators
      this.updateScrollIndicators();
    }
  }
  
  private updateScrollIndicators(): void {
    if (!this.scrollState.topIndicator || !this.scrollState.bottomIndicator || !this.scrollState.isScrollable) {
      return;
    }
    
    // Edge case: ensure maxScrollY is valid
    if (this.scrollState.maxScrollY <= 0) {
      this.scrollState.topIndicator.setAlpha(0);
      this.scrollState.bottomIndicator.setAlpha(0);
      return;
    }
    
    // Top indicator: show when scrolled down (with smooth fade)
    const topAlpha = Phaser.Math.Clamp(this.scrollState.currentScrollY / 10, 0, 1);
    this.scrollState.topIndicator.setAlpha(topAlpha);
    
    // Bottom indicator: show when there's content below (with smooth fade)
    const scrollProgress = this.scrollState.currentScrollY / this.scrollState.maxScrollY;
    const bottomAlpha = Phaser.Math.Clamp((1 - scrollProgress) * 1.2, 0, 1);
    this.scrollState.bottomIndicator.setAlpha(bottomAlpha);
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

  private handleOptionSelected(option: string): void {
    if (this.currentData?.onAnswer) {
      // COMPLETE ORIGINAL QUIZ FLOW:
      // 1. Store callback and close dialog immediately 
      const answerCallback = this.currentData.onAnswer;
      this.dialogContainer.setVisible(false);
      
      // 2. Call the answer handler - this callback implements the complete flow:
      //    - Step 4 (Immediate): Calculate reward, record attempt, play sound
      //    - Step 5 (500ms delay): Show reward dialog, save to database, auto-reset
      //    - Step 6 (Cleanup): Reset question index, resume walking
      answerCallback(option);
      
      // 3. Clean up current data
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
    
    // Clean up scroll state
    this.scrollState = {
      currentScrollY: 0,
      maxScrollY: 0,
      contentHeight: 0,
      isScrollable: false
    };
    
    if (optimizedSingletonInstance === this) {
      optimizedSingletonInstance = null;
    }
    
    this.dialogContainer.destroy();
  }
}

// Factory function for optimized enhanced quiz dialog
export function showOptimizedEnhancedQuizDialog(scene: Phaser.Scene, data: OptimizedQuizDialogData): OptimizedEnhancedQuizDialog | null {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showOptimizedEnhancedQuizDialog');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!optimizedSingletonInstance) {
      optimizedSingletonInstance = new OptimizedEnhancedQuizDialog(scene);
    }
    
    // Show the optimized enhanced quiz dialog
    optimizedSingletonInstance.showQuizDialog(data);
    return optimizedSingletonInstance;

  } catch (error) {
    console.error('Error showing optimized enhanced quiz dialog:', error);
    return null;
  }
}