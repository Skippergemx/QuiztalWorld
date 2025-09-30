import Phaser from 'phaser';
import { QuizQuestion } from './NPCQuizManager';
import NPCQuizManager from './NPCQuizManager';
import { saveQuiztalsToDatabase } from '../utils/Database';
import QuiztalRewardLog from '../utils/QuiztalRewardLog';
import AudioManager from '../managers/AudioManager';

export interface EnhancedQuizQuestion extends QuizQuestion {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  tags?: string[];
  timeLimit?: number; // seconds
  points?: number;
  explanation?: string;
}

export interface QuizSession {
  npcId: string;
  npcName: string;
  theme: string;
  questions: EnhancedQuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  startTime: number;
  endTime?: number;
  answers: {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    timestamp?: number; // DEXPERTGAL'S ENHANCED TRACKING
    difficulty?: 'Easy' | 'Medium' | 'Hard'; // DEXPERTGAL'S ENHANCED TRACKING
    points?: number; // DEXPERTGAL'S ENHANCED TRACKING
  }[];
}

export interface QuizStatistics {
  totalQuizzesCompleted: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  averageScore: number;
  favoriteNPC: string;
  totalTimeSpent: number;
  streakCount: number;
  categoryStats: {
    [category: string]: {
      attempted: number;
      correct: number;
      accuracy: number;
    };
  };
}

export default class EnhancedQuizManager {
  private static instance: EnhancedQuizManager;
  private npcQuizManager: NPCQuizManager;
  private currentSession: QuizSession | null = null;
  private quizHistory: QuizSession[] = [];
  private statistics: QuizStatistics;

  private constructor(scene: Phaser.Scene) {
    this.npcQuizManager = NPCQuizManager.getInstance(scene);
    this.statistics = this.initializeStatistics();
    this.loadQuizHistory();
  }

  public static getInstance(scene: Phaser.Scene): EnhancedQuizManager {
    if (!EnhancedQuizManager.instance) {
      EnhancedQuizManager.instance = new EnhancedQuizManager(scene);
    }
    return EnhancedQuizManager.instance;
  }

  private initializeStatistics(): QuizStatistics {
    const savedStats = localStorage.getItem('quiztal-quiz-statistics');
    if (savedStats) {
      return JSON.parse(savedStats);
    }

    return {
      totalQuizzesCompleted: 0,
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      averageScore: 0,
      favoriteNPC: '',
      totalTimeSpent: 0,
      streakCount: 0,
      categoryStats: {}
    };
  }

  private loadQuizHistory(): void {
    const savedHistory = localStorage.getItem('quiztal-quiz-history');
    if (savedHistory) {
      this.quizHistory = JSON.parse(savedHistory);
    }
  }

  private saveQuizHistory(): void {
    // Keep only last 50 quiz sessions
    const recentHistory = this.quizHistory.slice(-50);
    localStorage.setItem('quiztal-quiz-history', JSON.stringify(recentHistory));
  }

  private saveStatistics(): void {
    localStorage.setItem('quiztal-quiz-statistics', JSON.stringify(this.statistics));
  }

  public async startQuizSession(npcId: string): Promise<QuizSession | null> {
    try {
      // Get NPC info and questions
      const npcInfo = this.npcQuizManager.getNPCInfo(npcId);
      const questions = this.npcQuizManager.getQuizQuestions(npcId);

      if (!npcInfo || !questions || questions.length === 0) {
        console.error(`EnhancedQuizManager: No valid data for NPC ${npcId}`);
        return null;
      }

      // Enhance questions with additional metadata
      const enhancedQuestions = this.enhanceQuestions(questions, npcInfo.theme);
      
      // APPLY DEXPERTGAL'S RANDOMIZATION: Shuffle questions for random order
      const shuffledQuestions = Phaser.Utils.Array.Shuffle([...enhancedQuestions]);

      // Create new quiz session
      this.currentSession = {
        npcId,
        npcName: npcInfo.name,
        theme: npcInfo.theme,
        questions: shuffledQuestions, // Use shuffled questions
        currentQuestionIndex: 0,
        score: 0,
        totalQuestions: shuffledQuestions.length, // Update total count
        startTime: Date.now(),
        answers: []
      };

      console.log(`✅ EnhancedQuizManager: Started quiz session for ${npcInfo.name}`);
      return this.currentSession;

    } catch (error) {
      console.error('EnhancedQuizManager: Error starting quiz session:', error);
      return null;
    }
  }

