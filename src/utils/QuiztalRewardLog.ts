// src/utils/QuiztalRewardLog.ts

interface QuiztalReward {
    timestamp: number;
    source: string;
    amount: number;
    sessionStart?: number; // Track when the session started
}

interface SessionStats {
    totalRewards: number;
    rewardCount: number;
    sessionStart: number;
    lastReward?: QuiztalReward;
}

class QuiztalRewardLog {
    private static readonly STORAGE_KEY = 'quiztalRewardLog';
    private static readonly SESSION_KEY = 'quiztalRewardSession';
    private static readonly MAX_RECENT_REWARDS = 10; // Keep only recent rewards for UI
    private static sessionStartTime: number | null = null;

    /**
     * Initialize the session - call this when the player starts playing
     */
    static initializeSession(): void {
        if (!this.sessionStartTime) {
            this.sessionStartTime = Date.now();
            localStorage.setItem(this.SESSION_KEY, this.sessionStartTime.toString());
        }
    }

    /**
     * Log a new reward with session tracking
     */
    static logReward(source: string, amount: number): void {
        // Ensure session is initialized
        this.initializeSession();
        
        const log = this.getLog();
        const newReward: QuiztalReward = {
            timestamp: Date.now(),
            source: source,
            amount: amount,
            sessionStart: this.sessionStartTime!
        };
        
        log.push(newReward);
        
        // Keep only recent rewards to prevent localStorage bloat
        const trimmedLog = log.slice(-this.MAX_RECENT_REWARDS);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLog));
        
        // Dispatch custom event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('quiztalRewardAdded', { 
                detail: { reward: newReward, sessionStats: this.getSessionStats() } 
            }));
        }
    }

    /**
     * Get all logged rewards
     */
    static getLog(): QuiztalReward[] {
        const logString = localStorage.getItem(this.STORAGE_KEY);
        return logString ? JSON.parse(logString) : [];
    }

    /**
     * Get recent rewards (for UI display)
     */
    static getRecentRewards(count: number = 5): QuiztalReward[] {
        const log = this.getLog();
        return log.slice(-count).reverse(); // Most recent first
    }

    /**
     * Get current session statistics
     */
    static getSessionStats(): SessionStats {
        const sessionStartStr = localStorage.getItem(this.SESSION_KEY);
        const sessionStart = sessionStartStr ? parseInt(sessionStartStr) : Date.now();
        
        const log = this.getLog();
        const sessionRewards = log.filter(reward => 
            reward.sessionStart === sessionStart || 
            reward.timestamp >= sessionStart
        );
        
        const totalRewards = sessionRewards.reduce((sum, reward) => sum + reward.amount, 0);
        const lastReward = sessionRewards.length > 0 ? sessionRewards[sessionRewards.length - 1] : undefined;
        
        return {
            totalRewards,
            rewardCount: sessionRewards.length,
            sessionStart,
            lastReward
        };
    }

    /**
     * Get session duration in minutes
     */
    static getSessionDuration(): number {
        const sessionStartStr = localStorage.getItem(this.SESSION_KEY);
        if (!sessionStartStr) return 0;
        
        const sessionStart = parseInt(sessionStartStr);
        return Math.floor((Date.now() - sessionStart) / (1000 * 60)); // in minutes
    }

    /**
     * Clear the reward log and session data
     */
    static clearLog(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.SESSION_KEY);
        this.sessionStartTime = null;
        
        // Dispatch event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('quiztalLogCleared'));
        }
    }

    /**
     * Format timestamp for display
     */
    static formatTimeAgo(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    /**
     * Get a summary string for the current session
     */
    static getSessionSummary(): string {
        const stats = this.getSessionStats();
        const duration = this.getSessionDuration();
        
        if (stats.rewardCount === 0) {
            return `Session: ${duration}m | No rewards yet`;
        }
        
        return `Session: ${duration}m | ${stats.totalRewards.toFixed(2)} Quiztals (${stats.rewardCount} rewards)`;
    }
}

export default QuiztalRewardLog;
export type { QuiztalReward, SessionStats };
