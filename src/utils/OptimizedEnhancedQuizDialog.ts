import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';

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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = scene.scale.width < 768;
    
    // Optimized sizing similar to simple dialog but enhanced
    this.dialogWidth = this.isMobile ? scene.scale.width * 0.95 : 750;
    this.dialogHeight = this.isMobile ? 420 : 500; // Increased for longer explainer content
    
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
          width: this.dialogWidth - 60,
          useAdvancedWrap: true 
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
    
    // Add explainer section at the bottom
    if (this.currentData!.explainer) {
      this.createExplainerSection();
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
          width: buttonWidth - 50,
          useAdvancedWrap: true 
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

  private createExplainerSection(): void {
    if (!this.currentData?.explainer) return;
    
    // Calculate position after options
    const optionsEndY = this.isMobile ? 150 + (this.currentData.options.length * 38) + 10 : 170 + (this.currentData.options.length * 44) + 10;
    
    // Explainer container
    const explainerContainer = this.scene.add.container(0, optionsEndY);
    
    // Dynamic height based on content length - more space for lengthy explanations
    const explainerHeight = this.isMobile ? 120 : 140;
    
    // Explainer background
    const explainerBg = this.scene.add.graphics();
    explainerBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.06);
    explainerBg.fillRoundedRect(12, 0, this.dialogWidth - 24, explainerHeight, 6);
    explainerBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.4);
    explainerBg.strokeRoundedRect(12, 0, this.dialogWidth - 24, explainerHeight, 6);
    
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
    
    // Explainer content text with better wrapping for longer content
    const explainerText = this.scene.add.text(
      24,
      28,
      this.currentData.explainer,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '10px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        wordWrap: { 
          width: this.dialogWidth - 60,
          useAdvancedWrap: true 
        },
        lineSpacing: 3,
        align: 'left'
      }
    );
    
    explainerContainer.add([explainerBg, iconText, explainerText]);
    this.dialogContainer.add(explainerContainer);
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