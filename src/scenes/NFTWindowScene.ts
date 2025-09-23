import Phaser from "phaser";
import { NFTDisplayManager } from './wallet-verification/NFTDisplayManager';
import { Web3Service } from '../services/Web3Service';
import { NFTData } from '../types/nft';

export default class NFTWindowScene extends Phaser.Scene {
    private nftDisplayManager!: NFTDisplayManager;
    private web3Service!: Web3Service;
    private onCloseCallback?: () => void;
    private initialLoadingContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super({ key: 'NFTWindowScene' });
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

        // Load player data
        const playerDataStr = localStorage.getItem("quiztal-player");
        if (!playerDataStr) {
            this.hideInitialLoadingScreen();
            this.closeWindow();
            return;
        }

        // Initialize NFT display manager
        this.nftDisplayManager = new NFTDisplayManager(this);

        // Add event listener for when NFT display is closed
        this.events.on('nftDisplayClosed', this.closeWindow, this);

        // Load and display NFTs
        await this.loadAndDisplayNFTs();
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
            'Preparing NFT Collection...',
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
            'Checking wallet connection and loading your NFTs',
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

    private async loadAndDisplayNFTs() {
        try {
            // Hide initial loading screen
            this.hideInitialLoadingScreen();

            // Check if we have NFTs in localStorage first
            const nftDataStr = localStorage.getItem('quiztal-nfts');
            if (nftDataStr) {
                const nfts: NFTData[] = JSON.parse(nftDataStr);
                if (nfts.length > 0) {
                    console.log('NFTWindowScene: Displaying NFTs from localStorage');
                    await this.nftDisplayManager.displayNFTs(nfts);
                    return;
                }
            }

            // If no NFTs in localStorage, try to fetch from Web3 service
            console.log('NFTWindowScene: No NFTs in localStorage, checking wallet connection');
            
            // Check if wallet is connected
            if (!this.web3Service.isWalletConnected()) {
                console.log('NFTWindowScene: Wallet not connected, showing message');
                this.showNoWalletMessage();
                return;
            }

            // Fetch NFTs from wallet
            console.log('NFTWindowScene: Fetching NFTs from wallet');
            const nfts = await this.web3Service.getNFTsData();
            
            if (nfts && nfts.length > 0) {
                console.log('NFTWindowScene: Displaying NFTs from wallet');
                await this.nftDisplayManager.displayNFTs(nfts);
            } else {
                console.log('NFTWindowScene: No NFTs found in wallet');
                this.nftDisplayManager.showNoNFTMessage();
            }
        } catch (error) {
            console.error('NFTWindowScene: Error loading NFTs', error);
            this.hideInitialLoadingScreen();
            this.showErrorMessage('Failed to load NFTs. Please try again.');
        }
    }

    private showNoWalletMessage() {
        // Create message container
        const container = this.add.container(this.scale.width / 2, this.scale.height / 2);

        // Add semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(-200, -150, 400, 300);
        bg.setInteractive(new Phaser.Geom.Rectangle(-200, -150, 400, 300), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.closeWindow());

        // Add message text
        const message = this.add.text(0, -50, 'Wallet Not Connected', {
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add instruction text
        const instruction = this.add.text(0, 0, 'Please connect your wallet to view NFTs', {
            fontSize: '18px',
            color: '#3498db',
            align: 'center'
        }).setOrigin(0.5);

        // Add close button
        const closeBtn = this.add.text(0, 60, 'Close', {
            fontSize: '20px',
            backgroundColor: '#e74c3c',
            padding: { x: 20, y: 10 },
            color: '#ffffff'
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.closeWindow());

        container.add([bg, message, instruction, closeBtn]);
    }

    private showErrorMessage(message: string) {
        // Create error message container
        const container = this.add.container(this.scale.width / 2, this.scale.height / 2);

        // Add semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(-200, -100, 400, 200);
        bg.setInteractive(new Phaser.Geom.Rectangle(-200, -100, 400, 200), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.closeWindow());

        // Add error text
        const errorText = this.add.text(0, -20, `❌ ${message}`, {
            fontSize: '20px',
            color: '#ff0000',
            align: 'center',
            wordWrap: { width: 350 }
        }).setOrigin(0.5);

        // Add close button
        const closeBtn = this.add.text(0, 30, 'Close', {
            fontSize: '20px',
            backgroundColor: '#e74c3c',
            padding: { x: 20, y: 10 },
            color: '#ffffff'
        }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.closeWindow());

        container.add([bg, errorText, closeBtn]);
    }

    private closeWindow() {
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
        this.scene.stop('NFTWindowScene');
    }

    shutdown() {
        // Clean up event listeners
        this.events.off('nftDisplayClosed', this.closeWindow, this);
        
        // Clean up NFT display manager
        if (this.nftDisplayManager) {
            this.nftDisplayManager.cleanup();
        }
    }
}