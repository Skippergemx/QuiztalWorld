# NPC Cooldown Dialog Standardization

## Overview
This document tracks the standardization of cooldown dialog implementations across all quiz NPCs in the game. The goal is to ensure consistent user experience and maintainability across all NPC interactions.

## Standardization Goals
1. **Preferred Cooldown Dialog**: Use OptimizedRewardDialog with 3-second delay (DexpertGal approach)
2. **Preferred Cooldown Timer Display**: Use base QuizNPC implementation with dynamic text updates
3. **Consistency**: All quiz NPCs should follow the same pattern for cooldown handling

## Quiz NPCs Status

### ✅ Already Standardized (Using OptimizedRewardDialog)
- **HuntBoy** - Adventurous/Competitive personality
- **MintGirl** - Creative/Enthusiastic personality
- **MrRugPull** - Suspicious/Cynical personality
- **AlchemyMan** - Technical/Scientific personality
- **ArtizenGent** - Creative/Community-focused personality
- **DexpertGal** - Expert/Technical personality (Reference Implementation)
- **NftCyn** - NFT Expert personality
- **BaseSage** - Wise/Philosophical personality
- **ProfChain** - Professional personality
- **SecurityKai** - Security-focused personality
- **SmartContractGuy** - Smart contract expert personality
- **ThirdWebGuy** - Web3 expert personality

### ✅ Standardized (Updated)
- **WalletSafetyFriend** - Security expert personality
  - **Before**: Used SimpleDialogBox with static text
  - **After**: Uses OptimizedRewardDialog with 3-second delay

### ⬜ Not Applicable
- **MrGemx** - Cryptocurrency explainer (not a quiz NPC)

## Implementation Details

### Preferred Cooldown Dialog Pattern
```typescript
protected showCooldownDialog() {
  // Add a delay before showing the cooldown dialog
  // This allows players to see their reward from the third quiz
  this.scene.time.delayedCall(3000, () => { // 3 second delay
    const remainingTime = this.getRemainingCooldownTime();
    const formattedTime = this.formatTimeWithFractional(remainingTime);
    
    // Use optimized reward dialog for cooldown message
    const cooldownDialogData: OptimizedRewardDialogData = {
      npcName: "[NPC Name]",
      npcAvatar: "npc_[avatar_key]",
      rewardMessage: `[Personalized cooldown message with ${formattedTime}]`,
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

### Cooldown Timer Display
All quiz NPCs inherit the cooldown timer display functionality from the base QuizNPC class, which includes:
- Dynamic text updates every 100ms
- Fractional seconds display in the final 10 seconds
- Consistent formatting across all NPCs

## Benefits of Standardization

### User Experience
- Consistent cooldown messaging across all NPCs
- Modern, visually appealing dialog interface
- Proper timing delays to allow reward visibility
- Automatic dialog reset for smooth user flow

### Technical Advantages
- Reduced code duplication
- Easier maintenance and updates
- Consistent error handling
- Better performance with singleton dialog instances

### Maintainability
- Single pattern to learn and implement
- Centralized updates for cooldown functionality
- Clear documentation and examples
- Reduced likelihood of implementation errors

## Verification

All quiz NPCs have been verified to:
- ✅ Use OptimizedRewardDialog for cooldown messages
- ✅ Implement 3-second delay before showing cooldown dialog
- ✅ Include proper dialog state management
- ✅ Use base QuizNPC cooldown timer display functionality
- ✅ Compile without TypeScript errors

## Next Steps

1. Monitor player feedback on the standardized cooldown dialogs
2. Consider adding personality-specific cooldown messages for WalletSafetyFriend
3. Evaluate performance impact of the standardized approach
4. Document any additional improvements or optimizations