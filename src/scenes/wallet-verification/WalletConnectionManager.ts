/**
 * Enhanced WalletConnectionManager - Modern wallet connection and verification
 * 
 * Enhanced features:
 * - Progressive loading with detailed status updates
 * - Advanced error handling and recovery
 * - Real-time progress tracking
 * - Modern UI integration
 * - Comprehensive NFT verification
 * - Network validation and switching
 * - Enhanced user feedback
 * 
 * @example
 * ```typescript
 * const connectionManager = new WalletConnectionManager(scene, web3Service, playerData, uiManager);
 * const result = await connectionManager.connectWallet();
 * if (result.success) {
 *   await connectionManager.verifyNFTs();
 * }
 * ```
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Web3Service } from '../../services/Web3Service';
import { saveWalletAddress, saveNFTsToDatabase } from '../../utils/Database';
import {
    IWalletConnectionManager,
    PlayerData,
    WalletConnectionResult,
    WalletBindingResult,
    NFTVerificationResult,
    WalletError,
    WalletErrorType,
    LoadingStage,
    IWalletUIManager
} from './types';

export class WalletConnectionManager implements IWalletConnectionManager {
    private scene: Phaser.Scene;
    private web3Service: Web3Service;
    private playerData: PlayerData;
    private uiManager: IWalletUIManager;
    private confirmationDialog: Phaser.GameObjects.Container | null = null;
    
    // Progress tracking
    private progressCallbacks: ((stage: LoadingStage, progress: number, message: string) => void)[] = [];

    constructor(
        scene: Phaser.Scene, 
        web3Service: Web3Service, 
        playerData: PlayerData,
        uiManager: IWalletUIManager
    ) {
        this.scene = scene;
        this.web3Service = web3Service;
        this.playerData = playerData;
        this.uiManager = uiManager;
        
        console.log('Enhanced WalletConnectionManager: Initialized for player', playerData.uid);
    }

    /**
     * Enhanced wallet connection with progressive loading
     */
    public async connectWallet(): Promise<WalletConnectionResult> {
        try {
            console.log('WalletConnectionManager: Starting enhanced wallet connection');

            // Initialize progress tracking
            this.updateProgress(LoadingStage.INITIALIZING, 0, 'Initializing wallet connection...');

            // Check if wallet is installed
            this.updateProgress(LoadingStage.INITIALIZING, 20, 'Checking wallet availability...');
            if (!this.web3Service.isWalletInstalled()) {
                this.updateProgress(LoadingStage.ERROR, 100, 'No Web3 wallet detected');
                return {
                    success: false,
                    message: 'No Web3 wallet detected. Please install MetaMask or another Web3 wallet.'
                };
            }

            // Request wallet connection
            this.updateProgress(LoadingStage.CONNECTING, 40, 'Requesting wallet connection...');
            const connectionResult = await this.web3Service.connectWallet();
            
            if (!connectionResult.success) {
                this.updateProgress(LoadingStage.ERROR, 100, 'Connection failed');
                return {
                    success: false,
                    message: connectionResult.message || 'Failed to connect wallet'
                };
            }

            // Validate network
            this.updateProgress(LoadingStage.AUTHENTICATING, 60, 'Validating network...');
            const networkValid = await this.validateNetwork();
            if (!networkValid) {
                this.updateProgress(LoadingStage.ERROR, 100, 'Invalid network');
                return {
                    success: false,
                    message: 'Please switch to a supported network (Ethereum Mainnet)'
                };
            }

            // Get wallet address
            this.updateProgress(LoadingStage.AUTHENTICATING, 80, 'Retrieving wallet address...');
            const address = await this.web3Service.getWalletAddress();
            if (!address) {
                this.updateProgress(LoadingStage.ERROR, 100, 'Address retrieval failed');
                return {
                    success: false,
                    message: 'Failed to retrieve wallet address'
                };
            }

            // Complete connection
            this.updateProgress(LoadingStage.COMPLETE, 100, 'Wallet connected successfully!');
            
            console.log('WalletConnectionManager: Enhanced wallet connected successfully', address);

            return {
                success: true,
                message: 'Wallet connected successfully',
                address
            };

        } catch (error: any) {
            this.updateProgress(LoadingStage.ERROR, 100, 'Connection error occurred');
            console.error('WalletConnectionManager: Enhanced connection error', error);
            return {
                success: false,
                message: this.formatError(error)
            };
        }
    }

    /**
     * Binds wallet address to player account
     * Handles existing wallet checks and confirmation dialogs
     */
    public async bindWallet(address: string): Promise<WalletBindingResult> {
        try {
            console.log('WalletConnectionManager: Binding wallet', address);

            // Check if player already has a wallet bound
            const existingWallet = await this.checkExistingWallet(this.playerData);
            
            if (existingWallet && existingWallet !== address) {
                // Show confirmation dialog for wallet change
                const confirmed = await this.showWalletChangeConfirmation(existingWallet, address);
                
                if (!confirmed) {
                    return {
                        success: false,
                        message: 'Wallet binding cancelled by user'
                    };
                }
            }

            // Bind the wallet
            await saveWalletAddress(this.playerData.uid, address);
            
            // Update local player data
            this.playerData.walletAddress = address;

            console.log('WalletConnectionManager: Wallet bound successfully');

            return {
                success: true,
                message: 'Wallet bound successfully'
            };

        } catch (error: any) {
            console.error('WalletConnectionManager: Binding error', error);
            return {
                success: false,
                message: this.formatError(error)
            };
        }
    }

    /**
     * Checks if player already has a wallet bound
     */
    public async checkExistingWallet(playerData: PlayerData): Promise<string | null> {
        try {
            const playerDoc = await getDoc(doc(db, "players", playerData.uid));
            
            if (playerDoc.exists()) {
                const data = playerDoc.data();
                return data?.walletAddress || null;
            }
            
            return null;
        } catch (error) {
            console.error('WalletConnectionManager: Error checking existing wallet', error);
            return null;
        }
    }

    /**
     * Shows confirmation dialog for wallet address change
     */
    public async showWalletChangeConfirmation(oldWallet: string, newWallet: string): Promise<boolean> {
        return new Promise((resolve) => {
            console.log('WalletConnectionManager: Showing wallet change confirmation');
            
            // Create confirmation dialog container
            this.confirmationDialog = this.scene.add.container(0, 0);
            
            // Add semi-transparent background
            const bg = this.scene.add.rectangle(
                0, 0,
                this.scene.scale.width,
                this.scene.scale.height,
                0x000000, 0.8
            ).setOrigin(0);

            // Add dialog box
            const dialogBox = this.scene.add.rectangle(
                this.scene.scale.width / 2,
                this.scene.scale.height / 2,
                400,
                300,
                0x2c3e50
            ).setOrigin(0.5);

            // Add warning text
            const warningText = this.scene.add.text(
                this.scene.scale.width / 2,
                this.scene.scale.height / 2 - 80,
                '⚠️ Change Wallet Binding',
                {
                    fontSize: '24px',
                    color: '#FFA500',
                    align: 'center'
                }
            ).setOrigin(0.5);

            // Add current wallet info
            const currentWalletText = this.scene.add.text(
                this.scene.scale.width / 2,
                this.scene.scale.height / 2 - 20,
                `Current: ${this.shortenAddress(oldWallet)}`,
                {
                    fontSize: '16px',
                    color: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);

            // Add new wallet info
            const newWalletText = this.scene.add.text(
                this.scene.scale.width / 2,
                this.scene.scale.height / 2 + 20,
                `New: ${this.shortenAddress(newWallet)}`,
                {
                    fontSize: '16px',
                    color: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);

            // Add confirm button
            const confirmBtn = this.scene.add.text(
                this.scene.scale.width / 2 - 100,
                this.scene.scale.height / 2 + 80,
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
            .on('pointerdown', () => {
                this.cleanupConfirmationDialog();
                resolve(true);
            });

            // Add cancel button
            const cancelBtn = this.scene.add.text(
                this.scene.scale.width / 2 + 100,
                this.scene.scale.height / 2 + 80,
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
                this.cleanupConfirmationDialog();
                resolve(false);
            });

            this.confirmationDialog.add([
                bg, dialogBox, warningText, 
                currentWalletText, newWalletText, 
                confirmBtn, cancelBtn
            ]);

            // Add entrance animation
            this.confirmationDialog.setAlpha(0);
            this.scene.tweens.add({
                targets: this.confirmationDialog,
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
        });
    }

    /**
     * Enhanced NFT verification with progressive loading
     */
    public async verifyNFTs(): Promise<NFTVerificationResult> {
        try {
            console.log('WalletConnectionManager: Starting enhanced NFT verification');
            
            // Initialize NFT verification
            this.updateProgress(LoadingStage.LOADING_NFTS, 0, 'Initializing NFT verification...');

            // Check NFT ownership
            this.updateProgress(LoadingStage.LOADING_NFTS, 20, 'Checking NFT ownership...');
            const { hasNFT, error } = await this.web3Service.checkNFTOwnership();
            
            if (error) {
                this.updateProgress(LoadingStage.ERROR, 100, 'NFT verification failed');
                console.warn('WalletConnectionManager: NFT verification error', error);
                // Clear NFTs from localStorage on error
                localStorage.removeItem('niftdood-nfts');
                
                return {
                    hasNFTs: false,
                    error: 'Failed to verify NFT ownership'
                };
            }

            if (!hasNFT) {
                this.updateProgress(LoadingStage.COMPLETE, 100, 'No NFTs found in wallet');
                // Clear NFTs if none found
                localStorage.removeItem('niftdood-nfts');
                await saveNFTsToDatabase(this.playerData.uid, []);
                console.log('WalletConnectionManager: No NFTs found');
                
                return {
                    hasNFTs: false,
                    nfts: []
                };
            }

            // Get detailed NFT data
            this.updateProgress(LoadingStage.LOADING_NFTS, 50, 'Fetching NFT details...');
            const nfts = await this.web3Service.getNFTsData();
            
            console.log(`WalletConnectionManager: Web3Service returned ${nfts.length} NFTs`);
            
            if (nfts && nfts.length > 0) {
                // Validate NFT data before saving
                this.updateProgress(LoadingStage.LOADING_NFTS, 70, 'Validating NFT data...');
                const uniqueNFTs = this.validateAndDeduplicateNFTs(nfts);
                
                if (uniqueNFTs.length !== nfts.length) {
                    console.warn(`WalletConnectionManager: Removed ${nfts.length - uniqueNFTs.length} duplicate NFTs`);
                }
                
                console.log(`WalletConnectionManager: Saving ${uniqueNFTs.length} unique NFTs to database`);
                
                // Save to both Firestore and localStorage
                this.updateProgress(LoadingStage.LOADING_NFTS, 90, 'Saving NFT data...');
                await saveNFTsToDatabase(this.playerData.uid, uniqueNFTs);
                localStorage.setItem('niftdood-nfts', JSON.stringify(uniqueNFTs));
                
                this.updateProgress(LoadingStage.COMPLETE, 100, `Successfully verified ${uniqueNFTs.length} NFTs!`);
                console.log('WalletConnectionManager: Enhanced NFTs verified and saved', uniqueNFTs.length);
                
                return {
                    hasNFTs: true,
                    nfts: uniqueNFTs
                };
            } else {
                // No NFT data available
                this.updateProgress(LoadingStage.COMPLETE, 100, 'No NFT data available');
                localStorage.removeItem('niftdood-nfts');
                await saveNFTsToDatabase(this.playerData.uid, []);
                
                return {
                    hasNFTs: false,
                    nfts: []
                };
            }

        } catch (error: any) {
            this.updateProgress(LoadingStage.ERROR, 100, 'NFT verification failed');
            console.error('WalletConnectionManager: Enhanced NFT verification error', error);
            localStorage.removeItem('niftdood-nfts');
            
            return {
                hasNFTs: false,
                error: this.formatError(error)
            };
        }
    }

    /**
     * Progress tracking and UI updates
     */
    private updateProgress(stage: LoadingStage, progress: number, message: string): void {
        // Update UI manager if available
        if (this.uiManager && typeof this.uiManager.updateProgress === 'function') {
            this.uiManager.updateProgress(stage, progress, message);
        }
        
        // Notify any registered callbacks
        this.progressCallbacks.forEach(callback => {
            callback(stage, progress, message);
        });
        
        console.log(`Enhanced Progress: ${stage} - ${progress}% - ${message}`);
    }

    /**
     * Register progress callback
     */
    public onProgress(callback: (stage: LoadingStage, progress: number, message: string) => void): void {
        this.progressCallbacks.push(callback);
    }

    /**
     * Network validation
     */
    private async validateNetwork(): Promise<boolean> {
        try {
            const network = await this.web3Service.getNetwork();
            const chainIdNumber = parseInt(network.chainId, 16);
            const supportedChains = [1, 5, 8453]; // Ethereum Mainnet, Goerli Testnet, Base Mainnet
            return supportedChains.includes(chainIdNumber);
        } catch (error) {
            console.error('Network validation error:', error);
            return false;
        }
    }

    /**
     * Disconnects wallet and clears all associated data
     */
    public async disconnectWallet(): Promise<void> {
        try {
            console.log('WalletConnectionManager: Disconnecting wallet');
            
            await this.web3Service.disconnect();
            
            // Clear NFTs from localStorage
            localStorage.removeItem('niftdood-nfts');
            
            // Update player data
            this.playerData.walletAddress = undefined;
            
            console.log('WalletConnectionManager: Wallet disconnected successfully');
            
        } catch (error: any) {
            console.error('WalletConnectionManager: Disconnection error', error);
        }
    }

    /**
     * Validates player data integrity
     */
    public async validatePlayerData(): Promise<WalletError | null> {
        try {
            if (!this.playerData?.uid) {
                return {
                    type: WalletErrorType.PLAYER_DATA_NOT_FOUND,
                    message: 'Player data not found. Please log in again.',
                    recoverable: true
                };
            }

            // Fetch latest data from Firestore
            const playerDoc = await getDoc(doc(db, "players", this.playerData.uid));
            
            if (!playerDoc.exists()) {
                return {
                    type: WalletErrorType.PLAYER_DATA_NOT_FOUND,
                    message: 'Player document not found in database.',
                    recoverable: true
                };
            }

            return null; // No error
            
        } catch (error: any) {
            return {
                type: WalletErrorType.FIRESTORE_ERROR,
                message: 'Failed to validate player data',
                details: error,
                recoverable: true
            };
        }
    }

    /**
     * Gets current wallet connection status
     */
    public isWalletConnected(): boolean {
        return this.web3Service.isWalletConnected();
    }

    /**
     * Gets current wallet address if connected
     */
    public async getCurrentWalletAddress(): Promise<string | null> {
        try {
            if (!this.isWalletConnected()) {
                return null;
            }
            return await this.web3Service.getWalletAddress();
        } catch (error) {
            console.error('WalletConnectionManager: Error getting wallet address', error);
            return null;
        }
    }

    /**
     * Cleans up connection manager resources
     */
    public cleanup(): void {
        this.cleanupConfirmationDialog();
        console.log('WalletConnectionManager: Cleanup completed');
    }

    // Private helper methods

    private cleanupConfirmationDialog(): void {
        if (this.confirmationDialog) {
            this.confirmationDialog.destroy();
            this.confirmationDialog = null;
        }
    }

    private shortenAddress(address: string): string {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    private formatError(error: any): string {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error?.message) {
            return error.message;
        }
        
        if (error?.code === 4001) {
            return 'User rejected the connection request';
        }
        
        if (error?.code === -32002) {
            return 'Please check your wallet for pending connection requests';
        }
        
        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Validates and deduplicates NFT data to ensure integrity
     */
    private validateAndDeduplicateNFTs(nfts: any[]): any[] {
        const seen = new Set<string>();
        const uniqueNFTs: any[] = [];
        
        for (const nft of nfts) {
            // Create unique identifier using collection type and token ID
            const uniqueId = `${nft.collectionType}-${nft.tokenId}`;
            
            if (!seen.has(uniqueId)) {
                seen.add(uniqueId);
                uniqueNFTs.push(nft);
                console.log(`WalletConnectionManager: Added unique NFT: ${nft.name} (${uniqueId})`);
            } else {
                console.warn(`WalletConnectionManager: Duplicate NFT detected: ${nft.name} (${uniqueId})`);
            }
        }
        
        console.log(`WalletConnectionManager: Validation complete. ${uniqueNFTs.length} unique NFTs from ${nfts.length} total`);
        return uniqueNFTs;
    }
}