import modernUITheme, { UIHelpers } from '../utils/UITheme';

export class LoadingOverlay {
    private scene: Phaser.Scene;
    private overlay!: Phaser.GameObjects.Container;
    private loadingText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Graphics;
    private dots: number = 0;
    private updateTimer: Phaser.Time.TimerEvent | null = null;
    private totalImages: number = 0;
    private loadedImages: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createOverlay();
        this.setupLoadingHandlers();
    }

    private createOverlay() {
        this.overlay = this.scene.add.container(0, 0);
        
        // Modern semi-transparent background with glass effect
        const bg = this.scene.add.rectangle(
            0, 
            0, 
            this.scene.scale.width,
            this.scene.scale.height,
            UIHelpers.hexToNumber(modernUITheme.colors.background.overlay),
            0.8
        );
        bg.setOrigin(0);

        // Create modern loading text with better typography
        this.loadingText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 - 60,
            'Loading NFTs...',
            {
                fontSize: modernUITheme.typography.fontSize.xl,
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.text.primary,
                fontStyle: 'bold', // Use fontStyle instead of fontWeight
                align: 'center',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: modernUITheme.colors.background.primary,
                    blur: 4,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // Create modern progress bar container
        const barWidth = 320;
        const barHeight = 24;
        const barContainer = this.scene.add.graphics();
        
        // Progress bar background with rounded corners
        barContainer.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.background.secondary), 0.8);
        barContainer.fillRoundedRect(
            this.scene.scale.width / 2 - barWidth / 2,
            this.scene.scale.height / 2 + 10,
            barWidth,
            barHeight,
            modernUITheme.borderRadius.md
        );
        
        // Progress bar border
        barContainer.lineStyle(2, UIHelpers.hexToNumber(modernUITheme.colors.border.accent), 0.6);
        barContainer.strokeRoundedRect(
            this.scene.scale.width / 2 - barWidth / 2,
            this.scene.scale.height / 2 + 10,
            barWidth,
            barHeight,
            modernUITheme.borderRadius.md
        );

        // Create the actual progress bar
        this.progressBar = this.scene.add.graphics();
        this.progressBar.setPosition(
            this.scene.scale.width / 2 - barWidth / 2 + 2,
            this.scene.scale.height / 2 + 12
        );

        // Enhanced progress text
        this.progressText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 + 50,
            '0/0 items loaded',
            {
                fontSize: modernUITheme.typography.fontSize.md,
                fontFamily: modernUITheme.typography.fontFamily.primary,
                color: modernUITheme.colors.text.secondary,
                align: 'center'
            }
        ).setOrigin(0.5);

        // Add spinning loader animation
        const spinner = this.scene.add.graphics();
        spinner.lineStyle(4, UIHelpers.hexToNumber(modernUITheme.colors.accent), 1);
        spinner.strokeCircle(0, 0, 20);
        spinner.lineStyle(4, UIHelpers.hexToNumber(modernUITheme.colors.accent), 0.3);
        spinner.strokeCircle(0, 0, 20);
        spinner.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2 - 120);
        
        // Animate the spinner
        this.scene.tweens.add({
            targets: spinner,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        this.overlay.add([bg, this.loadingText, barContainer, this.progressBar, this.progressText, spinner]);
        this.overlay.setDepth(1000);
        this.overlay.setVisible(false);
    }

    private setupLoadingHandlers() {
        // Handle image loading events
        this.scene.load.on('filecomplete', (key: string) => {
            if (key.startsWith('nft-')) {
                this.loadedImages++;
                this.updateProgress();
            }
        });

        this.scene.load.on('loaderror', (file: Phaser.Loader.File) => {
            // Error loading NFT image silently handled
            this.loadedImages++;
            this.updateProgress();
        });
    }

    private updateProgress() {
        const progress = this.totalImages > 0 ? this.loadedImages / this.totalImages : 0;
        
        // Update progress bar with modern gradient animation
        this.progressBar.clear();
        
        const barWidth = 316; // Account for container padding
        const barHeight = 20;
        const progressWidth = barWidth * progress;
        
        // Create gradient progress bar
        if (progress > 0) {
            const color1 = UIHelpers.hexToNumber(modernUITheme.colors.accent);
            const color2 = UIHelpers.hexToNumber(modernUITheme.colors.primary);
            
            this.progressBar.fillGradientStyle(color1, color2, color1, color2, 1);
            this.progressBar.fillRoundedRect(
                0, 0, 
                progressWidth, barHeight, 
                modernUITheme.borderRadius.sm
            );
            
            // Add progress glow effect
            this.progressBar.lineStyle(1, color1, 0.5);
            this.progressBar.strokeRoundedRect(
                0, 0, 
                progressWidth, barHeight, 
                modernUITheme.borderRadius.sm
            );
        }

        // Update progress text with better formatting
        this.progressText.setText(`${this.loadedImages} / ${this.totalImages} items loaded`);

        // Smooth hide animation when complete
        if (this.loadedImages >= this.totalImages && this.totalImages > 0) {
            this.scene.time.delayedCall(800, () => {
                this.scene.tweens.add({
                    targets: this.overlay,
                    alpha: 0,
                    duration: modernUITheme.animations.duration.normal,
                    ease: modernUITheme.animations.easing.easeOut,
                    onComplete: () => this.hide()
                });
            });
        }
    }

    show(message: string = 'Fetching NFTs...', totalImages: number = 0) {
        this.loadedImages = 0;
        this.totalImages = totalImages;
        this.loadingText.setText(message);
        this.progressText.setText(`0/${totalImages} NFTs loaded`);
        this.progressBar.clear();
        this.overlay.setVisible(true);
        this.updateDots();
    }

    hide() {
        this.overlay.setVisible(false);
        if (this.updateTimer) {
            this.updateTimer.destroy();
            this.updateTimer = null;
        }
    }

    private updateDots() {
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }

        this.updateTimer = this.scene.time.addEvent({
            delay: 500,
            callback: () => {
                this.dots = (this.dots + 1) % 4;
                const dots = '.'.repeat(this.dots);
                this.loadingText.setText(`Fetching NFTs${dots}`);
            },
            loop: true
        });
    }

    reset() {
        this.loadedImages = 0;
        this.totalImages = 0;
        this.progressBar.clear();
        this.progressText.setText('0/0 NFTs loaded');
    }
}