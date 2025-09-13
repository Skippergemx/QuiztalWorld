/**
 * Enhanced WalletUIManager - Crystal-themed UI components for wallet verification
 * 
 * Features:
 * - Crystal-themed glass morphism and neumorphism effects
 * - Progressive loading with smooth animations
 * - Enhanced accessibility and keyboard navigation
 * - Responsive design with adaptive layouts
 * - Advanced notification system
 * - Form validation with real-time feedback
 * - Touch-optimized interactions
 * - Theme-based consistent styling
 * 
 * @example
 * ```typescript
 * const uiManager = new WalletUIManager(scene);
 * uiManager.createWalletUI();
 * uiManager.showNotification({ type: NotificationType.SUCCESS, message: 'Wallet connected!' });
 * ```
 */

import Phaser from "phaser";
import { modernUITheme, UIHelpers } from '../../utils/UITheme';
import {
    IWalletUIManager,
    EnhancedButtonConfig,
    GradientConfig,
    WalletUIState,
    NotificationConfig,
    NotificationType,
    LoadingOverlayConfig,
    ProgressBarConfig,
    LoadingSpinnerConfig,
    InputFieldConfig,
    FormState,
    AccessibilityConfig,
    FeedbackConfig,
    GlassMorphismConfig,
    NeumorphismConfig,
    AnimationConfig,
    LoadingStage,
    ResponsiveConfig
} from './types';

export class WalletUIManager implements IWalletUIManager {
    private scene: Phaser.Scene;
    private state: WalletUIState;
    private connectButtonCallback: (() => void) | null = null;
    
    // Enhanced UI Components
    private gradientOverlay: Phaser.GameObjects.Graphics | null = null;
    private connectButtonContainer: Phaser.GameObjects.Container | null = null;
    private loadingOverlay: Phaser.GameObjects.Container | null = null;
    private progressBar: Phaser.GameObjects.Container | null = null;
    private continueButton: Phaser.GameObjects.Text | null = null;
    private messageContainer: Phaser.GameObjects.Container | null = null;
    
    // Crystal-themed elements
    private crystalHighlights: Phaser.GameObjects.Graphics[] = [];
    private gemAccents: Phaser.GameObjects.Container[] = [];
    
    // Active timers and animations for cleanup
    private activeTimers: Phaser.Time.TimerEvent[] = [];
    private activeTweens: Phaser.Tweens.Tween[] = [];
    private activeNotifications: Phaser.GameObjects.Container[] = [];
    private activeMessageTimers: Phaser.Time.TimerEvent[] = [];

    // Crystal-themed UI Configuration
    private readonly CRYSTAL_STYLES = {
        glassMorphism: {
            blur: 20,
            opacity: 0.25,
            borderOpacity: 0.4,
            gradient: ['rgba(185, 243, 255, 0.2)', 'rgba(193, 240, 255, 0.1)'], // Crystal blues
            border: {
                width: 2,
                color: '#b9f3ff' // Crystal blue
            }
        } as GlassMorphismConfig,
        
        neumorphism: {
            lightShadow: '0 8px 16px rgba(185, 243, 255, 0.2)',
            darkShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            background: '#0a0a2a', // Deep blue
            borderRadius: modernUITheme.borderRadius.xl,
            inset: false
        } as NeumorphismConfig,

        animations: {
            fast: {
                duration: modernUITheme.animations.duration.fast,
                easing: modernUITheme.animations.easing.easeOut
            },
            normal: {
                duration: modernUITheme.animations.duration.normal,
                easing: modernUITheme.animations.easing.easeInOut
            },
            slow: {
                duration: modernUITheme.animations.duration.slow,
                easing: modernUITheme.animations.easing.bounce
            }
        } as Record<string, AnimationConfig>,

        responsive: {
            mobile: {
                buttonSize: { width: 280, height: 64 },
                fontSize: modernUITheme.typography.fontSize.lg,
                spacing: modernUITheme.spacing.md,
                borderRadius: modernUITheme.borderRadius.lg
            },
            desktop: {
                buttonSize: { width: 360, height: 72 },
                fontSize: modernUITheme.typography.fontSize.xl,
                spacing: modernUITheme.spacing.lg,
                borderRadius: modernUITheme.borderRadius.xl
            }
        } as ResponsiveConfig<any>,
        
        // Crystal-specific colors
        crystalColors: {
            primary: '#b9f3ff', // Crystal blue
            secondary: '#ffccf9', // Pink crystal
            accent: '#c1f0ff', // Light blue crystal
            highlight: '#e0ffff', // Cyan crystal
            background: '#0a0a2a' // Deep blue background
        }
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.state = {
            initialized: false,
            visible: false,
            interactive: false,
            loading: false,
            walletConnected: false,
            showingNFTs: false,
            buttonText: '💎 Connect Crystal Wallet',
            progressState: {
                stage: LoadingStage.IDLE,
                progress: 0,
                message: '',
                canCancel: false
            },
            showProgressBar: false,
            accessibilityEnabled: true,
            touchInteractionEnabled: true,
            keyboardNavigationActive: false
        };

        this.initialize();
    }

    private initialize(): void {
        this.state.initialized = true;
        console.log('Enhanced WalletUIManager: Initialized with crystal features');
    }

    /**
     * Creates gradient overlay for background effects
     */
    public drawGradient(config: GradientConfig): void {
        if (!this.gradientOverlay) {
            this.gradientOverlay = this.scene.add.graphics();
            this.gradientOverlay.setDepth(-10); // Behind all other elements
        }
        
        this.gradientOverlay.clear();
        
        // Create vertical gradient with crystal colors using Phaser's gradient fill
        this.gradientOverlay.fillGradientStyle(
            config.color1,  // top color
            config.color2,  // bottom color
            config.color2,  // left color
            config.color1,  // right color
            1  // alpha
        );
        this.gradientOverlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    }

