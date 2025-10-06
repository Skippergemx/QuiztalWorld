# NPC Dialog Upgrade Guide

## Overview
This guide provides step-by-step instructions for upgrading NPC dialog systems from the legacy SimpleDialogBox to the modern optimized dialog system. The upgrade improves performance, visual consistency, and user experience across all NPC interactions.

## Prerequisites
- Basic understanding of TypeScript and Phaser.js
- Familiarity with the existing NPC codebase
- Access to NPC personality configurations
- Understanding of the optimized dialog components

## Upgrade Process

### 1. Analysis Phase

#### Identify Dialog Usage
First, identify all places where an NPC uses SimpleDialogBox:

```bash
# Search for SimpleDialogBox usage in a specific NPC
grep -r "SimpleDialogBox" src/objects/NPC_NAME.ts

# Search for showDialog usage
grep -r "showDialog" src/objects/NPC_NAME.ts
```

#### Common Usage Patterns
Most NPCs use SimpleDialogBox in these scenarios:
1. Network offline dialogs
2. Cooldown/restriction dialogs
3. Simple quiz dialogs
4. Welcome/introduction dialogs

### 2. Implementation Steps

#### Step 1: Update Import Statements
Remove unused SimpleDialogBox imports and ensure optimized dialog imports are present:

```typescript
// Remove this line if it exists and is unused
// import { SimpleDialogBox } from "../utils/SimpleDialogBox";

// Ensure these imports are present
import { OptimizedEnhancedQuizDialog } from '../utils/OptimizedEnhancedQuizDialog';
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';
```

#### Step 2: Upgrade Network Offline Dialogs
Replace SimpleDialogBox with OptimizedRewardDialog:

```typescript
// Before
this.currentDialog = SimpleDialogBox.getInstance(this.scene);
this.currentDialog.showDialog([
  {
    text: "🚫 Network connection lost! Please check your internet connection to continue playing.",
    isExitDialog: true
  }
]);

// After
const offlineDialogData: OptimizedRewardDialogData = {
  npcName: "NPC Name", // Use the actual NPC name
  npcAvatar: "npc_avatar_key", // Use the correct avatar key
  rewardMessage: "🚫 Network connection lost! Please check your internet connection to continue playing.",
  rewardAmount: 0,
  onClose: () => {
    this.resetDialogState();
  }
};

showOptimizedRewardDialog(this.scene, offlineDialogData);
```

#### Step 3: Upgrade Cooldown Dialogs
Replace SimpleDialogBox with OptimizedRewardDialog:

```typescript
// Before
this.currentDialog = SimpleDialogBox.getInstance(this.scene);
this.currentDialog.showDialog([
  {
    text: cooldownMessage,
    avatar: "npc_avatar_key",
    isExitDialog: true
  }
]);

// After
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
```

#### Step 4: Upgrade Simple Quiz Dialogs
Replace showDialog with OptimizedEnhancedQuizDialog:

```typescript
// Before
showDialog(this.scene, [{
    text: currentQuestion.question,
    avatar: "npc_avatar_key",
    options: shuffledOptions.map(option => ({
        text: option,
        callback: () => {
          this.checkAnswer(option, currentQuestion.answer, player);
          this.notifyQuizEnded();
        }
    }))
}]);

// After
const dialog = new OptimizedEnhancedQuizDialog(this.scene);

dialog.showQuizDialog({
  npcName: "NPC Name",
  npcAvatar: "npc_avatar_key",
  theme: "Appropriate Theme for NPC", // Customize based on NPC's expertise
  question: currentQuestion.question,
  options: shuffledOptions,
  explainer: currentQuestion.explainer || "Default explanation",
  onAnswer: (selectedOption: string) => {
    this.checkAnswer(selectedOption, currentQuestion.answer, player);
    this.notifyQuizEnded();
  },
  onClose: () => {
    this.resetDialogState();
  }
});

this.currentDialog = dialog as any;
```

### 3. Personality Preservation

#### Maintain NPC-Specific Content
Each NPC has unique personality traits defined in NPCPersonalityConfig.ts. Ensure these are preserved:

```typescript
// Use personality-specific messages
const cooldownTemplate = Phaser.Utils.Array.GetRandom(npcPersonality.cooldownMessageTemplates);
const wrongAnswerPrefix = Phaser.Utils.Array.GetRandom(npcPersonality.wrongAnswerPrefixes);
const correctAnswerPrefix = Phaser.Utils.Array.GetRandom(npcPersonality.correctAnswerPrefixes);
```

#### Educational Content
Preserve educational content generation functions:

```typescript
private generateNPCSpecificDidYouKnow(): string {
  const didYouKnowPhrases = [
    // NPC-specific educational content
  ];
  
  const selectedPhrase = Phaser.Utils.Array.GetRandom(didYouKnowPhrases);
  
  // Limit phrase length for mobile
  const isMobile = this.scene.scale.width < 768;
  if (isMobile && selectedPhrase.length > 150) {
    return selectedPhrase.substring(0, 147) + "...";
  }
  
  return selectedPhrase;
}
```

### 4. Mobile Responsiveness

#### Text Length Management
Ensure all dialog content fits within mobile constraints:

