# NFT Detection System Implementation Guide

## Overview
This document provides a step-by-step guide for implementing the NFT Detection System with the "N/n" keyboard binding and the associated skill system in Quiztal World.

## System Components
1. NFT Detection System
2. Keyboard Binding ("N/n" key)
3. Skill System (Temporary Power-ups)
4. UI Integration

## Prerequisites
- Phaser.js game framework
- Web3 provider (MetaMask or similar)
- NFT smart contract ABI
- Player character with movement capabilities

## Implementation Steps

### 1. Setting up the NFT Detection System

#### 1.1 Create the NFT Detection Manager
Create a new file `src/managers/NFTDetectionManager.ts`:

```typescript
import Web3 from 'web3';
import { NFT_ABI } from '../config/NFTConfig';

export class NFTDetectionManager {
  private web3: Web3;
  private nftContract: any;
  private playerAddress: string | null = null;

  constructor() {
    this.initializeWeb3();
  }

  private initializeWeb3() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.web3 = new Web3((window as any).ethereum);
      // Initialize your NFT contract here
      // this.nftContract = new this.web3.eth.Contract(NFT_ABI, CONTRACT_ADDRESS);
    }
  }

  public async connectWallet(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        this.playerAddress = accounts[0];
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    }
  }

  public async checkPlayerNFTs(): Promise<any[]> {
    if (!this.playerAddress || !this.nftContract) {
      return [];
    }

    try {
      // Example implementation - adjust based on your NFT contract
      const balance = await this.nftContract.methods.balanceOf(this.playerAddress).call();
      const nfts = [];
      
      for (let i = 0; i < balance; i++) {
        const tokenId = await this.nftContract.methods.tokenOfOwnerByIndex(this.playerAddress, i).call();
        const tokenURI = await this.nftContract.methods.tokenURI(tokenId).call();
        nfts.push({ tokenId, tokenURI });
      }
      
      return nfts;
    } catch (error) {
      console.error('Error checking player NFTs:', error);
      return [];
    }
  }

  public async verifyNFTOwnership(tokenId: string): Promise<boolean> {
    if (!this.playerAddress || !this.nftContract) {
      return false;
    }

    try {
      const owner = await this.nftContract.methods.ownerOf(tokenId).call();
      return owner.toLowerCase() === this.playerAddress.toLowerCase();
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      return false;
    }
  }
}
```

### 2. Implementing the Keyboard Binding ("N/n" key)

#### 2.1 Add Keyboard Input Handling to GameScene
Modify `src/scenes/GameScene.ts`:

```typescript
import { NFTDetectionManager } from '../managers/NFTDetectionManager';

export default class GameScene extends Phaser.Scene {
  private nftDetectionManager: NFTDetectionManager;
  private nKey: Phaser.Input.Keyboard.Key;
  

  create() {
    
    // Initialize NFT Detection Manager
    this.nftDetectionManager = new NFTDetectionManager();
    
    // Create keyboard input for 'N' key
    this.nKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    
    // Add keyboard event listener
    this.input.keyboard.on('keydown-N', this.handleNFTDetection, this);
    
  }

  private async handleNFTDetection() {
    console.log('N key pressed - initiating NFT detection');
    
    // Connect wallet if not already connected
    const isConnected = await this.nftDetectionManager.connectWallet();
    if (!isConnected) {
      this.showNotification('Please connect your wallet to use NFT detection');
      return;
    }
    
    // Check player's NFTs
    const nfts = await this.nftDetectionManager.checkPlayerNFTs();
    
    if (nfts.length > 0) {
      this.showNFTCollection(nfts);
      // Activate skill system based on NFTs
      this.activateNFTRewards(nfts);
    } else {
      this.showNotification('No NFTs found in your wallet');
    }
  }

  private showNFTCollection(nfts: any[]) {
    // Create UI to display NFT collection
    // This is a simplified example - implement based on your UI system
    console.log('Player NFTs:', nfts);
    this.showNotification(`Found ${nfts.length} NFTs in your wallet!`);
  }

  private showNotification(message: string) {
    // Implement notification system
    console.log('Notification:', message);
    // Example: create a temporary text display on screen
  }

  private activateNFTRewards(nfts: any[]) {
    // Determine rewards based on NFT collection
    // For example, rare NFTs might provide better power-ups
    const rewardTier = this.calculateRewardTier(nfts);
    this.activateSkillSystem(rewardTier);
  }

  private calculateRewardTier(nfts: any[]): number {
    // Implement logic to determine reward tier based on NFTs
    // This is a simplified example
    if (nfts.length >= 10) return 3; // Platinum tier
    if (nfts.length >= 5) return 2;   // Gold tier
    if (nfts.length >= 1) return 1;   // Silver tier
    return 0; // No tier
  }

}
```

