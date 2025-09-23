import Phaser from 'phaser';
import { showDialog } from '../utils/SimpleDialogBox';

interface MobileControlsConfig {
  joystickScale: number;
  buttonScale: number;
  joystickAlpha: number;
  buttonAlpha: number;
}

export default class MobileControlsManager {
  private scene: Phaser.Scene;
  private playerManager: any; // PlayerManager reference
  private networkMonitor: any; // NetworkMonitor reference
  
  // UI Elements
  private joyStick?: Phaser.GameObjects.Image;
  private joyStickBase?: Phaser.GameObjects.Image;
  private interactButton?: Phaser.GameObjects.Image;
  
  // State
  private isMobile: boolean = false;
  private isJoystickActive: boolean = false;
  
  // Configuration
  private config: MobileControlsConfig = {
    joystickScale: 1.4, // Increased scale for better visibility
    buttonScale: 1.5,   // Increased scale for better touch targets
    joystickAlpha: 0.9, // Increased alpha for better visibility
    buttonAlpha: 0.95   // Increased alpha for better visibility
  };

  private static instance: MobileControlsManager;

  private constructor(scene: Phaser.Scene, playerManager: any, networkMonitor: any) {
    this.scene = scene;
    this.playerManager = playerManager;
    this.networkMonitor = networkMonitor;
    this.detectMobile();
  }

  public static getInstance(scene: Phaser.Scene, playerManager: any, networkMonitor: any): MobileControlsManager {
    if (!MobileControlsManager.instance) {
      MobileControlsManager.instance = new MobileControlsManager(scene, playerManager, networkMonitor);
    }
    MobileControlsManager.instance.scene = scene;
    MobileControlsManager.instance.playerManager = playerManager;
    MobileControlsManager.instance.networkMonitor = networkMonitor;
    return MobileControlsManager.instance;
  }

  /**
   * Initialize mobile controls if on mobile device
   */
  public initializeMobileControls(): void {
    console.log('📱 MobileControlsManager: Checking for mobile device...');
    
    if (!this.isMobile) {
      console.log('🖥️ MobileControlsManager: Desktop detected, skipping mobile controls');
      return;
    }

    console.log('📱 MobileControlsManager: Mobile detected, creating controls...');
    this.createMobileUI();
    this.setupEventListeners();
    console.log('✅ MobileControlsManager: Mobile controls initialized');
  }

  /**
   * Update mobile controls configuration
   */
  public updateConfig(newConfig: Partial<MobileControlsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply new configuration to existing controls
    if (this.joyStickBase) {
      this.joyStickBase.setScale(this.config.joystickScale).setAlpha(this.config.joystickAlpha);
    }
    
    if (this.joyStick) {
      this.joyStick.setScale(this.config.joystickScale * 0.8).setAlpha(this.config.joystickAlpha);
    }
    
    if (this.interactButton) {
      this.interactButton.setScale(this.config.buttonScale).setAlpha(this.config.buttonAlpha);
    }
  }

  /**
   * Show or hide mobile controls
   */
  public setControlsVisibility(visible: boolean): void {
    const alpha = visible ? (this.isMobile ? this.config.joystickAlpha : 0) : 0;
    
    if (this.joyStickBase) {
      this.joyStickBase.setAlpha(alpha);
    }
    
    if (this.joyStick) {
      this.joyStick.setAlpha(alpha);
    }
    
    if (this.interactButton) {
      const buttonAlpha = visible ? (this.isMobile ? this.config.buttonAlpha : 0) : 0;
      this.interactButton.setAlpha(buttonAlpha);
    }
  }

  /**
   * Check if device is mobile
   */
  public getIsMobile(): boolean {
    return this.isMobile;
  }

  /**
   * Force enable/disable mobile mode (for testing)
   */
  public setMobileMode(enabled: boolean): void {
    this.isMobile = enabled;
    
    if (enabled && !this.joyStickBase) {
      this.createMobileUI();
      this.setupEventListeners();
    } else if (!enabled) {
      this.destroyMobileControls();
    }
  }

  // Private methods
  private detectMobile(): void {
    this.isMobile = this.scene.game.device.os.android || 
                    this.scene.game.device.os.iOS || 
                    this.scene.game.device.input.touch;
  }

  private createMobileUI(): void {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    this.createJoystick(screenWidth, screenHeight);
    this.createInteractButton(screenWidth, screenHeight);
  }

