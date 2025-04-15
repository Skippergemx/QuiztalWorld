import Phaser from 'phaser';
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { app } from '../utils/firebase';


const db = getFirestore(app);

export default class UIScene extends Phaser.Scene {
  private logoutButton!: Phaser.GameObjects.Text;
  private balanceText!: Phaser.GameObjects.Text;
  private inventoryButton!: Phaser.GameObjects.Text;
  private backgroundBox!: Phaser.GameObjects.Rectangle;
  private playerId!: string;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const user = JSON.parse(localStorage.getItem('quiztal-player') || '{}'); 

    this.playerId = user?.uid || '';

    // 🎨 Background UI panel
    const panelWidth = 220;
    const panelHeight = 200;
    this.backgroundBox = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.5)
      .setOrigin(0)
      .setStrokeStyle(2, 0xffffff)
      .setScrollFactor(0)
      .setDepth(999);  

    // 🔴 Create "Logout" button
    this.logoutButton = this.createUIButton('🚪 Logout', '#ff5733', '#ff7f50', () => {
      this.handleLogout();
    });

    // 💰 Balance text
    this.balanceText = this.add.text(0, 0, 'Off Chain Quiztals: 0', {
      fontSize: '18px',
      color: '#ffffcc',
      fontFamily: 'Georgia',
      stroke: '#000000',
      strokeThickness: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 1, fill: true }
    })
    .setScrollFactor(0)
    .setDepth(1000);

    // 🎒 Inventory button
    this.inventoryButton = this.createUIButton('🎒 Inventory', '#32cd32', '#3cb371', () => {
      this.openInventory();
    });

    // Positioning
    this.updateButtonPosition();
    this.scale.on('resize', this.updateButtonPosition, this);

    // Firestore balance
    this.loadPlayerBalance();
  }

  private createUIButton(text: string, color: string, hoverColor: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: color,
      padding: { x: 14, y: 8 },
      fontFamily: 'Verdana',
      stroke: '#000',
      strokeThickness: 2,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, fill: true }
    })
    .setInteractive({ useHandCursor: true })
    .setScrollFactor(0)
    .setDepth(1000)
    .on('pointerover', () => btn.setStyle({ backgroundColor: hoverColor }))
    .on('pointerout', () => btn.setStyle({ backgroundColor: color }))
    .on('pointerdown', onClick);

    return btn;
  }

  private updateButtonPosition() {
    const buttonSpacing = 12;
    const startX = 20;
    let currentY = 20;


    this.logoutButton.setPosition(startX, currentY);
    currentY += this.logoutButton.height + buttonSpacing;

    this.balanceText.setPosition(startX, currentY);
    currentY += this.balanceText.height + buttonSpacing;

    this.inventoryButton.setPosition(startX, currentY);

    // Re-size background box based on content height
    const totalHeight = currentY + this.inventoryButton.height + 20;
    this.backgroundBox.setSize(240, totalHeight);
    this.backgroundBox.setPosition(10, 10);
  }

  private handleLogout() {
    console.log('🔴 Logging out...');
    localStorage.removeItem('quiztal-player');
    this.scene.stop('GameScene');
    this.scene.start('LoginCharacterScene');
  }

  private openInventory() {
    console.log('🎒 Opening Inventory...');
    this.scene.launch('InventoryScene');
  }

  private loadPlayerBalance() {
    if (!this.playerId) return console.log('⚠️ No player ID found!');

    const playerRef = doc(db, 'players', this.playerId);
    onSnapshot(playerRef, (playerDoc) => {
      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        const quiztalBalance = playerData?.quiztals || 0;
        this.updateBalance(quiztalBalance);
      } else {
        console.log('⚠️ Player not found in Firestore!');
      }
    }, (error) => {
      console.error('❌ Error listening to balance updates:', error);
    });
  }

  public updateBalance(balance: number) {
    const roundedBalance = Math.round(balance * 100) / 100;
    this.balanceText.setText(`Off Chain Quiztals: ${roundedBalance}`);
  }
}
