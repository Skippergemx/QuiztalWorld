import { getAuth } from "firebase/auth";
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Web3Service } from '../services/Web3Service';

export default class TokenClaimScene extends Phaser.Scene {
    private web3Service: Web3Service;
    private claimButton!: Phaser.GameObjects.Container;
    private balanceText!: Phaser.GameObjects.Text;
    private userId!: string;         // <--- add !
    private tokenAddress!: string;   // <--- add !

    // Add new property
    private connectionIndicator!: Phaser.GameObjects.Container;

    // Add new properties at the top of the class
    private statusContainer!: Phaser.GameObjects.Container;
    private statusText!: Phaser.GameObjects.Text;
    private statusSteps: string[] = [
        '⏳ Initializing claim process...',
        '📝 Preparing transaction...',
        '🔄 Waiting for wallet confirmation...',
        '📡 Broadcasting to network...',
        '✅ Transaction confirmed!',
        '📊 Updating game balance...'
    ];

   constructor() {
    super({ key: 'TokenClaimScene' });
    this.web3Service = new Web3Service();
    // Remove authentication check from constructor
    // User ID will be set in create()
}

    async create() {
        const auth = getAuth();
        if (!auth.currentUser) {
            this.scene.stop();
            this.scene.start('GoogleLoginScene');
            return;
        }
        this.userId = auth.currentUser.uid;

        // FIX: Assign tokenAddress from environment here
        this.tokenAddress = import.meta.env.VITE_QUIZTAL_TOKEN_ADDRESS;

        // Now your check will work as intended
        if (!this.tokenAddress) {
            console.error('Token address not configured in environment');
            this.showError('Token claiming is currently unavailable');
            return;
        }

        // Initialize treasury wallet first with a read-only provider
        try {
            const initSuccess = await this.web3Service.initTreasurySigner();
            if (!initSuccess) {
                console.error('Failed to initialize treasury wallet');
                this.showError('Failed to initialize claiming service');
                return;
            }
        } catch (error) {
            console.error('Failed to initialize treasury wallet:', error);
            this.showError('Failed to initialize claiming service');
            return;
        }

        console.log('Token contract address:', this.tokenAddress);
        
        // Check wallet connection first
        if (!this.web3Service.isWalletConnected()) {
            this.createConnectWalletInterface();
        } else {
            this.createClaimInterface();
            this.updateBalanceDisplay();
            this.createConnectionIndicator();
        }

        // Add close button
        this.createCloseButton();
    }

    private createConnectionIndicator() {
        const isMobile = this.scale.width < 768;
        const indicatorSize = isMobile ? 8 : 10;
        const padding = isMobile ? 10 : 15;
        
        // Create container for indicator and text
        this.connectionIndicator = this.add.container(
            this.scale.width - (isMobile ? 80 : 100),
            isMobile ? 20 : 30
        );

        // Create green circle
        const circle = this.add.graphics();
        circle.fillStyle(0x2ecc71, 1);  // Green color
        circle.fillCircle(0, 0, indicatorSize);
        
        // Add glow effect
        const glow = this.add.graphics();
        glow.lineStyle(4, 0x2ecc71, 0.4);
        glow.strokeCircle(0, 0, indicatorSize);

        // Add "Connected" text
        const text = this.add.text(
            indicatorSize + padding, 
            0, 
            'Connected', 
            {
                fontSize: isMobile ? '12px' : '14px',
                color: '#2ecc71',
                fontStyle: 'bold'
            }
        ).setOrigin(0, 0.5);

        this.connectionIndicator.add([glow, circle, text]);
    }

    private async handleConnectWallet(buttonContainer: Phaser.GameObjects.Container) {
        try {
            // Disable button and show loading state
            buttonContainer.setAlpha(0.5);
            buttonContainer.disableInteractive();

            // Attempt to connect wallet
            const result = await this.web3Service.connectWallet();

            if (result.success) {
                // Clear current interface
                this.children.removeAll();
                
                // Show claim interface if connection successful
                this.createClaimInterface();
                this.updateBalanceDisplay();
                this.createConnectionIndicator();  // Add this line
                this.createCloseButton();
            } else {
                this.showError(result.message);
                // Reset button state
                buttonContainer.setAlpha(1);
                buttonContainer.setInteractive();
            }
        } catch (error: any) {
            this.showError(error.message || 'Failed to connect wallet');
            // Reset button state
            buttonContainer.setAlpha(1);
            buttonContainer.setInteractive();
        }
    }

