/**
 * MobileHandler - Handles mobile device detection and mobile-specific UI
 * 
 * This class encapsulates all mobile-related functionality:
 * - Device detection (Android, iOS, touch capability)
 * - Mobile-specific UI creation and management
 * - Mobile user experience optimization
 * 
 * @example
 * ```typescript
 * const mobileHandler = new MobileHandler(scene);
 * if (mobileHandler.shouldShowMobileUI()) {
 *   mobileHandler.createMobileUI({
 *     showDesktopMessage: true,
 *     showContinueButton: true,
 *     messageText: 'Custom message',
 *     buttonText: 'Continue'
 *   });
 * }
 * ```
 */

import Phaser from "phaser";
import {
    IMobileHandler,
    MobileDetectionResult,
    MobileUIConfig,
    MobileHandlerState
} from './types';

export class MobileHandler implements IMobileHandler {
    private scene: Phaser.Scene;
    private state: MobileHandlerState;
    private mobileUIContainer: Phaser.GameObjects.Container | null = null;
    private continueButton: Phaser.GameObjects.Text | null = null;

    // Default mobile UI configuration
    private readonly DEFAULT_CONFIG: MobileUIConfig = {
        showDesktopMessage: true,
        showContinueButton: true,
        messageText: 'To connect your wallet,\nplease use a desktop computer.',
        buttonText: 'Continue to Game'
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.state = {
            initialized: false,
            visible: false,
            interactive: false,
            loading: false,
            mobileDetected: false,
            showingMobileUI: false,
            touchGesturesEnabled: false,
            hapticFeedbackEnabled: false,
            deviceOrientation: 'portrait'
        };

        this.initialize();
    }

    private initialize(): void {
        const detection = this.detectMobile();
        this.state.mobileDetected = detection.isMobile;
        this.state.initialized = true;
    }

    /**
     * Detects if the current device is mobile
     * Uses multiple detection methods for accuracy
     */
    public detectMobile(): MobileDetectionResult {
        const game = this.scene.game;
        
        // Primary detection through Phaser's device detection
        const isAndroid = game.device.os.android;
        const isIOS = game.device.os.iOS;
        const hasTouch = game.device.input.touch;
        
        // Secondary detection through user agent (fallback)
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Tertiary detection through screen size
        const smallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
        
        // Combined result - device is mobile if any primary detection is true
        // OR if both secondary detections are true
        const isMobile = isAndroid || isIOS || hasTouch || (isMobileUA && smallScreen);

        return {
            isMobile,
            isAndroid,
            isIOS,
            hasTouch
        };
    }

    /**
     * Determines if mobile UI should be shown
     * Considers both detection result and current state
     */
    public shouldShowMobileUI(): boolean {
        return this.state.mobileDetected && this.state.initialized;
    }

    /**
     * Creates the mobile-specific UI
     * Displays desktop message and continue button for mobile users
     */
    public createMobileUI(config: Partial<MobileUIConfig> = {}): void {
        if (!this.shouldShowMobileUI()) {
            console.warn('MobileHandler: Attempted to create mobile UI on non-mobile device');
            return;
        }

        // Merge provided config with defaults
        const finalConfig: MobileUIConfig = { ...this.DEFAULT_CONFIG, ...config };

        // Clean up existing mobile UI
        this.cleanup();

        // Create main container for mobile UI
        this.mobileUIContainer = this.scene.add.container(0, 0);

        // Create mobile detection notice
        if (finalConfig.showDesktopMessage) {
            this.createDesktopMessage(finalConfig.messageText);
        }

        // Create continue button for mobile users
        if (finalConfig.showContinueButton) {
            this.createContinueButton(finalConfig.buttonText);
        }

        // Update state
        this.state.visible = true;
        this.state.showingMobileUI = true;
        this.state.interactive = true;

        console.log('MobileHandler: Mobile UI created successfully');
    }

