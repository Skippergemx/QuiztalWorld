export interface QuizDialogPreferences {
  useEnhancedDialog: boolean;
  showQuestionProgress: boolean;
  showDifficultyBadge: boolean;
  showTimeLimit: boolean;
  enableQuizStatistics: boolean;
  autoAdvanceQuestions: boolean;
  showDetailedResults: boolean;
  enableRetryOption: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  dialogTheme: 'modern' | 'classic' | 'minimal';
}

export default class QuizDialogConfig {
  private static instance: QuizDialogConfig;
  private preferences: QuizDialogPreferences;
  private readonly STORAGE_KEY = 'quiztal-dialog-preferences';

  private constructor() {
    this.preferences = this.loadPreferences();
  }

  public static getInstance(): QuizDialogConfig {
    if (!QuizDialogConfig.instance) {
      QuizDialogConfig.instance = new QuizDialogConfig();
    }
    return QuizDialogConfig.instance;
  }

  private getDefaultPreferences(): QuizDialogPreferences {
    return {
      useEnhancedDialog: true,
      showQuestionProgress: true,
      showDifficultyBadge: true,
      showTimeLimit: false,
      enableQuizStatistics: true,
      autoAdvanceQuestions: false,
      showDetailedResults: true,
      enableRetryOption: true,
      animationSpeed: 'normal',
      dialogTheme: 'modern'
    };
  }

  private loadPreferences(): QuizDialogPreferences {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return { ...this.getDefaultPreferences(), ...parsed };
      }
    } catch (error) {
      console.warn('QuizDialogConfig: Error loading preferences:', error);
    }
    
    return this.getDefaultPreferences();
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('QuizDialogConfig: Error saving preferences:', error);
    }
  }

  // Getters
  public getPreferences(): QuizDialogPreferences {
    return { ...this.preferences };
  }

  public shouldUseEnhancedDialog(): boolean {
    return this.preferences.useEnhancedDialog;
  }

  public shouldShowQuestionProgress(): boolean {
    return this.preferences.showQuestionProgress;
  }

  public shouldShowDifficultyBadge(): boolean {
    return this.preferences.showDifficultyBadge;
  }

  public shouldShowTimeLimit(): boolean {
    return this.preferences.showTimeLimit;
  }

  public isQuizStatisticsEnabled(): boolean {
    return this.preferences.enableQuizStatistics;
  }

  public shouldAutoAdvanceQuestions(): boolean {
    return this.preferences.autoAdvanceQuestions;
  }

  public shouldShowDetailedResults(): boolean {
    return this.preferences.showDetailedResults;
  }

  public isRetryOptionEnabled(): boolean {
    return this.preferences.enableRetryOption;
  }

  public getAnimationSpeed(): 'slow' | 'normal' | 'fast' {
    return this.preferences.animationSpeed;
  }

  public getDialogTheme(): 'modern' | 'classic' | 'minimal' {
    return this.preferences.dialogTheme;
  }

  // Setters
  public setUseEnhancedDialog(enabled: boolean): void {
    this.preferences.useEnhancedDialog = enabled;
    this.savePreferences();
  }

  public setShowQuestionProgress(enabled: boolean): void {
    this.preferences.showQuestionProgress = enabled;
    this.savePreferences();
  }

  public setShowDifficultyBadge(enabled: boolean): void {
    this.preferences.showDifficultyBadge = enabled;
    this.savePreferences();
  }

  public setShowTimeLimit(enabled: boolean): void {
    this.preferences.showTimeLimit = enabled;
    this.savePreferences();
  }

  public setEnableQuizStatistics(enabled: boolean): void {
    this.preferences.enableQuizStatistics = enabled;
    this.savePreferences();
  }

  public setAutoAdvanceQuestions(enabled: boolean): void {
    this.preferences.autoAdvanceQuestions = enabled;
    this.savePreferences();
  }

  public setShowDetailedResults(enabled: boolean): void {
    this.preferences.showDetailedResults = enabled;
    this.savePreferences();
  }

  public setEnableRetryOption(enabled: boolean): void {
    this.preferences.enableRetryOption = enabled;
    this.savePreferences();
  }

  public setAnimationSpeed(speed: 'slow' | 'normal' | 'fast'): void {
    this.preferences.animationSpeed = speed;
    this.savePreferences();
  }

  public setDialogTheme(theme: 'modern' | 'classic' | 'minimal'): void {
    this.preferences.dialogTheme = theme;
    this.savePreferences();
  }

  public updatePreferences(updates: Partial<QuizDialogPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  public resetToDefaults(): void {
    this.preferences = this.getDefaultPreferences();
    this.savePreferences();
  }

  // Animation duration helpers based on speed preference
  public getAnimationDuration(baseMs: number): number {
    switch (this.preferences.animationSpeed) {
      case 'slow': return baseMs * 1.5;
      case 'fast': return baseMs * 0.7;
      case 'normal':
      default: return baseMs;
    }
  }

  // Theme-specific configurations
  public getThemeConfig(): any {
    switch (this.preferences.dialogTheme) {
      case 'classic':
        return {
          borderRadius: 4,
          shadowIntensity: 0.8,
          gradientEnabled: false,
          glowEnabled: false
        };
      case 'minimal':
        return {
          borderRadius: 2,
          shadowIntensity: 0.3,
          gradientEnabled: false,
          glowEnabled: false,
          borderWidth: 1
        };
      case 'modern':
      default:
        return {
          borderRadius: 16,
          shadowIntensity: 0.6,
          gradientEnabled: true,
          glowEnabled: true,
          borderWidth: 3
        };
    }
  }
}