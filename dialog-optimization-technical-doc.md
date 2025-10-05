# Technical Documentation: Dialog Optimization System

## Architecture Overview

The dialog optimization system consists of three main components:

1. **OptimizedEnhancedQuizDialog** - For quiz questions
2. **OptimizedRewardDialog** - For correct answer feedback
3. **OptimizedWrongAnswerDialog** - For incorrect answer feedback

All components inherit consistent design principles and mobile optimization techniques.

## Component Details

### OptimizedRewardDialog

#### File Location
`src/utils/OptimizedRewardDialog.ts`

#### Key Methods

##### Constructor
```typescript
constructor(scene: Phaser.Scene)
```
Initializes the dialog with mobile-responsive sizing:
- Mobile width: 95% of screen width
- Mobile height: 420px
- Desktop width: 750px
- Desktop height: 480px

##### showRewardDialog
```typescript
public showRewardDialog(data: OptimizedRewardDialogData): void
```
Displays the reward dialog with fade-in animation.

##### Core UI Creation Methods
- `createOptimizedHeader()` - NPC info and reward amount
- `createRewardMessageSection()` - Main reward message display
- `createEducationalSections()` - "Did You Know" and "Tips & Tricks"
- `createCloseButton()` - User-triggered dismissal

#### Data Interface
```typescript
interface OptimizedRewardDialogData {
  npcName: string;
  npcAvatar: string;
  rewardMessage: string;
  didYouKnow?: string;
  tipsAndTricks?: string;
  rewardAmount: number;
  onClose?: () => void;
}
```

### OptimizedWrongAnswerDialog

#### File Location
`src/utils/OptimizedWrongAnswerDialog.ts`

#### Key Methods

##### Constructor
```typescript
constructor(scene: Phaser.Scene)
```
Initializes the dialog with mobile-responsive sizing (same as reward dialog).

##### showWrongAnswerDialog
```typescript
public showWrongAnswerDialog(data: OptimizedWrongAnswerDialogData): void
```
Displays the wrong answer dialog with fade-in animation.

##### Core UI Creation Methods
- `createOptimizedHeader()` - NPC info with red theme
- `createWrongAnswerMessageSection()` - Wrong answer and correct answer display
- `createEducationalSections()` - "Common Mistakes", "Quick Tips", and explanations
- `createCloseButton()` - User-triggered dismissal

#### Data Interface
```typescript
interface OptimizedWrongAnswerDialogData {
  npcName: string;
  npcAvatar: string;
  wrongAnswerMessage: string;
  correctAnswer: string;
  explanation?: string;
  commonMistakes?: string;
  quickTips?: string;
  onClose?: () => void;
}
```

## Mobile Optimization Features

### Responsive Sizing
```typescript
this.dialogWidth = this.isMobile ? scene.scale.width * 0.95 : 750;
this.dialogHeight = this.isMobile ? 420 : 480;
```

### Dynamic Text Sizing
```typescript
fontSize: UIHelpers.getResponsiveFontSize(this.isMobile, '16px')
```

### Touch-Optimized Scrolling
- Mouse wheel support for desktop
- Touch drag support for mobile
- Visual scroll indicators
- Performance-optimized rendering

### Content Height Calculation
```typescript
class TextHeightCalculator {
  static calculateTextHeight(scene: Phaser.Scene, config: TextMeasurementConfig): number
}
```

## Integration Patterns

### NPC Implementation Example

#### Import Statements
```typescript
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from '../utils/OptimizedRewardDialog';
import { showOptimizedWrongAnswerDialog, OptimizedWrongAnswerDialogData } from '../utils/OptimizedWrongAnswerDialog';
```

#### Correct Answer Handling
```typescript
const rewardDialogData: OptimizedRewardDialogData = {
  npcName: this.npcName,
  npcAvatar: this.avatarKey,
  rewardMessage: rewardMessage,
  didYouKnow: didYouKnowContent,
  tipsAndTricks: tipsContent,
  rewardAmount: reward,
  onClose: () => {
    this.resetDialogState();
  }
};

showOptimizedRewardDialog(this.scene, rewardDialogData);
```

