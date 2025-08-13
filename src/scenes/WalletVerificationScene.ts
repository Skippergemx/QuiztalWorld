import Phaser from "phaser";
import { doc, getDoc } from 'firebase/firestore';  // Add this line
import { db } from '../utils/firebase';  // Add this line
import { Web3Service } from '../services/Web3Service';
import { saveWalletAddress } from '../utils/Database';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface NFTData {
  tokenId: string;
  image: string;
  name: string;
  description: string;
}

export default class WalletVerificationScene extends Phaser.Scene {
  private web3Service: Web3Service;
  private walletStatus!: Phaser.GameObjects.Text;
  private networkStatus!: Phaser.GameObjects.Text;
  private nftStatus!: Phaser.GameObjects.Text;
  private connectButton!: Phaser.GameObjects.Text;
  private continueButton!: Phaser.GameObjects.Text;
  private gradientOverlay!: Phaser.GameObjects.Graphics;
  private playerData: any;
  private nftContainer: Phaser.GameObjects.Container | null;
  private nftDetailPopup: Phaser.GameObjects.Container | null = null;  // Add this line
  private loadingOverlay!: LoadingOverlay;

  // Add this to the class properties
  private connectButtonText!: Phaser.GameObjects.Text;
  private connectButtonContainer!: Phaser.GameObjects.Container;
  private loadingSpinner!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'WalletVerificationScene' });
    this.web3Service = new Web3Service();
    // Initialize nftContainer as null
    this.nftContainer = null;
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
      // Check for wallet installation first
      if (!this.web3Service.isWalletInstalled()) {
        this.showNoWalletUI();
      } else {
        this.showWalletUI();
      }
    }

    this.loadingOverlay = new LoadingOverlay(this);
  }

  private showNoWalletUI() {
    // Warning message
    this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.3,
      '⚠️ No Web3 Wallet Detected',
      {
        fontSize: '28px',
        color: '#FFA500',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Instruction text
    this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.4,
      'To use wallet features, please install a Web3 wallet like MetaMask',
      {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: this.scale.width * 0.8 }
      }
    ).setOrigin(0.5);

    // Install wallet button
    const installButton = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.55,
      '🦊 Install MetaMask',
      {
        fontSize: '24px',
        backgroundColor: '#FF9800',
        padding: { x: 20, y: 10 },
        color: '#ffffff'
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    // Add touch feedback to install button
    this.addTouchFeedback(installButton);

    // Handle install button click
    installButton.on('pointerdown', () => {
      window.open(this.web3Service.getWalletInstallLink(), '_blank');
    });

    // Add continue button
    this.continueButton = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.7,
      'Continue Without Wallet',
      {
        fontSize: '24px',
        backgroundColor: '#4CAF50',
        padding: { x: 20, y: 10 },
        color: '#ffffff'
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    // Add touch feedback to continue button
    this.addTouchFeedback(this.continueButton);

    // Handle continue button click
    this.continueButton.on('pointerdown', () => {
      this.scene.start('LoginCharacterScene');
    });

    // Add refresh button
    const refreshButton = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.85,
      '🔄 Check Again',
      {
        fontSize: '20px',
        backgroundColor: '#2196F3',
        padding: { x: 15, y: 8 },
        color: '#ffffff'
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    this.addTouchFeedback(refreshButton);

    refreshButton.on('pointerdown', () => {
      if (this.web3Service.isWalletInstalled()) {
        this.scene.restart();
      } else {
        refreshButton.setText('❌ No Wallet Found');
        this.time.delayedCall(1000, () => {
          refreshButton.setText('🔄 Check Again');
        });
      }
    });
  }

  private showWalletUI() {
    // Add title text
    this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.3,
        '🎮 Welcome to Quiztal World',
        {
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }
    ).setOrigin(0.5);

    // Add subtitle
    this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.4,
        'Connect your wallet to verify your NFTs',
        {
            fontSize: '20px',
            color: '#3498db',
            align: 'center'
        }
    ).setOrigin(0.5);

    // Create animated connect wallet button
    this.connectButtonContainer = this.add.container(0, this.scale.height * 0.6);
    
    const glowGraphics = this.add.graphics()
        .fillStyle(0x3498db, 0.2)
        .fillRoundedRect(0, -30, this.scale.width, 60, 30);
    
    this.connectButtonText = this.add.text(
        this.scale.width / 2,
        0,
        '💎 Connect Wallet',
        {
            fontSize: '28px',
            color: '#ffffff',
            padding: { x: 25, y: 15 }
        }
    ).setOrigin(0.5);

    // Create loading spinner (hidden initially)
    this.loadingSpinner = this.add.text(
        this.scale.width / 2 - 120,
        0,
        '⚡',
        {
            fontSize: '28px',
            color: '#FFA500'
        }
    ).setOrigin(0.5).setVisible(false);

    // Add button effects
    this.connectButtonText
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            if (this.connectButtonText.active) {
                this.tweens.add({
                    targets: this.connectButtonText,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            }
        })
        .on('pointerout', () => {
            if (this.connectButtonText.active) {
                this.tweens.add({
                    targets: this.connectButtonText,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            }
        })
        .on('pointerdown', async () => {
            if (this.web3Service.isWalletConnected()) {
                await this.handleDisconnect();
            } else {
                await this.handleConnect();
            }
        });

    this.connectButtonContainer.add([glowGraphics, this.loadingSpinner, this.connectButtonText]);

    // Remove old status texts since we'll show them in NFT display
    this.walletStatus = this.add.text(0, 0, '').setVisible(false);
    this.networkStatus = this.add.text(0, 0, '').setVisible(false);
    this.nftStatus = this.add.text(0, 0, '').setVisible(false);
    
    // Hide continue button initially as it will be shown after NFT verification
    this.continueButton = this.add.text(0, 0, '').setVisible(false);
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


  private async handleConnect() {
    try {
        // Disable button and show loading state
        this.connectButtonText.disableInteractive();
        this.connectButtonText.setText('Connecting Wallet...');
        this.loadingSpinner.setVisible(true);

        // Connect wallet
        const { success, message } = await this.web3Service.connectWallet();
        
        if (success && this.playerData?.uid) {
            const address = await this.web3Service.getWalletAddress();
            
            try {
                // Get player document to check if wallet already bound
                const playerDoc = await getDoc(doc(db, "players", this.playerData.uid));
                const existingWallet = playerDoc.data()?.walletAddress;

                if (existingWallet && existingWallet !== address) {
                    // Show confirmation dialog for changing wallet
                    this.showWalletChangeConfirmation(existingWallet, address);
                } else {
                    // Bind new wallet
                    await this.bindWallet(address);
                }
            } catch (error) {
                console.error('Error checking player document:', error);
                this.showErrorMessage('Failed to verify wallet status');
                this.resetConnectButton();
            }
        } else {
            this.showErrorMessage(message || 'Connection failed');
            this.resetConnectButton();
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        this.showErrorMessage('Connection failed. Please try again.');
        this.resetConnectButton();
    }
}

private async bindWallet(address: string) {
    try {
        await saveWalletAddress(this.playerData.uid, address);
        this.connectButtonText.setText('✅ Wallet Bound');
        
        // Show success message
        this.showSuccessMessage('Wallet successfully bound!');
        
        // Proceed with NFT verification
        await this.verifyNFT();
    } catch (error) {
        console.error('Error binding wallet:', error);
        this.showErrorMessage('Failed to bind wallet');
        this.resetConnectButton();
    }
}

private showWalletChangeConfirmation(oldWallet: string, newWallet: string) {
    // Create confirmation dialog container
    const container = this.add.container(0, 0);
    
    // Add semi-transparent background
    const bg = this.add.rectangle(
        0, 0,
        this.scale.width,
        this.scale.height,
        0x000000, 0.8
    ).setOrigin(0);

    // Add dialog box
    const dialogBox = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        400,
        300,
        0x2c3e50
    ).setOrigin(0.5);

    // Add warning text
    const warningText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 80,
        '⚠️ Change Wallet Binding',
        {
            fontSize: '24px',
            color: '#FFA500',
            align: 'center'
        }
    ).setOrigin(0.5);

    // Add current wallet info
    const currentWalletText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 20,
        `Current: ${oldWallet.substring(0, 6)}...${oldWallet.substring(oldWallet.length - 4)}`,
        {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }
    ).setOrigin(0.5);

    // Add new wallet info
    const newWalletText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 20,
        `New: ${newWallet.substring(0, 6)}...${newWallet.substring(newWallet.length - 4)}`,
        {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }
    ).setOrigin(0.5);

    // Add confirm button
    const confirmBtn = this.add.text(
        this.scale.width / 2 - 100,
        this.scale.height / 2 + 80,
        'Confirm Change',
        {
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            padding: { x: 15, y: 8 },
            color: '#ffffff'
        }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', async () => {
        container.destroy();
        await this.bindWallet(newWallet);
    });

    // Add cancel button
    const cancelBtn = this.add.text(
        this.scale.width / 2 + 100,
        this.scale.height / 2 + 80,
        'Cancel',
        {
            fontSize: '16px',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 },
            color: '#ffffff'
        }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
        container.destroy();
        this.resetConnectButton();
    });

    container.add([bg, dialogBox, warningText, currentWalletText, newWalletText, confirmBtn, cancelBtn]);
}

