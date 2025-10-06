# Guide NPC Implementation Guide

## Overview
This document provides a comprehensive guide for implementing Guide NPCs in Quiztal World. Guide NPCs are specialized non-player characters that provide gameplay guidance and tutorial information through conversational interfaces, distinct from Quiz NPCs which focus on knowledge testing.

## Architecture

### Base GuideNPC Class
The `GuideNPC` class serves as the foundation for all Guide NPCs in the game. It provides:

1. **Conversation Management**
   - Topic-based navigation system
   - Conversation history tracking
   - Back/forward navigation

2. **Dialog System Integration**
   - Custom `GuideConversationDialog` for conversation flow
   - Fallback to `OptimizedRewardDialog` for special cases

3. **Network Handling**
   - Automatic offline/online status management
   - Network status shout messages

4. **Player Interaction**
   - Distance-based interaction validation
   - Dialog state management

### Guide Topic Structure
Guide NPCs organize their content into topics, each with:

```typescript
interface GuideTopic {
  id: string;                    // Unique identifier
  title: string;                 // Display title
  content: GuideContentSection[]; // Content sections
  navigationOptions: NavigationOption[]; // Navigation options
}
```

### Content Sections
Content is organized into sections with different types:

```typescript
interface GuideContentSection {
  type: 'text' | 'tip' | 'warning' | 'example';
  content: string;
  icon?: string;
}
```

### Navigation Options
Navigation between topics is handled through options with icons:

```typescript
interface NavigationOption {
  text: string;        // Display text
  targetTopic: string; // Target topic ID
  isBack?: boolean;    // Back navigation
  isMainMenu?: boolean; // Return to main menu
  isExit?: boolean;    // Exit conversation
  icon?: string;       // Emoji icon for visual recognition
}
```

## Implementation Steps

### 1. Create a New Guide NPC
Extend the `GuideNPC` base class:

```typescript
import GuideNPC, { GuideTopic } from "./GuideNPC";
import { NetworkMonitor } from "../utils/NetworkMonitor";

export default class MyNewGuide extends GuideNPC {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "texture_key");
    
    this.npcName = "My New Guide";
    this.npcAvatar = "npc_avatar_key";

    // Initialize animations
    this.createAnimations(scene);

    // Set up interactive behavior
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => this.interact());

    // Create UI elements
    this.nameLabel = scene.add.text(x, y - 40, this.npcName, { /* styles */ });
    this.shoutOutText = scene.add.text(x, y - 60, "", { /* styles */ });

    // Update positions on scene update
    scene.events.on("update", () => {
      this.nameLabel.setPosition(this.x, this.y - 40);
      this.shoutOutText.setPosition(this.x, this.y - 60);
    });

    // Initialize guide topics
    this.initializeGuideTopics();
    
    // Start shouting
    this.startShouting(scene);
  }

  private createAnimations(scene: Phaser.Scene) {
    // Create NPC-specific animations
  }

  protected initializeGuideTopics(): void {
    // Define topics for this NPC
    this.guideTopics = [
      // Topic definitions
    ];
  }

  private startShouting(scene: Phaser.Scene) {
    // Define shout messages
  }
}
```

### 2. Define Guide Topics
Implement the `initializeGuideTopics()` method to define the conversation flow:

```typescript
protected initializeGuideTopics(): void {
  this.guideTopics = [
    {
      id: 'welcome',
      title: '🎮 Welcome to My Guide!',
      content: [
        {
          type: 'text',
          content: 'Welcome message content...'
        },
        {
          type: 'tip',
          content: 'Helpful tip...'
        }
      ],
      navigationOptions: [
        { text: 'First Topic', targetTopic: 'first', icon: '📖' },
        { text: 'Second Topic', targetTopic: 'second', icon: '🔍' },
        { text: 'Not right now', targetTopic: 'goodbye', icon: '👋' }
      ]
    },
    {
      id: 'first',
      title: 'First Topic Title',
      content: [
        {
          type: 'text',
          content: 'Content for first topic...'
        }
      ],
      navigationOptions: [
        { text: 'Back to Main Menu', targetTopic: 'mainmenu', isMainMenu: true, icon: '🏠' },
        { text: 'Second Topic', targetTopic: 'second', icon: '🔍' },
        { text: 'Thanks!', targetTopic: 'goodbye', isExit: true, icon: '👋' }
      ]
    }
    // Additional topics...
  ];
}
```

### 3. Customize Shout Messages
Implement the `startShouting()` method for periodic NPC messages:

```typescript
private startShouting(scene: Phaser.Scene) {
  const shoutMessages = [
    "Helpful message 1! 🌍",
    "Helpful message 2! 📚",
    "Helpful message 3! 🧠"
  ];
  
  const networkOfflineMessages = [
    "Network error message 1! 🚫",
    "Network error message 2! 😢"
  ];

  scene.time.addEvent({
    delay: Phaser.Math.Between(5000, 10000),
    callback: () => {
      let randomMessage;
      
      if (!this.networkMonitor.getIsOnline()) {
        randomMessage = Phaser.Utils.Array.GetRandom(networkOfflineMessages);
      } else {
        randomMessage = Phaser.Utils.Array.GetRandom(shoutMessages);
      }
      
      this.showShout(randomMessage);
      this.startShouting(scene);
    },
    loop: false
  });
}
```

## New Conversation Dialog System

### GuideConversationDialog Features
The new `GuideConversationDialog` provides a conversation-focused interface:

1. **Natural Layout**
   - No quiz-style A/B/C options
   - Descriptive navigation text
   - Icon-enhanced options

2. **Visual Design**
   - Dark blue conversation-friendly theme
   - Grid layout (1 column on mobile, 2 on desktop)
   - Clear visual hierarchy

3. **Responsive Behavior**
   - Adapts to screen sizes
   - Touch-friendly button sizes
   - Readable text spacing

### Navigation with Icons
Each navigation option includes an emoji icon for better recognition:

```typescript
navigationOptions: [
  { text: 'Game Controls', targetTopic: 'controls', icon: '🎮' },
  { text: 'NPCs & Quizzes', targetTopic: 'npcs', icon: '🤖' },
  { text: 'Quiztals & Rewards', targetTopic: 'rewards', icon: '💰' },
  { text: 'Back to Main Menu', targetTopic: 'mainmenu', isMainMenu: true, icon: '🏠' },
  { text: 'Thanks!', targetTopic: 'goodbye', isExit: true, icon: '👋' }
]
```

## Customization Points

### Personality Customization
Each Guide NPC can have a distinct personality through:

1. **Visual Appearance**
   - Unique sprites and animations
   - Custom color schemes
   - Distinctive UI styling

2. **Language Style**
   - Personality-specific vocabulary
   - Tone and manner of speaking
   - Cultural references and humor

3. **Content Focus**
   - Specialized knowledge areas
   - Unique teaching approaches
   - Personal anecdotes and examples

### Topic Customization
Topics can be customized for different Guide NPCs:

1. **Content Depth**
   - Basic introductions for new players
   - Advanced techniques for experienced players
   - Specialized knowledge for specific areas

2. **Navigation Flow**
   - Linear progression paths
   - Branching conversation trees
   - Context-sensitive suggestions

3. **Interactive Elements**
   - Embedded mini-games
   - Visual demonstrations
   - Practical examples

## Integration with Existing Systems

### Guide Book Connection
Guide NPCs should reference the full GuideBook:

```typescript
{
  type: 'tip',
  content: '💡 TIP: Press G anytime to open the full Guide Book for more detailed information!'
}
```

### Quiz NPC References
Guide NPCs can direct players to relevant Quiz NPCs:

```typescript
{
  type: 'text',
  content: 'For more detailed information on this topic, visit [NPC Name] who specializes in [subject].'
}
```

### Progression Integration
Guide NPCs can be aware of player progression:

```typescript
// Example: Conditional content based on player progress
if (player.hasCompletedTutorial) {
  // Provide advanced guidance
} else {
  // Provide basic guidance
}
```

## Best Practices

### Content Organization
1. **Modular Topics**
   - Keep topics focused on single subjects
   - Use clear, descriptive titles
   - Provide logical navigation paths

2. **Progressive Disclosure**
   - Start with essential information
   - Offer deeper details through navigation
   - Avoid information overload

3. **Consistent Terminology**
   - Use standard game terms
   - Define specialized vocabulary
   - Maintain consistent language style

### User Experience
1. **Clear Navigation**
   - Provide obvious back/exit options
   - Use consistent navigation labels
   - Offer multiple paths to information

2. **Responsive Design**
   - Adapt content for mobile/desktop
   - Ensure text fits within dialog bounds
   - Maintain readable font sizes

3. **Performance Optimization**
   - Load content efficiently
   - Minimize dialog creation overhead
   - Clean up resources properly

### Maintenance
1. **Modular Structure**
   - Separate content from logic
   - Use configuration files where possible
   - Document customization points

2. **Extensibility**
   - Design for future additions
   - Use inheritance for specialization
   - Provide clear extension points

## Example Implementation: Mr. Gemx

Mr. Gemx serves as the template implementation for Guide NPCs. His structure demonstrates:

1. **Comprehensive Topic Coverage**
   - Game Controls
   - NPCs & Quizzes
   - Quiztals & Rewards
   - Inventory System
   - Gemante NFTs
   - Pro Tips

2. **Clear Navigation Flow**
   - Main menu as central hub
   - Topic-to-topic navigation
   - Back/exit options

3. **Personality Integration**
   - Friendly, approachable tone
   - Helpful tips and advice
   - Consistent visual identity

4. **Icon-Based Navigation**
   - Emoji icons for each navigation option
   - Visual recognition of options
   - Enhanced user experience

## Future Enhancements

### Advanced Features
1. **Context-Aware Guidance**
   - Player progress-based suggestions
   - Location-specific help
   - Dynamic content adaptation

2. **Interactive Tutorials**
   - Step-by-step guidance
   - Hands-on demonstrations
   - Progress tracking

3. **Multimedia Integration**
   - Embedded images and diagrams
   - Audio narration
   - Video tutorials

### Technical Improvements
1. **Enhanced Dialog System**
   - Rich text formatting
   - Animated transitions
   - Voice synthesis support

2. **Content Management**
   - External content files
   - Localization support
   - Dynamic content updates

3. **Analytics Integration**
   - Usage tracking
   - Effectiveness measurement
   - Continuous improvement

## Conclusion

The Guide NPC system provides a robust foundation for creating helpful, personality-driven guidance characters in Quiztal World. By following this implementation guide, developers can create consistent, engaging guide characters that enhance the player experience while maintaining the flexibility to customize for specific needs and personalities. The new conversation-based dialog system creates a distinctly different and more natural experience compared to quiz dialogs.