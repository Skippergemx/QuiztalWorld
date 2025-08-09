import Phaser from 'phaser';
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { app } from '../utils/firebase';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  icon?: string;
}

export default class InventoryScene extends Phaser.Scene {
  private items: InventoryItem[] = [];
  private itemContainers: Phaser.GameObjects.Container[] = [];
  private closeButton!: Phaser.GameObjects.Text;
  private playerId: string;
  private currentPage: number = 0;
  private itemsPerPage: number = 8; // Adjustable based on screen size

  constructor() {
    super({ key: 'InventoryScene' });
    this.playerId = JSON.parse(localStorage.getItem('quiztal-player') || '{}')?.uid || '';
  }

  create() {
    // Responsive sizing
    const width = this.scale.width;
    const height = this.scale.height;
    const isMobile = width < 768;
    
    // Panel size calculation
    const panelWidth = isMobile ? width * 0.95 : 600;
    const panelHeight = isMobile ? height * 0.8 : 400;

    // Semi-transparent dark background with blur effect
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setInteractive()
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Close inventory when clicking outside the panel
        if (pointer.y < (height - panelHeight) / 2 || 
            pointer.y > (height + panelHeight) / 2) {
          this.scene.stop();
        }
      });

    // Stylish inventory panel with gradient
    const panel = this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth,
      panelHeight,
      0x1a1a1a
    )
    .setStrokeStyle(2, 0x4a4a4a);

    // Add panel glow effect
    this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth + 4,
      panelHeight + 4,
      0x3498db,
      0.1
    );

    // Inventory header with icon
    const headerBg = this.add.rectangle(
      width / 2,
      height / 2 - (panelHeight / 2) + 30,
      panelWidth,
      60,
      0x2c3e50
    );

    this.add.text(
      width / 2,
      height / 2 - (panelHeight / 2) + 30,
      '🎒 Inventory',
      {
        fontSize: isMobile ? '24px' : '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0.5);

    // Styled close button
    this.closeButton = this.add.text(
      width / 2 + (panelWidth / 2) - 40,
      height / 2 - (panelHeight / 2) + 30,
      '✖',
      {
        fontSize: '24px',
        color: '#ffffff'
      }
    )
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => this.closeButton.setTint(0xff0000))
    .on('pointerout', () => this.closeButton.clearTint())
    .on('pointerdown', () => this.scene.stop());

    // Navigation buttons (if multiple pages)
    this.createNavigationButtons(width, height, panelHeight);

    // Load and display inventory with new styling
    this.loadInventory();
  }

  private loadInventory() {
    if (!this.playerId) return;

    const db = getFirestore(app);
    const inventoryRef = doc(db, 'players', this.playerId);

    onSnapshot(inventoryRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.inventory) {
          this.items = data.inventory;
          this.displayItems();
        }
      }
    });
  }

  private displayItems() {
    // Clear existing items
    this.itemContainers.forEach(container => container.destroy());
    this.itemContainers = [];

    const width = this.scale.width;
    const isMobile = width < 768;
    const itemsPerRow = isMobile ? 2 : 4;
    const slotSize = isMobile ? 100 : 120;
    const padding = isMobile ? 10 : 20;
    
    // Calculate start position
    const startX = width / 2 - ((itemsPerRow * (slotSize + padding) - padding) / 2);
    const startY = this.scale.height / 2 - 50;

    // Get items for current page
    const pageStart = this.currentPage * this.itemsPerPage;
    const pageItems = this.items.slice(pageStart, pageStart + this.itemsPerPage);

    pageItems.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = startX + (col * (slotSize + padding));
      const y = startY + (row * (slotSize + padding));

      this.createItemSlot(x, y, slotSize, item);
    });
  }

  private createItemSlot(x: number, y: number, size: number, item: InventoryItem) {
    const container = this.add.container(x, y);

    // Gradient background for slot
    const slot = this.add.rectangle(0, 0, size, size, 0x2c3e50)
      .setStrokeStyle(1, 0x3498db);

    // Item icon or placeholder
    const icon = item.icon ? 
      this.add.image(0, 0, item.icon).setDisplaySize(size * 0.6, size * 0.6) :
      this.add.text(0, 0, '📦', { fontSize: '32px' }).setOrigin(0.5);

    // Stylish name label
    const nameText = this.add.text(0, -size/2 + 15, item.name, {
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#2c3e50',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    // Quantity badge
    const quantityBadge = this.add.container(size/2 - 15, size/2 - 15);
    const badgeBg = this.add.circle(0, 0, 12, 0x3498db);
    const quantityText = this.add.text(0, 0, `${item.quantity}`, {
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    quantityBadge.add([badgeBg, quantityText]);

    container.add([slot, icon, nameText, quantityBadge]);

    // Interactive effects
    container
      .setInteractive(new Phaser.Geom.Rectangle(-size/2, -size/2, size, size), 
        Phaser.Geom.Rectangle.Contains)
      .on('pointerover', () => {
        slot.setStrokeStyle(2, 0x3498db);
        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
      })
      .on('pointerout', () => {
        slot.setStrokeStyle(1, 0x3498db);
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      })
      .on('pointerdown', () => this.showItemDetails(item));

    this.itemContainers.push(container);
  }

  private createNavigationButtons(width: number, height: number, panelHeight: number) {
    if (this.items.length > this.itemsPerPage) {
      // Previous page button
      this.add.text(
        width / 2 - 100,
        height / 2 + (panelHeight / 2) - 40,
        '◀',
        { fontSize: '24px', color: '#ffffff' }
      )
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this.displayItems();
        }
      });

      // Next page button
      this.add.text(
        width / 2 + 100,
        height / 2 + (panelHeight / 2) - 40,
        '▶',
        { fontSize: '24px', color: '#ffffff' }
      )
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if ((this.currentPage + 1) * this.itemsPerPage < this.items.length) {
          this.currentPage++;
          this.displayItems();
        }
      });
    }
  }

  private showItemDetails(item: InventoryItem) {
    // Create a popup with item details
    const popup = this.add.container(this.scale.width/2, this.scale.height/2);
    
    const bg = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.9)
      .setStrokeStyle(2, 0xffffff);
    
    const title = this.add.text(0, -70, item.name, {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    const description = this.add.text(0, 0, item.description, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 280 }
    }).setOrigin(0.5);

    const closeBtn = this.add.text(120, -80, '❌', {
      fontSize: '20px',
      color: '#ffffff'
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => popup.destroy());

    popup.add([bg, title, description, closeBtn]);
  }
}