private showSuccessMessage(message: string) {
    const successText = this.add.text(
        this.scale.width / 2,
        this.scale.height - 100,
        `✅ ${message}`,
        {
            fontSize: '20px',
            color: '#4CAF50',
            backgroundColor: '#2c3e50',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5);

    this.time.delayedCall(3000, () => successText.destroy());
}

  private async handleDisconnect() {
    await this.web3Service.disconnect();
    if (this.connectButtonText) {
        this.connectButtonText.setText('💎 Connect Wallet');
    }
    if (this.walletStatus) {
        this.walletStatus.setText('Wallet not connected');
    }
    if (this.networkStatus) {
        this.networkStatus.setText('Network: Not Connected').setColor('#ffffff');
    }
    if (this.nftStatus) {
        this.nftStatus.setText('');
    }
    if (this.continueButton) {
        this.continueButton.setVisible(true);
    }
}

  private async verifyNFT() {
    const { hasNFT, error } = await this.web3Service.checkNFTOwnership();
    
    if (error) {
        this.showErrorMessage('Failed to verify NFT ownership');
        return;
    }

    if (!hasNFT) {
        // Show No NFT message with market link
        this.showNoNFTMessage();
    } else {
        // Show NFT collection
        await this.displayNFTs();
    }
}

private showNoNFTMessage() {
    if (this.nftContainer) {
        this.nftContainer.destroy();
    }

    // Create container for no NFT message
    const container = this.add.container(0, 0);
    this.nftContainer = container;

    // Add semi-transparent background
    const bg = this.add.rectangle(
        0, 0,
        this.scale.width,
        this.scale.height,
        0x000000, 0.9
    ).setOrigin(0);
    container.add(bg);

    // Add header text
    const headerText = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.3,
        '⚠️ No Quiztal NFTs Found',
        {
            fontSize: '32px',
            color: '#FFA500',
            fontStyle: 'bold'
        }
    ).setOrigin(0.5);

    // Add description
    const description = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.4,
        'You can still play the game!\nBut owning NFTs gives you special benefits.',
        {
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }
    ).setOrigin(0.5);

    // Add market button
    const marketBtn = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.55,
        '🛍️ Get NFTs on Market',
        {
            fontSize: '24px',
            backgroundColor: '#3498db',
            padding: { x: 20, y: 10 },
            color: '#ffffff'
        }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => marketBtn.setScale(1.1))
    .on('pointerout', () => marketBtn.setScale(1))
    .on('pointerdown', () => {
        window.open('https://market.crystle.world', '_blank');
    });

    // Add continue button
    const continueBtn = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.7,
        '🎮 Continue to Game',
        {
            fontSize: '24px',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 },
            color: '#ffffff'
        }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => continueBtn.setScale(1.1))
    .on('pointerout', () => continueBtn.setScale(1))
    .on('pointerdown', () => {
        this.scene.start('LoginCharacterScene');
    });

    // Add note about benefits
    const benefitsNote = this.add.text(
        this.scale.width / 2,
        this.scale.height * 0.85,
        '💡 NFT holders get exclusive items and special rewards!',
        {
            fontSize: '16px',
            color: '#3498db',
            backgroundColor: '#2c3e50',
            padding: { x: 15, y: 8 }
        }
    ).setOrigin(0.5);

    // Add close button
    const closeBtn = this.add.text(
        this.scale.width - 60,
        30,
        '✖',
        {
            fontSize: '32px',
            color: '#ffffff'
        }
    )
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => closeBtn.setTint(0xff0000))
    .on('pointerout', () => closeBtn.clearTint())
    .on('pointerdown', () => {
        if (this.nftContainer) {
            this.nftContainer.destroy();
            this.nftContainer = null;
            this.showContinueButton();
        }
    });

    // Add all elements to container
    container.add([headerText, description, marketBtn, continueBtn, benefitsNote, closeBtn]);

    // Add appear animation
    container.setAlpha(0);
    this.tweens.add({
        targets: container,
        alpha: 1,
        duration: 300
    });
}
  private async displayNFTs() {
    try {
        this.loadingOverlay.show('Fetching your NFTs...');
        const nfts = await this.web3Service.getNFTsData();

        // Save NFTs to localStorage
        localStorage.setItem('quiztal-nfts', JSON.stringify(nfts));

        // Clear previous display if any
        if (this.nftContainer) {
            this.nftContainer.destroy();
        }

        // Create main container
        const container = this.add.container(0, 0);
        this.nftContainer = container;

        // Add semi-transparent background
        const bg = this.add.rectangle(
            0, 0,
            this.scale.width,
            this.scale.height,
            0x000000, 0.9
        ).setOrigin(0);
        container.add(bg);

        // Create header container
        const headerContainer = this.add.container(0, 0);
        
        // Add title with icon
        const title = this.add.text(
            this.scale.width / 2,
            50,
            '✨ NFT Collection Verified',
            {
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Add subtitle
        const subtitle = this.add.text(
            this.scale.width / 2,
            90,
            'Your NFTs have been successfully verified',
            {
                fontSize: '18px',
                color: '#4CAF50'
            }
        ).setOrigin(0.5);

        headerContainer.add([title, subtitle]);
        container.add(headerContainer);

        // Add close button
        const closeBtn = this.add.text(
            this.scale.width - 60,
            30,
            '✖',
            {
                fontSize: '32px',
                color: '#ffffff'
            }
        )
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => closeBtn.setTint(0xff0000))
        .on('pointerout', () => closeBtn.clearTint())
        .on('pointerdown', () => {
            if (this.nftContainer) {
                this.input.off('wheel');
                this.input.off('pointerdown');
                this.input.off('pointermove');
                this.input.off('pointerup');
                this.nftContainer.destroy();
                this.nftContainer = null;

                // Show the continue button with animation
                this.showContinueButton();
            }
        });
        container.add(closeBtn);

        if (nfts.length === 0) {
            const noNFTsText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                'No NFTs found in your wallet',
                {
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#2c3e50',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);
            container.add(noNFTsText);
        } else {
            this.displayNFTGrid(nfts);
        }

        // Add view message at the bottom
        const viewMessage = this.add.text(
            this.scale.width / 2,
            this.scale.height - 40,
            'View your collection and close this window to continue',
            {
                fontSize: '16px',
                color: '#3498db',
                backgroundColor: '#2c3e50',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setAlpha(0);

        container.add(viewMessage);

        // Fade in the view message
        this.tweens.add({
            targets: viewMessage,
            alpha: 1,
            duration: 500,
            delay: 1000
        });

        this.loadingOverlay.hide();
    } catch (error) {
        console.error('Error displaying NFTs:', error);
        this.loadingOverlay.hide();
        this.showErrorMessage('Failed to load NFTs');
    }
}

private showContinueButton() {
    // Create a container for the continue button section
    const buttonContainer = this.add.container(0, this.scale.height * 0.8);
    
    // Add glowing effect background
    const glowGraphics = this.add.graphics()
        .fillStyle(0x4CAF50, 0.2)
        .fillRoundedRect(0, -30, this.scale.width, 60, 30);
    
    // Create continue button with new style
    const continueBtn = this.add.text(
        this.scale.width / 2,
        0,
        '🎮 Continue to Game',
        {
            fontSize: '28px',
            color: '#ffffff',
            padding: { x: 25, y: 15 }
        }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    // Add button effects
    continueBtn
        .on('pointerover', () => {
            this.tweens.add({
                targets: continueBtn,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        })
        .on('pointerout', () => {
            this.tweens.add({
                targets: continueBtn,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        })
        .on('pointerdown', () => {
            this.scene.start('LoginCharacterScene');
        });

    buttonContainer.add([glowGraphics, continueBtn]);

    // Animate button container appearing
    buttonContainer.setAlpha(0);
    this.tweens.add({
        targets: buttonContainer,
        alpha: 1,
        y: this.scale.height * 0.75,
        duration: 500,
        ease: 'Back.easeOut'
    });
}
private displayNFTGrid(nfts: NFTData[]) {
    if (!this.nftContainer) return;

    // Refined scroll area configuration with better margins
    const scrollConfig = {
        padding: 60, // Increased side padding
        headerHeight: 120, // Taller header for better spacing
        viewportHeight: this.scale.height - 180, // Adjusted for header and bottom margin
        scrollSpeed: 0.5
    };

    // Create scrollable area with mask
    const scrollMask = this.add.graphics()
        .fillStyle(0xffffff, 0.5)  // Changed opacity to 0.5 (50%)
        .fillRect(
            scrollConfig.padding,
            scrollConfig.headerHeight,
            this.scale.width - (scrollConfig.padding * 2),
            scrollConfig.viewportHeight
        );

    // Create content container with initial padding
    const contentContainer = this.add.container(scrollConfig.padding, scrollConfig.headerHeight + 20); // Added top padding
    contentContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, scrollMask));

    // Refined grid configuration
    const gridConfig = {
        itemsPerRow: this.scale.width < 768 ? 2 : 3,
        spacing: 30, // Increased spacing between cards
        cardWidth: Math.min(
            (this.scale.width - (scrollConfig.padding * 3) - (30 * (this.scale.width < 768 ? 1 : 2))) / 
            (this.scale.width < 768 ? 2 : 3),
            240 // Slightly larger maximum card width
        ),
        cardHeight: 0,
        topMargin: 20, // Additional top margin for first row
        bottomMargin: 40 // Bottom margin for last row
    };
    
    // Set card height maintaining aspect ratio
    gridConfig.cardHeight = gridConfig.cardWidth * 1.4;

    // Calculate grid width for centering
    const gridWidth = (gridConfig.cardWidth * gridConfig.itemsPerRow) + 
                     (gridConfig.spacing * (gridConfig.itemsPerRow - 1));
    const startX = ((this.scale.width - (scrollConfig.padding * 2)) - gridWidth) / 2;

    // Create NFT cards with proper spacing
    let maxHeight = 0;
    nfts.forEach((nft, index) => {
        const row = Math.floor(index / gridConfig.itemsPerRow);
        const col = index % gridConfig.itemsPerRow;
        
        const x = startX + (col * (gridConfig.cardWidth + gridConfig.spacing)) + 
                 (gridConfig.cardWidth / 2);
        const y = gridConfig.topMargin + (row * (gridConfig.cardHeight + gridConfig.spacing)) + 
                 (gridConfig.cardHeight / 2);

        const card = this.createSimpleNFTCard(x, y, gridConfig.cardWidth, gridConfig.cardHeight, nft);
        contentContainer.add(card);

        // Update maxHeight including bottom margin
        maxHeight = Math.max(maxHeight, y + gridConfig.cardHeight / 2 + gridConfig.bottomMargin);
    });

    // Add scroll zone with adjusted dimensions
    const scrollZone = this.add.zone(
        scrollConfig.padding,
        scrollConfig.headerHeight,
        this.scale.width - (scrollConfig.padding * 2),
        scrollConfig.viewportHeight
    ).setOrigin(0);

    // Setup scrolling with improved boundaries
    let isDragging = false;
    let startY = 0;
    const minY = scrollConfig.headerHeight + 20; // Account for top padding
    const maxY = -(maxHeight - scrollConfig.viewportHeight);

    // Enable input events on scroll zone
    scrollZone.setInteractive();

    // Handle pointer events for scrolling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.y >= scrollConfig.headerHeight && 
            pointer.y <= scrollConfig.headerHeight + scrollConfig.viewportHeight) {
            isDragging = true;
            startY = pointer.y - contentContainer.y;
        }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (isDragging) {
            const newY = Phaser.Math.Clamp(
                pointer.y - startY,
                maxY,
                minY
            );
            contentContainer.y = newY;
        }
    });

    this.input.on('pointerup', () => {
        isDragging = false;
    });

    // Handle mouse wheel scrolling
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
        const newY = Phaser.Math.Clamp(
            contentContainer.y - (deltaY * scrollConfig.scrollSpeed),
            maxY,
            minY
        );
        contentContainer.y = newY;
    });

    // Add scroll indicator with better positioning
    if (maxHeight > scrollConfig.viewportHeight) {
        const scrollIndicator = this.add.text(
            this.scale.width - scrollConfig.padding - 10,
            scrollConfig.headerHeight + 15,
            '⚡ Scroll',
            {
                fontSize: '16px',
                color: '#3498db',
                backgroundColor: '#2c3e50',
                padding: { x: 12, y: 8 }
            }
        ).setOrigin(1, 0).setAlpha(0.8);
        this.nftContainer.add(scrollIndicator);

        // Fade out indicator after delay
        this.tweens.add({
            targets: scrollIndicator,
            alpha: 0,
            delay: 2000,
            duration: 500
        });
    }

    this.nftContainer.add([scrollMask, contentContainer]);
}

private createSimpleNFTCard(x: number, y: number, width: number, height: number, nft: NFTData): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);

    // Card background with shadow effect
    const bg = this.add.graphics()
        .fillStyle(0x2c3e50, 1)
        .fillRoundedRect(-width/2, -height/2, width, height, 12);

    // Add subtle shadow effect
    const shadow = this.add.graphics()
        .fillStyle(0x000000, 0.2)
        .fillRoundedRect(-width/2 + 2, -height/2 + 2, width, height, 12);
    
    // Calculate image dimensions
    const imageSize = width - 40; // Consistent padding

    // Image container centered in card
    const imageContainer = this.add.container(0, -height/6); // Fixed position for image container
    
    // Centered image placeholder
    const imagePlaceholder = this.add.graphics()
        .fillStyle(0x34495e, 1)
        .fillRoundedRect(
            -imageSize/2,
            -imageSize/2,
            imageSize,
            imageSize,
            8
        );

    imageContainer.add(imagePlaceholder);

    // Load and center NFT image
    const imageKey = `nft-${nft.tokenId}`;
    this.load.image(imageKey, nft.image);
    this.load.once(`filecomplete-image-${imageKey}`, () => {
        const image = this.add.image(0, 0, imageKey);
        
        // Calculate scale to fit while maintaining aspect ratio
        const scale = Math.min(
            imageSize / image.width,
            imageSize / image.height
        );
        
        image.setScale(scale);
        imagePlaceholder.destroy();
        imageContainer.add(image);
    });
    this.load.start();

    // Adjust text positions relative to container center
    const name = this.add.text(0, height/4, nft.name, {
        fontSize: width < 200 ? '14px' : '16px',
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        wordWrap: { width: width - 20 }
    }).setOrigin(0.5);

    const id = this.add.text(0, height/4 + 30, `#${nft.tokenId}`, {
        fontSize: width < 200 ? '12px' : '14px',
        color: '#3498db',
        align: 'center'
    }).setOrigin(0.5);

    // Add hover effect
    card.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains)
        .on('pointerover', () => {
            bg.clear()
              .fillStyle(0x34495e, 1)
              .fillRoundedRect(-width/2, -height/2, width, height, 12);
        })
        .on('pointerout', () => {
            bg.clear()
              .fillStyle(0x2c3e50, 1)
              .fillRoundedRect(-width/2, -height/2, width, height, 12);
        });

    card.add([shadow, bg, imageContainer, name, id]);
    return card;
}

  private showErrorMessage(message: string) {
    const errorText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        `❌ ${message}`,
        {
            fontSize: '20px',
            color: '#ff0000',
            backgroundColor: '#2c3e50',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5);

    this.time.delayedCall(3000, () => errorText.destroy());
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
    if (this.nftContainer) {
      this.displayNFTs(); // Re-layout NFTs
    }
  }

  shutdown() {
    // Remove all event listeners
    this.input.off('wheel');
    
    // Cleanup containers
    if (this.nftContainer) {
        this.nftContainer.destroy();
        this.nftContainer = null;
    }
    
    if (this.nftDetailPopup) {
        this.nftDetailPopup.destroy();
        this.nftDetailPopup = null;
    }
    
    // Cleanup loading overlay
    if (this.loadingOverlay) {
        this.loadingOverlay.hide();
    }
    
    // Cleanup gradient
    if (this.gradientOverlay) {
        this.gradientOverlay.destroy();
    }
    
    // Remove resize listener
    this.scale.off('resize', this.handleResize, this);
  }

  private resetConnectButton() {
    if (this.connectButtonText) {
        this.connectButtonText
            .setText('💎 Connect Wallet')
            .setInteractive({ useHandCursor: true });
    }
    if (this.loadingSpinner) {
        this.loadingSpinner.setVisible(false);
    }
  }
}