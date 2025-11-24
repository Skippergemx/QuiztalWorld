import Phaser from 'phaser';

interface GuideSection {
  id: string;
  title: string;
  emoji: string;
  content: string[];
}

export default class GuideBookScene extends Phaser.Scene {
  private guideContainer!: Phaser.GameObjects.Container;
  private currentSection: number = 0;
  private sections: GuideSection[] = [];
  private contentText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private navigationContainer!: Phaser.GameObjects.Container;
  private keyG!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GuideBookScene' });
    this.initializeGuideContent();
  }

  create() {
    // Add semi-transparent background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    this.createGuideBook();
    this.setupKeyboardControls();
    this.updateCurrentSection();
    
    // Set depth to ensure guide book appears above other UI elements
    if (this.guideContainer) {
      this.guideContainer.setDepth(2000);
    }
  }

  private initializeGuideContent() {
    this.sections = [
      {
        id: 'welcome',
        title: 'Welcome to Niftdood World',
        emoji: '🌍',
        content: [
          'Welcome to the Niftdood Metaverse, explorer!',
          '',
          '🎮 This is a solar-punk inspired world where knowledge fuels your journey.',
          '',
          '🧠 Interact with NPCs to take quizzes and earn Niftdood tokens.',
          '',
          '🎯 Complete challenges, explore the world, and level up your character!',
          '',
          '🔮 Collect Niftdood NFTs to boost your abilities and unlock special areas.',
          '',
          'Use the navigation buttons below or arrow keys to explore this guide!'
        ]
      },
      {
        id: 'controls',
        title: 'Game Controls',
        emoji: '🎮',
        content: [
          'Master the controls to navigate Niftdood World effectively:',
          '',
          '🖱️ DESKTOP CONTROLS:',
          '• ⬅️➡️⬆️⬇️ Arrow Keys or WASD - Move your character',
          '• C Key - Interact with nearby NPCs',
          '• I Key - Open/Close Inventory',
          '• R Key - Toggle Session Rewards Tracker',
          '• G Key - Open/Close this Guide Book',
          '',
          '📱 MOBILE CONTROLS:',
          '• Virtual Joystick (bottom-left) - Move character',
          '• Interact Button (bottom-right) - Talk to NPCs',
          '• Tap UI buttons for Inventory, Rewards, etc.',
          '',
          '💡 TIP: Get close to NPCs (within range) to interact with them!'
        ]
      },
      {
        id: 'npcs',
        title: 'NPCs & Quizzes',
        emoji: '🤖',
        content: [
          'Learn about the various NPCs and their specialties:',
          '',
          '🧑‍🏫 MR. GEMX - Niftdood Metaverse Guide',
          '• Explains the Niftdood Metaverse and Niftdood NFTs',
          '• Perfect starting point for new players',
          '',
          '👩‍🎨 NFT CYN - NFT & Blockchain Expert',
          '• Teaches about NFTs, digital art, and blockchain',
          '• Great for learning about digital ownership',
          '',
          '🔒 SECURITY KAI - Cybersecurity Specialist',
          '• Security best practices and protection tips',
          '• Essential knowledge for safe digital exploration',
          '',
          '📚 PROF CHAIN - Blockchain Professor',
          '• Deep dive into blockchain technology',
          '• Advanced concepts and technical knowledge',
          '',
          '💡 Each NPC offers unique quizzes with Niftdood rewards!'
        ]
      },
      {
        id: 'rewards',
        title: 'Niftdoods & Rewards',
        emoji: '💰',
        content: [
          'Earn and manage your Niftdood tokens:',
          '',
          '💎 EARNING NIFTDOODS:',
          '• Answer quiz questions correctly (0.01-0.5 Niftdoods)',
          '• Complete challenges and explore new areas',
          '• Participate in special events and activities',
          '',
          '📊 TRACKING YOUR PROGRESS:',
          '• Session Rewards Tracker (🎯 button) shows current session',
          '• Balance display shows total accumulated Niftdoods',
          '• Inventory system tracks your collected items',
          '',
          '🔄 CLAIMING TOKENS:',
          '• Use the 💎 Claim Tokens button to withdraw',
          '• Connect your wallet for blockchain transactions',
          '• Tokens are stored securely in your wallet',
          '',
          '⚡ NIFTDOOD NFT BOOSTS:',
          '• Niftdood NFTs provide multiplier effects',
          '• Increase quiz rewards and unlock special areas',
          '• Collect different types for various boosts'
        ]
      },
      {
        id: 'inventory',
        title: 'Inventory System',
        emoji: '🎒',
        content: [
          'Manage your items and collectibles:',
          '',
          '🎒 ACCESSING INVENTORY:',
          '• Click the 🎒 button in the UI panel',
          '• Press I key on desktop',
          '• Browse through pages of items',
          '',
          '📦 ITEM CATEGORIES:',
          '• Niftdood Tokens - Your earned currency',
          '• Niftdood NFTs - Boost items and collectibles',
          '• Special Items - Unlocked through exploration',
          '• Achievement Badges - Progress markers',
          '',
          '🔍 ITEM DETAILS:',
          '• Click on items to view detailed information',
          '• See rarity, effects, and acquisition date',
          '• Track your collection progress',
          '',
          '💡 TIP: Regularly check your inventory to see new items!'
        ]
      },

      {
        id: 'tips',
        title: 'Pro Tips & Strategies',
        emoji: '🏆',
        content: [
          'Master these strategies to excel in Niftdood World:',
          '',
          '🎯 QUIZ STRATEGIES:',
          '• Take your time to read questions carefully',
          '• Learn from incorrect answers for future attempts',
          '• Focus on NPCs matching your interests first',
          '• Use the cooldown period to explore other areas',
          '',
          '🗺️ EXPLORATION TIPS:',
          '• Visit all areas to discover hidden NPCs',
          '• Check behind buildings and objects',
          '• Return to areas periodically for new content',
          '• Use the map boundaries to find secret locations',
          '',
          '💡 PROGRESSION ADVICE:',
          '• Start with easier NPCs to build confidence',
          '• Collect a variety of Niftdood NFTs for different boosts',
          '• Track your session progress regularly',
          '• Set daily goals for Niftdood earnings',
          '',
          '🤝 COMMUNITY:',
          '• Share strategies with other players',
          '• Participate in community events',
          '• Follow updates for new content releases'
        ]
      }
    ];
  }

  private createGuideBook() {
    const isMobile = this.scale.width < 768;
    
    // Main container
    this.guideContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);

    // Book background
    const bookWidth = isMobile ? this.scale.width - 40 : 800;
    const bookHeight = isMobile ? this.scale.height - 100 : 600;
    
    const bookBg = this.add.graphics();
    bookBg.fillStyle(0x2c3e50, 0.95);
    bookBg.lineStyle(3, 0x3498db, 1);
    bookBg.fillRoundedRect(-bookWidth/2, -bookHeight/2, bookWidth, bookHeight, 15);
    bookBg.strokeRoundedRect(-bookWidth/2, -bookHeight/2, bookWidth, bookHeight, 15);

    // Title area
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x34495e, 1);
    titleBg.fillRoundedRect(-bookWidth/2 + 10, -bookHeight/2 + 10, bookWidth - 20, 80, 10);

    // Guide book title
    const mainTitle = this.add.text(0, -bookHeight/2 + 30, '📖 Niftdood World Guide Book', {
      fontSize: isMobile ? '20px' : '24px',
      color: '#f1c40f',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Section title (will be updated dynamically)
    this.titleText = this.add.text(0, -bookHeight/2 + 60, '', {
      fontSize: isMobile ? '16px' : '18px',
      color: '#ecf0f1',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Content area - adjusted position to avoid navigation buttons
    this.contentText = this.add.text(0, -bookHeight/2 + 100, '', {
      fontSize: isMobile ? '12px' : '14px',
      color: '#ecf0f1',
      align: 'left',
      wordWrap: { width: bookWidth - 160 }, // Reduced width to accommodate side buttons
      lineSpacing: 5
    }).setOrigin(0.5, 0);

    // Navigation buttons
    this.createNavigationButtons(bookWidth, bookHeight, isMobile);

    // Close button
    const closeButton = this.createCloseButton(bookWidth, bookHeight);

    // Add all elements to container
    this.guideContainer.add([bookBg, titleBg, mainTitle, this.titleText, this.contentText, this.navigationContainer, closeButton]);
    
    // Set depth to ensure guide book appears above other UI elements
    this.guideContainer.setDepth(2000);
  }

  private createNavigationButtons(bookWidth: number, bookHeight: number, isMobile: boolean) {
    this.navigationContainer = this.add.container(0, 0);

    // Previous button - positioned on the left middle side
    const prevButton = this.add.container(-bookWidth/2 + 60, 0);
    const prevBg = this.add.graphics();
    prevBg.fillStyle(0x3498db, 1);
    prevBg.fillRoundedRect(-40, -15, 80, 30, 8);
    const prevText = this.add.text(0, 0, '⬅️ Prev', {
      fontSize: isMobile ? '12px' : '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    prevButton.add([prevBg, prevText]);
    prevButton.setInteractive(new Phaser.Geom.Rectangle(-40, -15, 80, 30), Phaser.Geom.Rectangle.Contains);
    prevButton.on('pointerdown', () => this.previousSection());
    prevButton.on('pointerover', () => {
      prevBg.clear();
      prevBg.fillStyle(0x2980b9, 1);
      prevBg.fillRoundedRect(-40, -15, 80, 30, 8);
    });
    prevButton.on('pointerout', () => {
      prevBg.clear();
      prevBg.fillStyle(0x3498db, 1);
      prevBg.fillRoundedRect(-40, -15, 80, 30, 8);
    });

    // Next button - positioned on the right middle side
    const nextButton = this.add.container(bookWidth/2 - 60, 0);
    const nextBg = this.add.graphics();
    nextBg.fillStyle(0x3498db, 1);
    nextBg.fillRoundedRect(-40, -15, 80, 30, 8);
    const nextText = this.add.text(0, 0, 'Next ➡️', {
      fontSize: isMobile ? '12px' : '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    nextButton.add([nextBg, nextText]);
    nextButton.setInteractive(new Phaser.Geom.Rectangle(-40, -15, 80, 30), Phaser.Geom.Rectangle.Contains);
    nextButton.on('pointerdown', () => this.nextSection());
    nextButton.on('pointerover', () => {
      nextBg.clear();
      nextBg.fillStyle(0x2980b9, 1);
      nextBg.fillRoundedRect(-40, -15, 80, 30, 8);
    });
    nextButton.on('pointerout', () => {
      nextBg.clear();
      nextBg.fillStyle(0x3498db, 1);
      nextBg.fillRoundedRect(-40, -15, 80, 30, 8);
    });

    // Section navigation dots - positioned at the bottom
    const dotsContainer = this.add.container(0, bookHeight/2 - 50);
    for (let i = 0; i < this.sections.length; i++) {
      const dot = this.add.circle(i * 30 - (this.sections.length - 1) * 15, 0, 6, 0x7f8c8d);
      dot.setInteractive();
      dot.on('pointerdown', () => {
        this.currentSection = i;
        this.updateCurrentSection();
      });
      dotsContainer.add(dot);
    }

    this.navigationContainer.add([prevButton, nextButton, dotsContainer]);
  }

  private createCloseButton(bookWidth: number, bookHeight: number) {
    // Create a close button in the top-right corner
    const closeBtnX = bookWidth/2 - 30;
    const closeBtnY = -bookHeight/2 + 30;
    
    const closeBtn = this.add.container(closeBtnX, closeBtnY);
    const closeBtnBg = this.add.circle(0, 0, 20, 0xe74c3c);
    const closeBtnText = this.add.text(0, 0, '✖', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.add([closeBtnBg, closeBtnText]);
    closeBtn.setInteractive(
      new Phaser.Geom.Circle(0, 0, 20),
      Phaser.Geom.Circle.Contains
    );

    closeBtn
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        closeBtnBg.setFillStyle(0xc0392b);
        this.input.setDefaultCursor('pointer');
      })
      .on('pointerout', () => {
        closeBtnBg.setFillStyle(0xe74c3c);
        this.input.setDefaultCursor('default');
      })
      .on('pointerdown', () => this.toggleGuideBook());

    return closeBtn;
  }

  private setupKeyboardControls() {
    if (this.input.keyboard) {
      // G key to toggle guide book
      this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
      this.keyG.on('down', () => this.toggleGuideBook());

      // ESC key to close guide book (matching inventory behavior)
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => this.toggleGuideBook());

      // Arrow keys for navigation
      const leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      const rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      
      leftKey.on('down', () => this.previousSection());
      rightKey.on('down', () => this.nextSection());
    }
  }
  
  /**
   * Toggle the guide book open/closed
   */
  private toggleGuideBook() {
    // Resume the game scene and stop this scene
    this.scene.resume('GameScene');
    this.scene.stop('GuideBookScene');
    
    // Reset default cursor
    this.input.setDefaultCursor('default');
  }
// Removed unused closeGuideBook method

  private updateCurrentSection() {
    const section = this.sections[this.currentSection];
    
    // Update title
    this.titleText.setText(`${section.emoji} ${section.title}`);
    
    // Update content
    this.contentText.setText(section.content.join('\n'));

    // Update navigation dots
    const dotsContainer = this.navigationContainer.list[2] as Phaser.GameObjects.Container;
    dotsContainer.list.forEach((dot, index) => {
      const circle = dot as Phaser.GameObjects.Arc;
      if (index === this.currentSection) {
        circle.setFillStyle(0x3498db);
        circle.setRadius(8);
      } else {
        circle.setFillStyle(0x7f8c8d);
        circle.setRadius(6);
      }
    });
  }

  private previousSection() {
    if (this.currentSection > 0) {
      this.currentSection--;
      this.updateCurrentSection();
    }
  }

  private nextSection() {
    if (this.currentSection < this.sections.length - 1) {
      this.currentSection++;
      this.updateCurrentSection();
    }
  }

  shutdown() {
    // Clean up keyboard listeners
    if (this.keyG) {
      this.keyG.removeAllListeners();
      if (this.input.keyboard) {
        this.input.keyboard.removeKey(this.keyG);
      }
    }
  }
}