    /**
     * Creates the crystal-themed wallet UI with enhanced visual effects
     */
    public createWalletUI(): void {
        console.log('WalletUIManager: Creating crystal-themed wallet UI');
        
        const isMobile = this.detectMobile();
        
        // Create main content container with proper positioning
        const contentContainer = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);
        
        // Create crystal-themed background
        this.createCrystalBackground(contentContainer, isMobile);
        
        // Create animated title with crystal typography
        this.createCrystalTitle(contentContainer, isMobile);
        
        // Create subtitle with enhanced styling
        this.createCrystalSubtitle(contentContainer, isMobile);
        
        // Create crystal-themed connect button with advanced interactions
        this.createCrystalConnectButton(contentContainer, isMobile);
        
        // Add crystal highlights and gem accents
        this.createCrystalAccents(contentContainer, isMobile);
        
        // Entrance animation
        contentContainer.setAlpha(0).setScale(0.9);
        const enterTween = this.scene.tweens.add({
            targets: contentContainer,
            alpha: 1,
            scale: 1,
            duration: this.CRYSTAL_STYLES.animations.normal.duration,
            ease: this.CRYSTAL_STYLES.animations.normal.easing,
            delay: 200
        });
        this.activeTweens.push(enterTween);

        this.state.visible = true;
        this.state.interactive = true;
    }

    /**
     * Creates crystal-themed background effect with proper positioning
     */
    private createCrystalBackground(container: Phaser.GameObjects.Container, isMobile: boolean): void {
        const width = isMobile ? this.scene.scale.width * 0.9 : 600;
        const height = isMobile ? 400 : 500;
        
        // Create glass background with crystal theme
        const glassBackground = this.scene.add.graphics();
        this.applyGlassMorphism(glassBackground, {
            ...this.CRYSTAL_STYLES.glassMorphism,
            blur: isMobile ? 15 : 20
        });
        
        glassBackground.fillRoundedRect(
            -width / 2, 
            -height / 2, 
            width, 
            height, 
            this.CRYSTAL_STYLES.neumorphism.borderRadius
        );
        
        // Add crystal border
        glassBackground.lineStyle(
            this.CRYSTAL_STYLES.glassMorphism.border.width,
            UIHelpers.hexToNumber(this.CRYSTAL_STYLES.glassMorphism.border.color),
            this.CRYSTAL_STYLES.glassMorphism.borderOpacity
        );
        glassBackground.strokeRoundedRect(
            -width / 2, 
            -height / 2, 
            width, 
            height, 
            this.CRYSTAL_STYLES.neumorphism.borderRadius
        );
        
        container.add(glassBackground);
    }

    /**
     * Creates crystal-themed title with enhanced typography and glow effects
     */
    private createCrystalTitle(container: Phaser.GameObjects.Container, isMobile: boolean): void {
        const titleText = this.scene.add.text(
            0, 
            -120, // Proper vertical positioning
            '💎 Connect Crystal Wallet',
            {
                fontSize: UIHelpers.getResponsiveFontSize(isMobile, '36px'),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: this.CRYSTAL_STYLES.crystalColors.primary,
                fontStyle: modernUITheme.typography.fontWeight.bold,
                shadow: {
                    offsetX: 0,
                    offsetY: 2,
                    color: this.CRYSTAL_STYLES.crystalColors.secondary,
                    blur: 10,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // Add glow effect
        const titleGlow = this.scene.add.text(
            0, 
            -120, // Proper vertical positioning
            '💎 Connect Crystal Wallet',
            {
                fontSize: UIHelpers.getResponsiveFontSize(isMobile, '36px'),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: this.CRYSTAL_STYLES.crystalColors.accent,
                fontStyle: modernUITheme.typography.fontWeight.bold
            }
        ).setOrigin(0.5).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD);

        container.add([titleGlow, titleText]);
        
        // Subtle breathing animation
        const breatheTween = this.scene.tweens.add({
            targets: [titleText, titleGlow],
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.activeTweens.push(breatheTween);
    }

    /**
     * Creates crystal-themed subtitle with proper positioning
     */
    private createCrystalSubtitle(container: Phaser.GameObjects.Container, isMobile: boolean): void {
        const subtitle = this.scene.add.text(
            0,
            -40, // Proper vertical positioning
            'Securely connect to access your crystal NFTs and rewards',
            {
                fontSize: UIHelpers.getResponsiveFontSize(isMobile, modernUITheme.typography.fontSize.lg),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: this.CRYSTAL_STYLES.crystalColors.highlight,
                align: 'center',
                wordWrap: { width: isMobile ? this.scene.scale.width * 0.8 : 500 },
                lineSpacing: 4
            }
        ).setOrigin(0.5);

        container.add(subtitle);
        
        // Fade in animation
        subtitle.setAlpha(0);
        const fadeInTween = this.scene.tweens.add({
            targets: subtitle,
            alpha: 1,
            duration: this.CRYSTAL_STYLES.animations.normal.duration,
            ease: this.CRYSTAL_STYLES.animations.normal.easing,
            delay: 400
        });
        this.activeTweens.push(fadeInTween);
    }

    /**
     * Creates crystal-themed connect button with proper positioning and interactions
     */
    private createCrystalConnectButton(container: Phaser.GameObjects.Container, isMobile: boolean): void {
        const config: EnhancedButtonConfig = {
            text: this.state.buttonText,
            fontSize: this.CRYSTAL_STYLES.responsive[isMobile ? 'mobile' : 'desktop'].fontSize,
            backgroundColor: this.CRYSTAL_STYLES.crystalColors.primary,
            color: '#0a0a2a', // Dark text for contrast
            padding: { x: modernUITheme.spacing.lg, y: modernUITheme.spacing.md },
            variant: 'primary',
            size: isMobile ? 'lg' : 'xl',
            fullWidth: false,
            icon: '💎',
            iconPosition: 'left',
            loading: false,
            disabled: false,
            animation: {
                hover: this.CRYSTAL_STYLES.animations.fast,
                click: this.CRYSTAL_STYLES.animations.fast,
                focus: this.CRYSTAL_STYLES.animations.fast
            },
            accessibility: {
                ariaLabel: 'Connect crystal wallet to access NFTs and rewards',
                role: 'button',
                tabIndex: 0
            }
        };

        this.connectButtonContainer = this.createModernButton(config);
        this.connectButtonContainer.setPosition(0, 60); // Proper vertical positioning
        
        // Add the callback to the button's pointerdown event
        if (this.connectButtonContainer) {
            this.connectButtonContainer.on('pointerdown', () => {
                if (this.connectButtonCallback) {
                    this.connectButtonCallback();
                }
            });
        }
        
        container.add(this.connectButtonContainer);
    }
    
    /**
     * Creates crystal highlights and gem accents for visual enhancement
     */
    private createCrystalAccents(container: Phaser.GameObjects.Container, isMobile: boolean): void {
        const width = isMobile ? this.scene.scale.width * 0.9 : 600;
        const height = isMobile ? 400 : 500;
        
        // Create crystal highlights
        const highlight1 = this.scene.add.graphics();
        highlight1.fillStyle(UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.primary), 0.1);
        highlight1.fillRoundedRect(-width/2 + 20, -height/2 + 20, width/3, 20, 10);
        this.crystalHighlights.push(highlight1);
        container.add(highlight1);
        
        const highlight2 = this.scene.add.graphics();
        highlight2.fillStyle(UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.secondary), 0.08);
        highlight2.fillRoundedRect(width/2 - 100, height/2 - 40, 80, 15, 8);
        this.crystalHighlights.push(highlight2);
        container.add(highlight2);
        
        // Create gem accents
        const gemContainer = this.scene.add.container(-width/2 + 40, -height/2 + 40);
        const gem = this.scene.add.graphics();
        gem.fillStyle(UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.secondary), 0.7);
        gem.fillCircle(0, 0, 8);
        gem.lineStyle(1, 0xffffff, 0.5);
        gem.strokeCircle(0, 0, 8);
        gemContainer.add(gem);
        this.gemAccents.push(gemContainer);
        container.add(gemContainer);
    }
    
    /**
     * Updates the hit area of a button container based on its background bounds
     */
    private updateButtonHitArea(container: Phaser.GameObjects.Container, buttonWidth: number, buttonHeight: number): void {
        // Update the interactive hit area
        container.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
    }
    
    /**
     * Creates modern button with enhanced styling and interactions
     */
    public createModernButton(config: EnhancedButtonConfig): Phaser.GameObjects.Container {
        const isMobile = this.detectMobile();
        const buttonContainer = this.scene.add.container(0, 0);
        const responsiveConfig = isMobile ? this.CRYSTAL_STYLES.responsive.mobile : this.CRYSTAL_STYLES.responsive.desktop;
        
        // Calculate button dimensions
        const buttonWidth = config.fullWidth ? 
            (isMobile ? this.scene.scale.width * 0.8 : 400) : 
            responsiveConfig.buttonSize.width;
        const buttonHeight = responsiveConfig.buttonSize.height;
        
        // Create button background with gradient
        const buttonBg = this.scene.add.graphics();
        this.createButtonBackground(buttonBg, buttonWidth, buttonHeight);
        
        // Create button text with icon
        const buttonText = this.createButtonText(config);
        
        // Create loading spinner (hidden by default)
        const loadingSpinner = this.createLoadingSpinner({
            type: 'spinner',
            size: parseInt(config.fontSize) * 0.8,
            color: config.color,
            speed: 1000
        });
        loadingSpinner.setVisible(false);
        
        // Add all elements to container
        buttonContainer.add([buttonBg, loadingSpinner, buttonText]);
        
        // Add interaction effects
        this.addModernButtonInteractions(buttonContainer, config);
        
        // Update the hit area to match the background
        this.updateButtonHitArea(buttonContainer, buttonWidth, buttonHeight);
        
        // Add accessibility support
        if (config.accessibility) {
            this.addAccessibilitySupport(config.accessibility);
        }
        
        return buttonContainer;
    }

    /**
     * Creates button background with crystal-themed styling
     */
    private createButtonBackground(
        graphics: Phaser.GameObjects.Graphics, 
        width: number, 
        height: number
    ): void {
        graphics.clear();
        graphics.fillGradientStyle(
            UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.primary),
            UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.accent),
            UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.accent),
            UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.primary),
            1
        );
        graphics.fillRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height,
            this.CRYSTAL_STYLES.neumorphism.borderRadius - 4
        );
        
        // Add crystal border
        graphics.lineStyle(2, UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.highlight), 0.8);
        graphics.strokeRoundedRect(
            -width / 2,
            -height / 2,
            width,
            height,
            this.CRYSTAL_STYLES.neumorphism.borderRadius - 4
        );
        
        // Add inner glow
        graphics.lineStyle(1, 0xffffff, 0.3);
        graphics.strokeRoundedRect(
            -width / 2 + 2,
            -height / 2 + 2,
            width - 4,
            height - 4,
            this.CRYSTAL_STYLES.neumorphism.borderRadius - 6
        );
    }

    /**
     * Creates button text with icon support
     */
    private createButtonText(config: EnhancedButtonConfig): Phaser.GameObjects.Text {
        let displayText = config.text;
        
        if (config.icon) {
            switch (config.iconPosition) {
                case 'left':
                    displayText = `${config.icon}  ${config.text}`;
                    break;
                case 'right':
                    displayText = `${config.text}  ${config.icon}`;
                    break;
                case 'top':
                case 'bottom':
                    displayText = config.text; // Icons above/below need different handling
                    break;
                default:
                    displayText = `${config.icon}  ${config.text}`;
            }
        }
        
        return this.scene.add.text(0, 0, displayText, {
            fontSize: config.fontSize,
            fontFamily: modernUITheme.typography.fontFamily.primary,
            color: '#0a0a2a', // Dark text for contrast on crystal background
            fontStyle: modernUITheme.typography.fontWeight.bold,
            align: 'center'
        }).setOrigin(0.5);
    }

    /**
     * Adds modern button interactions with smooth animations
     */
    private addModernButtonInteractions(
        container: Phaser.GameObjects.Container,
        config: EnhancedButtonConfig
    ): void {
        const originalScale = { x: 1, y: 1 };
        
        // Define a rectangle hit area based on typical button dimensions
        const isMobile = this.detectMobile();
        const responsiveConfig = isMobile ? this.CRYSTAL_STYLES.responsive.mobile : this.CRYSTAL_STYLES.responsive.desktop;
        const buttonWidth = config.fullWidth ? 
            (isMobile ? this.scene.scale.width * 0.8 : 400) : 
            responsiveConfig.buttonSize.width;
        const buttonHeight = responsiveConfig.buttonSize.height;
        
        // Make the container interactive with a proper hit area
        container.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                if (config.disabled) return;
                
                // Hover animation with crystal effect
                const hoverTween = this.scene.tweens.add({
                    targets: container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: config.animation?.hover?.duration || this.CRYSTAL_STYLES.animations.fast.duration,
                    ease: config.animation?.hover?.easing || this.CRYSTAL_STYLES.animations.fast.easing
                });
                this.activeTweens.push(hoverTween);
                
                // Add crystal glow on hover
                const glow = this.scene.add.graphics();
                glow.fillStyle(UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.primary), 0.3);
                glow.fillRoundedRect(
                    -buttonWidth/2 - 5, 
                    -buttonHeight/2 - 5, 
                    buttonWidth + 10, 
                    buttonHeight + 10, 
                    this.CRYSTAL_STYLES.neumorphism.borderRadius
                );
                container.add(glow);
                
                // Remove glow after a short time
                this.scene.time.delayedCall(300, () => {
                    if (glow && glow.active) {
                        glow.destroy();
                    }
                });
                
                // Haptic feedback if enabled
                if (config.animation?.hapticFeedback && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            })
            .on('pointerout', () => {
                if (config.disabled) return;
                
                // Reset animation
                const resetTween = this.scene.tweens.add({
                    targets: container,
                    scaleX: originalScale.x,
                    scaleY: originalScale.y,
                    duration: this.CRYSTAL_STYLES.animations.fast.duration,
                    ease: this.CRYSTAL_STYLES.animations.fast.easing
                });
                this.activeTweens.push(resetTween);
            })
            .on('pointerdown', () => {
                if (config.disabled) return;
                
                // Click animation
                const clickTween = this.scene.tweens.add({
                    targets: container,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: config.animation?.click?.duration || 100,
                    ease: 'Power2.easeIn',
                    yoyo: true
                });
                this.activeTweens.push(clickTween);
                
                // Stronger haptic feedback
                if (config.animation?.hapticFeedback && navigator.vibrate) {
                    navigator.vibrate(20);
                }
            });
    }

    /**
     * Enhanced notification system with crystal styling
     */
    public showNotification(config: NotificationConfig): void {
        const isMobile = this.detectMobile();
        const notification = this.createNotificationContainer(config, isMobile);
        
        // Position notification with proper spacing
        this.positionNotification(notification, config.position, isMobile);
        
        // Add to active notifications
        this.activeNotifications.push(notification);
        
        // Entrance animation
        this.animateNotificationEntrance(notification, config.animation.enter);
        
        // Auto-dismiss if enabled
        if (config.autoClose && config.duration) {
            const dismissTimer = this.scene.time.delayedCall(config.duration, () => {
                this.dismissNotification(notification, config.animation.exit);
            });
            this.activeTimers.push(dismissTimer);
        }
        
        console.log(`Crystal notification shown: ${config.type} - ${config.text}`);
    }

    /**
     * Creates notification container with crystal styling
     */
    private createNotificationContainer(config: NotificationConfig, isMobile: boolean): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);
        const width = isMobile ? this.scene.scale.width * 0.9 : 400;
        const height = 80;
        
        // Crystal-themed glass morphism background
        const background = this.scene.add.graphics();
        this.applyGlassMorphism(background, this.CRYSTAL_STYLES.glassMorphism);
        background.fillRoundedRect(0, 0, width, height, modernUITheme.borderRadius.md);
        
        // Crystal accent bar
        const accentBar = this.scene.add.graphics();
        const accentColor = this.getNotificationColor(config.type);
        accentBar.fillStyle(UIHelpers.hexToNumber(accentColor), 1);
        accentBar.fillRoundedRect(0, 0, 6, height, 3);
        
        // Icon with crystal theme
        const icon = this.scene.add.text(
            modernUITheme.spacing.md + 2,
            height / 2,
            this.getNotificationIcon(config.type),
            {
                fontSize: UIHelpers.getResponsiveFontSize(isMobile, '24px'),
                color: accentColor
            }
        ).setOrigin(0, 0.5);
        
        // Title (if provided)
        let titleY = height / 2;
        if (config.title) {
            const title = this.scene.add.text(
                modernUITheme.spacing.md + 40,
                height / 3,
                config.title,
                {
                    fontSize: UIHelpers.getResponsiveFontSize(isMobile, modernUITheme.typography.fontSize.md),
                    fontFamily: modernUITheme.typography.fontFamily.primary,
                    color: this.CRYSTAL_STYLES.crystalColors.primary,
                    fontStyle: modernUITheme.typography.fontWeight.bold
                }
            ).setOrigin(0, 0.5);
            container.add(title);
            titleY = height * 0.65;
        }
        
        // Message text
        const message = this.scene.add.text(
            modernUITheme.spacing.md + 40,
            titleY,
            config.text,
            {
                fontSize: UIHelpers.getResponsiveFontSize(isMobile, modernUITheme.typography.fontSize.sm),
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: this.CRYSTAL_STYLES.crystalColors.highlight,
                wordWrap: { width: width - 80 }
            }
        ).setOrigin(0, 0.5);
        
        // Dismiss button (if dismissible)
        if (config.dismissible) {
            const dismissBtn = this.scene.add.text(
                width - modernUITheme.spacing.md - 2,
                modernUITheme.spacing.sm + 2,
                '✕',
                {
                    fontSize: '18px',
                    color: this.CRYSTAL_STYLES.crystalColors.highlight
                }
            ).setOrigin(1, 0).setInteractive({ useHandCursor: true });
            
            dismissBtn.on('pointerdown', () => {
                this.dismissNotification(container, config.animation.exit);
            });
            
            container.add(dismissBtn);
        }
        
        container.add([background, accentBar, icon, message]);
        return container;
    }

    /**
     * Enhanced message methods with crystal notification system
     */
    public showSuccessMessage(message: string, options?: Partial<NotificationConfig>): void {
        this.showNotification({
            type: NotificationType.SUCCESS,
            text: `💎 ${message}`,
            fontSize: modernUITheme.typography.fontSize.md,
            color: this.CRYSTAL_STYLES.crystalColors.primary,
            title: options?.title || 'Crystal Success',
            position: 'top-right',
            dismissible: true,
            autoClose: true,
            duration: 3000,
            animation: {
                enter: { duration: 300, easing: 'Back.easeOut' },
                exit: { duration: 200, easing: 'Power2.easeIn' }
            },
            ...options
        });
    }

    public showErrorMessage(message: string, options?: Partial<NotificationConfig>): void {
        this.showNotification({
            type: NotificationType.ERROR,
            text: `❌ ${message}`,
            fontSize: modernUITheme.typography.fontSize.md,
            color: modernUITheme.colors.text.primary,
            title: options?.title || 'Crystal Error',
            position: 'top-right',
            dismissible: true,
            autoClose: true,
            duration: 5000,
            animation: {
                enter: { duration: 300, easing: 'Back.easeOut' },
                exit: { duration: 200, easing: 'Power2.easeIn' }
            },
            ...options
        });
    }

    public showInfoMessage(message: string, options?: Partial<NotificationConfig>): void {
        this.showNotification({
            type: NotificationType.INFO,
            text: `ℹ️ ${message}`,
            fontSize: modernUITheme.typography.fontSize.md,
            color: this.CRYSTAL_STYLES.crystalColors.highlight,
            title: options?.title || 'Crystal Info',
            position: 'top-right',
            dismissible: true,
            autoClose: true,
            duration: 4000,
            animation: {
                enter: { duration: 300, easing: 'Back.easeOut' },
                exit: { duration: 200, easing: 'Power2.easeIn' }
            },
            ...options
        });
    }

    /**
     * Creates loading spinner with crystal theme
     */
    private createLoadingSpinner(config: LoadingSpinnerConfig): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);
        const size = config.size || 20;
        
        if (config.type === 'spinner') {
            const spinner = this.scene.add.graphics();
            spinner.lineStyle(3, UIHelpers.hexToNumber(config.color || this.CRYSTAL_STYLES.crystalColors.primary), 1);
            spinner.strokeCircle(0, 0, size / 2);
            
            // Add crystal effect to spinner
            const innerGlow = this.scene.add.graphics();
            innerGlow.lineStyle(1, 0xffffff, 0.5);
            innerGlow.strokeCircle(0, 0, (size / 2) - 2);
            
            container.add([spinner, innerGlow]);
            
            // Animate spinner
            const spinTween = this.scene.tweens.add({
                targets: spinner,
                angle: 360,
                duration: config.speed || 1000,
                repeat: -1,
                ease: 'Linear'
            });
            this.activeTweens.push(spinTween);
        }
        
        return container;
    }

    /**
     * Shows loading overlay with crystal theme
     */
    public showLoadingOverlay(config: LoadingOverlayConfig): void {
        // Hide existing overlay if present
        if (this.loadingOverlay) {
            this.loadingOverlay.destroy();
        }
        
        // Create new overlay
        this.loadingOverlay = this.scene.add.container(0, 0);
        this.loadingOverlay.setDepth(1000); // Above all other elements
        
        // Background overlay
        const overlay = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000,
            config.opacity || 0.7
        );
        overlay.setOrigin(0.5);
        
        // Loading container
        const loadingContainer = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);
        
        // Spinner
        if (config.spinner) {
            const spinnerContainer = this.createLoadingSpinner(config.spinner);
            loadingContainer.add(spinnerContainer);
        }
        
        // Message
        if (config.message) {
            const message = this.scene.add.text(
                0,
                config.spinner ? 50 : 0,
                config.message.text,
                {
                    fontSize: config.message.fontSize || modernUITheme.typography.fontSize.lg,
                    color: config.message.color || this.CRYSTAL_STYLES.crystalColors.primary,
                    fontFamily: modernUITheme.typography.fontFamily.primary
                }
            ).setOrigin(0.5);
            loadingContainer.add(message);
        }
        
        // Progress bar
        if (config.progressBar) {
            const progressBar = this.createProgressBarInternal(config.progressBar, !!config.message);
            loadingContainer.add(progressBar);
        }
        
        this.loadingOverlay.add([overlay, loadingContainer]);
    }

    /**
     * Creates progress bar with crystal theme
     */
    public createProgressBar(config: ProgressBarConfig): Phaser.GameObjects.Container {
        return this.createProgressBarInternal(config, false);
    }

    /**
     * Creates progress bar with crystal theme for internal use with message positioning
     */
    private createProgressBarInternal(config: ProgressBarConfig, hasMessage: boolean = false): Phaser.GameObjects.Container {
        const width = config.width || 300;
        const height = config.height || 20;
        const x = 0;
        const y = hasMessage ? 100 : 80;
        
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(UIHelpers.hexToNumber(config.backgroundColor || '#333333'), 1);
        bg.fillRoundedRect(x - width/2, y - height/2, width, height, config.borderRadius || 10);
        bg.lineStyle(1, 0xffffff, 0.2);
        bg.strokeRoundedRect(x - width/2, y - height/2, width, height, config.borderRadius || 10);
        
        // Fill
        const fill = this.scene.add.graphics();
        fill.fillStyle(UIHelpers.hexToNumber(config.fillColor || this.CRYSTAL_STYLES.crystalColors.primary), 1);
        fill.fillRoundedRect(x - width/2, y - height/2, 0, height, config.borderRadius || 10);
        
        // Add crystal glow effect if enabled
        let glow: Phaser.GameObjects.Graphics | null = null;
        if (config.glowEffect) {
            glow = this.scene.add.graphics();
            glow.fillStyle(UIHelpers.hexToNumber(config.fillColor || this.CRYSTAL_STYLES.crystalColors.primary), 0.3);
            glow.fillRoundedRect(x - width/2 - 2, y - height/2 - 2, 4, height + 4, (config.borderRadius || 10) + 2);
        }
        
        // Percentage text
        const percentText = this.scene.add.text(
            x,
            y,
            '0%',
            {
                fontSize: '14px',
                color: this.CRYSTAL_STYLES.crystalColors.highlight,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        const elements = [bg, fill, percentText];
        if (glow) {
            elements.push(glow);
        }
        
        const progressBarContainer = this.scene.add.container(0, 0, elements);
        this.progressBar = progressBarContainer;
        return progressBarContainer;
    }

    /**
     * Updates progress with crystal theme
     */
    public updateProgress(stage: LoadingStage, progress: number, message: string): void {
        // Update progress bar if it exists
        if (this.progressBar && this.progressBar.list.length >= 3) {
            const fill = this.progressBar.list[1] as Phaser.GameObjects.Graphics;
            const percentText = this.progressBar.list[2] as Phaser.GameObjects.Text;
            
            if (fill && percentText) {
                const width = 300; // Default width
                const height = 20; // Default height
                const x = 0;
                const y = 0;
                
                fill.clear();
                fill.fillStyle(UIHelpers.hexToNumber(this.CRYSTAL_STYLES.crystalColors.primary), 1);
                fill.fillRoundedRect(x - width/2, y - height/2, (width * progress) / 100, height, 10);
                
                percentText.setText(`${progress}%`);
            }
        }
        
        // Update state
        this.state.progressState = {
            stage,
            progress,
            message,
            canCancel: false
        };
    }

    /**
     * Hides loading overlay
     */
    public hideLoadingOverlay(): void {
        if (this.loadingOverlay) {
            this.loadingOverlay.destroy();
            this.loadingOverlay = null;
        }
    }

    /**
     * Shows continue button with crystal theme
     */
    public showContinueButton(): void {
        if (this.continueButton) {
            this.continueButton.destroy();
        }
        
        this.continueButton = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height * 0.8,
            'Continue to Game',
            {
                fontSize: '20px',
                color: this.CRYSTAL_STYLES.crystalColors.primary,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.continueButton.on('pointerdown', () => {
            // Handle continue action
            console.log('Continue button clicked');
        });
        
        // Add hover effect
        this.continueButton.on('pointerover', () => {
            this.continueButton?.setFontSize('22px');
        });
        
        this.continueButton.on('pointerout', () => {
            this.continueButton?.setFontSize('20px');
        });
    }

    /**
     * Creates no wallet UI with crystal theme
     */
    public createNoWalletUI(): void {
        // Clear existing UI
        if (this.messageContainer) {
            this.messageContainer.destroy();
        }
        
        this.messageContainer = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);
        
        // Create glass background
        const bg = this.scene.add.graphics();
        this.applyGlassMorphism(bg, this.CRYSTAL_STYLES.glassMorphism);
        bg.fillRoundedRect(-250, -150, 500, 300, modernUITheme.borderRadius.xl);
        this.messageContainer.add(bg);
        
        // Title
        const title = this.scene.add.text(
            0,
            -80,
            '💎 Crystal Wallet Required',
            {
                fontSize: '28px',
                color: this.CRYSTAL_STYLES.crystalColors.primary,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.messageContainer.add(title);
        
        // Message
        const message = this.scene.add.text(
            0,
            -20,
            'Please install a Web3 wallet\nlike MetaMask to continue',
            {
                fontSize: '18px',
                color: this.CRYSTAL_STYLES.crystalColors.highlight,
                align: 'center',
                wordWrap: { width: 400 }
            }
        ).setOrigin(0.5);
        this.messageContainer.add(message);
        
        // Install button
        const installButton = this.scene.add.text(
            0,
            60,
            'Install MetaMask',
            {
                fontSize: '20px',
                color: '#0a0a2a',
                backgroundColor: this.CRYSTAL_STYLES.crystalColors.primary,
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        installButton.on('pointerdown', () => {
            window.open('https://metamask.io/', '_blank');
        });
        
        this.messageContainer.add(installButton);
    }

    /**
     * Gets the connect button container for external access
     */
    public getConnectButtonContainer(): Phaser.GameObjects.Container | null {
        return this.connectButtonContainer;
    }

    /**
     * Sets the callback function for the connect button
     */
    public setConnectButtonCallback(callback: () => void): void {
        this.connectButtonCallback = callback;
    }

    /**
     * Enhanced state management
     */
    public getUIState(): WalletUIState {
        return { ...this.state };
    }

    public updateUIState(updates: Partial<WalletUIState>): void {
        this.state = { ...this.state, ...updates };
        console.log('UI State updated:', updates);
    }

    /**
     * Mobile detection helper
     */
    private detectMobile(): boolean {
        return this.scene.scale.width < 768 || 
               this.scene.game.device.os.android || 
               this.scene.game.device.os.iOS || 
               this.scene.game.device.input.touch;
    }

    /**
     * Utility methods for notifications
     */
    private getNotificationColor(type: NotificationType): string {
        switch (type) {
            case NotificationType.SUCCESS:
                return this.CRYSTAL_STYLES.crystalColors.primary;
            case NotificationType.ERROR:
                return modernUITheme.colors.error;
            case NotificationType.WARNING:
                return modernUITheme.colors.warning;
            case NotificationType.INFO:
                return this.CRYSTAL_STYLES.crystalColors.secondary;
            default:
                return this.CRYSTAL_STYLES.crystalColors.primary;
        }
    }

    private getNotificationIcon(type: NotificationType): string {
        switch (type) {
            case NotificationType.SUCCESS:
                return '💎';
            case NotificationType.ERROR:
                return '❌';
            case NotificationType.WARNING:
                return '⚠️';
            case NotificationType.INFO:
                return 'ℹ️';
            default:
                return '💎';
        }
    }

    private positionNotification(
        notification: Phaser.GameObjects.Container,
        position: string,
        isMobile: boolean
    ): void {
        const margin = modernUITheme.spacing.md;
        const width = isMobile ? this.scene.scale.width * 0.9 : 400;
        const height = 80;
        
        switch (position) {
            case 'top-right':
                notification.setPosition(
                    this.scene.scale.width - width / 2 - margin,
                    margin + (this.activeNotifications.length * (height + 10))
                );
                break;
            case 'top-center':
                notification.setPosition(
                    this.scene.scale.width / 2,
                    margin + (this.activeNotifications.length * (height + 10))
                );
                break;
            case 'center':
                notification.setPosition(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2
                );
                break;
            default:
                notification.setPosition(
                    this.scene.scale.width - width / 2 - margin,
                    margin + (this.activeNotifications.length * (height + 10))
                );
        }
    }

    private animateNotificationEntrance(
        notification: Phaser.GameObjects.Container,
        animation: AnimationConfig
    ): void {
        notification.setAlpha(0).setScale(0.8);
        
        const enterTween = this.scene.tweens.add({
            targets: notification,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: animation.duration,
            ease: animation.easing,
            delay: animation.delay || 0
        });
        this.activeTweens.push(enterTween);
    }

    private dismissNotification(
        notification: Phaser.GameObjects.Container,
        animation: AnimationConfig
    ): void {
        const exitTween = this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            x: notification.x + 100,
            duration: animation.duration,
            ease: animation.easing,
            onComplete: () => {
                const index = this.activeNotifications.indexOf(notification);
                if (index > -1) {
                    this.activeNotifications.splice(index, 1);
                }
                notification.destroy();
            }
        });
        this.activeTweens.push(exitTween);
    }

    /**
     * Handles screen resize events with crystal theme adjustments
     */
    public handleResize(): void {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Redraw gradient
        this.drawGradient({ color1: 0x001a33, color2: 0x330066 });

        // Reposition connect button
        if (this.connectButtonContainer) {
            this.connectButtonContainer.setPosition(width / 2, height / 2 + 60);
        }

        // Reposition continue button
        if (this.continueButton) {
            this.continueButton.setPosition(width / 2, height * 0.8);
        }
        
        // Reposition message container
        if (this.messageContainer) {
            this.messageContainer.setPosition(width / 2, height / 2);
        }
        
        // Reposition loading overlay
        if (this.loadingOverlay) {
            const overlayBg = this.loadingOverlay.getAt(0) as Phaser.GameObjects.Rectangle;
            if (overlayBg) {
                overlayBg.setPosition(width / 2, height / 2);
                overlayBg.setSize(width, height);
            }
            
            const loadingContent = this.loadingOverlay.getAt(1) as Phaser.GameObjects.Container;
            if (loadingContent) {
                loadingContent.setPosition(width / 2, height / 2);
            }
        }
    }

    /**
     * Applies glass morphism effect with crystal theme
     */
    public applyGlassMorphism(graphics: Phaser.GameObjects.Graphics, config: GlassMorphismConfig): void {
        // Create glass effect with crystal colors
        graphics.fillStyle(UIHelpers.hexToNumber(config.gradient[0]), config.opacity);
        graphics.lineStyle(config.border.width, UIHelpers.hexToNumber(config.border.color), config.borderOpacity);
    }

    /**
     * Applies neumorphism effect to a graphics object
     */
    public applyNeumorphism(target: Phaser.GameObjects.Graphics, config: NeumorphismConfig): void {
        // Apply neumorphism styling
        target.clear();
        
        // Set background color
        target.fillStyle(UIHelpers.hexToNumber(config.background), 1);
        target.fillRect(0, 0, 100, 100); // Default size, should be adjusted by caller
        
        // Apply shadows for neumorphic effect
        // Note: Phaser doesn't have direct shadow support, so we simulate it with additional graphics
        if (!config.inset) {
            // Outer shadow effect
            target.fillStyle(0x000000, 0.2);
            target.fillRoundedRect(2, 2, 100, 100, config.borderRadius);
        }
    }

    /**
     * Adds touch feedback to a button
     */
    public addTouchFeedback(button: Phaser.GameObjects.GameObject, config?: FeedbackConfig): void {
        // Add touch feedback effects
        if (config?.haptic && navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Visual feedback
        if (button instanceof Phaser.GameObjects.Container) {
            const originalScale = { x: button.scaleX, y: button.scaleY };
            
            // Scale up slightly on touch
            button.setScale(originalScale.x * 1.1, originalScale.y * 1.1);
            
            // Return to original scale after a short delay
            this.scene.time.delayedCall(100, () => {
                if (button.active) {
                    button.setScale(originalScale.x, originalScale.y);
                }
            });
        }
    }

    /**
     * Adds accessibility support to UI elements
     */
    public addAccessibilitySupport(config: AccessibilityConfig): void {
        // In a real implementation, this would add ARIA attributes and keyboard navigation
        // For now, we'll just log the accessibility config
        console.log('Accessibility support added:', config);
    }

    /**
     * Enables keyboard navigation for UI elements
     */
    public enableKeyboardNavigation(): void {
        this.state.keyboardNavigationActive = true;
        // Implementation would handle keyboard focus management
        console.log('Keyboard navigation enabled');
    }

    /**
     * Gets current UI state
     */
    public getState(): Readonly<WalletUIState> {
        return { ...this.state };
    }

    /**
     * Cleans up all UI components
     */
    public cleanup(): void {
        // Clear all active message timers
        this.activeMessageTimers.forEach(timer => timer.destroy());
        this.activeMessageTimers = [];
        
        // Clear all active tweens
        this.activeTweens.forEach(tween => tween.stop());
        this.activeTweens = [];
        
        // Clear all active notifications
        this.activeNotifications.forEach(notification => notification.destroy());
        this.activeNotifications = [];
        
        // Clear all timers
        this.activeTimers.forEach(timer => timer.destroy());
        this.activeTimers = [];
        
        // Destroy UI components
        if (this.gradientOverlay) {
            this.gradientOverlay.destroy();
            this.gradientOverlay = null;
        }
        
        if (this.loadingOverlay) {
            this.loadingOverlay.destroy();
            this.loadingOverlay = null;
        }
        
        if (this.connectButtonContainer) {
            this.connectButtonContainer.destroy();
            this.connectButtonContainer = null;
        }
        
        if (this.continueButton) {
            this.continueButton.destroy();
            this.continueButton = null;
        }
        
        if (this.messageContainer) {
            this.messageContainer.destroy();
            this.messageContainer = null;
        }
        
        if (this.progressBar) {
            this.progressBar.destroy();
            this.progressBar = null;
        }
        
        // Clean up crystal elements
        this.crystalHighlights.forEach(highlight => highlight.destroy());
        this.crystalHighlights = [];
        
        this.gemAccents.forEach(gem => gem.destroy());
        this.gemAccents = [];
        
        console.log('WalletUIManager: Cleanup completed');
    }

    /**
     * Creates a connect button with the specified configuration
     */
    public createConnectButton(config?: EnhancedButtonConfig): Phaser.GameObjects.Container {
        // If no config provided, use default values
        const buttonConfig: EnhancedButtonConfig = config || {
            text: '💎 Connect Crystal Wallet',
            fontSize: '20px',
            backgroundColor: this.CRYSTAL_STYLES.crystalColors.primary,
            color: '#0a0a2a',
            padding: { x: 20, y: 10 },
            variant: 'primary',
            size: 'lg',
            fullWidth: false,
            icon: '💎',
            iconPosition: 'left',
            loading: false,
            disabled: false,
            animation: {
                hover: this.CRYSTAL_STYLES.animations.fast,
                click: this.CRYSTAL_STYLES.animations.fast,
                focus: this.CRYSTAL_STYLES.animations.fast
            },
            accessibility: {
                ariaLabel: 'Connect crystal wallet to access NFTs and rewards',
                role: 'button',
                tabIndex: 0
            }
        };
        
        return this.createModernButton(buttonConfig);
    }

    /**
     * Creates an input field with the specified configuration
     */
    public createInputField(config: InputFieldConfig): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);
        
        // Create input background
        const background = this.scene.add.graphics();
        background.fillStyle(0x0a0a2a, 0.7);
        background.fillRoundedRect(0, 0, 300, 40, 8);
        background.lineStyle(1, 0xb9f3ff, 1);
        background.strokeRoundedRect(0, 0, 300, 40, 8);
        
        // Create label
        const label = this.scene.add.text(0, -20, config.label || '', {
            fontSize: '14px',
            color: this.CRYSTAL_STYLES.crystalColors.primary,
            fontStyle: 'bold'
        });
        
        // Create placeholder text
        const placeholder = this.scene.add.text(10, 20, config.placeholder, {
            fontSize: '16px',
            color: this.CRYSTAL_STYLES.crystalColors.highlight,
        }).setOrigin(0, 0.5);
        
        container.add([background, label, placeholder]);
        
        return container;
    }

    /**
     * Validates a form based on its state
     */
    public validateForm(formState: FormState): boolean {
        // Simple validation - check if all required fields have values
        for (const field in formState.values) {
            if (formState.errors[field]) {
                return false;
            }
        }
        
        return formState.isValid;
    }

    /**
     * Shows a warning message with crystal styling
     */
    public showWarningMessage(message: string, options?: Partial<NotificationConfig>): void {
        this.showNotification({
            type: NotificationType.WARNING,
            text: `⚠️ ${message}`,
            fontSize: modernUITheme.typography.fontSize.md,
            color: modernUITheme.colors.warning,
            title: options?.title || 'Crystal Warning',
            position: 'top-right',
            dismissible: true,
            autoClose: true,
            duration: 4000,
            animation: {
                enter: { duration: 300, easing: 'Back.easeOut' },
                exit: { duration: 200, easing: 'Power2.easeIn' }
            },
            ...options
        });
    }
}