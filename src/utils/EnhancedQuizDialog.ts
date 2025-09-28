import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';

// Enhanced Quiz Dialog Data Interface
export interface QuizDialogData {
  npcName: string;
  npcAvatar: string;
  question: string;
  options: string[];
  theme: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  questionNumber?: number;
  totalQuestions?: number;
  onAnswer: (selectedOption: string) => void;
  onClose?: () => void;
}

// Singleton instance
let enhancedSingletonInstance: EnhancedQuizDialog | null = null;

export class EnhancedQuizDialog {
  private scene: Phaser.Scene;
  private dialogContainer!: Phaser.GameObjects.Container;
  
  // Header Section Components
  private headerContainer!: Phaser.GameObjects.Container;
  private npcAvatar!: Phaser.GameObjects.Image;
  private npcNameText!: Phaser.GameObjects.Text;
  private themeText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private difficultyBadge!: Phaser.GameObjects.Container;
  
  // Question Section Components
  private questionContainer!: Phaser.GameObjects.Container;
  private questionText!: Phaser.GameObjects.Text;
  
  // Options Section Components
  private optionsContainer!: Phaser.GameObjects.Container;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  
  // Footer Section Components
  private footerContainer!: Phaser.GameObjects.Container;
  private closeButton!: Phaser.GameObjects.Container;
  
  // Layout Configuration
  private dialogWidth: number;
  private dialogHeight: number;
  private isMobile: boolean;
  
  // Current Dialog Data
  private currentData: QuizDialogData | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = scene.scale.width < 768;
    
    // Enhanced sizing for sectioned layout
    this.dialogWidth = this.isMobile ? scene.scale.width * 0.95 : 800;
    this.dialogHeight = this.isMobile ? scene.scale.height * 0.8 : 600;
    
