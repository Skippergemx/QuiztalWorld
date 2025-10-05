# Dialog Optimization Quick Reference Guide

## For AI Agents Working on Quiztal World

### Key Files
- `src/utils/OptimizedRewardDialog.ts` - Correct answer dialogs
- `src/utils/OptimizedWrongAnswerDialog.ts` - Incorrect answer dialogs
- `src/utils/OptimizedEnhancedQuizDialog.ts` - Quiz question dialogs

### Implementation Steps

#### 1. Add Imports
```typescript
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';
```

#### 2. For Correct Answers
```typescript
const rewardDialogData: OptimizedRewardDialogData = {
  npcName: "NPC Name",
  npcAvatar: "avatar_key",
  rewardMessage: "Reward message with emoji",
  didYouKnow: "Educational content",
  tipsAndTricks: "More educational content",
  rewardAmount: rewardValue,
  onClose: () => this.resetDialogState()
};

showOptimizedRewardDialog(this.scene, rewardDialogData);
```

#### 3. For Wrong Answers
```typescript
const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
  npcName: "NPC Name",
  npcAvatar: "avatar_key",
  wrongAnswerMessage: `❌ "${selectedOption}" is incorrect`,
  correctAnswer: correctAnswer,
  explanation: "Why this is wrong",
  commonMistakes: "Common errors in this domain",
  quickTips: "Helpful advice",
  onClose: () => this.resetDialogState()
};

showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
```

### Mobile Optimization Checklist
- [ ] Content under 150 characters for mobile
- [ ] Responsive font sizes
- [ ] Adequate touch targets
- [ ] Proper text wrapping
- [ ] No content overflow

### Design Consistency
- [ ] Use same color scheme (red for wrong, green for correct)
- [ ] Include educational sections
- [ ] Use emojis appropriately (❌, ✅, ⚠️, 💡, 📚)
- [ ] Maintain header structure
- [ ] User-triggered dismissal only

### Educational Content Guidelines
1. **Common Mistakes**: Domain-specific errors players make
2. **Quick Tips**: Actionable advice for improvement
3. **Explanations**: Clear reasoning for correct answers
4. **Length**: Under 150 characters for mobile

### Performance Considerations
- [ ] Proper cleanup in onClose callbacks
- [ ] Efficient text measurement
- [ ] Memory management
- [ ] Event listener cleanup

### Testing Requirements
- [ ] Mobile layout verification
- [ ] Touch interaction testing
- [ ] Educational content accuracy
- [ ] Dialog flow consistency

### Reference Implementations
1. **DexpertGal.ts** - Most comprehensive example
2. **MintGirl.ts** - Basic implementation
3. **ProfChain.ts** - Alternative approach

### Common Issues to Avoid
1. Auto-closing dialogs for educational content
2. Inconsistent color coding
3. Text overflow on mobile
4. Missing onClose handlers
5. Inadequate touch targets

### Quick Debug Tips
1. Check console for texture loading errors
2. Verify import statements
3. Ensure onClose callbacks reset dialog state
4. Test on multiple screen sizes
5. Validate educational content length

This quick reference provides essential information for implementing optimized dialogs consistently across all NPCs.