    private createConnectWalletInterface() {
        const isMobile = this.scale.width < 768;

        // Add semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Create title
        this.add.text(
            this.scale.width / 2,
            isMobile ? 60 : 100,
            '💎 Token Claiming',
            {
                fontSize: isMobile ? '28px' : '36px',
                color: '#ffffff',
                fontStyle: 'bold',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 5,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // Add subtitle
        this.add.text(
            this.scale.width / 2,
            isMobile ? 120 : 170,
            'Connect your wallet to claim tokens',
            {
                fontSize: isMobile ? '18px' : '24px',
                color: '#3498db',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Create connect button container
        const buttonWidth = isMobile ? 220 : 280;
        const buttonContainer = this.add.container(
            this.scale.width / 2,
            this.scale.height / 2
        );

        // Button background with gradient
        const buttonBg = this.add.graphics();
        buttonBg.fillGradientStyle(
            0x3498db,
            0x3498db,
            0x2980b9,
            0x2980b9,
            1
        );
        buttonBg.fillRoundedRect(
            -buttonWidth/2,
            -30,
            buttonWidth,
            60,
            12
        );

        // Button glow
        const buttonGlow = this.add.graphics();
        buttonGlow.lineStyle(2, 0x3498db, 0.5);
        buttonGlow.strokeRoundedRect(
            -buttonWidth/2 - 2,
            -32,
            buttonWidth + 4,
            64,
            12
        );

        const buttonText = this.add.text(0, 0, '🦊 Connect MetaMask', {
            fontSize: isMobile ? '20px' : '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        buttonContainer.add([buttonBg, buttonGlow, buttonText]);
        buttonContainer
            .setInteractive(new Phaser.Geom.Rectangle(
                -buttonWidth/2,
                -30,
                buttonWidth,
                60
            ), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillGradientStyle(
                    0x2980b9,
                    0x2980b9,
                    0x3498db,
                    0x3498db,
                    1
                );
                buttonBg.fillRoundedRect(
                    -buttonWidth/2,
                    -30,
                    buttonWidth,
                    60,
                    12
                );
            })
            .on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillGradientStyle(
                    0x3498db,
                    0x3498db,
                    0x2980b9,
                    0x2980b9,
                    1
                );
                buttonBg.fillRoundedRect(
                    -buttonWidth/2,
                    -30,
                    buttonWidth,
                    60,
                    12
                );
            })
            .on('pointerdown', () => this.handleConnectWallet(buttonContainer));

        // Remove this line since we're not using the property:
        // this.connectButton = buttonContainer;
    }

    private async createClaimInterface() {
        const isMobile = this.scale.width < 768;

        // Add semi-transparent background overlay
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Create title with glow effect - add to scene directly
        this.add.text(
            this.scale.width / 2,
            isMobile ? 60 : 100,
            '💎 Claim Quiztal Tokens',
            {
                fontSize: isMobile ? '28px' : '36px',
                color: '#ffffff',
                fontStyle: 'bold',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 5,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // Create card background
        const cardWidth = isMobile ? this.scale.width * 0.9 : 400;
        const cardHeight = 280; // Reduced height since we removed input
        const cardY = this.scale.height / 2 - 50;
        
        // Create card graphics
        const card = this.add.graphics();
        card.fillStyle(0x1a1a1a, 0.9);
        card.fillRoundedRect(
            (this.scale.width - cardWidth) / 2,
            cardY,
            cardWidth,
            cardHeight,
            16
        );
        card.lineStyle(2, 0x3498db, 1);
        card.strokeRoundedRect(
            (this.scale.width - cardWidth) / 2,
            cardY,
            cardWidth,
            cardHeight,
            16
        );

        // Display current balance with max claim info
        this.balanceText = this.add.text(
            this.scale.width / 2,
            cardY + 80,
            'Loading balance...',
            {
                fontSize: isMobile ? '24px' : '28px',
                color: '#f1c40f',
                fontStyle: 'bold',
                align: 'center',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // Add claim info text
        this.add.text(
            this.scale.width / 2,
            cardY + 130,
            'Maximum claim amount: 100 Quiztals\nMinimum claim amount: 10 Quiztals',
            {
                fontSize: isMobile ? '14px' : '16px',
                color: '#3498db',
                align: 'center',
                lineSpacing: 10
            }
        ).setOrigin(0.5);

        // Create claim button
        const buttonWidth = isMobile ? 200 : 240;
        this.claimButton = this.createClaimButton(
            this.scale.width / 2,
            cardY + 200,
            buttonWidth
        );
    }

    private createClaimButton(x: number, y: number, width: number): Phaser.GameObjects.Container {
        const isMobile = this.scale.width < 768;
        const buttonContainer = this.add.container(0, 0);  // Changed from x,y to 0,0

        // Button background with gradient
        const buttonBg = this.add.graphics();
        buttonBg.fillGradientStyle(
            0x2ecc71,
            0x2ecc71,
            0x27ae60,
            0x27ae60,
            1
        );
        buttonBg.fillRoundedRect(
            -width/2,  // Changed from x - width/2
            -25,
            width,
            50,
            8
        );

        // Button glow effect
        const buttonGlow = this.add.graphics();
        buttonGlow.lineStyle(2, 0x2ecc71, 0.5);
        buttonGlow.strokeRoundedRect(
            -width/2 - 2,  // Changed from x - width/2 - 2
            -27,
            width + 4,
            54,
            8
        );

        const buttonText = this.add.text(0, 0, '💎 Claim Tokens', {  // Changed from x,y to 0,0
            fontSize: isMobile ? '20px' : '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        buttonContainer.add([buttonBg, buttonGlow, buttonText]);
        buttonContainer.setPosition(x, y);  // Set position after adding elements

        // Add interactive behavior
        buttonContainer
            .setInteractive(new Phaser.Geom.Rectangle(
                -width/2,  // Changed from x - width/2
                -25,
                width,
                50
            ), Phaser.Geom.Rectangle.Contains)
            .on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillGradientStyle(
                    0x27ae60,
                    0x27ae60,
                    0x2ecc71,
                    0x2ecc71,
                    1
                );
                buttonBg.fillRoundedRect(
                    -width/2,  // Changed from x - width/2
                    -25,
                    width,
                    50,
                    8
                );
            })
            .on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillGradientStyle(
                    0x2ecc71,
                    0x2ecc71,
                    0x27ae60,
                    0x27ae60,
                    1
                );
                buttonBg.fillRoundedRect(
                    -width/2,  // Changed from x - width/2
                    -25,
                    width,
                    50,
                    8
                );
            })
            .on('pointerdown', async () => {
                // This is the correct way to handle the claim
                await this.processClaimRequest();
            });

        return buttonContainer;
    }

    // Update processClaimRequest with improved flow
    private async processClaimRequest() {
        // Create and show status window
        this.createStatusWindow();
        this.statusContainer.setAlpha(1);
        this.updateStatus(0);

        const playerDoc = await getDoc(doc(db, "players", this.userId));
        if (!playerDoc.exists()) return;

        const currentBalance = playerDoc.data().quiztals || 0;
        const claimAmount = Math.min(Math.floor(currentBalance), 100);
        
        if (claimAmount < 10) {
            this.updateStatus(0, 'Minimum claim amount is 10 Quiztals');
            this.showError('Minimum claim amount is 10 Quiztals');
            return;
        }

        this.claimButton.setAlpha(0.5);
        this.claimButton.disableInteractive();

        try {
            this.updateStatus(1);
            console.log(`Initiating claim for ${claimAmount} Quiztals...`);

            this.updateStatus(2);
            const result = await this.web3Service.claimTokens(claimAmount);
            
            if (result.success && result.txHash) {
                this.updateStatus(3);
                console.log('Transaction confirmed:', result.txHash);

                this.updateStatus(4);

                this.updateStatus(5);
                await updateDoc(doc(db, "players", this.userId), {
                    quiztals: currentBalance - claimAmount,
                    claimHistory: arrayUnion({
                        amount: claimAmount,
                        timestamp: Date.now(),
                        txHash: result.txHash
                    })
                });

                // Close status window with success animation
                this.tweens.add({
                    targets: this.statusContainer,
                    alpha: 0,
                    scale: 1.1,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        this.statusContainer.destroy();
                        this.showSuccess(
                            `Successfully claimed ${claimAmount} Quiztals!\n` +
                            `Transaction: ${result.txHash?.substring(0, 10) || 'Pending'}...`
                        );
                    }
                });
                
                this.updateBalanceDisplay();
            } else {
                this.updateStatus(2, result.message);
                console.error('Claim failed:', result.message);
            }
        } catch (error: any) {
            console.error('Claim error:', error);
            this.updateStatus(2, error.message || 'Failed to process claim');
        } finally {
            this.claimButton.setAlpha(1);
            this.claimButton.setInteractive();

            // If error occurred, fade out status window after delay
            if (this.statusContainer.alpha === 1) {
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: this.statusContainer,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => this.statusContainer.destroy()
                    });
                });
            }
        }
    }