    this.initializeDialog();
    this.setupEventListeners();
  }

  private initializeDialog(): void {
    // Main dialog container
    this.dialogContainer = this.scene.add.container(0, 0);
    this.dialogContainer.setDepth(2000); // Higher than simple dialog
    this.dialogContainer.setVisible(false);
    
    // Create background with enhanced styling
    this.createDialogBackground();
    
    // Initialize all sections
    this.initializeHeaderSection();
    this.initializeQuestionSection();
    this.initializeOptionsSection();
    this.initializeFooterSection();
    
    this.updatePosition();
  }

  private createDialogBackground(): void {
    const background = this.scene.add.graphics();
    
    // Main background with gradient effect
    background.fillGradientStyle(
      UIHelpers.hexToNumber(modernUITheme.colors.background.card),
      UIHelpers.hexToNumber(modernUITheme.colors.background.card),
      UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
      UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
      0.98
    );
    
    background.fillRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 
      UIHelpers.getResponsiveSpacing(this.isMobile, 16, 12));
    
    // Enhanced border with accent color
    background.lineStyle(
      UIHelpers.getResponsiveSpacing(this.isMobile, 4, 3),
      UIHelpers.hexToNumber(modernUITheme.colors.accent),
      0.9
    );
    background.strokeRoundedRect(0, 0, this.dialogWidth, this.dialogHeight,
      UIHelpers.getResponsiveSpacing(this.isMobile, 16, 12));
    
    // Add subtle inner glow
    background.lineStyle(
      UIHelpers.getResponsiveSpacing(this.isMobile, 2, 1),
      UIHelpers.hexToNumber('#ffffff'),
      0.3
    );
    background.strokeRoundedRect(2, 2, this.dialogWidth - 4, this.dialogHeight - 4,
      UIHelpers.getResponsiveSpacing(this.isMobile, 14, 10));
    
    this.dialogContainer.add(background);
  }

  private initializeHeaderSection(): void {
    const headerHeight = this.isMobile ? 80 : 100;
    
    this.headerContainer = this.scene.add.container(0, 0);
    
    // Header background
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.1);
    headerBg.fillRoundedRect(8, 8, this.dialogWidth - 16, headerHeight - 8, 8);
    headerBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
    headerBg.strokeRoundedRect(8, 8, this.dialogWidth - 16, headerHeight - 8, 8);
    this.headerContainer.add(headerBg);
    
    // NPC Avatar (larger in enhanced version)
    this.npcAvatar = this.scene.add.image(
      this.isMobile ? 40 : 50,
      headerHeight / 2,
      "npc_mintgirl_avatar"
    )
    .setDisplaySize(this.isMobile ? 60 : 80, this.isMobile ? 74 : 98)
    .setOrigin(0.5)
    .setVisible(false);
    this.headerContainer.add(this.npcAvatar);
    
    // NPC Name
    this.npcNameText = this.scene.add.text(
      this.isMobile ? 80 : 110,
      this.isMobile ? 20 : 25,
      "",
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '18px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.accent,
        fontStyle: 'bold'
      }
    );
    this.headerContainer.add(this.npcNameText);
    
    // Theme text
    this.themeText = this.scene.add.text(
      this.isMobile ? 80 : 110,
      this.isMobile ? 40 : 50,
      "",
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        fontStyle: 'italic'
      }
    );
    this.headerContainer.add(this.themeText);
    
    // Progress text (right aligned)
    this.progressText = this.scene.add.text(
      this.dialogWidth - 20,
      this.isMobile ? 25 : 30,
      "",
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary
      }
    ).setOrigin(1, 0);
    this.headerContainer.add(this.progressText);
    
    // Difficulty badge placeholder
    this.difficultyBadge = this.scene.add.container(this.dialogWidth - 20, this.isMobile ? 50 : 60);
    this.headerContainer.add(this.difficultyBadge);
    
    this.dialogContainer.add(this.headerContainer);
  }

  private initializeQuestionSection(): void {
    const questionY = this.isMobile ? 100 : 120;
    const questionHeight = this.isMobile ? 120 : 140;
    
    this.questionContainer = this.scene.add.container(0, questionY);
    
    // Question background
    const questionBg = this.scene.add.graphics();
    questionBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.05);
    questionBg.fillRoundedRect(16, 0, this.dialogWidth - 32, questionHeight, 8);
    questionBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.2);
    questionBg.strokeRoundedRect(16, 0, this.dialogWidth - 32, questionHeight, 8);
    this.questionContainer.add(questionBg);
    
    // Question text
    this.questionText = this.scene.add.text(
      32,
      20,
      "",
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        wordWrap: { 
          width: this.dialogWidth - 80,
          useAdvancedWrap: true 
        },
        lineSpacing: 6,
        fontStyle: 'bold'
      }
    );
    this.questionContainer.add(this.questionText);
    
    this.dialogContainer.add(this.questionContainer);
  }

  private initializeOptionsSection(): void {
    const optionsY = this.isMobile ? 240 : 280;
    
    this.optionsContainer = this.scene.add.container(0, optionsY);
    this.dialogContainer.add(this.optionsContainer);
  }

  private initializeFooterSection(): void {
    const footerY = this.dialogHeight - (this.isMobile ? 60 : 80);
    
    this.footerContainer = this.scene.add.container(0, footerY);
    
    // Footer separator line
    const separator = this.scene.add.graphics();
    separator.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
    separator.lineBetween(16, 0, this.dialogWidth - 16, 0);
    this.footerContainer.add(separator);
    
    // Close button
    this.createCloseButton();
    
    this.dialogContainer.add(this.footerContainer);
  }

  private createCloseButton(): void {
    this.closeButton = this.scene.add.container(this.dialogWidth - 80, 20);
    
    // Close button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 0.8);
    buttonBg.fillRoundedRect(0, 0, 60, 30, 6);
    buttonBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.5);
    buttonBg.strokeRoundedRect(0, 0, 60, 30, 6);
    
    // Close button text
    const buttonText = this.scene.add.text(30, 15, "Close", {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: modernUITheme.colors.text.primary
    }).setOrigin(0.5);
    
    this.closeButton.add([buttonBg, buttonText]);
    this.closeButton.setSize(60, 30);
    this.closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleClose())
      .on('pointerover', () => this.closeButton.setAlpha(0.8))
      .on('pointerout', () => this.closeButton.setAlpha(1));
    
    this.footerContainer.add(this.closeButton);
  }

  private setupEventListeners(): void {
    // Camera movement tracking
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

  public showQuizDialog(data: QuizDialogData): void {
    this.currentData = data;
    this.updateDialogContent();
    
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

  private updateDialogContent(): void {
    if (!this.currentData) return;
    
    // Update header
    this.npcNameText.setText(this.currentData.npcName);
    this.themeText.setText(this.currentData.theme);
    
    if (this.currentData.questionNumber && this.currentData.totalQuestions) {
      this.progressText.setText(`Question ${this.currentData.questionNumber}/${this.currentData.totalQuestions}`);
    }
    
    // Set avatar
    if (this.scene.textures.exists(this.currentData.npcAvatar)) {
      this.npcAvatar.setTexture(this.currentData.npcAvatar).setVisible(true);
    }
    
    // Update difficulty badge
    this.updateDifficultyBadge();
    
    // Update question
    this.questionText.setText(this.currentData.question);
    
    // Update options
    this.createOptionButtons();
  }

  private updateDifficultyBadge(): void {
    this.difficultyBadge.removeAll(true);
    
    if (!this.currentData?.difficulty) return;
    
    const colors = {
      'Easy': '#4CAF50',
      'Medium': '#FF9800', 
      'Hard': '#F44336'
    };
    
    const color = colors[this.currentData.difficulty];
    
    const badge = this.scene.add.graphics();
    badge.fillStyle(UIHelpers.hexToNumber(color), 0.8);
    badge.fillRoundedRect(-25, -8, 50, 16, 8);
    
    const badgeText = this.scene.add.text(0, 0, this.currentData.difficulty, {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '10px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.difficultyBadge.add([badge, badgeText]);
  }

  private createOptionButtons(): void {
    this.optionsContainer.removeAll(true);
    this.optionButtons = [];
    
    if (!this.currentData?.options) return;
    
    const buttonHeight = this.isMobile ? 40 : 50;
    const buttonSpacing = this.isMobile ? 50 : 60;
    const startY = 20;
    
    this.currentData.options.forEach((option, index) => {
      const optionButton = this.createOptionButton(option, index, startY + (index * buttonSpacing), buttonHeight);
      this.optionsContainer.add(optionButton);
      this.optionButtons.push(optionButton);
    });
  }

  private createOptionButton(option: string, index: number, y: number, height: number): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(0, y);
    const buttonWidth = this.dialogWidth - 40;
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.card), 0.7);
    buttonBg.fillRoundedRect(20, 0, buttonWidth, height, 8);
    buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.6);
    buttonBg.strokeRoundedRect(20, 0, buttonWidth, height, 8);
    
    // Option letter (A, B, C)
    const optionLetter = String.fromCharCode(65 + index); // A, B, C
    const letterCircle = this.scene.add.graphics();
    letterCircle.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.9);
    letterCircle.fillCircle(40, height / 2, 12);
    
    const letterText = this.scene.add.text(40, height / 2, optionLetter, {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Option text
    const optionText = this.scene.add.text(
      60,
      height / 2,
      option,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        wordWrap: { 
          width: buttonWidth - 60,
          useAdvancedWrap: true 
        }
      }
    ).setOrigin(0, 0.5);
    
    buttonContainer.add([buttonBg, letterCircle, letterText, optionText]);
    
    // Make interactive
    buttonContainer.setSize(buttonWidth, height);
    buttonContainer.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleOptionSelected(option))
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.1);
        buttonBg.fillRoundedRect(20, 0, buttonWidth, height, 8);
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.9);
        buttonBg.strokeRoundedRect(20, 0, buttonWidth, height, 8);
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.card), 0.7);
        buttonBg.fillRoundedRect(20, 0, buttonWidth, height, 8);
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.6);
        buttonBg.strokeRoundedRect(20, 0, buttonWidth, height, 8);
      });
    
    return buttonContainer;
  }

  private handleOptionSelected(option: string): void {
    if (this.currentData?.onAnswer) {
      // Immediately close the quiz dialog to match existing behavior
      this.dialogContainer.setVisible(false);
      
      // Call the answer handler immediately
      this.currentData.onAnswer(option);
      
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
      duration: 200,
      onComplete: () => {
        this.dialogContainer.setVisible(false);
        this.currentData = null;
      }
    });
  }

  private cleanup(): void {
    // Remove camera listeners
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.off('cameramove', this.updatePosition, this);
      this.scene.cameras.main.off('scroll', this.updatePosition, this);
    }
    
    // Clean up the singleton reference
    if (enhancedSingletonInstance === this) {
      enhancedSingletonInstance = null;
    }
    
    // Destroy the container and all its children
    this.dialogContainer.destroy();
  }
}

// Factory function for enhanced quiz dialog
export function showEnhancedQuizDialog(scene: Phaser.Scene, data: QuizDialogData): EnhancedQuizDialog | null {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showEnhancedQuizDialog');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!enhancedSingletonInstance) {
      enhancedSingletonInstance = new EnhancedQuizDialog(scene);
    }
    
    // Show the enhanced quiz dialog
    enhancedSingletonInstance.showQuizDialog(data);
    return enhancedSingletonInstance;

  } catch (error) {
    console.error('Error showing enhanced quiz dialog:', error);
    return null;
  }
}