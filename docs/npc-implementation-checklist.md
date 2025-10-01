# NPC Implementation Checklist

This comprehensive checklist ensures all steps are completed when implementing new Walking Quiz NPCs in QuiztalWorld, maintaining consistency and quality across all implementations.

## Pre-Implementation Planning

### 1. NPC Concept Definition
- [ ] Define NPC role and theme
- [ ] Identify target audience/knowledge level
- [ ] Determine patrol area and behavior
- [ ] Select appropriate color scheme
- [ ] Plan unique shout messages
- [ ] Design avatar and animation style

### 2. Content Planning
- [ ] Research topic thoroughly
- [ ] Identify 5-10 key concepts to teach
- [ ] Plan question difficulty progression
- [ ] Draft educational explainers
- [ ] Review existing NPCs for consistency

### 3. Asset Preparation
- [ ] Create avatar image (256x256 PNG recommended)
- [ ] Create idle animation spritesheet (6 frames, 32x53 or 32x64)
- [ ] Create walk animation spritesheet (6 frames, 32x53 or 32x64)
- [ ] Verify asset quality and consistency
- [ ] Optimize assets for web delivery

## Implementation Phase

### 4. Quiz Data Creation
- [ ] Create quiz JSON file in `public/assets/quizzes/`
- [ ] Name file: `npc-{npcid}.json`
- [ ] Include NPC metadata (id, name, theme, description)
- [ ] Add 5-10 educational questions
- [ ] Ensure each question has 3 options
- [ ] Verify correct answers match options exactly
- [ ] Include educational explainers (120-200 characters)
- [ ] Validate JSON syntax

### 5. BootScene Asset Loading
- [ ] Add idle sprite loading:
```typescript
this.load.spritesheet("npc_{npcid}", "assets/npc/npc_{npcid}_idle_1.png", {
    frameWidth: 32,
    frameHeight: 53
});
```
- [ ] Add walk sprite loading:
```typescript
this.load.spritesheet("npc_{npcid}_walk", "assets/npc/npc_{npcid}_walk_1.png", {
    frameWidth: 32,
    frameHeight: 53
});
```
- [ ] Verify asset paths are correct
- [ ] Test asset loading in browser

### 6. AssetManager Configuration
- [ ] Add to asset configurations:
```typescript
{
  avatarKey: 'npc_{npcid}_avatar',
  avatarPath: 'assets/npc/npc_{npcid}_avatar.png',
  spriteKey: 'npc_{npcid}',
  spritePath: 'assets/npc/npc_{npcid}_idle_1.png',
  frameWidth: 32,
  frameHeight: 53
}
```
- [ ] Add walk animation loading condition:
```typescript
if (config.spriteKey.includes('{npcid}')) {
  // Load walk animation
}
```

### 7. NPCQuizManager Update
- [ ] Add NPC ID to loading list:
```typescript
private async loadAllQuizData(): Promise<void> {
    const npcIds = [
        // ... existing NPC IDs
        '{npcid}'
    ];
}
```
- [ ] Verify NPC ID matches quiz file name

### 8. NPCManager Configuration
- [ ] Import new NPC class:
```typescript
import {NPCName} from '../objects/{NPCName}';
```
- [ ] Add to npcConfigs array:
```typescript
{
  id: '{npcid}',
  name: '{NPC Display Name}',
  class: {NPCName},
  position: { x: X_POSITION, y: Y_POSITION },
  interactionRange: 100
}
```
- [ ] Choose appropriate starting position
- [ ] Set suitable interaction range

### 9. GameScene Registration
- [ ] Add NPC registration:
```typescript
const {npcVariableName} = this.npcManager.getNPC('{npcid}');
if ({npcVariableName}) {
  this.walkingNPCManager.registerWalkingNPC({npcVariableName});
}
```
- [ ] Use consistent variable naming
- [ ] Verify registration logic

### 10. Animation Handling
- [ ] Add SimplePatrolBehavior animation handling:
```typescript
else if (npc.texture && npc.texture.key === 'npc_{npcid}') {
  // Animation handling
}
```
- [ ] Add interaction start handling:
```typescript
else if (npc.texture && npc.texture.key === 'npc_{npcid}') {
  // Idle animation handling
}
```
- [ ] Add WalkingNPC animation key generation:
```typescript
if (textureKey === 'npc_{npcid}' || textureKey === 'npc_{npcid}_walk') {
  // Key generation
}
```

