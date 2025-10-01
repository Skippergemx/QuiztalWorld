import Phaser from "phaser";
import modernUITheme, { UIHelpers } from '../utils/UITheme';
import { QuizSession } from '../managers/EnhancedQuizManager';
import { BaseDialog } from './BaseDialog';

export interface QuizResultData {
  session: QuizSession;
  reward: number;
  onClose: () => void;
  onRetry?: () => void;
}

// Singleton instance
// let resultSingletonInstance: QuizResultDialog | null = null;

export class QuizResultDialog extends BaseDialog {
  // Current result data
  private currentData: QuizResultData | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, { 
      width: scene.scale.width < 768 ? scene.scale.width * 0.95 : 750,
      height: scene.scale.width < 768 ? 420 : 480,
      depth: 2500
    });
  }

  public showResults(data: QuizResultData): void {
    this.currentData = data;
    this.createResultContent();
    this.showWithAnimation();
  }

  private createResultContent(): void {
    if (!this.currentData) return;
    
    this.dialogContainer.removeAll(true);
    
    const { session, reward } = this.currentData;
    const correctAnswers = session.answers.filter(answer => answer.isCorrect).length;
    const accuracy = ((correctAnswers / session.answers.length) * 100).toFixed(1);
    const timeSpent = ((session.endTime! - session.startTime) / 1000).toFixed(1);
    
    // Background
    this.createStandardBackground();
    
    // Header section
    this.createHeader(session, correctAnswers, session.answers.length);
    
    // Statistics section
    this.createStatisticsSection(accuracy, timeSpent, session.score, reward);
    
    // Performance breakdown
    this.createPerformanceBreakdown(session);
    
    // Action buttons
    this.createActionButtons();
  }

  private createHeader(session: QuizSession, correct: number, total: number): void {
    const headerHeight = this.isMobile ? 60 : 70;
    
    // Header background
    this.createHeaderBackground(0, headerHeight);
    
    // Title
    const title = this.scene.add.text(
      this.dialogWidth / 2,
      this.isMobile ? 15 : 20,
      'Quiz Complete!',
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '20px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.accent,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0);
    
    // NPC name and theme
    const subtitle = this.scene.add.text(
      this.dialogWidth / 2,
      this.isMobile ? 35 : 45,
      `${session.npcName} - ${session.theme}`,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary,
        fontStyle: 'italic'
      }
    ).setOrigin(0.5, 0);
    
    // Score circle
    this.createScoreCircle(correct, total, this.dialogWidth / 2, headerHeight + 20);
    
    this.dialogContainer.add([title, subtitle]);
  }

  private createScoreCircle(correct: number, total: number, x: number, y: number): void {
    const radius = this.isMobile ? 35 : 45;
    const percentage = (correct / total) * 100;
    
    // Background circle
    const bgCircle = this.scene.add.graphics();
    bgCircle.lineStyle(6, UIHelpers.hexToNumber('#333333'), 0.5);
    bgCircle.strokeCircle(x, y, radius);
    
    // Progress circle
    const progressCircle = this.scene.add.graphics();
    const color = percentage >= 80 ? '#4CAF50' : percentage >= 60 ? '#FF9800' : '#F44336';
    progressCircle.lineStyle(6, UIHelpers.hexToNumber(color), 0.9);
    
    // Calculate arc based on percentage
    const startAngle = Phaser.Math.DegToRad(-90);
    const endAngle = startAngle + Phaser.Math.DegToRad((percentage / 100) * 360);
    
    progressCircle.beginPath();
    progressCircle.arc(x, y, radius, startAngle, endAngle, false);
    progressCircle.strokePath();
    
    // Score text
    const scoreText = this.scene.add.text(
      x,
      y - 8,
      `${correct}/${total}`,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: color,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    const percentText = this.scene.add.text(
      x,
      y + 8,
      `${percentage.toFixed(0)}%`,
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.secondary
      }
    ).setOrigin(0.5);
    
    this.dialogContainer.add([bgCircle, progressCircle, scoreText, percentText]);
  }

  private createStatisticsSection(accuracy: string, timeSpent: string, score: number, reward: number): void {
    const statsY = this.isMobile ? 150 : 170;
    const statsContainer = this.scene.add.container(0, statsY);
    
    // Background
    const statsBg = this.scene.add.graphics();
    statsBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.05);
    statsBg.fillRoundedRect(20, 0, this.dialogWidth - 40, this.isMobile ? 70 : 80, 8);
    statsBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
    statsBg.strokeRoundedRect(20, 0, this.dialogWidth - 40, this.isMobile ? 70 : 80, 8);
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
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px')
        }
      ).setOrigin(0.5);
      
      // Value
      const value = this.scene.add.text(
        statX + statWidth / 2,
        35,
        stat.value,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
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
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '10px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary
        }
      ).setOrigin(0.5);
      
      statsContainer.add([icon, value, label]);
    });
    
    this.dialogContainer.add(statsContainer);
  }

  private createPerformanceBreakdown(session: QuizSession): void {
    const breakdownY = this.isMobile ? 240 : 270;
    const breakdownContainer = this.scene.add.container(0, breakdownY);
    
    // Section title
    const title = this.scene.add.text(
      30,
      0,
      'Question Breakdown',
      {
        fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '14px'),
        fontFamily: modernUITheme.typography.fontFamily.primary,
        color: modernUITheme.colors.text.primary,
        fontStyle: 'bold'
      }
    );
    breakdownContainer.add(title);
    
    // Questions list (simplified for space)
    const maxQuestionsToShow = this.isMobile ? 3 : 5;
    const questionsToShow = session.questions.slice(0, maxQuestionsToShow);
    
    questionsToShow.forEach((question, index) => {
      const answer = session.answers.find(a => a.question === question.question);
      if (!answer) return;
      
      const y = 25 + (index * 25);
      
      // Question number and status
      const statusText = this.scene.add.text(
        30,
        y,
        `${index + 1}. ${answer.isCorrect ? '✅' : '❌'}`,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: answer.isCorrect ? modernUITheme.colors.success : modernUITheme.colors.error
        }
      );
      
      // Question text (truncated)
      const maxTextLength = this.isMobile ? 30 : 50;
      const questionText = question.question.length > maxTextLength 
        ? question.question.substring(0, maxTextLength) + '...' 
        : question.question;
        
      const questionLabel = this.scene.add.text(
        60,
        y,
        questionText,
        {
          fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '11px'),
          fontFamily: modernUITheme.typography.fontFamily.primary,
          color: modernUITheme.colors.text.secondary
        }
      );
      
      breakdownContainer.add([statusText, questionLabel]);
    });
    
    this.dialogContainer.add(breakdownContainer);
  }

  private createActionButtons(): void {
    const buttonsY = this.isMobile ? 340 : 390;
    const buttonsContainer = this.scene.add.container(0, buttonsY);
    
    // Close button
    const closeButton = this.createButton(
      this.dialogWidth / 2 - (this.isMobile ? 60 : 80),
      0,
      this.isMobile ? 100 : 120,
      35,
      'Close',
      modernUITheme.colors.secondary,
      () => {
        if (this.currentData?.onClose) {
          this.currentData.onClose();
        }
        this.hide();
      }
    );
    
    buttonsContainer.add(closeButton);
    
    // Retry button (if provided)
    if (this.currentData?.onRetry) {
      const retryButton = this.createButton(
        this.dialogWidth / 2 + (this.isMobile ? 60 : 80),
        0,
        this.isMobile ? 100 : 120,
        35,
        'Try Again',
        modernUITheme.colors.primary,
        () => {
          if (this.currentData?.onRetry) {
            this.currentData.onRetry();
          }
          this.hide();
        }
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
    buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 6);
    buttonBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.6);
    buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    
    // Button text
    const buttonText = this.scene.add.text(0, 0, text, {
      fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '12px'),
      fontFamily: modernUITheme.typography.fontFamily.primary,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Interactive elements
    buttonBg.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(UIHelpers.hexToNumber(color), 1);
      buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 6);
      buttonBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.8);
      buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(UIHelpers.hexToNumber(color), 0.8);
      buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 6);
      buttonBg.lineStyle(1, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.6);
      buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    });
    
    buttonBg.on('pointerdown', callback);
    
    button.add([buttonBg, buttonText]);
    button.setSize(width, height);
    
    return button;
  }
}