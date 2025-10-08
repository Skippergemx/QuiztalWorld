# Standardized Cooldown Dialogs Documentation

## Overview
This document outlines the standardization of cooldown dialog implementations across all NPCs in the Quiztal World game. The goal was to ensure consistency in user experience while providing personality-specific content for each NPC.

## Standardization Approach

### 1. Consistent UI Framework
All NPCs now use the `OptimizedRewardDialog` for cooldown messages instead of the older `SimpleDialogBox`. This provides:
- Consistent visual design across all NPCs
- Better mobile responsiveness
- Unified user experience

### 2. Personality-Specific Content
Each NPC maintains its unique personality through multiple cooldown message templates that reflect their character's expertise and theme.

### 3. Timing Consistency
All cooldown dialogs now use a standardized 3-second delay before appearing, allowing players to see any reward messages from previous interactions.

## Standardized NPCs

### Smart Contract Guy
- **File**: `src/objects/SmartContractGuy.ts`
- **Changes**: Replaced hardcoded message with 4 personality-specific templates
- **Themes**: Smart contract protocols, security audits, DeFi education

### Security Kai
- **File**: `src/objects/SecurityKai.ts`
- **Changes**: Replaced SimpleDialogBox with OptimizedRewardDialog and added 4 personality-specific templates
- **Themes**: Cybersecurity, threat databases, protection strategies

### Wallet Safety Friend
- **File**: `src/objects/WalletSafetyFriend.ts`
- **Changes**: Replaced hardcoded message with 4 personality-specific templates
- **Themes**: Wallet security, threat protection, safety education

### Prof Chain
- **File**: `src/objects/ProfChain.ts`
- **Changes**: Replaced SimpleDialogBox with OptimizedRewardDialog and added 4 personality-specific templates
- **Themes**: Blockchain technology, consensus mechanisms, decentralized systems

### NFT Cyn
- **File**: `src/objects/NftCyn.ts`
- **Changes**: Replaced hardcoded message with 4 personality-specific templates
- **Themes**: Digital art, collectibles, NFT marketplace innovations

### Artizen Gent
- **File**: `src/objects/ArtizenGent.ts`
- **Changes**: Replaced hardcoded message with 4 personality-specific templates
- **Themes**: NFT art, digital creativity, art curation

### Alchemy Man
- **File**: `src/objects/AlchemyMan.ts`
- **Changes**: Replaced hardcoded message with 4 personality-specific templates
- **Themes**: Blockchain infrastructure, API development, node management

### ThirdWeb Guy
- **File**: `src/objects/ThirdWebGuy.ts`
- **Changes**: Replaced SimpleDialogBox with OptimizedRewardDialog and added 4 personality-specific templates
- **Themes**: Web3 development, SDK updates, development frameworks

## NPCs Already Standardized
These NPCs were already properly implemented and required no changes:

### Dexpert Gal
- Uses personality-specific cooldown message templates
- Already implemented with OptimizedRewardDialog

### Mint Girl
- Uses personality-specific cooldown message templates
- Already implemented with OptimizedRewardDialog

### Mr. Rug Pull
- Uses personality-specific cooldown message templates from configuration
- Already implemented with OptimizedRewardDialog

### Hunt Boy
- Uses personality-specific cooldown message templates from configuration
- Already implemented with OptimizedRewardDialog

### Base Sage
- Uses personality-specific cooldown message templates from configuration
- Already implemented with OptimizedRewardDialog

### BasePal
- Uses simple cooldown message (appropriate for lecture-based NPC)
- Already implemented with OptimizedRewardDialog

## Special Cases

### Moblin
- Not a QuizNPC but a gift box collector
- Does not require quiz cooldown dialogs
- Maintains its own gift collection system

## Benefits of Standardization

1. **Consistent User Experience**: Players receive uniform feedback across all NPC interactions
2. **Better Mobile Support**: OptimizedRewardDialog provides better mobile responsiveness
3. **Maintained Personality**: Each NPC retains unique character through themed messages
4. **Easier Maintenance**: Unified implementation pattern simplifies future updates
5. **Enhanced Engagement**: Multiple message templates prevent repetition and increase engagement

## Implementation Pattern

All standardized cooldown dialogs follow this pattern:

```typescript
protected showCooldownDialog() {
  // Add a delay before showing the cooldown dialog
  this.scene.time.delayedCall(3000, () => {
    const remainingTime = this.getRemainingCooldownTime();
    const formattedTime = this.formatTimeWithFractional(remainingTime);
    
    // Use personality-specific cooldown message templates
    const cooldownMessages = [
      `Template 1 with ${formattedTime} placeholder`,
      `Template 2 with ${formattedTime} placeholder`,
      `Template 3 with ${formattedTime} placeholder`,
      `Template 4 with ${formattedTime} placeholder`
    ];
    
    const cooldownMessage = Phaser.Utils.Array.GetRandom(cooldownMessages);

    // Use optimized reward dialog for cooldown message
    const cooldownDialogData: OptimizedRewardDialogData = {
      npcName: "NPC Name",
      npcAvatar: "npc_avatar_key",
      rewardMessage: cooldownMessage,
      rewardAmount: 0,
      onClose: () => {
        this.resetDialogState();
      }
    };
    
    showOptimizedRewardDialog(this.scene, cooldownDialogData);

    // Set up auto-reset for the dialog after 3 seconds
    this.setupDialogAutoReset(3000);
  });
}
```