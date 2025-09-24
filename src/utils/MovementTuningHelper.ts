/**
 * Movement Tuning Helper
 * 
 * Utility class to help tune movement parameters for mobile controls
 * 
 * Usage:
 * 1. Import this in your scene
 * 2. Call MovementTuningHelper.showControls(scene, mobileControlsManager) in your create() method
 * 3. Use the UI to adjust parameters in real-time
 */

export class MovementTuningHelper {
  private static instance: MovementTuningHelper | null = null;
  private mobileControlsManager: any;
  private scene!: Phaser.Scene;
  private guiContainer: Phaser.GameObjects.Container | null = null;
  
  private constructor() {}
  
  public static getInstance(): MovementTuningHelper {
    if (!MovementTuningHelper.instance) {
      MovementTuningHelper.instance = new MovementTuningHelper();
    }
    return MovementTuningHelper.instance;
  }
  
  /**
   * Show tuning controls for mobile movement parameters
   * @param scene The Phaser scene
   * @param mobileControlsManager The MobileControlsManager instance
   */
  public showControls(scene: Phaser.Scene, mobileControlsManager: any): void {
    this.scene = scene;
    this.mobileControlsManager = mobileControlsManager;
    
    // Create GUI container
    this.guiContainer = scene.add.container(10, 10);
    this.guiContainer.setDepth(1000); // Ensure it's on top
    
    // Background
    const bg = scene.add.rectangle(0, 0, 200, 180, 0x000000, 0.7);
    bg.setOrigin(0, 0);
    this.guiContainer.add(bg);
    
    // Title
    const title = scene.add.text(10, 5, 'Movement Tuning', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0, 0);
    this.guiContainer.add(title);
    
    // Smoothing slider
    this.createSlider(scene, 10, 25, 'Smoothing', 0.01, 0.5, 
      mobileControlsManager.getVelocitySmoothing(), 
      (value: number) => {
        mobileControlsManager.setVelocitySmoothing(value);
      });
    
    // Direction change delay slider
    this.createSlider(scene, 10, 50, 'Dir Delay (ms)', 50, 500,
      mobileControlsManager.getDirectionChangeDelay(),
      (value: number) => {
        mobileControlsManager.setDirectionChangeDelay(value);
      });
    
    // Stop threshold slider
    this.createSlider(scene, 10, 75, 'Stop Threshold', 0.1, 2.0,
      mobileControlsManager.getStopThreshold(),
      (value: number) => {
        mobileControlsManager.setStopThreshold(value);
      });
    
    // Close button
    const closeBtn = scene.add.text(170, 5, 'X', {
      fontSize: '12px',
      color: '#ff0000',
      fontStyle: 'bold'
    });
    closeBtn.setOrigin(0, 0);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.hideControls();
    });
    this.guiContainer.add(closeBtn);
  }
  
  private createSlider(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    label: string, 
    min: number, 
    max: number, 
    initialValue: number, 
    onChange: (value: number) => void
  ): void {
    // Label
    const labelText = scene.add.text(x, y, `${label}: ${initialValue.toFixed(2)}`, {
      fontSize: '10px',
      color: '#ffffff'
    });
    labelText.setOrigin(0, 0);
    this.guiContainer?.add(labelText);
    
    // Slider track
    const track = scene.add.rectangle(x, y + 15, 100, 8, 0x555555);
    track.setOrigin(0, 0);
    this.guiContainer?.add(track);
    
    // Slider handle
    const handleX = x + (initialValue - min) / (max - min) * 100;
    const handle = scene.add.rectangle(handleX, y + 15, 10, 12, 0xffffff);
    handle.setOrigin(0.5, 0.5);
    handle.setInteractive({ useHandCursor: true });
    
    // Make handle draggable
    scene.input.setDraggable(handle);
    handle.on('drag', (_: any, dragX: number) => {
      // Constrain to track
      const constrainedX = Phaser.Math.Clamp(dragX, x, x + 100);
      handle.x = constrainedX;
      
      // Calculate value
      const percentage = (constrainedX - x) / 100;
      const value = min + percentage * (max - min);
      
      // Update label
      labelText.setText(`${label}: ${value.toFixed(2)}`);
      
      // Call onChange callback
      onChange(value);
    });
    
    this.guiContainer?.add(handle);
  }
  
  public hideControls(): void {
    if (this.guiContainer) {
      this.guiContainer.destroy();
      this.guiContainer = null;
    }
  }
  
  /**
   * Log current movement parameters for debugging
   */
  public logMovementParams(): void {
    if (this.mobileControlsManager) {
      const debugInfo = this.mobileControlsManager.getDebugInfo();
      console.log('Movement Parameters:', {
        velocitySmoothing: debugInfo.velocityInfo.smoothing,
        directionChangeDelay: debugInfo.directionInfo.directionChangeDelay,
        targetVelocity: {
          x: debugInfo.velocityInfo.targetX,
          y: debugInfo.velocityInfo.targetY
        },
        currentVelocity: {
          x: debugInfo.velocityInfo.currentX,
          y: debugInfo.velocityInfo.currentY
        }
      });
    }
  }
}