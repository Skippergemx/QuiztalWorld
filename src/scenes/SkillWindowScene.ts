import Phaser from "phaser";
import SkillManager from '../managers/SkillManager';
import { Skill } from '../managers/SkillManager';

export default class SkillWindowScene extends Phaser.Scene {
    private skillManager!: SkillManager;
    private onCloseCallback?: () => void;
    private contentContainer!: Phaser.GameObjects.Container;
    private skillWindowContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'SkillWindowScene' });
    }

    init(data: { onClose?: () => void }) {
        if (data.onClose) {
            this.onCloseCallback = data.onClose;
        }
    }

    async create() {
        // Initialize skill manager
        this.skillManager = SkillManager.getInstance(this);

        // Add event listener for when window is closed
        this.events.on('skillWindowClosed', this.closeWindow, this);

        // Get center position from camera
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Add semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);
        bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', (_pointer: Phaser.Input.Pointer, x: number, y: number) => {
                // Close window when clicking outside the content area
                const windowWidth = Math.min(this.scale.width * 0.8, 600);
                const windowHeight = Math.min(this.scale.height * 0.7, 500);
                const contentArea = new Phaser.Geom.Rectangle(
                    centerX - windowWidth / 2,
                    centerY - windowHeight / 2,
                    windowWidth,
                    windowHeight
                );
                if (!contentArea.contains(x, y)) {
                    this.closeWindow();
                }
            });

        // Create skill window container for animations
        this.skillWindowContainer = this.add.container(centerX, centerY);

        // Window dimensions
        const windowWidth = Math.min(this.scale.width * 0.8, 600);
        const windowHeight = Math.min(this.scale.height * 0.7, 500);

        // Create main window container (centered at 0,0 relative to parent container)
        const windowContainer = this.add.container(0, 0);

        // Window background
        const windowBg = this.add.graphics();
        windowBg.fillStyle(0x2c3e50, 1);
        windowBg.fillRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, windowHeight, 10);
        windowBg.lineStyle(2, 0x3498db, 1);
        windowBg.strokeRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, windowHeight, 10);

        // Header
        const header = this.add.graphics();
        header.fillStyle(0x3498db, 1);
        header.fillRoundedRect(-windowWidth/2, -windowHeight/2, windowWidth, 50, 10);

        // Header title
        const title = this.add.text(0, -windowHeight/2 + 25, '🎯 Skills', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.text(windowWidth/2 - 25, -windowHeight/2 + 15, '✖', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => closeBtn.setTint(0xff0000))
        .on('pointerout', () => closeBtn.clearTint())
        .on('pointerdown', () => this.closeWindow());

        // Content area
        this.contentContainer = this.add.container(-windowWidth/2 + 20, -windowHeight/2 + 60);

        // Add skills content
        await this.createSkillsContent();

        // Add all elements to containers
        windowContainer.add([windowBg, header, title, closeBtn, this.contentContainer]);
        this.skillWindowContainer.add(windowContainer);
        this.add.existing(this.skillWindowContainer);

        // Set up keyboard controls
        this.setupKeyboardControls();

        // Show with slide-in animation
        this.showWithAnimation();
    }

    private showWithAnimation(): void {
        // Start with the window off-screen below
        const startY = 50;
        this.skillWindowContainer.setY(this.skillWindowContainer.y + startY);
        this.skillWindowContainer.setAlpha(0);
        
        // Animate sliding in with bounce effect
        this.tweens.add({
            targets: this.skillWindowContainer,
            alpha: 1,
            y: this.skillWindowContainer.y - startY,
            duration: 500,
            ease: 'Bounce.easeOut'
        });
    }

    private hideWithAnimation(callback: () => void): void {
        // Animate sliding out
        this.tweens.add({
            targets: this.skillWindowContainer,
            alpha: 0,
            y: this.skillWindowContainer.y + 30,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: callback
        });
    }

    private async createSkillsContent(): Promise<void> {
        const skills = this.skillManager.getSkills();
        let currentY = 0;
        const sectionSpacing = 20;

        // Add skills to the content container
        for (let i = 0; i < skills.length; i++) {
            const skill = skills[i];
            
            // Add skill section
            currentY = await this.addSkillSection(skill, currentY);
            
            // Add separator line except for the last skill
            if (i < skills.length - 1) {
                const windowWidth = Math.min(this.scale.width * 0.8, 600);
                const separator = this.add.graphics();
                separator.lineStyle(1, 0x3498db, 0.3);
                separator.lineBetween(0, currentY + 5, windowWidth - 40, currentY + 5);
                this.contentContainer.add(separator);
                currentY += sectionSpacing;
            }
        }
    }

    private async addSkillSection(skill: Skill, startY: number): Promise<number> {
        let currentY = startY;
        
        // Skill name
        const nameText = this.add.text(0, currentY, skill.name, {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.contentContainer.add(nameText);
        currentY += 25;

        // Description
        const descText = this.add.text(10, currentY, skill.description, {
            fontSize: '14px',
            color: '#3498db'
        });
        this.contentContainer.add(descText);
        currentY += 20;

        // Status
        const statusText = this.add.text(10, currentY, `Status: ${this.skillManager.getSkillStatusText(skill.id)}`, {
            fontSize: '14px',
            color: '#e74c3c'
        });
        this.contentContainer.add(statusText);
        currentY += 30;

        return currentY;
    }

    private setupKeyboardControls(): void {
        // Add keyboard event listeners for Q and ESC keys to close the window
        this.input.keyboard?.on('keydown-Q', () => this.closeWindow());
        this.input.keyboard?.on('keydown-q', () => this.closeWindow());
        this.input.keyboard?.on('keydown-ESC', () => this.closeWindow());
        this.input.keyboard?.on('keydown-Esc', () => this.closeWindow());
        this.input.keyboard?.on('keydown-esc', () => this.closeWindow());
    }

    private closeWindow(): void {
        // Use animation to close the window
        this.hideWithAnimation(() => {
            if (this.onCloseCallback) {
                this.onCloseCallback();
            }
            this.scene.stop('SkillWindowScene');
        });
    }

    private handleResize(): void {
        // Handle window resize by maintaining centered position
        console.log('SkillWindowScene: Resize event detected');
        
        // Update the skill window container to maintain center position
        if (this.skillWindowContainer) {
            const centerX = this.cameras.main.centerX;
            const centerY = this.cameras.main.centerY;
            this.skillWindowContainer.setPosition(centerX, centerY);
        }
        
        // For simplicity, we'll just close the window on resize
        this.closeWindow();
    }

    shutdown() {
        // Cleanup event listeners
        this.scale.off('resize', this.handleResize, this);
        this.events.off('skillWindowClosed', this.closeWindow, this);
        
        // Clean up keyboard listeners
        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllListeners();
        }
        
        // Clean up input listeners
        if (this.input) {
            this.input.off('pointerdown');
        }
        
        // Don't destroy the skill manager singleton instance
        // Just clear the reference
        this.skillManager = null as any;
    }
}