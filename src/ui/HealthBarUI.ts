import Phaser from 'phaser';

export default class HealthBarUI {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  
  private background!: Phaser.GameObjects.Graphics;
  private healthFill!: Phaser.GameObjects.Graphics;
  private border!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  
  private currentHealth: number;
  private maxHealth: number;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    width: number = 100, 
    height: number = 12,
    maxHealth: number = 100
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    
    this.create();
  }

  private create(): void {
    // Create background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x333333, 0.8);
    this.background.fillRoundedRect(
      this.x, 
      this.y, 
      this.width, 
      this.height, 
      4
    );
    
    // Create health fill
    this.healthFill = this.scene.add.graphics();
    
    // Create border
    this.border = this.scene.add.graphics();
    this.border.lineStyle(2, 0xffffff, 1);
    this.border.strokeRoundedRect(
      this.x, 
      this.y, 
      this.width, 
      this.height, 
      4
    );
    
    // Create health text
    this.healthText = this.scene.add.text(
      this.x + this.width / 2, 
      this.y + this.height / 2, 
      `${this.currentHealth}/${this.maxHealth}`,
      {
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Set depths
    this.background.setDepth(100);
    this.healthFill.setDepth(101);
    this.border.setDepth(102);
    this.healthText.setDepth(103);
    
    // Initial update
    this.updateHealthBar();
  }

  public updateHealth(currentHealth: number, maxHealth?: number): void {
    this.currentHealth = currentHealth;
    if (maxHealth !== undefined) {
      this.maxHealth = maxHealth;
    }
    
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    // Update health fill
    this.healthFill.clear();
    
    const healthPercent = this.currentHealth / this.maxHealth;
    const fillWidth = Math.max(0, healthPercent * this.width);
    
    // Choose color based on health percentage
    let fillColor: number;
    if (healthPercent > 0.6) {
      fillColor = 0x00ff00; // Green
    } else if (healthPercent > 0.3) {
      fillColor = 0xffff00; // Yellow
    } else {
      fillColor = 0xff0000; // Red
    }
    
    this.healthFill.fillStyle(fillColor, 0.8);
    this.healthFill.fillRoundedRect(
      this.x, 
      this.y, 
      fillWidth, 
      this.height, 
      4
    );
    
    // Update text
    this.healthText.setText(`${Math.max(0, Math.floor(this.currentHealth))}/${this.maxHealth}`);
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    
    // Update positions of all elements
    this.background.clear();
    this.background.fillStyle(0x333333, 0.8);
    this.background.fillRoundedRect(
      this.x, 
      this.y, 
      this.width, 
      this.height, 
      4
    );
    
    this.border.clear();
    this.border.lineStyle(2, 0xffffff, 1);
    this.border.strokeRoundedRect(
      this.x, 
      this.y, 
      this.width, 
      this.height, 
      4
    );
    
    this.healthText.setPosition(
      this.x + this.width / 2, 
      this.y + this.height / 2
    );
    
    // Update health bar to match new position
    this.updateHealthBar();
  }

  public destroy(): void {
    this.background.destroy();
    this.healthFill.destroy();
    this.border.destroy();
    this.healthText.destroy();
  }

  public setVisible(visible: boolean): void {
    this.background.setVisible(visible);
    this.healthFill.setVisible(visible);
    this.border.setVisible(visible);
    this.healthText.setVisible(visible);
  }
}