// src/managers/NPCQuizManager.ts

import Phaser from 'phaser';

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

export interface NPCQuizData {
    npcId: string;
    npcName: string;
    theme: string;
    description: string;
    questions: QuizQuestion[];
}

// NPCQuizManager class: Manages the quiz data for all NPCs, including SecurityKai.
export default class NPCQuizManager {
    private static instance: NPCQuizManager;
    // quizData: Stores the quiz data for each NPC, using the NPC's ID as the key.
    private quizData: Map<string, NPCQuizData> = new Map();
    private isLoaded: boolean = false;
    private loadingPromise: Promise<void> | null = null;

    private constructor(scene: Phaser.Scene) {
        // Scene parameter kept for future use (asset loading, etc.)
        console.log('NPCQuizManager initialized for scene:', scene.scene.key);
    }

    /**
     * Get the singleton instance of NPCQuizManager
     */
    public static getInstance(scene: Phaser.Scene): NPCQuizManager {
        if (!NPCQuizManager.instance) {
            NPCQuizManager.instance = new NPCQuizManager(scene);
        }
        return NPCQuizManager.instance;
    }

    /**
     * Initialize and load all quiz data
     */
    public async initialize(): Promise<void> {
        if (this.isLoaded) {
            return; // Already loaded
        }

        if (this.loadingPromise) {
            return this.loadingPromise; // Already loading
        }

        this.loadingPromise = this.loadAllQuizData();
        await this.loadingPromise;
        this.isLoaded = true;
    }

    /**
     * Load all quiz JSON files
     */
    private async loadAllQuizData(): Promise<void> {
        // npcIds: Array of NPC IDs to load quiz data for.  Make sure to include 'securitykai' here.
        const npcIds = ['mintgirl', 'basesage', 'huntboy', 'securitykai', 'nftcyn', 'profchain', 'smartcontractguy', 'dexpertgal', 'walletsafetyfriend'];
        const loadPromises = npcIds.map(npcId => this.loadQuizData(npcId));
        
        try {
            await Promise.all(loadPromises);
            console.log('✅ All NPC quiz data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading quiz data:', error);
            throw error;
        }
    }

    /**
     * Load quiz data for a specific NPC
     */
    private async loadQuizData(npcId: string): Promise<void> {
        try {
            const response = await fetch(`/assets/quizzes/npc-${npcId}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load quiz data for ${npcId}: ${response.statusText}`);
            }
            
            const quizData: NPCQuizData = await response.json();
            
            // Validate the data structure
            if (!this.validateQuizData(quizData)) {
                throw new Error(`Invalid quiz data structure for ${npcId}`);
            }
            
            this.quizData.set(npcId, quizData);
            console.log(`📚 Loaded ${quizData.questions.length} questions for ${quizData.npcName}`);
        } catch (error) {
            console.error(`❌ Error loading quiz data for ${npcId}:`, error);
            throw error;
        }
    }

    /**
     * Validate quiz data structure
     */
    private validateQuizData(data: any): data is NPCQuizData {
        if (!data || typeof data !== 'object') return false;
        if (!data.npcId || !data.npcName || !data.questions) return false;
        if (!Array.isArray(data.questions)) return false;
        
        return data.questions.every((q: any) => 
            q.question && 
            Array.isArray(q.options) && 
            q.options.length >= 2 && 
            q.answer &&
            q.options.includes(q.answer)
        );
    }

    /**
     * Get quiz questions for a specific NPC
     */
    public getQuizQuestions(npcId: string): QuizQuestion[] {
        if (!this.isLoaded) {
            console.warn(`Quiz data not loaded yet. Call initialize() first.`);
            return [];
        }

        const quizData = this.quizData.get(npcId);
        if (!quizData) {
            console.warn(`No quiz data found for NPC: ${npcId}`);
            return [];
        }

        return quizData.questions;
    }

    /**
     * Get a random question for a specific NPC, optionally excluding a previous question
     */
    public getRandomQuestion(npcId: string, excludeIndex: number = -1): { question: QuizQuestion; index: number } | null {
        const questions = this.getQuizQuestions(npcId);
        if (questions.length === 0) {
            return null;
        }

        let questionIndex: number;
        
        // If we have more than one question and want to exclude one
        if (questions.length > 1 && excludeIndex >= 0 && excludeIndex < questions.length) {
            do {
                questionIndex = Math.floor(Math.random() * questions.length);
            } while (questionIndex === excludeIndex);
        } else {
            questionIndex = Math.floor(Math.random() * questions.length);
        }

        return {
            question: questions[questionIndex],
            index: questionIndex
        };
    }

    /**
     * Get NPC information
     */
    public getNPCInfo(npcId: string): { name: string; theme: string; description: string } | null {
        const quizData = this.quizData.get(npcId);
        if (!quizData) {
            return null;
        }

        return {
            name: quizData.npcName,
            theme: quizData.theme,
            description: quizData.description
        };
    }

    /**
     * Get the total number of questions for an NPC
     */
    public getQuestionCount(npcId: string): number {
        const questions = this.getQuizQuestions(npcId);
        return questions.length;
    }

    /**
     * Get all available NPC IDs
     */
    public getAvailableNPCs(): string[] {
        return Array.from(this.quizData.keys());
    }

    /**
     * Check if quiz data is loaded
     */
    public isReady(): boolean {
        return this.isLoaded;
    }

    /**
     * Reload all quiz data (useful for development)
     */
    public async reload(): Promise<void> {
        this.isLoaded = false;
        this.loadingPromise = null;
        this.quizData.clear();
        await this.initialize();
    }

    /**
     * Get quiz statistics
     */
    public getStatistics(): Record<string, any> {
        const stats: Record<string, any> = {
            totalNPCs: this.quizData.size,
            totalQuestions: 0,
            npcs: {}
        };

        this.quizData.forEach((data, npcId) => {
            stats.totalQuestions += data.questions.length;
            stats.npcs[npcId] = {
                name: data.npcName,
                theme: data.theme,
                questionCount: data.questions.length
            };
        });

        return stats;
    }
}
