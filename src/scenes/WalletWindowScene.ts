import Phaser from "phaser";
import { Web3Service } from '../services/Web3Service';
import { saveWalletAddress, saveNFTsToDatabase } from '../utils/Database';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { NFTData } from '../types/nft';
import { NFTDisplayManager } from './wallet-verification/NFTDisplayManager';

export default class WalletWindowScene extends Phaser.Scene {
    private web3Service!: Web3Service;
    private loadingOverlay!: LoadingOverlay;
    private nftDisplayManager!: NFTDisplayManager;
    private playerData: any;
    private connectButtonText!: Phaser.GameObjects.Text;
    private loadingSpinner!: Phaser.GameObjects.Text;
    private connectButtonContainer!: Phaser.GameObjects.Container;
    private onCloseCallback?: () => void;
    private windowWidth: number = 0;
    private windowHeight: number = 0;
    private windowX: number = 0;
    private windowY: number = 0;
    private initialLoadingContainer: Phaser.GameObjects.Container | null = null;
    private contentContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'WalletWindowScene' });
        this.web3Service = new Web3Service();
    }

    init(data: { onClose?: () => void }) {
        if (data.onClose) {
            this.onCloseCallback = data.onClose;
        }
    }

    async create() {
        // Show initial loading screen
        this.showInitialLoadingScreen();

        // Load player data at scene creation
        const playerDataStr = localStorage.getItem("quiztal-player");
        if (!playerDataStr) {
            this.hideInitialLoadingScreen();
            this.closeWindow();
            return;
        }
        this.playerData = JSON.parse(playerDataStr);

        // Initialize NFT display manager
        this.nftDisplayManager = new NFTDisplayManager(this);

        // Add event listener for when NFT display is closed
        this.events.on('nftDisplayClosed', this.closeWindow, this);

        // Add semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);
        bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', (_pointer: Phaser.Input.Pointer, x: number, y: number) => {
                // Close window when clicking outside the content area
                const contentArea = new Phaser.Geom.Rectangle(
                    this.scale.width * 0.1,
                    this.scale.height * 0.1,
                    this.scale.width * 0.8,
                    this.scale.height * 0.8
                );
                if (!contentArea.contains(x, y)) {
                    this.closeWindow();
                }
            });

        // Create wallet window container
        this.windowWidth = Math.min(this.scale.width * 0.9, 600);
        this.windowHeight = Math.min(this.scale.height * 0.85, 700);
        this.windowX = (this.scale.width - this.windowWidth) / 2;
        this.windowY = (this.scale.height - this.windowHeight) / 2;

        const windowContainer = this.add.container(this.windowX, this.windowY);

        // Window background
        const windowBg = this.add.graphics();
        windowBg.fillStyle(0x2c3e50, 1);
        windowBg.fillRoundedRect(0, 0, this.windowWidth, this.windowHeight, 15);
        windowBg.lineStyle(2, 0x3498db, 1);
        windowBg.strokeRoundedRect(0, 0, this.windowWidth, this.windowHeight, 15);

        // Window header
        const header = this.add.graphics();
        header.fillStyle(0x3498db, 1);
        header.fillRoundedRect(0, 0, this.windowWidth, 60, 15);

        // Header title
        const title = this.add.text(this.windowWidth / 2, 30, '💎 Wallet Verification', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.text(this.windowWidth - 30, 20, '✖', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => closeBtn.setTint(0xff0000))
        .on('pointerout', () => closeBtn.clearTint())
        .on('pointerdown', () => this.closeWindow());

        // Content area with proper padding
        this.contentContainer = this.add.container(30, 80);

        // Add wallet connection UI
        this.createWalletUI(this.contentContainer, this.windowWidth - 60);

        windowContainer.add([windowBg, header, title, closeBtn, this.contentContainer]);

        this.loadingOverlay = new LoadingOverlay(this);
        this.scale.on('resize', this.handleResize, this);

        // Hide initial loading screen after UI is created
        this.hideInitialLoadingScreen();
    }

    private showInitialLoadingScreen() {
        // Create a container for the initial loading screen
        this.initialLoadingContainer = this.add.container(0, 0);
        this.initialLoadingContainer.setDepth(2000); // Ensure it's above other elements

        // Add semi-transparent background
        const bg = this.add.rectangle(
            0, 0,
            this.scale.width,
            this.scale.height,
            0x000000, 0.8
        ).setOrigin(0);
        
        // Add loading text
        const loadingText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 30,
            'Preparing Wallet Verification...',
            {
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Add description text
        const descriptionText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 + 10,
            'Checking wallet connection and preparing verification process',
            {
                fontSize: '16px',
                color: '#3498db',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Add spinner
        const spinner = this.add.graphics();
        spinner.lineStyle(4, 0x3498db, 1);
        spinner.strokeCircle(0, 0, 15);
        spinner.setPosition(this.scale.width / 2, this.scale.height / 2 - 80);
        
        // Animate the spinner
        this.tweens.add({
            targets: spinner,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        this.initialLoadingContainer.add([bg, loadingText, descriptionText, spinner]);
    }

    private hideInitialLoadingScreen() {
        if (this.initialLoadingContainer) {
            this.initialLoadingContainer.destroy();
            this.initialLoadingContainer = null;
        }
    }

    private createWalletUI(container: Phaser.GameObjects.Container, contentWidth: number) {
        const isMobile = this.game.device.os.android || 
                        this.game.device.os.iOS || 
                        this.game.device.input.touch;

        if (isMobile) {
            // Show mobile message
            const mobileText = this.add.text(
                contentWidth / 2,
                0,
                'To connect your wallet,\nplease use a desktop computer.',
                {
                    fontSize: '20px',
                    color: '#ffffff',
                    align: 'center',
                    lineSpacing: 10,
                    wordWrap: { width: contentWidth - 40 }
                }
            ).setOrigin(0.5);

            // Add continue button for mobile
            const continueBtn = this.add.text(
                contentWidth / 2,
                80,
                'Continue',
                {
                    fontSize: '24px',
                    backgroundColor: '#4CAF50',
                    padding: { x: 25, y: 15 },
                    color: '#ffffff'
                }
            )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.closeWindow());

            container.add([mobileText, continueBtn]);
        } else {
            // Check for wallet installation first
            if (!this.web3Service.isWalletInstalled()) {
                this.showNoWalletUI(container, contentWidth);
            } else {
                this.showWalletUI(container, contentWidth);
            }
        }
    }

    private showNoWalletUI(container: Phaser.GameObjects.Container, contentWidth: number) {
        // Warning message
        const warningText = this.add.text(
            contentWidth / 2,
            0,
            '⚠️ No Web3 Wallet Detected',
            {
                fontSize: '24px',
                color: '#FFA500',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Instruction text
        const instructionText = this.add.text(
            contentWidth / 2,
            50,
            'To use wallet features, please install a Web3 wallet like MetaMask',
            {
                fontSize: '18px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: contentWidth - 40 }
            }
        ).setOrigin(0.5);

        // Install wallet button
        const installBtn = this.add.text(
            contentWidth / 2,
            120,
            '🦊 Install MetaMask',
            {
                fontSize: '20px',
                backgroundColor: '#FF9800',
                padding: { x: 20, y: 10 },
                color: '#ffffff'
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            window.open(this.web3Service.getWalletInstallLink(), '_blank');
        });

        // Continue button
        const continueBtn = this.add.text(
            contentWidth / 2,
            190,
            'Continue Without Wallet',
            {
                fontSize: '20px',
                backgroundColor: '#4CAF50',
                padding: { x: 20, y: 10 },
                color: '#ffffff'
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.closeWindow());

        // Refresh button
        const refreshBtn = this.add.text(
            contentWidth / 2,
            260,
            '🔄 Check Again',
            {
                fontSize: '18px',
                backgroundColor: '#2196F3',
                padding: { x: 15, y: 8 },
                color: '#ffffff'
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (this.web3Service.isWalletInstalled()) {
                this.scene.restart();
            } else {
                refreshBtn.setText('❌ No Wallet Found');
                this.time.delayedCall(1000, () => {
                    refreshBtn.setText('🔄 Check Again');
                });
            }
        });

        container.add([warningText, instructionText, installBtn, continueBtn, refreshBtn]);
    }

    private showWalletUI(container: Phaser.GameObjects.Container, contentWidth: number) {
        // Title with glow effect
        const title = this.add.text(
            contentWidth / 2,
            0,
            '🎮 Connect Your Wallet',
            {
                fontSize: '28px',
                color: '#ffffff',
                align: 'center',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(
            contentWidth / 2,
            50,
            'Connect your wallet to verify your NFTs',
            {
                fontSize: '18px',
                color: '#3498db',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Create animated connect wallet button
        this.connectButtonContainer = this.add.container(contentWidth / 2, 120);
        
        // Create button text first to measure its dimensions
        this.connectButtonText = this.add.text(
            0,
            0,
            '💎 Connect Wallet',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Calculate button dimensions based on text size with padding
        const paddingX = 30;
        const paddingY = 20;
        const buttonWidth = this.connectButtonText.width + paddingX * 2;
        const buttonHeight = this.connectButtonText.height + paddingY * 2;
        
        // Button background with gradient
        const buttonBg = this.add.graphics();
        buttonBg.fillGradientStyle(0x3498db, 0x2980b9, 0x2980b9, 0x3498db, 1);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
        
        // Button glow effect
        const buttonGlow = this.add.graphics()
            .lineStyle(4, 0x3498db, 0.3)
            .strokeRoundedRect(-buttonWidth/2 - 2, -buttonHeight/2 - 2, buttonWidth + 4, buttonHeight + 4, 15);

        // Loading spinner with simple rotation
        this.loadingSpinner = this.add.text(
            -buttonWidth/2 + 30,
            0,
            '',
            {
                fontSize: '24px',
                color: '#FFA500'
            }
        ).setOrigin(0.5).setVisible(false);

        this.connectButtonContainer.add([buttonBg, buttonGlow, this.loadingSpinner, this.connectButtonText]);

        // Add simple hover effect with dynamic sizing
        this.connectButtonText
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                buttonBg.clear()
                    .fillGradientStyle(0x2980b9, 0x3498db, 0x3498db, 0x2980b9, 1)
                    .fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            })
            .on('pointerout', () => {
                buttonBg.clear()
                    .fillGradientStyle(0x3498db, 0x2980b9, 0x2980b9, 0x3498db, 1)
                    .fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            })
            .on('pointerdown', async () => {
                if (this.web3Service.isWalletConnected()) {
                    await this.handleDisconnect();
                } else {
                    await this.handleConnect();
                }
            });

        container.add([title, subtitle, this.connectButtonContainer]);
    }

    private async handleConnect() {
        try {
            // Disable button and show loading state
            this.connectButtonText.disableInteractive();
            this.connectButtonText.setText('Connecting Wallet...');
            this.updateButtonDimensions();
            this.loadingSpinner.setVisible(true);

            // Connect wallet
            const { success, message } = await this.web3Service.connectWallet();
            
            if (success && this.playerData?.uid) {
                const address = await this.web3Service.getWalletAddress();
                await this.bindWallet(address);
            } else {
                // Show error message centered on screen
                const errorText = this.add.text(
                    this.scale.width / 2,
                    this.scale.height / 2,
                    `❌ ${message || 'Connection failed'}`,
                    {
                        fontSize: '18px',
                        color: '#ff0000',
                        backgroundColor: '#2c3e50',
                        padding: { x: 20, y: 10 }
                    }
                ).setOrigin(0.5);
                
                this.time.delayedCall(3000, () => errorText.destroy());
                this.resetConnectButton();
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            // Show error message centered on screen
            const errorText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                '❌ Connection failed. Please try again.',
                {
                    fontSize: '18px',
                    color: '#ff0000',
                    backgroundColor: '#2c3e50',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);
            
            this.time.delayedCall(3000, () => errorText.destroy());
            this.resetConnectButton();
        }
    }

    private async bindWallet(address: string) {
        try {
            // Save wallet address to database
            await saveWalletAddress(this.playerData.uid, address);
            this.connectButtonText.setText('✅ Wallet Bound');
            this.updateButtonDimensions();
            
            // Show success message centered on screen
            const successText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                '✅ Wallet successfully bound!',
                {
                    fontSize: '18px',
                    color: '#4CAF50',
                    backgroundColor: '#2c3e50',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);
            
            this.time.delayedCall(2000, () => {
                successText.destroy();
                // Proceed with NFT verification
                this.verifyNFT();
            });
        } catch (error) {
            console.error('Error binding wallet:', error);
            // Show error message centered on screen
            const errorText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                '❌ Failed to bind wallet',
                {
                    fontSize: '18px',
                    color: '#ff0000',
                    backgroundColor: '#2c3e50',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);
            
            this.time.delayedCall(3000, () => errorText.destroy());
            this.resetConnectButton();
        }
    }

    private async verifyNFT() {
        try {
            this.loadingOverlay.show('Verifying NFT ownership...');
            const { hasNFT, error } = await this.web3Service.checkNFTOwnership();
            
            if (error) {
                console.warn('NFT verification error:', error);
                this.loadingOverlay.hide();
                // Show error message centered on screen
                const errorText = this.add.text(
                    this.scale.width / 2,
                    this.scale.height / 2,
                    '⚠️ Failed to verify NFT ownership',
                    {
                        fontSize: '18px',
                        color: '#FFA500',
                        backgroundColor: '#2c3e50',
                        padding: { x: 20, y: 10 }
                    }
                ).setOrigin(0.5);
                
                this.time.delayedCall(3000, () => errorText.destroy());
                return;
            }

            if (!hasNFT) {
                this.loadingOverlay.hide();
                // Show message centered on screen
                const noNFTText = this.add.text(
                    this.scale.width / 2,
                    this.scale.height / 2,
                    '⚠️ No NFTs found in this wallet',
                    {
                        fontSize: '18px',
                        color: '#FFA500',
                        backgroundColor: '#2c3e50',
                        padding: { x: 20, y: 10 }
                    }
                ).setOrigin(0.5);
                
                this.time.delayedCall(3000, () => noNFTText.destroy());
            } else {
                // Update localStorage with NFT data
                await this.displayNFTs();
            }
        } catch (error) {
            console.error('NFT verification error:', error);
            this.loadingOverlay.hide();
            // Show error message centered on screen
            const errorText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                '❌ Failed to verify NFTs',
                {
                    fontSize: '18px',
                    color: '#ff0000',
                    backgroundColor: '#2c3e50',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);
            
            this.time.delayedCall(3000, () => errorText.destroy());
        }
    }

    private async displayNFTs() {
        try {
            this.loadingOverlay.show('Fetching your NFTs...');
            // Move the declaration inside the try block where it's used
            const nfts = await this.web3Service.getNFTsData();

            // Save to Firestore and localStorage
            if (nfts && nfts.length > 0) {
                // Save the full NFT data to Firestore, creating a complete cache.
                await saveNFTsToDatabase(this.playerData.uid, nfts);
                // Save the full data to localStorage for fast access during the current session.
                localStorage.setItem('quiztal-nfts', JSON.stringify(nfts));
                console.log('Updated localStorage and Firestore with NFTs:', nfts);
                
                // Activate player glow, titles, and moblin pet for NFT holders
                await this.activateNFTBenefits();
            } else {
                // If no NFTs are found, clear both by saving an empty array.
                await saveNFTsToDatabase(this.playerData.uid, []);
                localStorage.removeItem('quiztal-nfts');
                console.log('No NFTs found, cleared localStorage and Firestore');
            }

            this.loadingOverlay.hide();
            
            // Display NFTs using the NFTDisplayManager
            if (nfts && nfts.length > 0) {
                await this.showNFTDisplay(nfts);
            } else {
                this.showNoNFTMessage();
            }

        } catch (error) {
            console.error('Error displaying NFTs:', error);
            localStorage.removeItem('quiztal-nfts');
            this.loadingOverlay.hide();
            // Show error message centered on screen
            const errorText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                '❌ Failed to load NFTs',
                {
                    fontSize: '18px',
                    color: '#ff0000',
                    backgroundColor: '#2c3e50',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);
            
            this.time.delayedCall(3000, () => errorText.destroy());
        }
    }

    /**
     * Activate player glow, titles, and moblin pet for NFT holders
     */
    private async activateNFTBenefits(): Promise<void> {
        try {
            // Get the GameScene instance
            const gameScene = this.scene.get('GameScene') as any;
            if (gameScene && gameScene.playerManager) {
                // Activate player title and glow effects
                await gameScene.playerManager.createPlayerTitle();
                
                // Activate moblin pet if eligible
                if (gameScene.petManager) {
                    gameScene.petManager.createPetIfEligible();
                }
            }
        } catch (error) {
            console.error('Error activating NFT benefits:', error);
        }
    }

    private async showNFTDisplay(nfts: NFTData[]) {
        try {
            // Hide the wallet UI elements
            this.contentContainer.setVisible(false);
            
            // Update the header title
            const title = this.add.text(this.windowWidth / 2, 30, '🖼️ Your NFT Collection', {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Find and update the existing title
            const existingTitle = this.children.getByName('walletTitle');
            if (existingTitle) {
                existingTitle.destroy();
            }
            
            // Add the new title with a name for future reference
            title.setName('walletTitle');
            
            // Display NFTs using the NFTDisplayManager
            await this.nftDisplayManager.displayNFTs(nfts);
            
            // Remove the continue button for NFT display - NFT window should only display NFTs
            // this.addContinueButton();
            
        } catch (error) {
            console.error('Error showing NFT display:', error);
            this.showErrorMessage('Failed to display NFTs');
        }
    }

    private showNoNFTMessage() {
        // Hide the wallet UI elements
        this.contentContainer.setVisible(false);
        
        // Update the header title
        const title = this.add.text(this.windowWidth / 2, 30, '🖼️ Your NFT Collection', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Find and update the existing title
        const existingTitle = this.children.getByName('walletTitle');
        if (existingTitle) {
            existingTitle.destroy();
        }
        
        // Add the new title with a name for future reference
        title.setName('walletTitle');
        
        // Show no NFT message using the NFTDisplayManager
        this.nftDisplayManager.showNoNFTMessage();
        
        // Remove the continue button for NFT display - NFT window should only display NFTs
        // this.addContinueButton();
    }

    private showErrorMessage(message: string) {
        // Hide the wallet UI elements
        this.contentContainer.setVisible(false);
        
        // Show error message centered on screen
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            `❌ ${message}`,
            {
                fontSize: '18px',
                color: '#ff0000',
                backgroundColor: '#2c3e50',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5);
        
        // Add a continue button at the bottom
        this.addContinueButton();
    }

    private addContinueButton() {
        // Add continue button at the bottom of the window
        this.add.text(
            this.windowWidth / 2,
            this.windowHeight - 40,
            'Continue to Game',
            {
                fontSize: '20px',
                backgroundColor: '#4CAF50',
                padding: { x: 20, y: 10 },
                color: '#ffffff'
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.closeWindow());
    }

    private async handleDisconnect() {
        await this.web3Service.disconnect();
        // Clear NFTs from localStorage on disconnect
        localStorage.removeItem('quiztal-nfts');
        console.log('Wallet disconnected, cleared NFTs from localStorage');
        
        if (this.connectButtonText) {
            this.connectButtonText.setText('💎 Connect Wallet');
            this.updateButtonDimensions();
        }
        if (this.loadingSpinner) {
            this.loadingSpinner.setVisible(false);
        }
    }

    private updateButtonDimensions() {
        if (this.connectButtonText && this.connectButtonContainer) {
            // Get the button background elements (first two children of container)
            const buttonBg = this.connectButtonContainer.getAt(0) as Phaser.GameObjects.Graphics;
            const buttonGlow = this.connectButtonContainer.getAt(1) as Phaser.GameObjects.Graphics;
            
            if (buttonBg && buttonGlow) {
                // Calculate new dimensions based on text size with padding
                const paddingX = 30;
                const paddingY = 20;
                const buttonWidth = this.connectButtonText.width + paddingX * 2;
                const buttonHeight = this.connectButtonText.height + paddingY * 2;
                
                // Redraw button background with new dimensions
                buttonBg.clear();
                buttonBg.fillGradientStyle(0x3498db, 0x2980b9, 0x2980b9, 0x3498db, 1);
                buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
                
                // Redraw button glow with new dimensions
                buttonGlow.clear();
                buttonGlow.lineStyle(4, 0x3498db, 0.3);
                buttonGlow.strokeRoundedRect(-buttonWidth/2 - 2, -buttonHeight/2 - 2, buttonWidth + 4, buttonHeight + 4, 15);
                
                // Reposition loading spinner
                if (this.loadingSpinner) {
                    this.loadingSpinner.setPosition(-buttonWidth/2 + 30, 0);
                }
            }
        }
    }

    private resetConnectButton() {
        if (this.connectButtonText) {
            this.connectButtonText
                .setText('💎 Connect Wallet')
                .setInteractive({ useHandCursor: true });
        }
        this.updateButtonDimensions();
        if (this.loadingSpinner) {
            this.loadingSpinner.setVisible(false);
        }
    }

    private closeWindow() {
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
        this.scene.stop('WalletWindowScene');
    }

    private handleResize() {
        // Handle window resize if needed
        console.log('WalletWindowScene: Resize event detected');
    }

    shutdown() {
        // Cleanup event listeners
        this.scale.off('resize', this.handleResize, this);
        this.events.off('nftDisplayClosed', this.closeWindow, this);
        
        // Clean up NFT display manager
        if (this.nftDisplayManager) {
            this.nftDisplayManager.cleanup();
        }
    }
}