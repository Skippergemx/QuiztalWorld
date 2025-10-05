import Phaser from "phaser";
import modernUITheme, { UIHelpers } from './UITheme';

export interface BaseDialogConfig {
  width?: number;
  height?: number;
  depth?: number;
}

export class BaseDialog {
  protected scene: Phaser.Scene;
  protected dialogContainer: Phaser.GameObjects.Container;
  protected background: Phaser.GameObjects.Graphics | null = null; // Store background reference
  
  protected dialogWidth: number;
  protected dialogHeight: number;
  protected isMobile: boolean;
  protected depth: number;
  protected minHeight: number; // Add minimum height property
  
  constructor(scene: Phaser.Scene, config?: BaseDialogConfig) {
    this.scene = scene;
    this.isMobile = scene.scale.width < 768;
    
    // Default sizing based on OptimizedEnhancedQuizDialog
    this.dialogWidth = config?.width || (this.isMobile ? scene.scale.width * 0.95 : 750);
    this.minHeight = config?.height || (this.isMobile ? 420 : 480); // Store as minimum height
    this.dialogHeight = this.minHeight; // Will be adjusted dynamically
    this.depth = config?.depth || 2000;
    
    this.dialogContainer = scene.add.container(0, 0);
    this.dialogContainer.setDepth(this.depth);
    this.dialogContainer.setVisible(false);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.scene.events.once('create', () => {
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.on('cameramove', this.updatePosition, this);
        this.scene.cameras.main.on('scroll', this.updatePosition, this);
      }
    });

    this.scene.events.on('shutdown', () => {
      this.cleanup();
    });
  }

  protected updatePosition = (): void => {
    if (!this.scene?.cameras?.main || !this.dialogContainer) {
      return;
    }

    const camera = this.scene.cameras.main;
    const centerX = (camera.scrollX + camera.width / 2) || 0;
    let centerY = (camera.scrollY + camera.height / 2) || 0;

    // For mobile devices, ensure the dialog doesn't go above the screen
    if (this.isMobile) {
      const minY = camera.scrollY + 20; // Minimum Y position with some padding
      const maxY = camera.scrollY + camera.height - this.dialogHeight - 20; // Maximum Y position with padding
      
      // Ensure dialog is within visible bounds
      centerY = Math.max(minY, Math.min(centerY, maxY));
    }

    this.dialogContainer.setPosition(
      centerX - this.dialogWidth / 2,
      centerY - this.dialogHeight / 2
    );
  };

  protected createStandardBackground(): void {
    // Remove existing background if it exists
    if (this.background) {
      this.background.destroy();
    }
    
    this.background = this.scene.add.graphics();
    
    // Enhanced gradient background matching OptimizedEnhancedQuizDialog
    this.background.fillGradientStyle(
      UIHelpers.hexToNumber(modernUITheme.colors.background.card),
      UIHelpers.hexToNumber(modernUITheme.colors.background.card),
      UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
      UIHelpers.hexToNumber(modernUITheme.colors.background.primary),
      0.98
    );
    
    this.background.fillRoundedRect(0, 0, this.dialogWidth, this.dialogHeight, 
      UIHelpers.getResponsiveSpacing(this.isMobile, 16, 12));
    
    // Enhanced border with accent color
    this.background.lineStyle(
      UIHelpers.getResponsiveSpacing(this.isMobile, 3, 2),
      UIHelpers.hexToNumber(modernUITheme.colors.accent),
      0.8
    );
    this.background.strokeRoundedRect(0, 0, this.dialogWidth, this.dialogHeight,
      UIHelpers.getResponsiveSpacing(this.isMobile, 16, 12));
    
    // Add subtle inner glow
    this.background.lineStyle(
      UIHelpers.getResponsiveSpacing(this.isMobile, 1, 1),
      UIHelpers.hexToNumber('#ffffff'),
      0.3
    );
    this.background.strokeRoundedRect(2, 2, this.dialogWidth - 4, this.dialogHeight - 4,
      UIHelpers.getResponsiveSpacing(this.isMobile, 14, 10));
    
    this.dialogContainer.addAt(this.background, 0); // Add at the bottom (index 0) so it's behind other elements
  }

  protected createHeaderBackground(y: number, height: number): void {
    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UIHelpers.hexToNumber(modernUITheme.colors.primary), 0.08);
    headerBg.fillRoundedRect(8, y + 8, this.dialogWidth - 16, height - 8, 6);
    this.dialogContainer.add(headerBg);
  }

  protected createSectionBackground(x: number, y: number, width: number, height: number): void {
    const sectionBg = this.scene.add.graphics();
    sectionBg.fillStyle(UIHelpers.hexToNumber('#ffffff'), 0.04);
    sectionBg.fillRoundedRect(x, y, width, height, 6);
    this.dialogContainer.add(sectionBg);
  }

  protected showWithAnimation(): void {
    this.dialogContainer.setVisible(true);
    this.dialogContainer.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.dialogContainer,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
    
    this.updatePosition();
  }

  public hide(): void {
    this.dialogContainer.setVisible(false);
  }

  public cleanup(): void {
    if (this.dialogContainer) {
      this.dialogContainer.destroy(true);
    }
  }

  public isVisible(): boolean {
    return this.dialogContainer.visible;
  }
}