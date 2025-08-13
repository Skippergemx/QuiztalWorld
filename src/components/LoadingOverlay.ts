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
        
        // Semi-transparent background
        const bg = this.scene.add.rectangle(
            0, 
            0, 
            this.scene.scale.width,
            this.scene.scale.height, // Fixed: Use scale.height instead of height
            0x000000,
            0.7
        );
        bg.setOrigin(0);

        // Loading text
        this.loadingText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 - 40,
            'Fetching NFTs...',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Progress bar background
        const barWidth = 300;
        const barHeight = 20;
        const barBg = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 + 20,
            barWidth,
            barHeight,
            0x333333
        ).setOrigin(0.5);

        // Progress bar
        this.progressBar = this.scene.add.graphics();
        this.progressBar.setPosition(
            this.scene.scale.width / 2 - barWidth / 2,
            this.scene.scale.height / 2 + 20 - barHeight / 2
        );

        // Progress text
        this.progressText = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2 + 50,
            '0/0 NFTs loaded',
            {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial',
                align: 'center'
            }
        ).setOrigin(0.5);

        this.overlay.add([bg, this.loadingText, barBg, this.progressBar, this.progressText]);
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
            console.error(`Error loading NFT image: ${file.key}`);
            this.loadedImages++;
            this.updateProgress();
        });
    }

    private updateProgress() {
        const progress = this.totalImages > 0 ? this.loadedImages / this.totalImages : 0;
        
        // Update progress bar
        this.progressBar.clear();
        this.progressBar.fillStyle(0x3498db);
        this.progressBar.fillRect(0, 0, 300 * progress, 20);

        // Update progress text
        this.progressText.setText(`${this.loadedImages}/${this.totalImages} NFTs loaded`);

        // Hide overlay when all images are loaded
        if (this.loadedImages >= this.totalImages && this.totalImages > 0) {
            this.scene.time.delayedCall(500, () => this.hide());
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