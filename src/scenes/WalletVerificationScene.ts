import Phaser from "phaser";
import { Web3Service } from '../services/Web3Service';
import { saveWalletAddress } from '../utils/Database';

export default class WalletVerificationScene extends Phaser.Scene {
  private web3Service: Web3Service;
  private walletStatus!: Phaser.GameObjects.Text;
  private networkStatus!: Phaser.GameObjects.Text;
  private nftStatus!: Phaser.GameObjects.Text;
  private connectButton!: Phaser.GameObjects.Text;
  private continueButton!: Phaser.GameObjects.Text;
  private gradientOverlay!: Phaser.GameObjects.Graphics;
  private playerData: any;

  constructor() {
    super({ key: 'WalletVerificationScene' });
    this.web3Service = new Web3Service();
  }

  create() {
    // Load player data at scene creation
    const playerDataStr = localStorage.getItem("quiztal-player");
    if (playerDataStr) {
      this.playerData = JSON.parse(playerDataStr);
    } else {
      // If no player data, return to login
      this.scene.start('GoogleLoginScene');
      return;
    }

    this.gradientOverlay = this.add.graphics();
    this.drawGradient(0x001a33, 0x330066);

    const isMobile = this.game.device.os.android || 
                    this.game.device.os.iOS || 
                    this.game.device.input.touch;

    // Add title
    this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.15,
      'Wallet Verification',
      {
        fontSize: '32px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);

    if (isMobile) {
      // Show mobile message
      this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.4,
        'To connect your wallet,\nplease use a desktop computer.',
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 10
        }
      ).setOrigin(0.5);

      // Add continue button for mobile
      this.continueButton = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.6,
        'Continue to Game',
        {
          fontSize: '28px',
          backgroundColor: '#4CAF50',
          padding: { x: 25, y: 15 },
          color: '#ffffff'
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

      this.continueButton.on('pointerdown', () => {
        this.scene.start('LoginCharacterScene');
      });

    } else {
      // Show regular wallet connection UI for desktop
      // Initialize wallet status
      this.walletStatus = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.3,
        'Wallet not connected',
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);

      // Initialize network status
      this.networkStatus = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.4,
        'Network: Not Connected',
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);

      this.nftStatus = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.5,
        '',
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'center',
          padding: { x: 15, y: 8 },
          wordWrap: { width: this.scale.width * 0.8 }
        }
      ).setOrigin(0.5);

      // Make buttons larger and more spaced for touch
      this.connectButton = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.65,
        'Connect Wallet',
        {
          fontSize: '28px',
          backgroundColor: '#4CAF50',
          padding: { x: 25, y: 15 },
          color: '#ffffff'
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setPadding(20);

      this.continueButton = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.8,
        'Continue to Game',
        {
          fontSize: '28px',
          backgroundColor: '#4CAF50',
          padding: { x: 25, y: 15 },
          color: '#ffffff'
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setPadding(20)
      .setVisible(false);

      // Add touch feedback
      this.addTouchFeedback(this.connectButton);
      this.addTouchFeedback(this.continueButton);

      // Button handlers
      this.setupButtonHandlers();
    }
  }

  private addTouchFeedback(button: Phaser.GameObjects.Text) {
    button.on('pointerdown', () => {
      button.setAlpha(0.7);
      button.y += 2;
    });

    button.on('pointerup', () => {
      button.setAlpha(1);
      button.y -= 2;
    });

    button.on('pointerout', () => {
      button.setAlpha(1);
      button.y = button.y - (button.y % 1); // Reset position
    });
  }

  private async setupButtonHandlers() {
    this.connectButton.on('pointerdown', async () => {
      if (this.web3Service.isWalletConnected()) {
        await this.handleDisconnect();
      } else {
        await this.handleConnect();
      }
    });

    this.continueButton.on('pointerdown', () => {
      this.scene.start('LoginCharacterScene');
    });
  }

  private async handleConnect() {
    try {
      this.connectButton.setAlpha(0.5);
      this.connectButton.disableInteractive();
      this.walletStatus.setText('Connecting...');

      const { success, message } = await this.web3Service.connectWallet();
      
      if (success && this.playerData?.uid) {
        const address = await this.web3Service.getWalletAddress();
        const network = await this.web3Service.getNetwork();
        
        // Save wallet address to database
        await saveWalletAddress(this.playerData.uid, address);
        
        this.walletStatus
          .setText(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`)
          .setColor('#4CAF50');

        this.networkStatus
          .setText(`Network: ${network.name}`)
          .setColor('#4CAF50');

        this.connectButton.setText('Disconnect Wallet');
        
        await this.verifyNFT();
      } else {
        this.walletStatus.setText(message || 'Connection failed');
        this.networkStatus.setText('Network: Not Connected').setColor('#ff3333');
        this.connectButton.setText('Connect Wallet');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.walletStatus.setText('Connection failed. Please try again.');
      this.networkStatus.setText('Network: Error').setColor('#ff3333');
      this.connectButton.setText('Connect Wallet');
    } finally {
      this.connectButton.setAlpha(1);
      this.connectButton.setInteractive();
      this.continueButton.setVisible(true);
    }
  }

  private async handleDisconnect() {
    await this.web3Service.disconnect();
    this.connectButton.setText('Connect Wallet');
    this.walletStatus.setText('Wallet not connected');
    this.networkStatus.setText('Network: Not Connected').setColor('#ffffff');
    this.nftStatus.setText('');
    this.continueButton.setVisible(true);
  }

  private async verifyNFT() {
    const { hasNFT, error } = await this.web3Service.checkNFTOwnership();
    
    if (error) {
      this.nftStatus
        .setText('⚠️ Failed to verify NFT ownership')
        .setColor('#FFA500');
    } else {
      this.nftStatus
        .setText(hasNFT 
          ? '✅ You have the required NFT!'
          : '⚠️ You don\'t have our NFT yet.\nGet it at market.crystle.world')
        .setColor(hasNFT ? '#4CAF50' : '#FFA500');
    }
  }

  private drawGradient(color1: number, color2: number) {
    this.gradientOverlay.clear();
    this.gradientOverlay.fillGradientStyle(color1, color1, color2, color2, 1);
    this.gradientOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  // Handle device orientation changes
  private handleResize() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Redraw gradient
    this.drawGradient(0x001a33, 0x330066);

    // Reposition elements based on new dimensions
    if (this.walletStatus) {
      this.walletStatus.setPosition(width / 2, height * 0.3);
      this.walletStatus.setWordWrapWidth(width * 0.8);
    }
    if (this.networkStatus) {
      this.networkStatus.setPosition(width / 2, height * 0.4);
      this.networkStatus.setWordWrapWidth(width * 0.8);
    }
    if (this.nftStatus) {
      this.nftStatus.setPosition(width / 2, height * 0.5);
      this.nftStatus.setWordWrapWidth(width * 0.8);
    }
    if (this.connectButton) {
      this.connectButton.setPosition(width / 2, height * 0.65);
    }
    if (this.continueButton) {
      this.continueButton.setPosition(width / 2, height * 0.8);
    }
  }

  shutdown() {
    // Remove resize listener
    this.scale.off('resize', this.handleResize, this);
    // Cleanup not needed since we're keeping wallet state
    this.gradientOverlay.destroy();
  }
}