    private async updateBalanceDisplay() {
        if (!this.userId) {
    this.showError('You must be logged in to claim.');
    return;
}

        const playerDoc = await getDoc(doc(db, "players", this.userId));
        if (playerDoc.exists()) {
            const balance = playerDoc.data().quiztals || 0;
            const roundedBalance = Math.floor(balance);
            const claimAmount = Math.min(roundedBalance, 100);
            
            if (claimAmount < 10) {
                this.balanceText.setText(`Available balance: ${roundedBalance} Quiztals\n(Minimum 10 required to claim)`);
                if (this.claimButton) {
                    this.claimButton.setAlpha(0.5);
                    this.claimButton.disableInteractive();
                }
            } else {
                this.balanceText.setText(`Available balance: ${roundedBalance} Quiztals\nClaimable amount: ${claimAmount} Quiztals`);
                if (this.claimButton) {
                    this.claimButton.setAlpha(1);
                    this.claimButton.setInteractive();
                }
            }
        }
    }

    private createCloseButton() {
        const isMobile = this.scale.width < 768;
        const button = this.add.text(
            this.scale.width - (isMobile ? 30 : 40),
            isMobile ? 20 : 30,
            '✖',
            {
                fontSize: isMobile ? '24px' : '32px',
                color: '#ffffff'
            }
        )
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5)
        .on('pointerover', () => button.setAlpha(0.7))
        .on('pointerout', () => button.setAlpha(1))
        .on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }

    private showError(message: string) {
        const errorText = this.add.text(
            this.scale.width / 2,
            this.scale.height - 100,
            '❌ ' + message,
            {
                fontSize: '18px',
                color: '#ff6b6b',
                backgroundColor: '#2d3436',
                padding: { x: 15, y: 10 },
                // Remove borderRadius as it's not supported
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 3,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: errorText,
            alpha: 0,
            y: errorText.y - 20,
            duration: 2000,
            ease: 'Power2',
            delay: 2000,
            onComplete: () => errorText.destroy()
        });
    }

    // Update showSuccess to display transaction info better
    private showSuccess(message: string) {
        const lines = message.split('\n');
        const container = this.add.container(
            this.scale.width / 2,
            this.scale.height - 120  // Moved up slightly to accommodate link
        );

        const bg = this.add.graphics()
            .fillStyle(0x2d3436, 0.9)
            .fillRoundedRect(-200, -50, 400, 100, 8);  // Made taller for link

        const successText = this.add.text(
            0,
            -25,
            '✅ ' + lines[0],
            {
                fontSize: '18px',
                color: '#00b894',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Extract tx hash from second line
        const txHash = lines[1].split(': ')[1].replace('...', '');

        // Create View on Basescan link
        const viewOnBasescan = this.add.text(
            0,
            10,
            '🔍 View on Basescan',
            {
                fontSize: '14px',
                color: '#3498db',
                align: 'center'
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            viewOnBasescan.setStyle({ color: '#2980b9' });
            viewOnBasescan.setText('🔍 View on Basescan (Click)');
        })
        .on('pointerout', () => {
            viewOnBasescan.setStyle({ color: '#3498db' });
            viewOnBasescan.setText('🔍 View on Basescan');
        })
        .on('pointerdown', () => {
            const basescanUrl = `https://basescan.org/tx/${txHash}`;
            window.open(basescanUrl, '_blank');
        });

        container.add([bg, successText, viewOnBasescan]);

        this.tweens.add({
            targets: container,
            alpha: 0,
            y: container.y - 20,
            duration: 2000,
            ease: 'Power2',
            delay: 4000,  // Increased delay to give time to click
            onComplete: () => container.destroy()
        });
    }

    // Add method to create status window
    private createStatusWindow() {
        const isMobile = this.scale.width < 768;
        const width = isMobile ? 300 : 400;
        const height = 180;
        
        this.statusContainer = this.add.container(
            this.scale.width / 2,
            this.scale.height / 2
        ).setAlpha(0);

        // Background panel
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a1a, 0.95);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 16);
        bg.lineStyle(2, 0x3498db);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 16);

        // Title
        const title = this.add.text(
            0,
            -height/2 + 25,
            '💎 Claim Status',
            {
                fontSize: isMobile ? '20px' : '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Status text
        this.statusText = this.add.text(
            0,
            0,
            '',
            {
                fontSize: isMobile ? '16px' : '18px',
                color: '#3498db',
                align: 'center',
                lineSpacing: 8
            }
        ).setOrigin(0.5);

        this.statusContainer.add([bg, title, this.statusText]);
    }

    // Add method to update status
    private updateStatus(step: number, error?: string) {
        if (!this.statusContainer || !this.statusText) return;

        if (error) {
            this.statusText.setText('❌ ' + error).setColor('#ff6b6b');
            return;
        }

        const steps = this.statusSteps.slice(0, step + 1);
        this.statusText.setText(steps.join('\n')).setColor('#3498db');
    }
}