```typescript
private limitTextForMobile(text: string, maxLength: number = 150): string {
  const isMobile = this.scene.scale.width < 768;
  if (isMobile && text.length > maxLength) {
    return text.substring(0, maxLength - 3) + "...";
  }
  return text;
}
```

#### Responsive Font Sizes
Use the UIHelpers for responsive font sizing:

```typescript
import modernUITheme, { UIHelpers } from './UITheme';

const fontSize = UIHelpers.getResponsiveFontSize(this.isMobile, '14px');
```

### 5. Error Handling and Cleanup

#### Dialog State Management
Ensure proper dialog state management:

```typescript
// Always reset dialog state on close
onClose: () => {
  this.resetDialogState();
}

// Implement resetDialogState if not already present
protected resetDialogState(): void {
  this.currentDialog = null;
  // Any other cleanup needed
}
```

#### Auto-reset Implementation
If using auto-reset functionality:

```typescript
protected setupDialogAutoReset(delay: number = 3000): void {
  this.scene.time.delayedCall(delay, () => {
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = null;
    }
  });
}
```

## NPC-Specific Considerations

### HuntBoy
- Personality: Adventurous/Competitive
- Color scheme: Orange (#FF5722)
- Themes: Hunt Master, Target Locked
- Educational focus: Base Layer 2, Web3 development

### MintGirl
- Personality: Creative/Enthusiastic
- Color scheme: Green (#00ff00)
- Themes: Artistic Genius, Creative Masterpiece
- Educational focus: NFTs, Digital Art

### MrRugPull
- Personality: Suspicious/Cynical
- Color scheme: Orange (#FF9800)
- Themes: Security Expert, Scam Detector
- Educational focus: Security, Scam prevention

### AlchemyMan
- Personality: Technical/Scientific
- Color scheme: Blue (#2196F3)
- Themes: Alchemy Master, Potion Expert
- Educational focus: DeFi, Tokenomics

## Testing Checklist

### Before Committing Changes
- [ ] Build compiles without errors
- [ ] No TypeScript errors
- [ ] All dialog types display correctly
- [ ] Personality-specific content appears
- [ ] Mobile responsiveness verified
- [ ] Educational content preserved
- [ ] Dialog transitions work smoothly
- [ ] Cleanup functions execute properly

### Testing Scenarios
1. Network offline dialog appears correctly
2. Cooldown dialog shows with proper timing
3. Quiz dialog displays questions and options
4. Correct answer shows reward dialog
5. Wrong answer shows wrong answer dialog
6. Dialog close functionality works
7. Mobile layout is appropriate
8. Personality-specific messages appear

## Common Issues and Solutions

### Issue: "showDialog is not defined"
**Solution:** Ensure the showDialog import is maintained if still needed for other purposes:

```typescript
import { showDialog } from "../utils/SimpleDialogBox";
```

### Issue: "Cannot find name 'npcPersonality'"
**Solution:** Import the correct personality configuration:

```typescript
import { npcPersonalities } from '../config/NPCPersonalityConfig';
// or
import { specificNPCPersonality } from '../config/NPCPersonalityConfig';
```

### Issue: Dialog not closing properly
**Solution:** Ensure onClose callbacks are implemented and resetDialogState is called:

```typescript
onClose: () => {
  this.resetDialogState();
}
```

## Code Quality Guidelines

### 1. Maintain Consistent Naming
```typescript
// Good
const cooldownDialogData: OptimizedRewardDialogData = {...}

// Avoid
const data = {...}
```

### 2. Preserve Comments and Documentation
Keep existing helpful comments while adding new ones where needed.

### 3. Follow Existing Code Style
Match the existing code style in terms of:
- Indentation
- Spacing
- Naming conventions
- Function organization

## Documentation Requirements

### Create Upgrade Documentation
For each NPC upgraded, create a documentation file following this template:

```markdown
# NPC_NAME Dialog Upgrade Documentation

## Overview
Brief description of changes made

## Changes Made
### 1. Network Offline Dialog
### 2. Cooldown Dialog
### 3. Simple Quiz Dialog

## Benefits of Upgrade
### 1. Performance Improvements
### 2. Visual Enhancements
### 3. User Experience
### 4. Code Maintainability

## Technical Implementation
### Import Changes
### Dialog Flow

## Verification
List of verification steps completed
```

## Next Steps

### 1. Upgrade Priority Order
Based on usage frequency and importance:
1. HuntBoy (High usage, central to Base ecosystem)
2. MintGirl (Popular with creative users)
3. MrRugPull (Important for security education)
4. AlchemyMan (Technical content)
5. Other NPCs as needed

### 2. Post-Upgrade Verification
- Test all NPCs in various scenarios
- Verify cross-NPC consistency
- Check mobile and desktop layouts
- Validate educational content delivery

### 3. Performance Monitoring
- Monitor build times
- Check memory usage
- Verify dialog load performance
- Gather user feedback

## Conclusion

This guide provides a comprehensive approach to upgrading NPC dialog systems. By following these steps, you can ensure consistent, high-quality user experiences across all NPCs while maintaining their unique personalities and educational value. Always remember to test thoroughly and document changes for future reference.