### 11. NPC Class Implementation
- [ ] Create new file: `src/objects/{NPCName}.ts`
- [ ] Extend WalkingNPC class
- [ ] Implement constructor with all essentials:
  - [ ] Call super()
  - [ ] Initialize managers
  - [ ] Load quiz data
  - [ ] Set up physics
  - [ ] Define patrol behavior
  - [ ] Create animations
  - [ ] Set up UI elements
  - [ ] Register event handlers
- [ ] Implement required methods:
  - [ ] createAnimations()
  - [ ] update()
  - [ ] interact()
  - [ ] startQuiz()
  - [ ] startSimpleQuiz()
  - [ ] checkAnswer()
  - [ ] startEnhancedQuiz()
  - [ ] handleEnhancedAnswer()
  - [ ] calculateReward()
  - [ ] saveRewardToDatabase()
  - [ ] startShouting()
  - [ ] showShout()
  - [ ] getClosestPlayer()
  - [ ] showCooldownDialog()
  - [ ] handleWorldBoundsCollision()

## Testing Phase

### 12. Asset Testing
- [ ] Verify all assets load without errors
- [ ] Check animation frame sequences
- [ ] Test idle and walk animations
- [ ] Verify avatar displays in dialogs

### 13. Quiz Functionality Testing
- [ ] Test quiz data loading
- [ ] Verify questions display correctly
- [ ] Test answer selection and validation
- [ ] Check reward calculation and distribution
- [ ] Test cooldown mechanism
- [ ] Verify enhanced quiz flow (if applicable)

### 14. Interaction Testing
- [ ] Test NPC clicking/interaction
- [ ] Verify dialog display and behavior
- [ ] Test shout message system
- [ ] Check patrol behavior and boundaries
- [ ] Test collision detection
- [ ] Verify name label display

### 15. Mobile Responsiveness Testing
- [ ] Test on various screen sizes
- [ ] Verify touch target sizes
- [ ] Check dialog positioning
- [ ] Test orientation changes
- [ ] Verify performance on mobile

### 16. Cross-Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari (if possible)
- [ ] Verify consistent behavior

## Quality Assurance

### 17. Code Quality Review
- [ ] Check for TypeScript errors
- [ ] Verify proper error handling
- [ ] Ensure consistent naming conventions
- [ ] Remove unnecessary console logs
- [ ] Validate memory management
- [ ] Check for potential performance issues

### 18. Educational Content Review
- [ ] Verify question accuracy
- [ ] Check explainer quality and length
- [ ] Ensure progressive difficulty
- [ ] Confirm educational value
- [ ] Review for bias or offensive content

### 19. User Experience Review
- [ ] Test interaction flow
- [ ] Verify clear feedback
- [ ] Check timing of messages
- [ ] Ensure intuitive navigation
- [ ] Confirm accessibility standards

## Documentation and Finalization

### 20. Documentation Updates
- [ ] Update NPC documentation if it exists
- [ ] Add to NPC roster documentation
- [ ] Document any special implementation notes
- [ ] Update implementation templates if needed

### 21. Performance Monitoring
- [ ] Monitor initial user interactions
- [ ] Check for reported issues
- [ ] Verify reward distribution
- [ ] Monitor quiz completion rates

### 22. Final Verification
- [ ] Full playthrough test
- [ ] Verify all checklist items completed
- [ ] Confirm no console errors
- [ ] Test edge cases
- [ ] Verify backup systems work

## Common Issue Resolution

### Quick Fixes for Common Problems

**Assets Not Loading:**
- [ ] Check file paths in BootScene
- [ ] Verify file names match exactly
- [ ] Confirm assets are in correct directories
- [ ] Check browser network tab for 404 errors

**Animations Not Working:**
- [ ] Verify frame numbers match spritesheet
- [ ] Check animation key names
- [ ] Ensure animations are created only once
- [ ] Confirm texture keys match asset loading

**Quiz Not Starting:**
- [ ] Verify NPC ID matches in all files
- [ ] Check quiz JSON structure
- [ ] Confirm quiz manager initialization
- [ ] Test quiz data loading in browser

**Dialog Issues:**
- [ ] Use correct dialog pattern:
```typescript
this.currentDialog = SimpleDialogBox.getInstance(this.scene);
this.currentDialog.showDialog([{ ... }]);
```
- [ ] Ensure proper dialog cleanup
- [ ] Check for existing dialog conflicts

**Rewards Not Saving:**
- [ ] Verify database integration
- [ ] Check reward calculation logic
- [ ] Confirm player ID handling
- [ ] Test database connectivity

This comprehensive checklist ensures consistent, high-quality NPC implementations that maintain the educational and entertainment value of QuiztalWorld while following established patterns and best practices.