  private createJoystick(screenWidth: number, screenHeight: number): void {
    // Position joystick in bottom-left area with better safe margins
    const joystickX = Math.max(screenWidth * 0.15, 80); // Ensure minimum distance from edge
    const joystickY = screenHeight - Math.max(screenHeight * 0.2, 80); // Ensure it's above UI elements

    // Create joystick base with improved visibility
    this.joyStickBase = this.scene.add.image(joystickX, joystickY, 'joystick-base')
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(this.config.joystickAlpha)
      .setScale(this.config.joystickScale)
      .setInteractive()
      .setOrigin(0.5); // Ensure proper centering

    // Create joystick stick
    this.joyStick = this.scene.add.image(joystickX, joystickY, 'joystick')
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(this.config.joystickAlpha)
      .setScale(this.config.joystickScale * 0.7) // Make stick smaller than base
      .setOrigin(0.5); // Ensure proper centering
  }

  private createInteractButton(screenWidth: number, screenHeight: number): void {
    // Position interact button in bottom-right area with better safe margins
    const buttonX = screenWidth - Math.max(screenWidth * 0.15, 80); // Ensure minimum distance from edge
    const buttonY = screenHeight - Math.max(screenHeight * 0.2, 80); // Ensure it's above UI elements

    this.interactButton = this.scene.add.image(buttonX, buttonY, 'button-interact')
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(this.config.buttonAlpha)
      .setScale(this.config.buttonScale)
      .setInteractive()
      .setOrigin(0.5) // Ensure proper centering
      .on('pointerdown', () => {
        // Visual feedback on press
        if (this.interactButton) {
          this.interactButton.setScale(this.config.buttonScale * 0.9);
        }
      })
      .on('pointerup', () => {
        // Restore scale on release
        if (this.interactButton) {
          this.interactButton.setScale(this.config.buttonScale);
        }
      })
      .on('pointerout', () => {
        // Restore scale if pointer leaves
        if (this.interactButton) {
          this.interactButton.setScale(this.config.buttonScale);
        }
      });
  }

  private setupEventListeners(): void {
    if (!this.joyStickBase || !this.interactButton) {
      console.error('❌ MobileControlsManager: UI elements not created');
      return;
    }

    // Joystick events
    this.joyStickBase.on('pointerdown', this.handleJoystickStart, this);
    this.joyStickBase.on('pointermove', this.handleJoystickMove, this);
    this.joyStickBase.on('pointerup', this.handleJoystickEnd, this);
    this.joyStickBase.on('pointerout', this.handleJoystickEnd, this);

    // Interact button events
    this.interactButton.on('pointerdown', this.handleInteractButtonPress, this);
  }

  private handleJoystickStart(pointer: Phaser.Input.Pointer): void {
    if (!this.joyStick || !this.joyStickBase) return;
    
    this.isJoystickActive = true;
    this.handleJoystickMove(pointer);
  }

  private handleJoystickMove(pointer: Phaser.Input.Pointer): void {
    if (!this.joyStick || !this.joyStickBase || !pointer.isDown || !this.isJoystickActive) return;

    const baseX = this.joyStickBase.x;
    const baseY = this.joyStickBase.y;
    const angle = Phaser.Math.Angle.Between(baseX, baseY, pointer.x, pointer.y);
    const distance = Phaser.Math.Distance.Between(baseX, baseY, pointer.x, pointer.y);
    const maxDistance = 50;

    // Calculate joystick position
    let moveX = Math.cos(angle) * Math.min(distance, maxDistance);
    let moveY = Math.sin(angle) * Math.min(distance, maxDistance);

    // Update joystick visual position
    this.joyStick.x = baseX + moveX;
    this.joyStick.y = baseY + moveY;

    // Convert joystick movement to player velocity
    const speedMultiplier = 200 / 50; // Convert joystick distance to match keyboard speed
    const velocityX = moveX * speedMultiplier;
    const velocityY = moveY * speedMultiplier;
    
    // Set player velocity through PlayerManager
    if (this.playerManager && typeof this.playerManager.setPlayerVelocity === 'function') {
      this.playerManager.setPlayerVelocity(velocityX, velocityY);
    }

    // Update player animation direction
    this.updatePlayerAnimation(moveX, moveY);
  }

  private handleJoystickEnd(): void {
    if (!this.joyStick || !this.joyStickBase) return;
    
    this.isJoystickActive = false;
    
    // Reset joystick to center position
    this.joyStick.x = this.joyStickBase.x;
    this.joyStick.y = this.joyStickBase.y;
    
    // Stop player movement
    if (this.playerManager && typeof this.playerManager.setPlayerVelocity === 'function') {
      this.playerManager.setPlayerVelocity(0, 0);
    }
    
    // Set idle animation
    if (this.playerManager && typeof this.playerManager.getLastDirection === 'function' && 
        typeof this.playerManager.playPlayerAnimation === 'function') {
      const lastDirection = this.playerManager.getLastDirection();
      this.playerManager.playPlayerAnimation(`idle-${lastDirection}`);
    }
  }

