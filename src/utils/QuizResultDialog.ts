import Phaser from "phaser";
import modernUITheme, { UIHelpers } from '../utils/UITheme';
import { QuizSession } from '../managers/EnhancedQuizManager';

export interface QuizResultData {
  session: QuizSession;
  reward: number;
  onClose: () => void;
  onRetry?: () => void;
}

// Singleton instance
let resultSingletonInstance: QuizResultDialog | null = null;

export class QuizResultDialog {
  private scene: Phaser.Scene;
  private dialogContainer!: Phaser.GameObjects.Container;
  
  // Layout configuration
  private dialogWidth: number;
  private dialogHeight: number;
  private isMobile: boolean;
  
  // Current result data
  private currentData: QuizResultData | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = scene.scale.width < 768;
    
    // Result dialog sizing
    this.dialogWidth = this.isMobile ? scene.scale.width * 0.9 : 600;
    this.dialogHeight = this.isMobile ? scene.scale.height * 0.7 : 500;
    
    this.initializeDialog();
    this.setupEventListeners();
  }

  private initializeDialog(): void {
    this.dialogContainer = this.scene.add.container(0, 0);
    this.dialogContainer.setDepth(2500); // Higher than quiz dialog
    this.dialogContainer.setVisible(false);
    
    this.updatePosition();
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

  public showResults(data: QuizResultData): void {
    this.currentData = data;
    this.createResultContent();
    
    // Show with animation
    this.dialogContainer.setVisible(true);
    this.dialogContainer.setAlpha(0);
    this.dialogContainer.setScale(0.8);
    
    this.scene.tweens.add({
      targets: this.dialogContainer,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
    
    this.updatePosition();
  }

  private createResultContent(): void {
    if (!this.currentData) return;
    
    this.dialogContainer.removeAll(true);
    
    const { session, reward } = this.currentData;
    const correctAnswers = session.answers.filter(answer => answer.isCorrect).length;
    const accuracy = ((correctAnswers / session.answers.length) * 100).toFixed(1);
    const timeSpent = ((session.endTime! - session.startTime) / 1000).toFixed(1);
    
    // Background
    this.createBackground();
    
    // Header section
    this.createHeader(session, correctAnswers, session.answers.length);
    
    // Statistics section
    this.createStatisticsSection(accuracy, timeSpent, session.score, reward);
    
    // Performance breakdown
    this.createPerformanceBreakdown(session);
    
    // Action buttons
    this.createActionButtons();
  }

  private createBackground(): void {
    const background = this.scene.add.graphics();
    
    // Gradient background
    background.fillGradientStyle(
      UIHelpers.hexToNumber('#1a1a2e'),
      UIHelpers.hexToNumber('#16213e'),
      UIHelpers.hexToNumber('#0f3460'),
      UIHelpers.hexToNumber('#533483'),
      0.98
    );
    
    background.fillRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 16);
    
    // Border
    background.lineStyle(3, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
    background.strokeRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 16);
    
    // Inner glow
    background.lineStyle(1, UIHelpers.hexToNumber('#ffffff'), 0.3);
    background.strokeRoundedRect(2, 2, this.dialogWidth - 4, this.dialogHeight - 4, 14);
    
    this.dialogContainer.add(background);
  }

  private createHeader(session: QuizSession, correct: number, total: number): void {
    const headerY = 20;
    
    // Title
    const title = this.scene.add.text(
      this.dialogWidth / 2,
      headerY,
      'Quiz Complete!',
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '24px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.accent,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0);
    
    // NPC name and theme
    const subtitle = this.scene.add.text(
      this.dialogWidth / 2,
      headerY + 35,
      `${session.npcName} - ${session.theme}`,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        fontStyle: 'italic'
      }
    ).setOrigin(0.5, 0);
    
    // Score circle
    this.createScoreCircle(correct, total, this.dialogWidth / 2, headerY + 70);
    
    this.dialogContainer.add([title, subtitle]);
  }

  private createScoreCircle(correct: number, total: number, x: number, y: number): void {
    const radius = this.isMobile ? 40 : 50;
    const percentage = (correct / total) * 100;
    
    // Background circle
    const bgCircle = this.scene.add.graphics();
    bgCircle.lineStyle(8, UIHelpers.hexToNumber('#333333'), 0.5);
    bgCircle.strokeCircle(x, y, radius);
    
    // Progress circle
    const progressCircle = this.scene.add.graphics();
    const color = percentage >= 80 ? '#4CAF50' : percentage >= 60 ? '#FF9800' : '#F44336';
    progressCircle.lineStyle(8, UIHelpers.hexToNumber(color), 0.9);
    
    // Calculate arc based on percentage
    const startAngle = Phaser.Math.DegToRad(-90);
    const endAngle = startAngle + Phaser.Math.DegToRad((percentage / 100) * 360);
    
    progressCircle.beginPath();
    progressCircle.arc(x, y, radius, startAngle, endAngle, false);
    progressCircle.strokePath();
    
    // Score text
    const scoreText = this.scene.add.text(
      x,
      y - 10,
      `${correct}/${total}`,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '18px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: color,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    const percentText = this.scene.add.text(
      x,
      y + 10,
      `${percentage.toFixed(0)}%`,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary
      }
    ).setOrigin(0.5);
    
    this.dialogContainer.add([bgCircle, progressCircle, scoreText, percentText]);
  }

  private createStatisticsSection(accuracy: string, timeSpent: string, score: number, reward: number): void {
    const statsY = 180;
    const statsContainer = this.scene.add.container(0, statsY);
    
    // Stats background
    const statsBg = this.scene.add.graphics();
    statsBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.05);
    statsBg.fillRoundedRect(20, 0, this.dialogWidth - 40, 80, 8);
    statsBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
    statsBg.strokeRoundedRect(20, 0, this.dialogWidth - 40, 80, 8);
    statsContainer.add(statsBg);
    
    // Stats grid
    const stats = [
      { label: 'Accuracy', value: `${accuracy}%`, icon: '🎯' },
      { label: 'Time', value: `${timeSpent}s`, icon: '⏱️' },
      { label: 'Score', value: score.toString(), icon: '⭐' },
      { label: 'Reward', value: `${reward.toFixed(2)} $Q`, icon: '💰' }
    ];
    
    const statWidth = (this.dialogWidth - 60) / 4;
    
    stats.forEach((stat, index) => {
      const statX = 30 + (index * statWidth);
      
      // Icon
      const icon = this.scene.add.text(
        statX + statWidth / 2,
        15,
        stat.icon,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '20px')
        }
      ).setOrigin(0.5);
      
      // Value
      const value = this.scene.add.text(
        statX + statWidth / 2,
        35,
        stat.value,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.accent,
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
      
      // Label
      const label = this.scene.add.text(
        statX + statWidth / 2,
        55,
        stat.label,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary
        }
      ).setOrigin(0.5);
      
      statsContainer.add([icon, value, label]);
    });
    
    this.dialogContainer.add(statsContainer);
  }

  private createPerformanceBreakdown(session: QuizSession): void {
    const breakdownY = 280;
    const breakdownContainer = this.scene.add.container(0, breakdownY);
    
    // Section title
    const title = this.scene.add.text(
      30,
      0,
      'Question Breakdown',
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        fontStyle: 'bold'
      }
    );
    breakdownContainer.add(title);
    
    // Questions list
    const listY = 25;
    const maxQuestions = this.isMobile ? 3 : 5; // Show limited questions on mobile
    const questionsToShow = session.answers.slice(0, maxQuestions);
    
    questionsToShow.forEach((answer, index) => {
      const questionY = listY + (index * 25);
      
      // Status icon
      const statusIcon = this.scene.add.text(
        40,
        questionY,
        answer.isCorrect ? '✅' : '❌',
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px')
        }
      );
      
      // Question number
      const questionNum = this.scene.add.text(
        60,
        questionY,
        `Q${index + 1}:`,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary,
          fontStyle: 'bold'
        }
      );
      
      // Answer summary
      const answerText = this.scene.add.text(
        90,
        questionY,
        answer.isCorrect ? 'Correct' : `Wrong (${answer.correctAnswer})`,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: answer.isCorrect ? '#4CAF50' : '#F44336',
          wordWrap: { width: this.dialogWidth - 150 }
        }
      );
      
      // Time spent
      const timeText = this.scene.add.text(
        this.dialogWidth - 80,
        questionY,
        `${answer.timeSpent.toFixed(1)}s`,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '10px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary
        }
      ).setOrigin(1, 0);
      
      breakdownContainer.add([statusIcon, questionNum, answerText, timeText]);
    });
    
    // Show more indicator if there are more questions
    if (session.answers.length > maxQuestions) {
      const moreText = this.scene.add.text(
        this.dialogWidth / 2,
        listY + (maxQuestions * 25) + 10,
        `... and ${session.answers.length - maxQuestions} more questions`,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary,
          fontStyle: 'italic'
        }
      ).setOrigin(0.5, 0);
      
      breakdownContainer.add(moreText);
    }
    
    this.dialogContainer.add(breakdownContainer);
  }

  private createActionButtons(): void {
    const buttonsY = this.dialogHeight - 60;
    const buttonsContainer = this.scene.add.container(0, buttonsY);
    
    // Close button
    const closeButton = this.createButton(
      this.dialogWidth / 2 - (this.currentData?.onRetry ? 75 : 0),
      0,
      this.currentData?.onRetry ? 120 : 160,
      40,
      'Continue',
      modernUITheme.colors.primary,
      () => this.handleClose()
    );
    
    buttonsContainer.add(closeButton);
    
    // Retry button (if available)
    if (this.currentData?.onRetry) {
      const retryButton = this.createButton(
        this.dialogWidth / 2 + 75,
        0,
        120,
        40,
        'Try Again',
        modernUITheme.colors.secondary,
        () => this.handleRetry()
      );
      
      buttonsContainer.add(retryButton);
    }
    
    this.dialogContainer.add(buttonsContainer);
  }

  private createButton(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    text: string, 
    color: string, 
    callback: () => void
  ): Phaser.GameObjects.Container {
    const button = this.scene.add.container(x, y);
    
    // Button background
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(UIHelpers.hexToNumber(color), 0.8);
    buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 8);
    buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.6);
    buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    
    // Button text
    const buttonText = this.scene.add.text(0, 0, text, {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    button.add([buttonBg, buttonText]);
    button.setSize(width, height);
    button.setInteractive({ useHandCursor: true })
      .on('pointerdown', callback)
      .on('pointerover', () => {
        button.setScale(1.05);
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber(color), 1);
        buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 8);
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
        buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
      })
      .on('pointerout', () => {
        button.setScale(1);
        buttonBg.clear();
        buttonBg.fillStyle(UIHelpers.hexToNumber(color), 0.8);
        buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 8);
        buttonBg.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.6);
        buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
      });
    
    return button;
  }

  private handleClose(): void {
    if (this.currentData?.onClose) {
      this.currentData.onClose();
    }
    this.close();
  }

  private handleRetry(): void {
    if (this.currentData?.onRetry) {
      this.currentData.onRetry();
    }
    this.close();
  }

  public close(): void {
    this.scene.tweens.add({
      targets: this.dialogContainer,
      alpha: 0,
      scale: 0.8,
      duration: 300,
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
    if (resultSingletonInstance === this) {
      resultSingletonInstance = null;
    }
    
    // Destroy the container and all its children
    this.dialogContainer.destroy();
  }
}

// Factory function for quiz result dialog
export function showQuizResultDialog(scene: Phaser.Scene, data: QuizResultData): QuizResultDialog | null {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showQuizResultDialog');
      return null;
    }

    // Create singleton instance if it doesn't exist
    if (!resultSingletonInstance) {
      resultSingletonInstance = new QuizResultDialog(scene);
    }
    
    // Show the result dialog
    resultSingletonInstance.showResults(data);
    return resultSingletonInstance;

  } catch (error) {
    console.error('Error showing quiz result dialog:', error);
    return null;
  }
}