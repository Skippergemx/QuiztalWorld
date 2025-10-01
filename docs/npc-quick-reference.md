# NPC Implementation Quick Reference

This is a simplified cheat sheet for quickly implementing new Walking Quiz NPCs in QuiztalWorld.

## Quick Start Template

### 1. File Names & Paths
```
Assets:
- public/assets/npc/npc_{npcid}_avatar.png
- public/assets/npc/npc_{npcid}_idle_1.png  
- public/assets/npc/npc_{npcid}_walk_1.png

Quiz Data:
- public/assets/quizzes/npc-{npcid}.json

NPC Class:
- src/objects/{NPCName}.ts
```

### 2. Quiz JSON Template
```json
{
  "npcId": "{npcid}",
  "npcName": "{NPC Display Name}",
  "theme": "{Theme}",
  "description": "{Description}",
  "questions": [
    {
      "question": "{Question?}",
      "options": [
        "{Correct}",
        "{Incorrect 1}",
        "{Incorrect 2}"
      ],
      "answer": "{Correct}",
      "explainer": "{Educational explanation (120-200 chars)}"
    }
  ]
}
```

### 3. BootScene Asset Loading
```typescript
this.load.spritesheet("npc_{npcid}", "assets/npc/npc_{npcid}_idle_1.png", {
    frameWidth: 32,
    frameHeight: 53
});
this.load.spritesheet("npc_{npcid}_walk", "assets/npc/npc_{npcid}_walk_1.png", {
    frameWidth: 32,
    frameHeight: 53
});
```

### 4. NPCManager Configuration
```typescript
{
  id: '{npcid}',
  name: '{NPC Display Name}',
  class: {NPCName},
  position: { x: X_POSITION, y: Y_POSITION },
  interactionRange: 100
}
```

### 5. Key Implementation Points

**Constructor Essentials:**
- Call `super(scene, x, y, "npc_{npcid}")`
- Initialize quiz managers
- Load quiz data
- Set up physics
- Define patrol points
- Create animations
- Set up UI elements

**Required Methods:**
- `createAnimations()` - Set up idle/walk animations
- `interact()` - Handle player interaction
- `startQuiz()` - Start quiz flow
- `startSimpleQuiz()` - Simple quiz implementation
- `checkAnswer()` - Handle answer checking
- `startEnhancedQuiz()` - Enhanced quiz implementation
- `handleEnhancedAnswer()` - Handle enhanced answer
- `startShouting()` - Set up shout messages
- `showShout()` - Display shout messages
- `showCooldownDialog()` - Show cooldown message

**Dialog Pattern:**
```typescript
// Correct pattern
this.currentDialog = SimpleDialogBox.getInstance(this.scene);
this.currentDialog.showDialog([{ ... }]);

// NOT this pattern
const dialog = showDialog(this.scene, [...]);
this.currentDialog = dialog;
```

## Common Customization Values

### Color Schemes
- **Art/Media**: #00aaff (blue) / #003366 (dark blue)
- **Blockchain**: #9932cc (purple) / #4b0082 (dark purple)
- **Security**: #ff0000 (red) / #330000 (dark red)
- **Development**: #2ecc71 (green) / #1a5d38 (dark green)
- **Finance**: #f1c40f (yellow) / #926d00 (dark yellow)

### Patrol Patterns
- **Horizontal**: `{ x: x - 100, y: y }, { x: x + 100, y: y }`
- **Vertical**: `{ x: x, y: y - 100 }, { x: x, y: y + 100 }`
- **Square**: Multiple points for square patrol

### Emoji Themes
- **Art/Media**: 🎨 🖼️ 💡 🔍 ⛓️ 🌟
- **Blockchain**: 🔮 ⚡ 🌐 🚀 💎 ⛓️
- **Security**: 🔐 🛡️ ⚠️ 🔍 🔒 🛡️
- **Development**: 💻 🚀 ⚙️ 🔧 🎯 💡
- **Finance**: 💰 📈 📊 📉 💎 🎯

## Quick Implementation Steps

1. **Prepare Assets** (10 min)
   - Create avatar, idle, and walk images
   - Place in correct directories

2. **Create Quiz Data** (15 min)
   - Copy template JSON
   - Add 5-10 themed questions
   - Include explainers

3. **Update Managers** (10 min)
   - Add to BootScene asset loading
   - Add to NPCManager configuration
   - Add to NPCQuizManager NPC list

4. **Create NPC Class** (30 min)
   - Copy template NPC class
   - Replace placeholders
   - Customize messages and behavior

5. **Register NPC** (5 min)
   - Add to GameScene registration
   - Add animation handling if needed

6. **Test & Polish** (20 min)
   - Test in game
   - Adjust positioning
   - Fine-tune messages

## Troubleshooting Quick Fixes

**Assets Not Loading:**
- Check file paths and names
- Verify frame dimensions
- Check browser network tab

**Animations Not Working:**
- Verify frame numbers match spritesheet
- Check animation key names
- Ensure animations are created only once

**Quiz Not Starting:**
- Verify NPC ID matches in all files
- Check quiz JSON structure
- Ensure quiz manager is initialized

**Dialog Issues:**
- Use correct dialog pattern
- Ensure dialog cleanup
- Check for existing dialogs

**Rewards Not Saving:**
- Verify database integration
- Check reward calculation
- Ensure player ID is valid

This quick reference provides the essential information needed to implement new NPCs rapidly while maintaining consistency with existing implementations.