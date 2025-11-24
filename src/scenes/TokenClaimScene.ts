import { getAuth } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
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

    // Detect mobile device
    private isMobile: boolean = false;

   constructor() {
    super({ key: 'TokenClaimScene' });
    this.web3Service = new Web3Service();
    // Remove authentication check from constructor
    // User ID will be set in create()
}

    async create() {
        // Detect mobile device
        this.isMobile = this.game.device.os.android || 
                       this.game.device.os.iOS || 
                       this.game.device.input.touch ||
                       this.scale.width < 768;

        const auth = getAuth();
        if (!auth.currentUser) {
            this.scene.stop();
            this.scene.start('GoogleLoginScene');
            return;
        }
        this.userId = auth.currentUser.uid;

        // FIX: Assign tokenAddress from environment here
        this.tokenAddress = import.meta.env.VITE_NDOOD_TOKEN_ADDRESS;

        // Now your check will work as intended
        if (!this.tokenAddress) {
            console.error('Token address not configured in environment');
            this.showError('Token claiming is currently unavailable');
            return;
        }

        console.log('Token contract address:', this.tokenAddress);
        
        // Check if mobile - show mobile restriction message
        if (this.isMobile) {
            this.createMobileRestrictionInterface();
        } else {
            // Check wallet connection first
            if (!this.web3Service.isWalletConnected()) {
                this.createConnectWalletInterface();
            } else {
                this.createClaimInterface();
                this.updateBalanceDisplay();
                this.createConnectionIndicator();
            }
        }

        // Add close button
        this.createCloseButton();
    }

    private createMobileRestrictionInterface() {
        // Add semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Create main container for centering
        const container = this.add.container(this.scale.width / 2, this.scale.height / 2);

        // Create card background
        const cardWidth = this.scale.width * 0.9;
        const cardHeight = 400;
        
        const card = this.add.graphics();
        card.fillStyle(0x1a1a1a, 0.95);
        card.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
        card.lineStyle(3, 0xe74c3c, 1);
        card.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);

        // Icon
        const icon = this.add.text(0, -120, '💻', {
            fontSize: '64px'
        }).setOrigin(0.5);

        // Title
        const title = this.add.text(0, -50, 'Desktop Required', {
            fontSize: '28px',
            color: '#e74c3c',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Message with proper text containment
        const message = this.add.text(0, 20, 
            'Token claiming is only available on desktop/PC.\n\n' +
            'Please use a desktop computer or laptop\n' +
            'with MetaMask to claim your tokens.',
            {
                fontSize: '16px',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 8,
                wordWrap: { 
                    width: cardWidth - 40,
                    useAdvancedWrap: true
                }
            }
        ).setOrigin(0.5);

        // "Got it" button
        const buttonWidth = 200;
        const buttonContainer = this.add.container(0, 120);
        
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x3498db);
        buttonBg.fillRoundedRect(-buttonWidth/2, -25, buttonWidth, 50, 8);
        
        const buttonText = this.add.text(0, 0, 'Got it!', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        buttonContainer.add([buttonBg, buttonText]);
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(-buttonWidth/2, -25, buttonWidth, 50),
            Phaser.Geom.Rectangle.Contains
        )
        .on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        })
        .on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x2980b9);
            buttonBg.fillRoundedRect(-buttonWidth/2, -25, buttonWidth, 50, 8);
        })
        .on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x3498db);
            buttonBg.fillRoundedRect(-buttonWidth/2, -25, buttonWidth, 50, 8);
        });

        container.add([card, icon, title, message, buttonContainer]);
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

        // Calculate title width for proper containment
        const titleWidth = isMobile ? this.scale.width * 0.9 : 500;
        
        // Create title with proper text containment
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
                },
                align: 'center',
                wordWrap: { 
                    width: titleWidth,
                    useAdvancedWrap: true
                }
            }
        ).setOrigin(0.5);

        // Add subtitle with proper text containment
        const subtitleWidth = isMobile ? this.scale.width * 0.9 : 500;
        this.add.text(
            this.scale.width / 2,
            isMobile ? 120 : 170,
            'Connect your wallet to claim tokens',
            {
                fontSize: isMobile ? '18px' : '24px',
                color: '#3498db',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { 
                    width: subtitleWidth,
                    useAdvancedWrap: true
                }
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
        bg.fillStyle(0x000000, 0.85); // Darker background for better contrast
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Calculate title width for proper containment
        const titleWidth = isMobile ? this.scale.width * 0.9 : 600;
        
        // Create title with improved styling and more spacing
        this.add.text(
            this.scale.width / 2,
            isMobile ? 100 : 150, // Increased vertical spacing
            '💎 Claim Your NDOOD Tokens',
            {
                fontSize: isMobile ? '32px' : '48px', // Larger font size
                color: '#ffffff',
                fontStyle: 'bold',
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: '#000000',
                    blur: 6,
                    fill: true
                },
                align: 'center',
                wordWrap: { 
                    width: titleWidth,
                    useAdvancedWrap: true
                }
            }
        ).setOrigin(0.5);

        // Add subtitle with description and more spacing
        this.add.text(
            this.scale.width / 2,
            isMobile ? 170 : 240, // Increased vertical spacing
            'Claim your earned tokens and add them to your wallet',
            {
                fontSize: isMobile ? '18px' : '24px', // Larger font size
                color: '#3498db',
                align: 'center',
                wordWrap: { 
                    width: isMobile ? this.scale.width * 0.8 : 500,
                    useAdvancedWrap: true
                }
            }
        ).setOrigin(0.5);

        // Create card background with more spacious design
        const cardWidth = isMobile ? this.scale.width * 0.95 : 600; // Increased width
        const cardX = this.scale.width / 2;
        const cardY = isMobile ? 300 : this.scale.height / 2 + 30; // Adjusted position
        
        // Create card container for better organization
        const cardContainer = this.add.container(cardX, cardY);
        
        // Create card graphics with enhanced styling and more height
        const card = this.add.graphics();
        card.fillStyle(0x2c3e50, 0.95); // Darker card background
        card.fillRoundedRect(-cardWidth/2, -250, cardWidth, 500, 25); // Increased height
        card.lineStyle(3, 0x3498db, 1); // Thicker border
        card.strokeRoundedRect(-cardWidth/2, -250, cardWidth, 500, 25);
        
        // Add decorative elements
        const topAccent = this.add.graphics();
        topAccent.fillStyle(0x3498db, 0.7);
        topAccent.fillRoundedRect(-cardWidth/2 + 20, -240, cardWidth - 40, 10, 5);
        
        // Increased spacing between elements
        const balanceY = -150;  // More spacing from top
        const claimInfoY = -20; // More spacing between elements
        const buttonY = 150;    // More spacing from claim info

        // Display current balance with improved styling and more spacing
        this.balanceText = this.add.text(
            0,
            balanceY,
            'Loading balance...',
            {
                fontSize: isMobile ? '30px' : '36px', // Larger font size
                color: '#f1c40f',
                fontStyle: 'bold',
                align: 'center',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 3,
                    fill: true
                },
                wordWrap: { 
                    width: cardWidth - 80, // More space for text
                    useAdvancedWrap: true
                }
            }
        ).setOrigin(0.5);

        // Add icon next to balance for visual enhancement
        const balanceIcon = this.add.text(
            -((cardWidth/2) - 50),
            balanceY,
            '💰',
            {
                fontSize: isMobile ? '28px' : '32px' // Larger icon
            }
        ).setOrigin(0.5);

        // Update claim info text with improved styling and more spacing
        const claimInfoText = this.add.text(
            0,
            claimInfoY,
            'Maximum claim amount: 100 NDOOD\n\nMinimum claim amount: 50 NDOOD', // Added extra line break
            {
                fontSize: isMobile ? '20px' : '22px', // Larger font size
                color: '#3498db',
                align: 'center',
                lineSpacing: 20, // Increased line spacing
                wordWrap: { 
                    width: cardWidth - 100, // More space for text
                    useAdvancedWrap: true
                }
            }
        ).setOrigin(0.5);

        // Add icons for claim info for visual enhancement
        const maxIcon = this.add.text(
            -((cardWidth/2) - 60),
            claimInfoY - 40, // Adjusted position
            '🔺',
            {
                fontSize: '20px', // Larger icon
                color: '#e74c3c'
            }
        ).setOrigin(0.5);

        const minIcon = this.add.text(
            -((cardWidth/2) - 60),
            claimInfoY + 40, // Adjusted position
            '🔻',
            {
                fontSize: '20px', // Larger icon
                color: '#2ecc71'
            }
        ).setOrigin(0.5);

        // Create claim button with improved design and more spacing
        const buttonWidth = isMobile ? cardWidth * 0.8 : 350; // Increased width
        this.claimButton = this.createClaimButton(
            0,
            buttonY,
            buttonWidth
        );

        // Add all elements to card container
        cardContainer.add([card, topAccent, this.balanceText, balanceIcon, claimInfoText, maxIcon, minIcon, this.claimButton]);
    }

    private createClaimButton(x: number, y: number, width: number): Phaser.GameObjects.Container {
        const buttonContainer = this.add.container(x, y);

        // Button background with gradient - disabled if mobile
        const buttonBg = this.add.graphics();
        const bgColor = this.isMobile ? 0x7f8c8d : 0x2ecc71;
        buttonBg.fillGradientStyle(bgColor, bgColor, bgColor, bgColor, 1);
        buttonBg.fillRoundedRect(-width/2, -35, width, 70, 15); // Increased size

        // Button glow effect
        const buttonGlow = this.add.graphics();
        buttonGlow.lineStyle(3, bgColor, 0.6); // Enhanced glow
        buttonGlow.strokeRoundedRect(-width/2 - 3, -38, width + 6, 76, 15);

        // Enhanced button text
        const buttonText = this.add.text(0, 0, 
            this.isMobile ? '🚫 Mobile Not Supported' : '💎 Claim Tokens Now', 
            {
                fontSize: this.isMobile ? '20px' : '26px', // Larger font size
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        buttonContainer.add([buttonBg, buttonGlow, buttonText]);

        // Only make interactive if not mobile
        if (!this.isMobile) {
            buttonContainer
                .setInteractive(new Phaser.Geom.Rectangle(-width/2, -35, width, 70), Phaser.Geom.Rectangle.Contains)
                .on('pointerover', () => {
                    buttonBg.clear();
                    buttonBg.fillGradientStyle(0x27ae60, 0x27ae60, 0x2ecc71, 0x2ecc71, 1);
                    buttonBg.fillRoundedRect(-width/2, -35, width, 70, 15);
                    // Add scale effect
                    this.tweens.add({
                        targets: buttonContainer,
                        scale: 1.05,
                        duration: 200,
                        ease: 'Power2'
                    });
                })
                .on('pointerout', () => {
                    buttonBg.clear();
                    buttonBg.fillGradientStyle(0x2ecc71, 0x2ecc71, 0x27ae60, 0x27ae60, 1);
                    buttonBg.fillRoundedRect(-width/2, -35, width, 70, 15);
                    // Reset scale
                    this.tweens.add({
                        targets: buttonContainer,
                        scale: 1,
                        duration: 200,
                        ease: 'Power2'
                    });
                })
                .on('pointerdown', async () => {
                    await this.processClaimRequest();
                });
        }

        return buttonContainer;
    }

    // Update processClaimRequest with improved flow
    private async processClaimRequest() {
        // Create and show status window
        this.createStatusWindow();
        this.statusContainer.setAlpha(1);
        this.updateStatus(0);
        
        // The claim button is already disabled by updateBalanceDisplay if the balance is too low.
        // The final validation is handled securely on the server, so we can remove the client-side check here.
        if (this.claimButton.alpha < 1) {
            this.showError('Your balance is too low to claim.');
            return;
        }

        this.claimButton.setAlpha(0.5);
        this.claimButton.disableInteractive();

        try {
            this.updateStatus(1);
            console.log(`Initiating claim request...`);

            this.updateStatus(2);
            // Call the updated Web3Service method. The server handles the amount.
            const result = await this.web3Service.claimTokens();
            
            if (result.success && result.txHash) {
                this.updateStatus(3);
                this.updateStatus(4);
                this.updateStatus(5);
                console.log('Transaction confirmed:', result.txHash);

                // Close status window with success animation
                this.tweens.add({
                    targets: this.statusContainer,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        this.statusContainer.destroy();
                        // Pass the full message and the full txHash separately
                        this.showSuccess(result.message, result.txHash!);
                    }
                });
                
                this.updateBalanceDisplay();
            } else {
                // Show the error message from the server
                this.showError(result.message);
                this.updateStatus(0, result.message);
                console.error('Claim failed:', result.message);
            }
        } catch (error: any) {
            console.error('Claim processing error:', error);
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
            // Updated field name from quiztals to ndood for the new token
            const balance = playerDoc.data().ndood || playerDoc.data().quiztals || 0;
            const roundedBalance = Math.floor(balance);
            const claimAmount = Math.min(roundedBalance, 100);
            
            // Update minimum check to 50
            if (claimAmount < 50) {  // Changed from 10 to 50
                this.balanceText.setText(`Available balance: ${roundedBalance} NDOOD\n(Minimum 50 required to claim)`);  // Updated message
                if (this.claimButton) {
                    this.claimButton.setAlpha(0.5);
                    this.claimButton.disableInteractive();
                }
            } else {
                this.balanceText.setText(`Available balance: ${roundedBalance} NDOOD\nClaimable amount: ${claimAmount} NDOOD`);
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
        // Calculate message width for proper containment
        const messageWidth = Math.min(this.scale.width * 0.9, 500);
        
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
                },
                align: 'center',
                wordWrap: { 
                    width: messageWidth,
                    useAdvancedWrap: true
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
    private showSuccess(message: string, txHash: string) {
        const container = this.add.container(
            this.scale.width / 2,
            this.scale.height - 120  // Moved up slightly to accommodate link
        );

        // Calculate container width for proper containment
        const containerWidth = Math.min(this.scale.width * 0.9, 400);
        const containerHeight = 100;
        
        const bg = this.add.graphics()
            .fillStyle(0x2d3436, 0.9)
            .fillRoundedRect(-containerWidth/2, -containerHeight/2, containerWidth, containerHeight, 8);  // Made taller for link

        // Calculate text width for proper containment
        const textWidth = containerWidth - 40;
        
        const successText = this.add.text(
            0,
            -25,
            '✅ ' + message,
            {
                fontSize: '18px',
                color: '#00b894',
                align: 'center',
                wordWrap: { 
                    width: textWidth,
                    useAdvancedWrap: true
                }
            }
        ).setOrigin(0.5);

        // Create View on Basescan link with proper containment
        const linkText = `🔍 View on Basescan (${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)})`;
        const viewOnBasescan = this.add.text(
            0,
            10,
            linkText,
            {
                fontSize: '14px',
                color: '#3498db',
                align: 'center',
                wordWrap: { 
                    width: textWidth,
                    useAdvancedWrap: true
                }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
            viewOnBasescan.setStyle({ color: '#2980b9' });
            viewOnBasescan.setText(linkText);
        })
        .on('pointerout', () => {
            viewOnBasescan.setStyle({ color: '#3498db' });
            viewOnBasescan.setText(linkText);
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
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Status text with proper containment
        const statusWidth = width - 40;
        this.statusText = this.add.text(
            0,
            0,
            '',
            {
                fontSize: isMobile ? '16px' : '18px',
                color: '#3498db',
                align: 'center',
                lineSpacing: 8,
                wordWrap: { 
                    width: statusWidth,
                    useAdvancedWrap: true
                }
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