  private enhanceQuestions(questions: QuizQuestion[], theme: string): EnhancedQuizQuestion[] {
    console.log('🔧 EnhancedQuizManager: enhanceQuestions called with:', {
      questionCount: questions.length,
      theme: theme,
      firstQuestionHasExplainer: !!questions[0]?.explainer,
      firstQuestionPreview: questions[0]?.question.substring(0, 50) + '...'
    });
    
    return questions.map((question) => {
      // Auto-assign difficulty based on question complexity
      const difficulty = this.determineDifficulty(question);
      
      // Extract category from theme
      const category = this.extractCategory(theme);
      
      // Generate tags based on question content
      const tags = this.generateTags(question, theme);

      const enhanced = {
        ...question,
        difficulty,
        category,
        tags,
        timeLimit: this.getTimeLimit(difficulty),
        points: this.getPoints(difficulty),
        explanation: this.generateExplanation(question)
      };
      
      console.log('🔧 Enhanced question:', {
        originalHasExplainer: !!question.explainer,
        enhancedHasExplanation: !!enhanced.explanation,
        explanationLength: enhanced.explanation?.length || 0
      });
      
      return enhanced;
    });
  }

  private determineDifficulty(question: QuizQuestion): 'Easy' | 'Medium' | 'Hard' {
    const questionLength = question.question.length;
    const optionsLength = question.options.reduce((sum, opt) => sum + opt.length, 0);
    
    // Simple heuristic based on content complexity
    if (questionLength < 50 && optionsLength < 100) {
      return 'Easy';
    } else if (questionLength < 100 && optionsLength < 200) {
      return 'Medium';
    } else {
      return 'Hard';
    }
  }

  private extractCategory(theme: string): string {
    // Map themes to broader categories
    const categoryMap: { [key: string]: string } = {
      'NFT & Blockchain': 'Blockchain',
      'Security & Safety': 'Security',
      'DeFi & Trading': 'DeFi',
      'Web3 Development': 'Development',
      'Smart Contracts': 'Development',
      'Cryptocurrency': 'Blockchain',
      'Layer 2 Solutions': 'Blockchain',
      'Wallet Security': 'Security'
    };

    return categoryMap[theme] || 'General';
  }