    /**
     * Creates the desktop message for mobile users
     */
    private createDesktopMessage(messageText: string): void {
        if (!this.mobileUIContainer) return;

        const messageStyle = {
            fontSize: '24px',
            color: '#ffffff',
            align: 'center' as const,
            lineSpacing: 10,
            wordWrap: { width: this.scene.scale.width * 0.8 }
        };

        const message = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height * 0.4,
            messageText,
            messageStyle
        ).setOrigin(0.5);

        this.mobileUIContainer.add(message);
    }

    /**
     * Creates the continue button for mobile users
     */
    private createContinueButton(buttonText: string): void {
        if (!this.mobileUIContainer) return;

        const buttonStyle = {
            fontSize: '28px',
            backgroundColor: '#4CAF50',
            padding: { x: 25, y: 15 },
            color: '#ffffff'
        };

        this.continueButton = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height * 0.6,
            buttonText,
            buttonStyle
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Add touch feedback
        this.addTouchFeedback(this.continueButton);

        // Handle button click
        this.continueButton.on('pointerdown', () => {
            this.handleContinueButtonClick();
        });

        this.mobileUIContainer!.add(this.continueButton);
    }

    /**
     * Adds touch feedback to interactive elements
     */
    private addTouchFeedback(button: Phaser.GameObjects.Text): void {
        button.on('pointerdown', () => {
            button.setAlpha(0.7);
            button.y += 2;
        });

        button.on('pointerup', () => {
            button.setAlpha(1);
            button.y -= 2;
        });

        button.on('pointerout', () => {
            button.setAlpha(1);
            // Reset position properly
            button.y = button.y - (button.y % 1);
        });
    }

    /**
     * Handles continue button click - transitions to character selection
     */
    private handleContinueButtonClick(): void {
        console.log('MobileHandler: Continue button clicked, transitioning to CharacterSelectionScene');
        
        // Add fade out animation before scene transition
        this.scene.tweens.add({
            targets: this.mobileUIContainer,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.scene.scene.start('CharacterSelectionScene');
            }
        });
    }

    /**
     * Handles screen resize events
     * Repositions mobile UI elements based on new dimensions
     */
    public handleResize(): void {
        if (!this.state.showingMobileUI || !this.mobileUIContainer) return;

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Reposition message
        const message = this.mobileUIContainer.list[0] as Phaser.GameObjects.Text;
        if (message) {
            message.setPosition(width / 2, height * 0.4);
            message.setWordWrapWidth(width * 0.8);
        }

        // Reposition continue button
        if (this.continueButton) {
            this.continueButton.setPosition(width / 2, height * 0.6);
        }
    }

    /**
     * Gets the current state of the mobile handler
     */
    public getState(): Readonly<MobileHandlerState> {
        return { ...this.state };
    }

    /**
     * Checks if the mobile UI is currently visible
     */
    public isVisible(): boolean {
        return this.state.visible && this.state.showingMobileUI;
    }

    /**
     * Hides the mobile UI without destroying it
     */
    public hide(): void {
        if (this.mobileUIContainer) {
            this.mobileUIContainer.setVisible(false);
            this.state.visible = false;
        }
    }

    /**
     * Shows the mobile UI if it exists
     */
    public show(): void {
        if (this.mobileUIContainer) {
            this.mobileUIContainer.setVisible(true);
            this.state.visible = true;
        }
    }

    /**
     * Cleans up mobile UI components and resets state
     */
    public cleanup(): void {
        if (this.mobileUIContainer) {
            this.mobileUIContainer.destroy();
            this.mobileUIContainer = null;
        }

        if (this.continueButton) {
            this.continueButton = null;
        }

        this.state.visible = false;
        this.state.showingMobileUI = false;
        this.state.interactive = false;

        console.log('MobileHandler: Cleanup completed');
    }

    /**
     * Static utility method to quickly detect if current device is mobile
     * Useful for quick checks without creating a MobileHandler instance
     */
    public static isMobileDevice(): boolean {
        if (typeof window === 'undefined') return false;
        
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const smallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
        
        return isMobileUA || smallScreen;
    }
}