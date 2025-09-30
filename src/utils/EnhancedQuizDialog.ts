import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';
import { BaseDialog } from './BaseDialog';

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
  explanation?: string;
  onAnswer: (selectedOption: string) => void;
  onClose?: () => void;
}

// Singleton instance
let enhancedSingletonInstance: EnhancedQuizDialog | null = null;

export class EnhancedQuizDialog extends BaseDialog {
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
  
  // Explanation Section Components
  private explanationContainer!: Phaser.GameObjects.Container;
  private explanationText!: Phaser.GameObjects.Text;
  
  // Footer Section Components
  private footerContainer!: Phaser.GameObjects.Container;
  private closeButton!: Phaser.GameObjects.Container;
  
  // Current Dialog Data
  private currentData: QuizDialogData | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, { 
      width: scene.scale.width < 768 ? scene.scale.width * 0.95 : 750,
      height: scene.scale.width < 768 ? 500 : 600,
      depth: 2000
    });
    
    this.initializeSections();
  }

  private initializeSections(): void {
    // Initialize all sections
    this.initializeHeaderSection();
    this.initializeQuestionSection();
    this.initializeOptionsSection();
    this.initializeExplanationSection();
    this.initializeFooterSection();
  }

  public showQuizDialog(data: QuizDialogData): void {
    this.currentData = data;
    this.updateDialogContent();
    this.showWithAnimation();
  }

  private updateDialogContent(): void {
    if (!this.currentData) return;
    
    this.dialogContainer.removeAll(true);
    
    // Recreate all sections with updated content
    this.createDialogBackground();
    this.updateHeaderSection();
    this.updateQuestionSection();
    this.updateOptionsSection();
    this.updateExplanationSection();
    this.updateFooterSection();
  }

  private createDialogBackground(): void {
    this.createStandardBackground();
  }

  private initializeHeaderSection(): void {
    const headerHeight = this.isMobile ? 60 : 70;
    
    this.headerContainer = this.scene.add.container(0, 0);
    
    // Header background
    this.createHeaderBackground(0, headerHeight);
    
    // NPC Avatar
    this.npcAvatar = this.scene.add.image(
      this.isMobile ? 35 : 45,
      headerHeight / 2,
      "npc_mintgirl_avatar"
    )
    .setDisplaySize(this.isMobile ? 50 : 65, this.isMobile ? 61 : 80)
    .setOrigin(0.5)
    .setVisible(false);
    this.headerContainer.add(this.npcAvatar);
    
    // NPC Name
    this.npcNameText = this.scene.add.text(
      this.isMobile ? 65 : 85,
      this.isMobile ? 18 : 22,
      "",
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.accent,
        fontStyle: 'bold'
      }
    );
    this.headerContainer.add(this.npcNameText);
    
    // Theme text
    this.themeText = this.scene.add.text(
      this.isMobile ? 65 : 85,
      this.isMobile ? 35 : 42,
      "",
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
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
        color: modernUITheme.colors.text.secondary,
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0);
    this.headerContainer.add(this.progressText);
    
    // Difficulty badge placeholder
    this.difficultyBadge = this.scene.add.container(this.dialogWidth - 20, this.isMobile ? 45 : 52);
    this.headerContainer.add(this.difficultyBadge);
    
    this.dialogContainer.add(this.headerContainer);
  }

  private updateHeaderSection(): void {
    if (!this.currentData) return;
    
    // Update NPC Name
    this.npcNameText.setText(this.currentData.npcName);
    
    // Update Theme
    this.themeText.setText(this.currentData.theme);
    
    // Update Progress
    if (this.currentData.questionNumber && this.currentData.totalQuestions) {
      this.progressText.setText(`${this.currentData.questionNumber}/${this.currentData.totalQuestions}`);
    }
    
    // Update Avatar
    if (this.scene.textures.exists(this.currentData.npcAvatar)) {
      this.npcAvatar.setTexture(this.currentData.npcAvatar);
      this.npcAvatar.setVisible(true);
    } else {
      this.npcAvatar.setVisible(false);
    }
    
    // Update Difficulty Badge
    this.updateDifficultyBadge();
  }

  private updateDifficultyBadge(): void {
    if (!this.currentData?.difficulty) return;
    
    this.difficultyBadge.removeAll(true);
    
    const colors = {
      'Easy': '#4CAF50',
      'Medium': '#FF9800', 
      'Hard': '#F44336'
    };
    
    const difficulty = this.currentData.difficulty;
    const color = colors[difficulty];
    
    const badge = this.scene.add.graphics();
    badge.fillStyle(UIHelpers.hexToNumber(color), 0.8);
    badge.fillRoundedRect(-30, -8, 60, 16, 8);
    
    const badgeText = this.scene.add.text(0, 0, difficulty, {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '9px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.difficultyBadge.add([badge, badgeText]);
  }

  private initializeQuestionSection(): void {
    const questionY = this.isMobile ? 75 : 85;
    
    this.questionContainer = this.scene.add.container(0, questionY);
    
    // Question background
    this.createSectionBackground(12, 0, this.dialogWidth - 24, this.isMobile ? 60 : 70);
    
    // Question text
    this.questionText = this.scene.add.text(
      24,
      12,
      "",
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
    this.questionContainer.add(this.questionText);
    
    this.dialogContainer.add(this.questionContainer);
  }

  private updateQuestionSection(): void {
    if (!this.currentData) return;
    this.questionText.setText(this.currentData.question);
  }

  private initializeOptionsSection(): void {
    this.optionsContainer = this.scene.add.container(0, this.isMobile ? 150 : 170);
    this.dialogContainer.add(this.optionsContainer);
  }

  private updateOptionsSection(): void {
    if (!this.currentData) return;
    
    this.optionsContainer.removeAll(true);
    this.optionButtons = [];
    
    const optionHeight = this.isMobile ? 32 : 38;
    const optionSpacing = this.isMobile ? 38 : 44;
    
    this.currentData.options.forEach((option, index) => {
      const y = index * optionSpacing;
      const button = this.createOptionButton(option, index, y, optionHeight);
      this.optionsContainer.add(button);
      this.optionButtons.push(button);
    });
  }

  private createOptionButton(option: string, index: number, y: number, height: number): Phaser.GameObjects.Container {
    const buttonContainer = this.scene.add.container(0, y);
    const buttonWidth = this.dialogWidth - 32;
    
    // Button background
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
    
    // Interactive elements
    buttonBg.setInteractive(new Phaser.Geom.Rectangle(16, 0, buttonWidth, height), Phaser.Geom.Rectangle.Contains);
    
    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
      buttonBg.fillRoundedRect(16, 0, buttonWidth, height, 6);
      buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
      buttonBg.strokeRoundedRect(16, 0, buttonWidth, height, 6);
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.card), 0.6);
      buttonBg.fillRoundedRect(16, 0, buttonWidth, height, 6);
      buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.5);
      buttonBg.strokeRoundedRect(16, 0, buttonWidth, height, 6);
    });
    
    buttonBg.on('pointerdown', () => {
      if (this.currentData) {
        this.currentData.onAnswer(option);
      }
    });
    
    buttonContainer.add([buttonBg, letterCircle, letterText, optionText]);
    
    return buttonContainer;
  }

  private initializeExplanationSection(): void {
    this.explanationContainer = this.scene.add.container(0, this.isMobile ? 300 : 380);
    this.dialogContainer.add(this.explanationContainer);
  }

  private updateExplanationSection(): void {
    if (!this.currentData) return;
    
    this.explanationContainer.removeAll(true);
    
    if (this.currentData.explanation) {
      // Explanation background
      const explanationBg = this.scene.add.graphics();
      explanationBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.06);
      explanationBg.fillRoundedRect(12, 0, this.dialogWidth - 24, this.isMobile ? 80 : 100, 6);
      explanationBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.4);
      explanationBg.strokeRoundedRect(12, 0, this.dialogWidth - 24, this.isMobile ? 80 : 100, 6);
      
      // Explanation label
      const label = this.scene.add.text(
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
      
      // Explanation text
      this.explanationText = this.scene.add.text(
        24,
        28,
        this.currentData.explanation,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary,
          wordWrap: { 
            width: this.dialogWidth - 60
          },
          lineSpacing: 3,
          fontStyle: 'bold'
        }
      );
      
      this.explanationContainer.add([explanationBg, label, this.explanationText]);
    }
  }

  private initializeFooterSection(): void {
    this.footerContainer = this.scene.add.container(0, this.dialogHeight - 40);
    this.dialogContainer.add(this.footerContainer);
    
    // Close button
    this.closeButton = this.scene.add.container(this.dialogWidth - 30, 0);
    
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 0.7);
    closeBg.fillCircle(0, 0, 12);
    closeBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.5);
    closeBg.strokeCircle(0, 0, 12);
    
    const closeText = this.scene.add.text(0, 0, '✕', {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: modernUITheme.colors.text.primary,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    closeBg.setInteractive(new Phaser.Geom.Circle(0, 0, 12), Phaser.Geom.Circle.Contains);
    closeBg.on('pointerover', () => {
      closeBg.clear();
      closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 1);
      closeBg.fillCircle(0, 0, 12);
      closeBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.8);
      closeBg.strokeCircle(0, 0, 12);
    });
    
    closeBg.on('pointerout', () => {
      closeBg.clear();
      closeBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.secondary), 0.7);
      closeBg.fillCircle(0, 0, 12);
      closeBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.text.secondary), 0.5);
      closeBg.strokeCircle(0, 0, 12);
    });
    
    closeBg.on('pointerdown', () => {
      if (this.currentData?.onClose) {
        this.currentData.onClose();
      }
      this.hide();
    });
    
    this.closeButton.add([closeBg, closeText]);
    this.footerContainer.add(this.closeButton);
  }

  private updateFooterSection(): void {
    // Footer section is static, no update needed
  }

  // Singleton accessor
  public static getInstance(scene: Phaser.Scene): EnhancedQuizDialog {
    if (!enhancedSingletonInstance) {
      enhancedSingletonInstance = new EnhancedQuizDialog(scene);
    }
    return enhancedSingletonInstance;
  }
}