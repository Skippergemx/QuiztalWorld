# Quiztal World NFT Detection System Implementation Guide

## Overview
This document provides a step-by-step guide for implementing the NFT Detection System with the "N/n" keyboard binding in Quiztal World. This system will allow players to quickly check their NFT collection and activate skill-based power-ups based on their holdings.

## System Components
1. N Key Binding ("N/n")
2. NFT Detection Integration with existing Web3Service
3. Skill System (Temporary Power-ups)
4. UI Integration with existing UIScene

## Prerequisites
- Phaser.js game framework (already in use)
- Existing Web3Service implementation
- Existing UI system (UIScene)
- Firebase integration for data storage

## Implementation Steps

### 1. Adding N Key Binding to GameScene

#### 1.1 Modify GameScene to add N key handling
Edit `src/scenes/GameScene.ts`:

```typescript

export default class GameScene extends Phaser.Scene {
  // ... existing properties ...
  
  // Add this new property for the N key
  private nKey!: Phaser.Input.Keyboard.Key;


  private setupInputHandling(): void {
    console.log('🎮 GameScene: Setting up input handling...');

    // Set up existing keyboard event handlers
    this.input.keyboard?.on('keydown-C', () => this.handleInteraction('C'));
    this.input.keyboard?.on('keydown-c', () => this.handleInteraction('C'));
    this.input.keyboard?.on('keydown-O', () => this.handleInteraction('O'));
    this.input.keyboard?.on('keydown-o', () => this.handleInteraction('O'));
    this.input.keyboard?.on('keydown-G', () => this.toggleGuideBook());
    this.input.keyboard?.on('keydown-g', () => this.toggleGuideBook());
    
    // ADD THIS NEW KEY BINDING
    this.input.keyboard?.on('keydown-N', () => this.handleNFTDetection());
    this.input.keyboard?.on('keydown-n', () => this.handleNFTDetection());

    // Set up cleanup event
    this.events.on('shutdown', this.handleSceneShutdown, this);
  }

  // ADD THIS NEW METHOD
  private async handleNFTDetection(): Promise<void> {
    console.log('N key pressed - initiating NFT detection');
    
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log('GameScene: N key press blocked - interactions are currently blocked');
      return;
    }

    // Check network connectivity
    if (!this.checkNetworkConnectivity()) {
      return;
    }

    // Launch the NFT window scene
    this.scene.launch('NFTWindowScene');
  }

}
```

### 2. Updating UIScene to Add NFT Button

#### 2.1 Add NFT Button to Desktop UI
Edit `src/scenes/UIScene.ts`:

```typescript

private createDesktopButtons() {
  const isMobile = this.scale.width < 768;
  const buttonConfigs = [
    {
      text: '📖',  // Guide book button
      tooltip: 'Guide Book',
      color: '#3498db',  // Blue color for guide book
      hoverColor: '#2980b9',
      callback: () => this.openGuideBook()
    },
    {
      text: '💎',  // Claim tokens button
      tooltip: 'Claim Tokens',
      color: '#9b59b6',  // Purple color for claim button
      hoverColor: '#8e44ad',
      callback: () => this.openTokenClaim()
    },
    {
      text: '👛',  // Wallet verification button
      tooltip: 'Wallet',
      color: '#9b59b6',  // Purple color for wallet
      hoverColor: '#8e44ad',
      callback: () => this.openWalletWindow()
    },
    // ADD THIS NEW BUTTON CONFIGURATION
    {
      text: '🖼️',  // NFT collection button
      tooltip: 'NFT Collection',
      color: '#e74c3c',  // Red color for NFTs
      hoverColor: '#c0392b',
      callback: () => this.openNFTCollection()
    },
    {
      text: '🎯',  // Session rewards tracker button
      tooltip: 'Session Rewards',
      color: '#f39c12',  // Orange/gold color for rewards
      hoverColor: '#e67e22',
      callback: () => this.toggleRewardTracker()
    },
    {
      text: '🎒',
      tooltip: 'Inventory',
      color: '#2ecc71',
      hoverColor: '#34f585ff',
      callback: () => this.openInventory()
    },
    {
      text: '🚪',
      tooltip: 'Logout',
      color: '#e74c3c',
      hoverColor: '#fc4e3bff',
      callback: () => this.handleLogout()
    }
  ];

}

// ADD THIS NEW METHOD
private openNFTCollection() {
  // Launch the NFT window scene
  this.scene.launch('NFTWindowScene');
}

```

### 3. Adding N Key Binding to UIScene for Direct Access

#### 3.1 Add N Key Handling to UIScene
Edit `src/scenes/UIScene.ts`:

```typescript

create() {
  try {

    // Add keyboard listeners
    if (this.input.keyboard) {
      this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      this.keyI.on('down', () => this.openInventory());
      
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyR.on('down', () => this.toggleRewardTracker());
      
      // ADD THIS NEW KEY BINDING
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.keyN.on('down', () => this.openNFTCollection());
    }
  } catch (error) {
    console.error('Error initializing UI:', error);
    this.playerId = '';
  }
}

```

### 4. Implementing the Skill System

#### 4.1 Create Skill System Manager
Create a new file `src/managers/SkillSystemManager.ts`:

```typescript
export interface SkillEffect {
  type: 'speedBoost' | 'invincibility' | 'magnet' | 'vision';
  multiplier?: number;
  duration: number;
}

export class SkillSystemManager {
  private activeSkills: Map<string, SkillEffect> = new Map();
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private baseSpeed: number = 160;
  
  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
  }

  public activateSkill(skillName: string, effect: SkillEffect) {
    // Deactivate if already active
    if (this.activeSkills.has(skillName)) {
      this.deactivateSkill(skillName);
    }
    
    // Apply skill effects
    this.applySkillEffects(skillName, effect);
    
    // Store skill information
    this.activeSkills.set(skillName, effect);
    
    // Set up deactivation timer
    this.scene.time.delayedCall(effect.duration * 1000, () => {
      this.deactivateSkill(skillName);
    });
    
    console.log(`Skill ${skillName} activated for ${effect.duration} seconds`);
  }

  private applySkillEffects(skillName: string, effect: SkillEffect) {
    switch (effect.type) {
      case 'speedBoost':
        this.applySpeedBoost(effect.multiplier || 1.5);
        break;
      case 'invincibility':
        this.applyInvincibility();
        break;
      case 'magnet':
        this.applyMagnet();
        break;
      case 'vision':
        this.applyVision();
        break;
    }
    
    // Emit event for other systems to react
    this.scene.events.emit('skillActivated', { skillName, effect });
  }

  private applySpeedBoost(multiplier: number) {
    // Update player speed
    const currentVelocityX = this.player.body.velocity.x;
    const currentVelocityY = this.player.body.velocity.y;
    
    // Apply multiplier to current velocity
    this.player.setVelocity(currentVelocityX * multiplier, currentVelocityY * multiplier);
    
    // Update max speed if needed
    // This would need to be integrated with PlayerManager's movement system
    console.log(`Speed boost activated: ${multiplier}x`);
  }

  private applyInvincibility() {
    // Implement invincibility logic
    // This might involve setting a flag and changing visual effects
    console.log('Invincibility activated');
  }

  private applyMagnet() {
    // Implement magnet logic to attract nearby items
    console.log('Magnet activated');
  }

  private applyVision() {
    // Implement vision enhancement to highlight nearby NPCs or objects
    console.log('Vision enhancement activated');
  }

  private deactivateSkill(skillName: string) {
    if (this.activeSkills.has(skillName)) {
      // Remove effects
      this.removeSkillEffects(skillName);
      
      // Clean up
      this.activeSkills.delete(skillName);
      
      console.log(`Skill ${skillName} deactivated`);
      this.scene.events.emit('skillDeactivated', { skillName });
    }
  }

  private removeSkillEffects(skillName: string) {
    // Reset effects based on skill type
    const effect = this.activeSkills.get(skillName);
    if (!effect) return;
    
    switch (effect.type) {
      case 'speedBoost':
        this.resetSpeed();
        break;
      case 'invincibility':
        this.removeInvincibility();
        break;
      case 'magnet':
        this.removeMagnet();
        break;
      case 'vision':
        this.removeVision();
        break;
    }
  }

  private resetSpeed() {
    // Reset to base speed
    console.log('Speed reset to normal');
  }

  private removeInvincibility() {
    // Remove invincibility
    console.log('Invincibility removed');
  }

  private removeMagnet() {
    // Remove magnet effect
    console.log('Magnet effect removed');
  }

  private removeVision() {
    // Remove vision enhancement
    console.log('Vision enhancement removed');
  }

  public getActiveSkills(): string[] {
    return Array.from(this.activeSkills.keys());
  }

  public getSkillEffect(skillName: string): SkillEffect | undefined {
    return this.activeSkills.get(skillName);
  }
}
```

### 5. Integrating Skill System with Player

