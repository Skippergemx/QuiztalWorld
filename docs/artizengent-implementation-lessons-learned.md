# Artizen Gent Implementation: Lessons Learned

This document captures the specific issues encountered during the implementation of the Artizen Gent NPC and their solutions. This serves as a reference for future NPC implementations to avoid similar mistakes.

## Overview

The Artizen Gent NPC was implemented as a walking quiz NPC based on the MrRugPull template. During testing, several console errors were observed related to texture loading and animation frame generation.

## Issues Encountered

### 1. Incorrect Texture Key in Animation Frame Generation

**Problem**: 
Console errors showed:
```
ArtizenGent: Checking if walk animation artizengent-walk-right exists: false
ArtizenGent.ts:184 Texture "npc_artizengent_walk_1" not found
```

**Root Cause**: 
In the `createAnimations` method of ArtizenGent.ts, the code was using an incorrect texture key when generating walk animation frames:
```typescript
const walkFrames = scene.anims.generateFrameNumbers("npc_artizengent_walk_1", {
  start: config.walkStart,
  end: config.walkEnd,
});
```

**Solution**: 
The texture key needed to match exactly what was loaded in the BootScene. The correct key was "npc_artizengent_walk":
```typescript
const walkFrames = scene.anims.generateFrameNumbers("npc_artizengent_walk", {
  start: config.walkStart,
  end: config.walkEnd,
});
```

### 2. Empty Animation Frames Leading to Runtime Errors

**Problem**: 
After the texture key fix, there were still errors when trying to play animations:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'frame')
```

**Root Cause**: 
This was a cascading effect from the initial texture key issue. When `generateFrameNumbers` couldn't find the texture, it returned an empty array of frames, which caused issues when the animation system tried to play those frames.

**Solution**: 
Fixing the texture key resolved this issue as well, since the frames were then generated correctly.

## Correct Implementation Pattern

### BootScene Asset Loading
Assets must be loaded with consistent keys:
```typescript
// ✅ Load Artizen Gent spritesheets (idle and walk)
this.load.spritesheet("npc_artizengent", "assets/npc/npc_artizengent_idle_1.png", {
    frameWidth: 32,
    frameHeight: 53,
});
this.load.spritesheet("npc_artizengent_walk", "assets/npc/npc_artizengent_walk_1.png", {
    frameWidth: 32,
    frameHeight: 53,
});
```

### Animation Frame Generation
When generating animation frames, use the exact same keys as in BootScene:
```typescript
// For idle animations
const idleFrames = scene.anims.generateFrameNumbers("npc_artizengent", {
  start: config.idleStart,
  end: config.idleEnd,
});

// For walk animations
const walkFrames = scene.anims.generateFrameNumbers("npc_artizengent_walk", {
  start: config.walkStart,
  end: config.walkEnd,
});
```

## Key Takeaways

1. **Texture Key Consistency**: The texture key used in `generateFrameNumbers()` must exactly match the key used in `this.load.spritesheet()` in BootScene.

2. **Debugging Approach**: When encountering "Texture not found" errors, verify:
   - Asset files exist in the correct location
   - BootScene loads assets with the correct keys
   - Animation frame generation uses matching keys
   - No typos in file paths or keys

3. **Cascade Effects**: One incorrect key can cause multiple downstream errors. Always fix the root cause first.

4. **Pattern Matching**: Follow the exact same pattern as working implementations (like MrRugPull) to minimize errors.

## Verification Process

To ensure correct implementation, verify these checkpoints:

1. ✅ Asset files exist in `public/assets/npc/` with correct names
2. ✅ BootScene loads spritesheets with consistent keys
3. ✅ Animation frame generation uses matching keys
4. ✅ No console errors about missing textures
5. ✅ Animations play correctly (idle and walk)
6. ✅ NPC behaves correctly in game (patrolling, interaction, quizzes)

## Conclusion

The Artizen Gent implementation highlighted the critical importance of texture key consistency across the asset loading pipeline. By following the established patterns and carefully matching keys between BootScene and animation generation, similar issues can be avoided in future NPC implementations.