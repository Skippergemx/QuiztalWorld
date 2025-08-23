// src/components/QuiztalRewardTracker.ts

import Phaser from 'phaser';
import QuiztalRewardLog, { QuiztalReward, SessionStats } from '../utils/QuiztalRewardLog';

export default class QuiztalRewardTracker {
    private scene: Phaser.Scene;
    private container!: Phaser.GameObjects.Container;
    private backgroundPanel!: Phaser.GameObjects.Rectangle;
    private headerText!: Phaser.GameObjects.Text;
    private sessionStatsText!: Phaser.GameObjects.Text;
    private recentRewardsText!: Phaser.GameObjects.Text;
    private isVisible: boolean = false;
    private rewardAddedHandler: (event: Event) => void;
    private logClearedHandler: () => void;
    
    // Position and size constants
    private readonly PANEL_WIDTH = 280;
    private readonly PANEL_HEIGHT = 180;
    private readonly PADDING = 12;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
        // Bind event handlers
        this.rewardAddedHandler = (event: Event) => {
            const customEvent = event as CustomEvent;
            this.handleRewardAdded(customEvent.detail);
        };
        
        this.logClearedHandler = () => {
            this.updateDisplay();
        };
        
        this.initializeUI();
        this.setupEventListeners();
        this.updateDisplay();
    }

    private initializeUI(): void {
        // Create main container
        this.container = this.scene.add.container(0, 0).setDepth(1500);
        
        // Create background panel
        this.backgroundPanel = this.scene.add.rectangle(0, 0, this.PANEL_WIDTH, this.PANEL_HEIGHT, 0x1a1a1a, 0.95)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xf1c40f, 0.8);
        
        // Create header
        this.headerText = this.scene.add.text(this.PADDING, this.PADDING, '🎯 Quiztal Explorer', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#f1c40f',
            fontStyle: 'bold'
        });
        
        // Create session stats text
        this.sessionStatsText = this.scene.add.text(this.PADDING, this.PADDING + 30, '', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#2ecc71',
            lineSpacing: 4
        });
        
        // Create recent rewards text
        this.recentRewardsText = this.scene.add.text(this.PADDING, this.PADDING + 80, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#3498db',
            lineSpacing: 3
        });
        
        // Add all elements to container
        this.container.add([
            this.backgroundPanel,
            this.headerText,
            this.sessionStatsText,
            this.recentRewardsText
        ]);
        
        // Position the tracker (top-right corner by default)
        this.positionTracker();
        
        // Start hidden
        this.container.setVisible(false);
    }

    private setupEventListeners(): void {
        // Listen for reward additions
        if (typeof window !== 'undefined') {
            window.addEventListener('quiztalRewardAdded', this.rewardAddedHandler);
            window.addEventListener('quiztalLogCleared', this.logClearedHandler);
        }
        
        // Listen for resize events
        this.scene.scale.on('resize', () => {
            this.positionTracker();
        });
    }

    private handleRewardAdded(detail: { reward: QuiztalReward; sessionStats: SessionStats }): void {
        this.updateDisplay();
        
        // Show a brief animation for new rewards only if the tracker is visible
        if (this.isVisible) {
            this.showRewardAnimation(detail.reward);
        }
    }

    private showRewardAnimation(reward: QuiztalReward): void {
        // Create temporary reward notification positioned above the panel
        const notification = this.scene.add.text(
            this.container.x + this.PANEL_WIDTH / 2,  // Center horizontally on the panel
            this.container.y - 30,                   // Position above the panel
            `+${reward.amount.toFixed(2)} from ${reward.source}!`,
            {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#f1c40f',
                backgroundColor: '#2c3e50',
                padding: { x: 8, y: 4 }
            }
        ).setOrigin(0.5, 0)  // Center the text horizontally
         .setDepth(1600);
        
        // Animate the notification upward and fade out
        this.scene.tweens.add({
            targets: notification,
            y: notification.y - 40,  // Move upward instead of leftward
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                notification.destroy();
            }
        });
    }

    private updateDisplay(): void {
        const stats = QuiztalRewardLog.getSessionStats();
        const recentRewards = QuiztalRewardLog.getRecentRewards(3);
        const duration = QuiztalRewardLog.getSessionDuration();
        
        // Update session stats
        let statsText = `Duration: ${duration}m\n`;
        if (stats.rewardCount > 0) {
            statsText += `Total: ${stats.totalRewards.toFixed(2)} Quiztals\n`;
            statsText += `Rewards: ${stats.rewardCount}`;
        } else {
            statsText += `Total: 0 Quiztals\nNo rewards yet`;
        }
        this.sessionStatsText.setText(statsText);
        
        // Update recent rewards
        let rewardsText = 'Recent Rewards:\n';
        if (recentRewards.length === 0) {
            rewardsText += 'None yet - start quizzing!';
        } else {
            recentRewards.forEach(reward => {
                const timeAgo = QuiztalRewardLog.formatTimeAgo(reward.timestamp);
                rewardsText += `• ${reward.amount.toFixed(2)} from ${reward.source} (${timeAgo})\n`;
            });
        }
        this.recentRewardsText.setText(rewardsText.trim());
    }

    private positionTracker(): void {
        const isMobile = this.scene.scale.width < 768;
        
        if (isMobile) {
            // On mobile, position at bottom-left to avoid conflicts with UI buttons
            this.container.setPosition(10, this.scene.scale.height - this.PANEL_HEIGHT - 50);
        } else {
            // On desktop, position at top-right
            this.container.setPosition(
                this.scene.scale.width - this.PANEL_WIDTH - 20,
                70 // Below the main UI panel
            );
        }
    }

    public show(): void {
        if (!this.isVisible) {
            this.isVisible = true;
            this.updateDisplay();
            this.container.setVisible(true);
            
            // Animate in
            this.container.setAlpha(0);
            this.scene.tweens.add({
                targets: this.container,
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
        }
    }

    public hide(): void {
        if (this.isVisible) {
            this.isVisible = false;
            
            // Animate out
            this.scene.tweens.add({
                targets: this.container,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.container.setVisible(false);
                }
            });
        }
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public isShowing(): boolean {
        return this.isVisible;
    }

    public refresh(): void {
        this.updateDisplay();
    }

    public destroy(): void {
        // Clean up event listeners
        if (typeof window !== 'undefined') {
            window.removeEventListener('quiztalRewardAdded', this.rewardAddedHandler);
            window.removeEventListener('quiztalLogCleared', this.logClearedHandler);
        }
        
        this.scene.scale.off('resize');
        
        // Destroy UI elements
        this.container.destroy();
    }
}