#### Wrong Answer Handling
```typescript
const wrongAnswerDialogData: OptimizedWrongAnswerDialogData = {
  npcName: this.npcName,
  npcAvatar: this.avatarKey,
  wrongAnswerMessage: `❌ Incorrect! "${selectedOption}" is not correct.`,
  correctAnswer: correctAnswer,
  explanation: explanationContent,
  commonMistakes: this.generateCommonMistakes(),
  quickTips: this.generateQuickTips(),
  onClose: () => {
    this.resetDialogState();
  }
};

showOptimizedWrongAnswerDialog(this.scene, wrongAnswerDialogData);
```

## Performance Optimizations

### Event Management
- Single event listeners with proper cleanup
- Camera movement tracking for dialog positioning
- Scene shutdown handling

### Memory Management
- Temporary text object reuse in TextHeightCalculator
- Proper destruction of dialog containers
- Singleton pattern for dialog instances

### Rendering Efficiency
- Mask-based content clipping
- Geometry-based graphics rendering
- Tween-based animations

## Visual Design System

### Color Palette
- Primary background: `#2c0a0a` (dark red for wrong answers)
- Secondary background: `#1a0606` (darker red)
- Accent color: `#ff4444` (bright red)
- Text colors: Theme-appropriate values

### Typography
- Responsive font sizing through UIHelpers
- Consistent font families
- Proper line spacing for readability

### Layout Structure
1. Header section (NPC info)
2. Main content section (message)
3. Educational sections (borders, categorized)
4. Close button (bottom-centered)

## Error Handling

### Graceful Degradation
```typescript
export function showOptimizedRewardDialog(scene: Phaser.Scene, data: OptimizedRewardDialogData): OptimizedRewardDialog | null {
  try {
    // Implementation
  } catch (error) {
    console.error('Error showing optimized reward dialog:', error);
    return null;
  }
}
```

### Validation
- Scene validity checking
- Data structure validation
- Texture existence verification

## Testing Considerations

### Unit Tests
- Dialog creation and display
- Data population
- Event handling
- Cleanup procedures

### Integration Tests
- Cross-NPC consistency
- Mobile responsiveness
- Educational content delivery

### Performance Tests
- Memory usage monitoring
- Frame rate impact assessment
- Loading time measurement

## Migration Guide

### From SimpleDialogBox to Optimized Dialogs

#### Before
```typescript
this.currentDialog = SimpleDialogBox.getInstance(this.scene);
this.currentDialog.showDialog([
  {
    text: "Simple message",
    avatar: "npc_avatar",
    isExitDialog: true
  }
]);
```

#### After
```typescript
const dialogData: OptimizedRewardDialogData = {
  npcName: "NPC Name",
  npcAvatar: "npc_avatar",
  rewardMessage: "Enhanced message",
  rewardAmount: reward,
  onClose: () => this.resetDialogState()
};

showOptimizedRewardDialog(this.scene, dialogData);
```

## API Reference

### showOptimizedRewardDialog
```typescript
function showOptimizedRewardDialog(scene: Phaser.Scene, data: OptimizedRewardDialogData): OptimizedRewardDialog | null
```

### showOptimizedWrongAnswerDialog
```typescript
function showOptimizedWrongAnswerDialog(scene: Phaser.Scene, data: OptimizedWrongAnswerDialogData): OptimizedWrongAnswerDialog | null
```

### TextHeightCalculator
```typescript
class TextHeightCalculator {
  static calculateTextHeight(scene: Phaser.Scene, config: TextMeasurementConfig): number
  static cleanup(): void
}
```

## Best Practices

### Code Organization
- Separate concerns (UI creation, data handling, event management)
- Consistent naming conventions
- Clear method responsibilities

### Performance
- Minimize DOM operations
- Reuse objects where possible
- Efficient event handling

### Maintainability
- Modular design
- Clear documentation
- Consistent patterns

This technical documentation provides the foundation for understanding and implementing the optimized dialog system in Quiztal World.