  private generateTags(question: QuizQuestion, theme: string): string[] {
    const tags: string[] = [];
    
    // Add theme-based tag
    tags.push(theme.toLowerCase().replace(/\s+/g, '-'));
    
    // Extract keywords from question
    const keywords = ['blockchain', 'nft', 'defi', 'smart contract', 'wallet', 'crypto', 'ethereum', 'bitcoin'];
    keywords.forEach(keyword => {
      if (question.question.toLowerCase().includes(keyword)) {
        tags.push(keyword.replace(/\s+/g, '-'));
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private getTimeLimit(difficulty: 'Easy' | 'Medium' | 'Hard'): number {
    switch (difficulty) {
      case 'Easy': return 30;
      case 'Medium': return 45;
      case 'Hard': return 60;
      default: return 30;
    }
  }

  private getPoints(difficulty: 'Easy' | 'Medium' | 'Hard'): number {
    switch (difficulty) {
      case 'Easy': return 10;
      case 'Medium': return 15;
      case 'Hard': return 25;
      default: return 10;
    }
  }

  private generateExplanation(question: QuizQuestion): string {
    console.log('🔍 EnhancedQuizManager: generateExplanation debug:', {
      hasExplainer: !!question.explainer,
      explainerLength: question.explainer?.length || 0,
      explainerPreview: question.explainer?.substring(0, 100) || 'No explainer found'
    });
    
    // Use custom explainer from JSON if available, otherwise provide educational context
    if (question.explainer && question.explainer.trim().length > 0) {
      console.log('✅ EnhancedQuizManager: Using explainer from JSON:', question.explainer.substring(0, 150));
      return question.explainer;
    }
    
    console.log('⚠️ EnhancedQuizManager: No explainer found, using fallback');
    // Generate educational explanation without revealing the answer
    return `This question relates to fundamental concepts in the topic. Consider the key principles and definitions to determine the most accurate answer.`;
  }

  public getCurrentQuestion(): EnhancedQuizQuestion | null {
    if (!this.currentSession) return null;
    
    const { questions, currentQuestionIndex } = this.currentSession;
    if (currentQuestionIndex >= questions.length) return null;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // APPLY DEXPERTGAL'S RANDOMIZATION: Shuffle options each time question is accessed
    return {
      ...currentQuestion,
      options: Phaser.Utils.Array.Shuffle([...currentQuestion.options])
    };
  }

  public submitAnswer(selectedAnswer: string, timeSpent: number, playerId?: string): boolean {
    // APPLY DEXPERTGAL'S COMPREHENSIVE VALIDATION
    if (!this.validateSessionIntegrity()) {
      console.error('EnhancedQuizManager: Cannot submit answer - session validation failed');
      return false;
    }

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      console.error('EnhancedQuizManager: No current question available');
      return false;
    }

    // Validate answer input
    if (!selectedAnswer || typeof selectedAnswer !== 'string') {
      console.error('EnhancedQuizManager: Invalid answer provided');
      return false;
    }

    // Check if answer is one of the valid options
    if (!currentQuestion.options.includes(selectedAnswer)) {
      console.error('EnhancedQuizManager: Answer not in valid options');
      return false;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    // APPLY DEXPERTGAL'S COMPREHENSIVE TRACKING
    if (playerId) {
      this.recordQuizAttempt(playerId, this.currentSession!.npcId);
    }
    
    // Record the answer with enhanced metadata
    this.currentSession!.answers.push({
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.answer,
      isCorrect,
      timeSpent,
      timestamp: Date.now(),
      difficulty: currentQuestion.difficulty,
      points: currentQuestion.points || 10
    });

    // Update score with enhanced points
    if (isCorrect) {
      this.currentSession!.score += currentQuestion.points || 10;
    }

    // Move to next question
    this.currentSession!.currentQuestionIndex++;

    // APPLY DEXPERTGAL'S STATISTICS TRACKING
    this.updateStatistics(currentQuestion, isCorrect);

    return isCorrect;
  }

  private updateStatistics(question: EnhancedQuizQuestion, isCorrect: boolean): void {
    this.statistics.totalQuestionsAnswered++;
    if (isCorrect) {
      this.statistics.correctAnswers++;
    }

    // Update category stats
    const category = question.category || 'General';
    if (!this.statistics.categoryStats[category]) {
      this.statistics.categoryStats[category] = {
        attempted: 0,
        correct: 0,
        accuracy: 0
      };
    }

    const categoryStats = this.statistics.categoryStats[category];
    categoryStats.attempted++;
    if (isCorrect) {
      categoryStats.correct++;
    }
    categoryStats.accuracy = (categoryStats.correct / categoryStats.attempted) * 100;

    this.saveStatistics();
  }

  // APPLY DEXPERTGAL'S COMPREHENSIVE REWARD SYSTEM
  public calculateEnhancedReward(isCorrect: boolean, difficulty?: 'Easy' | 'Medium' | 'Hard'): number {
    if (!isCorrect) return 0;
    
    // Base reward ranges by difficulty (like DexpertGal but enhanced)
    let minReward: number, maxReward: number;
    
    switch (difficulty) {
      case 'Easy':
        minReward = 0.01;
        maxReward = 0.3;
        break;
      case 'Medium':
        minReward = 0.02;
        maxReward = 0.5;
        break;
      case 'Hard':
        minReward = 0.05;
        maxReward = 0.8;
        break;
      default:
        minReward = 0.01;
        maxReward = 0.5;
    }
    
    return parseFloat(Phaser.Math.FloatBetween(minReward, maxReward).toFixed(2));
  }

  // APPLY DEXPERTGAL'S TRIPLE-REDUNDANCY REWARD SYSTEM
  public saveEnhancedRewardToDatabase(playerId: string, reward: number, npcName: string): void {
    console.log('💾 EnhancedQuizManager: saveEnhancedRewardToDatabase called with:', {
      playerId,
      reward,
      npcName
    });
    
    try {
      // 1. FIREBASE DATABASE (Primary storage)
      console.log('🔥 EnhancedQuizManager: Saving to Firebase database...');
      saveQuiztalsToDatabase(playerId, reward, npcName);
      console.log('✅ EnhancedQuizManager: Firebase save completed');
      
      // 2. LOCAL SESSION TRACKER (Secondary storage)
      console.log('📋 EnhancedQuizManager: Logging to local session tracker...');
      QuiztalRewardLog.logReward(npcName, reward);
      console.log('✅ EnhancedQuizManager: Local session tracker completed');
      
      // 3. LOGGER SCENE (Audit trail)
      console.log('📝 EnhancedQuizManager: Adding to logger scene...');
      if (typeof window !== 'undefined' && (window as any).game) {
        const game = (window as any).game;
        const loggerScene = game.scene.getScene('LoggerScene');
        if (loggerScene && loggerScene.addReward) {
          loggerScene.addReward(reward, npcName, npcName);
          console.log('✅ EnhancedQuizManager: Logger scene audit trail completed');
        } else {
          console.warn('⚠️ EnhancedQuizManager: LoggerScene not found or missing addReward method');
        }
      } else {
        console.warn('⚠️ EnhancedQuizManager: Window or game object not available for logger scene');
      }
      
      console.log('🎉 EnhancedQuizManager: All reward saving operations completed successfully');
    } catch (error) {
      console.error('❌ EnhancedQuizManager: Error in saveEnhancedRewardToDatabase:', error);
    }
  }

  // APPLY DEXPERTGAL'S AUDIO FEEDBACK SYSTEM
  public playRewardAudio(isCorrect: boolean): void {
    const audioManager = AudioManager.getInstance();
    if (isCorrect) {
      audioManager.playCorrectSound();
    } else {
      audioManager.playWrongSound();
    }
  }

  public isQuizComplete(): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.currentQuestionIndex >= this.currentSession.questions.length;
  }

  // APPLY DEXPERTGAL'S SESSION VALIDATION AND ANTI-SPAM PROTECTION
  public validateSessionIntegrity(): boolean {
    if (!this.currentSession) {
      console.warn('EnhancedQuizManager: No active session to validate');
      return false;
    }

    // Validate session data integrity
    const session = this.currentSession;
    
    // Check required fields
    if (!session.npcId || !session.npcName || !session.theme) {
      console.error('EnhancedQuizManager: Session missing required fields');
      return false;
    }

    // Check questions array
    if (!Array.isArray(session.questions) || session.questions.length === 0) {
      console.error('EnhancedQuizManager: Session has invalid questions array');
      return false;
    }

    // Check current question index bounds
    if (session.currentQuestionIndex < 0 || session.currentQuestionIndex > session.questions.length) {
      console.error('EnhancedQuizManager: Session has invalid question index');
      return false;
    }

    // Check timestamp validity (session not older than 1 hour)
    const sessionAge = Date.now() - session.startTime;
    if (sessionAge > 3600000) { // 1 hour in milliseconds
      console.warn('EnhancedQuizManager: Session expired (older than 1 hour)');
      return false;
    }

    return true;
  }

  // APPLY DEXPERTGAL'S COMPREHENSIVE SESSION TRACKING
  public recordQuizAttempt(playerId: string, npcId: string): void {
    const attemptRecord = {
      playerId,
      npcId,
      timestamp: Date.now(),
      sessionId: this.currentSession?.startTime || Date.now()
    };

    // Store in localStorage for persistence
    try {
      const existingAttempts = JSON.parse(localStorage.getItem('quiztal-quiz-attempts') || '[]');
      existingAttempts.push(attemptRecord);
      
      // Keep only last 1000 attempts to prevent storage bloat
      const recentAttempts = existingAttempts.slice(-1000);
      localStorage.setItem('quiztal-quiz-attempts', JSON.stringify(recentAttempts));
    } catch (error) {
      console.error('EnhancedQuizManager: Failed to record quiz attempt:', error);
    }
  }

  public completeQuizSession(): QuizSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    
    // Update overall statistics
    this.statistics.totalQuizzesCompleted++;
    this.statistics.totalTimeSpent += (this.currentSession.endTime - this.currentSession.startTime) / 1000;
    this.statistics.averageScore = (this.statistics.averageScore * (this.statistics.totalQuizzesCompleted - 1) + 
      this.getSessionAccuracy(this.currentSession)) / this.statistics.totalQuizzesCompleted;

    // Update favorite NPC
    this.updateFavoriteNPC();

    // Add to history
    this.quizHistory.push({ ...this.currentSession });
    this.saveQuizHistory();
    this.saveStatistics();

    const completedSession = this.currentSession;
    this.currentSession = null;

    return completedSession;
  }

  private getSessionAccuracy(session: QuizSession): number {
    const correctAnswers = session.answers.filter(answer => answer.isCorrect).length;
    return (correctAnswers / session.answers.length) * 100;
  }

  private updateFavoriteNPC(): void {
    const npcCounts: { [npcId: string]: number } = {};
    
    this.quizHistory.forEach(session => {
      npcCounts[session.npcId] = (npcCounts[session.npcId] || 0) + 1;
    });

    let maxCount = 0;
    let favoriteNPC = '';
    
    Object.entries(npcCounts).forEach(([npcId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteNPC = npcId;
      }
    });

    this.statistics.favoriteNPC = favoriteNPC;
  }

  public getQuizProgress(): { current: number; total: number; percentage: number } {
    if (!this.currentSession) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const current = this.currentSession.currentQuestionIndex + 1;
    const total = this.currentSession.totalQuestions;
    const percentage = (this.currentSession.currentQuestionIndex / total) * 100;

    return { current, total, percentage };
  }

  public getSessionSummary(): any {
    if (!this.currentSession) return null;

    const correctAnswers = this.currentSession.answers.filter(answer => answer.isCorrect).length;
    const accuracy = (correctAnswers / this.currentSession.answers.length) * 100;
    
    return {
      npcName: this.currentSession.npcName,
      theme: this.currentSession.theme,
      questionsAnswered: this.currentSession.answers.length,
      correctAnswers,
      accuracy: accuracy.toFixed(1),
      score: this.currentSession.score,
      timeSpent: ((Date.now() - this.currentSession.startTime) / 1000).toFixed(1),
      answers: this.currentSession.answers
    };
  }

  public getStatistics(): QuizStatistics {
    return { ...this.statistics };
  }

  public getQuizHistory(limit: number = 10): QuizSession[] {
    return this.quizHistory.slice(-limit);
  }

  public resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.quizHistory = [];
    this.saveStatistics();
    this.saveQuizHistory();
  }

  // Helper method for NPCs to get recommended next questions
  public getRecommendedQuestions(npcId: string, difficulty?: 'Easy' | 'Medium' | 'Hard'): EnhancedQuizQuestion[] {
    const questions = this.npcQuizManager.getQuizQuestions(npcId);
    if (!questions) return [];

    const npcInfo = this.npcQuizManager.getNPCInfo(npcId);
    const enhanced = this.enhanceQuestions(questions, npcInfo?.theme || 'General');

    if (difficulty) {
      return enhanced.filter(q => q.difficulty === difficulty);
    }

    return enhanced;
  }
}