### 3. Implementing the Skill System

#### 3.1 Create the Skill System Manager
Create a new file `src/managers/SkillSystemManager.ts`:

```typescript
export class SkillSystemManager {
  private activeSkills: Map<string, any> = new Map();
  private skillDurations: Map<string, number> = new Map();
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public activateSkill(skillName: string, duration: number, effects: any) {
    // Deactivate if already active
    if (this.activeSkills.has(skillName)) {
      this.deactivateSkill(skillName);
    }
    
    // Apply skill effects
    this.applySkillEffects(skillName, effects);
    
    // Store skill information
    this.activeSkills.set(skillName, effects);
    this.skillDurations.set(skillName, duration);
    
    // Set up deactivation timer
    this.scene.time.delayedCall(duration * 1000, () => {
      this.deactivateSkill(skillName);
    });
    
    console.log(`Skill ${skillName} activated for ${duration} seconds`);
  }

  private applySkillEffects(skillName: string, effects: any) {
    // Apply effects based on skill type
    // Example effects: speed boost, invincibility, etc.
    this.scene.events.emit('skillActivated', { skillName, effects });
  }

  private deactivateSkill(skillName: string) {
    if (this.activeSkills.has(skillName)) {
      // Remove effects
      this.removeSkillEffects(skillName);
      
      // Clean up
      this.activeSkills.delete(skillName);
      this.skillDurations.delete(skillName);
      
      console.log(`Skill ${skillName} deactivated`);
      this.scene.events.emit('skillDeactivated', { skillName });
    }
  }

  private removeSkillEffects(skillName: string) {
    // Remove skill effects
    this.scene.events.emit('skillDeactivated', { skillName });
  }

  public getActiveSkills(): string[] {
    return Array.from(this.activeSkills.keys());
  }

  public getSkillDuration(skillName: string): number | undefined {
    return this.skillDurations.get(skillName);
  }
}
```

#### 3.2 Integrate Skill System with Player Character
Modify `src/objects/Player.ts` (or your player character file):

```typescript
import { SkillSystemManager } from '../managers/SkillSystemManager';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private skillSystem: SkillSystemManager;
  private baseSpeed: number = 200;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    
    // Initialize skill system
    this.skillSystem = new SkillSystemManager(scene);
    
    // Listen for skill events
    scene.events.on('skillActivated', this.onSkillActivated, this);
    scene.events.on('skillDeactivated', this.onSkillDeactivated, this);
  }

  private onSkillActivated(event: any) {
    const { skillName, effects } = event;
    
    switch (skillName) {
      case 'speedBoost':
        this.setSpeedBoost(effects.multiplier);
        break;
      case 'invincibility':
        this.setInvincibility(true);
        break;
      // Add more skill cases as needed
    }
  }

  private onSkillDeactivated(event: any) {
    const { skillName } = event;
    
    switch (skillName) {
      case 'speedBoost':
        this.resetSpeed();
        break;
      case 'invincibility':
        this.setInvincibility(false);
        break;
      // Add more skill cases as needed
    }
  }

  private setSpeedBoost(multiplier: number) {
    this.setVelocityX(this.body.velocity.x * multiplier);
    this.setVelocityY(this.body.velocity.y * multiplier);
    // Update max speed if needed
  }

  private resetSpeed() {
    // Reset to base speed
  }

  private setInvincibility(enabled: boolean) {
    // Implement invincibility logic
    // This might involve setting a flag and changing visual effects
  }

}
```

### 4. Implementing UI Integration

#### 4.1 Create NFT Detection UI
Create a new file `src/ui/NFTDetectionUI.ts`:

```typescript
export class NFTDetectionUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private notificationText: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI() {
    // Create container for UI elements
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0); // UI stays fixed on screen
    
    // Create notification text (initially hidden)
    this.notificationText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      50,
      '',
      {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5, 0);
    
    this.container.add(this.notificationText);
    this.container.setVisible(false);
  }

  public showNotification(message: string, duration: number = 3000) {
    this.notificationText.setText(message);
    this.container.setVisible(true);
    
    // Hide after duration
    this.scene.time.delayedCall(duration, () => {
      this.container.setVisible(false);
    });
  }

  public showNFTCollection(nfts: any[]) {
    // Create a more detailed UI for displaying NFT collection
    // This could be a modal or popup window
    console.log('Displaying NFT collection:', nfts);
  }
}
```