  private handleInteractButtonPress(): void {
    console.log('📱 MobileControlsManager: Interact button pressed');
    
    // Check network connectivity before triggering interaction
    if (this.networkMonitor && typeof this.networkMonitor.getIsOnline === 'function') {
      if (!this.networkMonitor.getIsOnline()) {
        console.log('📱 MobileControlsManager: Network offline - preventing interaction');
        showDialog(this.scene, [
          {
            text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
            isExitDialog: true
          }
        ]);
        return;
      }
    }
    
    // Simulate keyboard 'C' key press for NPC interaction
    const keyEvent = new KeyboardEvent('keydown', { key: 'c' });
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.emit('keydown-C', keyEvent);
    }
  }

  private updatePlayerAnimation(moveX: number, moveY: number): void {
    if (!this.playerManager || 
        typeof this.playerManager.playPlayerAnimation !== 'function' ||
        typeof this.playerManager.setLastDirection !== 'function') {
      return;
    }

    // Determine direction based on joystick movement
    const direction = Math.abs(moveX) > Math.abs(moveY) 
      ? (moveX < 0 ? 'left' : 'right')
      : (moveY < 0 ? 'up' : 'down');
    
    // Play walk animation and update last direction
    this.playerManager.playPlayerAnimation(`walk-${direction}`);
    this.playerManager.setLastDirection(direction);
  }

  private destroyMobileControls(): void {
    if (this.joyStickBase) {
      this.joyStickBase.destroy();
      this.joyStickBase = undefined;
    }
    
    if (this.joyStick) {
      this.joyStick.destroy();
      this.joyStick = undefined;
    }
    
    if (this.interactButton) {
      this.interactButton.destroy();
      this.interactButton = undefined;
    }
    
    this.isJoystickActive = false;
  }

  /**
   * Resize mobile controls when screen size changes
   */
  public handleResize(): void {
    if (!this.isMobile || !this.joyStickBase || !this.interactButton) return;

    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    // Reposition joystick with better safe margins
    const joystickX = Math.max(screenWidth * 0.15, 80); // Ensure minimum distance from edge
    const joystickY = screenHeight - Math.max(screenHeight * 0.2, 80); // Ensure it's above UI elements
    this.joyStickBase.setPosition(joystickX, joystickY);
    this.joyStick?.setPosition(joystickX, joystickY);

    // Reposition interact button with better safe margins
    const buttonX = screenWidth - Math.max(screenWidth * 0.15, 80); // Ensure minimum distance from edge
    const buttonY = screenHeight - Math.max(screenHeight * 0.2, 80); // Ensure it's above UI elements
    this.interactButton.setPosition(buttonX, buttonY);
    
    // Add visual feedback during orientation change
    if (this.joyStickBase && this.joyStick && this.interactButton) {
      // Briefly highlight controls to show they've been repositioned
      this.joyStickBase.setAlpha(this.config.joystickAlpha * 1.5);
      this.joyStick.setAlpha(this.config.joystickAlpha * 1.5);
      this.interactButton.setAlpha(this.config.buttonAlpha * 1.5);
      
      // Reset alpha after a short delay
      this.scene.time.delayedCall(300, () => {
        if (this.joyStickBase) this.joyStickBase.setAlpha(this.config.joystickAlpha);
        if (this.joyStick) this.joyStick.setAlpha(this.config.joystickAlpha);
        if (this.interactButton) this.interactButton.setAlpha(this.config.buttonAlpha);
      });
    }
  }

  /**
   * Get current joystick state for debugging
   */
  public getJoystickState(): any {
    if (!this.joyStickBase || !this.joyStick) {
      return { active: false, position: null };
    }

    return {
      active: this.isJoystickActive,
      position: {
        base: { x: this.joyStickBase.x, y: this.joyStickBase.y },
        stick: { x: this.joyStick.x, y: this.joyStick.y },
        offset: {
          x: this.joyStick.x - this.joyStickBase.x,
          y: this.joyStick.y - this.joyStickBase.y
        }
      }
    };
  }

  /**
   * Clean up mobile controls
   */
  public destroy(): void {
    console.log('🧹 MobileControlsManager: Cleaning up mobile controls...');
    
    this.destroyMobileControls();
    MobileControlsManager.instance = null as any;
    
    console.log('✅ MobileControlsManager: Cleanup complete');
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      isMobile: this.isMobile,
      hasJoystick: !!this.joyStickBase,
      hasInteractButton: !!this.interactButton,
      joystickActive: this.isJoystickActive,
      config: this.config,
      joystickState: this.getJoystickState()
    };
  }
}