#### 5.1 Update PlayerManager to Support Skills
Edit `src/managers/PlayerManager.ts` (conceptual - you'll need to find the actual file):

```typescript
import { SkillSystemManager } from './SkillSystemManager';

export default class PlayerManager {
  // ... existing properties ...
  private skillSystem!: SkillSystemManager;
  
  
  public initializePlayer(): Phaser.Physics.Arcade.Sprite {
    
    // Initialize skill system
    this.skillSystem = new SkillSystemManager(this.scene, this.player);
    
    // Listen for skill events
    this.scene.events.on('skillActivated', this.onSkillActivated, this);
    this.scene.events.on('skillDeactivated', this.onSkillDeactivated, this);
    
    return this.player;
  }
  
  private onSkillActivated(event: any) {
    const { skillName, effect } = event;
    console.log(`Player skill activated: ${skillName}`);
    // Handle any player-specific logic for skill activation
  }
  
  private onSkillDeactivated(event: any) {
    const { skillName } = event;
    console.log(`Player skill deactivated: ${skillName}`);
    // Handle any player-specific logic for skill deactivation
  }
  
  
  public getSkillSystem(): SkillSystemManager {
    return this.skillSystem;
  }
}
```

### 6. Integrating NFT Detection with Skill Activation

#### 6.1 Modify Web3Service to Determine Skill Rewards
Edit `src/services/Web3Service.ts`:

```typescript
import { SkillEffect } from '../managers/SkillSystemManager';

export class Web3Service {
  
  // ADD THIS NEW METHOD
  public async getNFTRewards(): Promise<SkillEffect[]> {
    try {
      const nfts = await this.getNFTsData();
      const rewards: SkillEffect[] = [];
      
      // Determine rewards based on NFT collection
      // This is a simplified example - implement based on your NFT types
      let speedBoost = false;
      let invincibility = false;
      let magnet = false;
      let vision = false;
      
      for (const nft of nfts) {
        // Example logic based on NFT properties
        if (nft.collectionType === 'erc721') {
          speedBoost = true; // All ERC721 NFTs grant speed boost
        }
        
        if (nft.collectionType === 'erc1155' && nft.name.includes('Gemante')) {
          invincibility = true; // Gemante NFTs grant invincibility
        }
        
        // Add more conditions based on your NFT types
      }
      
      // Create skill effects based on NFT holdings
      if (speedBoost) {
        rewards.push({
          type: 'speedBoost',
          multiplier: 2.0,
          duration: 30 // 30 seconds
        });
      }
      
      if (invincibility) {
        rewards.push({
          type: 'invincibility',
          duration: 15 // 15 seconds
        });
      }
      
      if (magnet) {
        rewards.push({
          type: 'magnet',
          duration: 60 // 60 seconds
        });
      }
      
      if (vision) {
        rewards.push({
          type: 'vision',
          duration: 45 // 45 seconds
        });
      }
      
      return rewards;
    } catch (error) {
      console.error("Error determining NFT rewards:", error);
      return [];
    }
  }
  
}
```

### 7. Connecting NFT Detection with Skill Activation

#### 7.1 Modify GameScene to Activate Skills
Edit `src/scenes/GameScene.ts`:

```typescript
import { Web3Service } from '../services/Web3Service';
import { SkillEffect } from '../managers/SkillSystemManager';

export default class GameScene extends Phaser.Scene {
  // ... existing properties ...
  private web3Service!: Web3Service;
  
  
  private async initializeCoreSystem(): Promise<void> {
    console.log('⚙️ GameScene: Initializing core systems...');

    // Initialize quiz and network systems
    const quizManager = NPCQuizManager.getInstance(this);
    await quizManager.initialize();

    this.quizAntiSpamManager = QuizAntiSpamManager.getInstance(this);
    this.networkMonitor = NetworkMonitor.getInstance(this);
    
    // Initialize Web3 service
    this.web3Service = new Web3Service();

    // Make managers globally accessible
    if (typeof window !== 'undefined') {
      (window as any).quizAntiSpamManager = this.quizAntiSpamManager;
      (window as any).gameScene = this;
    }
  }
  
  // UPDATE THIS METHOD
  private async handleNFTDetection(): Promise<void> {
    console.log('N key pressed - initiating NFT detection');
    
    // Check if interactions are blocked
    if (this.isInteractionBlocked()) {
      console.log('GameScene: N key press blocked - interactions are currently blocked');
      return;
    }

    // Check network connectivity
    if (!this.checkNetworkConnectivity()) {
      return;
    }

    // Launch the NFT window scene
    this.scene.launch('NFTWindowScene');
    
    // Activate skills based on NFT collection
    await this.activateNFTRewards();
  }
  
  // ADD THIS NEW METHOD
  private async activateNFTRewards(): Promise<void> {
    try {
      // Get skill rewards based on NFT collection
      const rewards = await this.web3Service.getNFTRewards();
      
      if (rewards.length > 0) {
        // Get player manager and skill system
        const playerManager = this.playerManager;
        if (playerManager) {
          const skillSystem = playerManager.getSkillSystem();
          
          // Activate each reward
          for (const reward of rewards) {
            const skillName = `${reward.type}Skill`;
            skillSystem.activateSkill(skillName, reward);
          }
          
          // Show notification about activated skills
          this.showNotification(`🎉 ${rewards.length} power-up${rewards.length > 1 ? 's' : ''} activated!`);
        }
      } else {
        // Show notification about no rewards
        this.showNotification('📭 No special power-ups available from your NFT collection');
      }
    } catch (error) {
      console.error('Error activating NFT rewards:', error);
      this.showNotification('❌ Error activating power-ups');
    }
  }
  
  // ADD THIS NEW METHOD
  private showNotification(message: string): void {
    // Simple notification - you might want to integrate with existing UI system
    console.log('Notification:', message);
    
    // You could also emit an event for UIScene to handle
    this.events.emit('showNotification', { message });
  }
  
}
```

### 8. Adding Notification System to UIScene

#### 8.1 Add Notification Display to UIScene
Edit `src/scenes/UIScene.ts`:

```typescript

export default class UIScene extends Phaser.Scene {
  // ... existing properties ...
  private notificationText!: Phaser.GameObjects.Text;
  private notificationContainer!: Phaser.GameObjects.Container;
  
  
  create() {
    try {
      
      // Add notification system
      this.createNotificationSystem();
      
      // Setup event listeners
      this.scale.on('resize', this.updateLayout, this);
      
      // Add event listener for notifications from GameScene
      this.scene.get('GameScene').events.on('showNotification', this.showNotification, this);
      
    } catch (error) {
      console.error('Error initializing UI:', error);
      this.playerId = '';
    }
  }
  
  // ADD THIS NEW METHOD
  private createNotificationSystem() {
    // Create container for notifications
    this.notificationContainer = this.add.container(
      this.scale.width / 2,
      100
    ).setScrollFactor(0).setDepth(2000);
    this.notificationContainer.setVisible(false);
    
    // Create notification background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-150, -25, 300, 50, 10);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-150, -25, 300, 50, 10);
    
    // Create notification text
    this.notificationText = this.add.text(0, 0, '', {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 280 }
    }).setOrigin(0.5);
    
    this.notificationContainer.add([bg, this.notificationText]);
  }
  
  // ADD THIS NEW METHOD
  private showNotification(event: { message: string }): void {
    const { message } = event;
    
    // Update text
    this.notificationText.setText(message);
    
    // Show notification
    this.notificationContainer.setVisible(true);
    this.notificationContainer.setPosition(this.scale.width / 2, 100);
    
    // Hide after 3 seconds
    this.time.delayedCall(3000, () => {
      this.notificationContainer.setVisible(false);
    });
  }
  
}
```

## Skill System Implementation Details

### Skill Types
1. **Speed Boost** - Increases player movement speed (2x for 30 seconds)
2. **Invincibility** - Makes player immune to damage (15 seconds)
3. **Magnet** - Automatically collects nearby items (60 seconds)
4. **Vision** - Highlights nearby NPCs or objects (45 seconds)

### Skill Duration System
- **Basic NFTs**: 15-30 seconds
- **Rare NFTs**: 30-60 seconds
- **Legendary NFTs**: 60-120 seconds

### Skill Activation Based on NFTs
- **ERC721 NFTs**: Speed boost
- **Gemante NFTs**: Invincibility
- **Special Collection NFTs**: Additional skills

## Testing the Implementation

### Test Plan
1. Verify N key binding works in both GameScene and UIScene
2. Test NFT detection with different wallet states
3. Confirm skill activation and deactivation
4. Validate UI notifications
5. Check mobile compatibility

### Example Test Cases
```typescript
// Test N key binding
// 1. Press 'N' key in game
// Expected: NFT window opens

// Test skill activation
// 1. Connect wallet with qualifying NFTs
// 2. Press 'N' key
// Expected: Skills activated with visual feedback

// Test skill deactivation
// 1. Activate a timed skill
// 2. Wait for duration to expire
// Expected: Skill automatically deactivated
```

## UI/UX Considerations

### Visual Feedback
1. Skill activation indicators in the UI
2. Remaining time displays for active skills
3. NFT collection notifications
4. Wallet connection status

### Mobile Compatibility
1. Touch-friendly NFT button in header
2. Responsive notification positioning
3. Landscape orientation support

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
2. Community leaderboards based on NFT collections
3. Exclusive content for specific NFT holders

### Integration Possibilities
1. Cross-game NFT compatibility
2. NFT-based achievements
3. Play-to-earn mechanics with NFT rewards

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
This implementation provides a complete NFT detection system with keyboard binding and skill system integration specifically tailored for Quiztal World. The modular design allows for easy extension and customization based on specific game requirements while leveraging existing systems like Web3Service and UIScene.