#### 4.2 Integrate UI with GameScene
Update `src/scenes/GameScene.ts`:

```typescript
import { NFTDetectionUI } from '../ui/NFTDetectionUI';

export default class GameScene extends Phaser.Scene {
  private nftDetectionUI: NFTDetectionUI;
  
  create() {
    
    // Initialize NFT Detection UI
    this.nftDetectionUI = new NFTDetectionUI(this);
    
  }

  private showNotification(message: string) {
    this.nftDetectionUI.showNotification(message);
  }

  private showNFTCollection(nfts: any[]) {
    this.nftDetectionUI.showNFTCollection(nfts);
  }

}
```

### 5. Configuring NFT Contract Information

#### 5.1 Create NFT Configuration
Create a new file `src/config/NFTConfig.ts`:

```typescript
// Example NFT contract ABI (simplified)
export const NFT_ABI = [
  // Add your NFT contract ABI here
  // Example functions:
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"name": "owner", "type": "address"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"name": "uri", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}, {"name": "index", "type": "uint256"}],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "type": "function"
  }
];

// Contract address
export const NFT_CONTRACT_ADDRESS = 'YOUR_NFT_CONTRACT_ADDRESS_HERE';
```

### 6. Testing the Implementation

#### 6.1 Test Plan
1. Verify wallet connection functionality
2. Test NFT detection with different wallet states
3. Confirm skill activation and deactivation
4. Validate UI notifications
5. Check keyboard binding responsiveness

#### 6.2 Example Test Cases
```typescript
// Test wallet connection
// 1. Press 'N' key without wallet connected
// Expected: Wallet connection prompt

// Test NFT detection
// 1. Connect wallet with NFTs
// 2. Press 'N' key
// Expected: Notification showing NFT count

// Test skill activation
// 1. Connect wallet with qualifying NFTs
// 2. Press 'N' key
// Expected: Skill activated with visual feedback

// Test skill deactivation
// 1. Activate a timed skill
// 2. Wait for duration to expire
// Expected: Skill automatically deactivated
```

## Skill System Implementation Details

### Skill Types
1. **Speed Boost** - Increases player movement speed
2. **Invincibility** - Makes player immune to damage
3. **Magnet** - Automatically collects nearby items
4. **Vision** - Highlights nearby NPCs or objects

### Skill Duration System
- **Bronze Tier**: 15 seconds
- **Silver Tier**: 30 seconds
- **Gold Tier**: 60 seconds
- **Platinum Tier**: 120 seconds

### Skill Activation Based on NFTs
- **Common NFTs**: Bronze tier skills
- **Rare NFTs**: Silver tier skills
- **Legendary NFTs**: Gold tier skills
- **Mythic NFTs**: Platinum tier skills

## UI/UX Considerations

### Visual Feedback
1. Skill activation indicators
2. Remaining time displays
3. NFT collection notifications
4. Wallet connection status

### Accessibility
1. Clear visual indicators for active skills
2. Audio cues for skill activation/deactivation
3. Keyboard shortcut reminders
4. Mobile-friendly alternatives

## Performance Optimization

### Caching
1. Cache NFT data to reduce blockchain calls
2. Cache skill effects to prevent recalculation
3. Cache UI elements to reduce creation overhead

### Error Handling
1. Graceful degradation when wallet is not connected
2. Retry mechanisms for failed blockchain calls
3. User-friendly error messages

## Security Considerations

### Wallet Integration
1. Use secure wallet connection methods
2. Validate all blockchain data
3. Handle network errors gracefully

### Data Validation
1. Verify NFT ownership on-chain
2. Validate NFT metadata
3. Sanitize all user inputs

## Future Enhancements

### Advanced Features
1. NFT-based character customization
2. NFT trading within the game
3. Community leaderboards based on NFT collections
4. Exclusive content for specific NFT holders

### Integration Possibilities
1. Cross-game NFT compatibility
2. NFT-based achievements
3. Play-to-earn mechanics with NFT rewards
4. Decentralized governance for game features

## Troubleshooting

### Common Issues
1. **Wallet not connecting**: Check browser compatibility and wallet installation
2. **NFTs not detected**: Verify contract address and ABI
3. **Skills not activating**: Check event listeners and timing calculations
4. **UI not displaying**: Verify container visibility and positioning

### Debugging Tips
1. Use browser console to monitor system events
2. Add detailed logging for blockchain interactions
3. Test with different wallet providers
4. Validate NFT contract functions with tools like Etherscan

## Conclusion
This implementation provides a complete NFT detection system with keyboard binding and skill system integration. The modular design allows for easy extension and customization based on specific game requirements.