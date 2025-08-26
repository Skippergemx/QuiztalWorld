// src/components/QuiztalRewardTracker.ts

import Phaser from 'phaser';
import QuiztalRewardLog, { QuiztalReward, SessionStats } from '../utils/QuiztalRewardLog';
import modernUITheme, { UIHelpers } from '../utils/UITheme';

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
    
    // Enhanced position and size constants for modern design
    private readonly PANEL_WIDTH = 320;
    private readonly PANEL_HEIGHT = 200;
    private readonly PADDING = modernUITheme.spacing.md;

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
        // Create main container with enhanced depth
        this.container = this.scene.add.container(0, 0).setDepth(1500);
        
        // Create modern background with glass morphism effect
        const backgroundGraphics = this.scene.add.graphics();
        UIHelpers.createGradientFill(
            backgroundGraphics,
            0, 0,
            this.PANEL_WIDTH, this.PANEL_HEIGHT,
            modernUITheme.gradients.glass,
            true
        );
        
        // Create main background panel with modern styling
        this.backgroundPanel = this.scene.add.rectangle(
            0, 0, 
            this.PANEL_WIDTH, this.PANEL_HEIGHT, 
            UIHelpers.hexToNumber(modernUITheme.colors.background.card), 
            0.95
        )
            .setOrigin(0, 0)
            .setStrokeStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.6);
        
        // Add subtle glow effect
        const glowGraphics = this.scene.add.graphics();
        glowGraphics.lineStyle(4, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.2);
        glowGraphics.strokeRoundedRect(
            -2, -2, 
            this.PANEL_WIDTH + 4, this.PANEL_HEIGHT + 4, 
            modernUITheme.borderRadius.lg
        );
        
        // Create enhanced header with modern typography
        this.headerText = this.scene.add.text(
            this.PADDING, this.PADDING, 
            '🎯 Quiztal Explorer', 
            {
                fontSize: modernUITheme.typography.fontSize.lg,
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.accent,
                fontStyle: 'bold' // Use fontStyle instead of fontWeight
            }
        );
        
        // Create session stats with improved styling
        this.sessionStatsText = this.scene.add.text(
            this.PADDING, this.PADDING + 35, 
            '', 
            {
                fontSize: modernUITheme.typography.fontSize.sm,
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.success,
                lineSpacing: 6
            }
        );
        
        // Create recent rewards with enhanced readability
        this.recentRewardsText = this.scene.add.text(
            this.PADDING, this.PADDING + 95, 
            '', 
            {
                fontSize: modernUITheme.typography.fontSize.xs,
                fontFamily: modernUITheme.typography.fontFamily.mono,
                color: modernUITheme.colors.info,
                lineSpacing: 4
            }
        );
        
        // Add all elements to container
        this.container.add([
            glowGraphics,
            backgroundGraphics,
            this.backgroundPanel,
            this.headerText,
            this.sessionStatsText,
            this.recentRewardsText
        ]);
        
        // Position the tracker
        this.positionTracker();
        
        // Start hidden with proper initial state
        this.container.setVisible(false).setAlpha(0);
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
            
            // Modern slide-in animation with bounce
            this.container.setAlpha(0);
            const isMobile = this.scene.scale.width < 768;
            const startY = this.container.y + (isMobile ? 50 : 30);
            this.container.setY(startY);
            
            this.scene.tweens.add({
                targets: this.container,
                alpha: 1,
                y: this.container.y - (isMobile ? 50 : 30),
                duration: modernUITheme.animations.duration.normal,
                ease: modernUITheme.animations.easing.bounce
            });
        }
    }

    public hide(): void {
        if (this.isVisible) {
            this.isVisible = false;
            
            // Smooth slide-out animation
            const isMobile = this.scene.scale.width < 768;
            this.scene.tweens.add({
                targets: this.container,
                alpha: 0,
                y: this.container.y + (isMobile ? 30 : 20),
                duration: modernUITheme.animations.duration.fast,
                ease: modernUITheme.animations.easing.easeIn,
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
