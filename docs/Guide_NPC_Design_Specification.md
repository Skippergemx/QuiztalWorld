# Guide NPC Design Specification

## Overview
This document defines the architectural design and implementation pattern for Guide NPCs in Quiztal World. Guide NPCs provide gameplay guidance and tutorial information through conversational interfaces, distinct from Quiz NPCs which focus on knowledge testing.

## Core Principles

### 1. Conversation-First Approach
- Guide NPCs use natural conversation flows rather than quiz formats
- Information is presented in digestible chunks with clear navigation
- Players can easily jump between topics of interest

### 2. Contextual Help System
- Guide NPCs provide just-in-time assistance
- Content is organized by player needs and progression
- Integration with the full GuideBook system

### 3. Personality-Driven Interaction
- Each Guide NPC has a distinct personality and presentation style
- Content is tailored to match the NPC's character
- Visual and verbal cues reinforce the NPC's role

## Technical Architecture

### Base Guide NPC Class
```typescript
class GuideNPC extends Phaser.Physics.Arcade.Sprite {
  protected currentTopic: string = 'welcome';
  protected conversationHistory: string[] = [];
  protected guideTopics: GuideTopic[] = [];
  
  // Core methods
  public interact(): void
  protected showTopic(topicId: string): void
  protected navigateToTopic(topicId: string): void
  protected showMainMenu(): void
  protected showGoodbye(): void
}
```

### Guide Topic Structure
```typescript
interface GuideTopic {
  id: string;
  title: string;
  content: GuideContentSection[];
  navigationOptions: NavigationOption[];
}

interface GuideContentSection {
  type: 'text' | 'tip' | 'warning' | 'example';
  content: string;
  icon?: string;
}

interface NavigationOption {
  text: string;
  targetTopic: string;
  isBack?: boolean;
  isMainMenu?: boolean;
  isExit?: boolean;
}
```

## Dialog Flow Design

### 1. Welcome Interaction
- Brief introduction to the NPC's role
- Overview of available topics
- Clear navigation options

### 2. Topic Exploration
- Focused content on a specific subject
- Visual aids and examples where appropriate
- Related topic suggestions

### 3. Navigation System
- Back to previous topic
- Return to main menu
- Exit conversation
- Jump to related topics

### 4. Contextual Integration
- References to the full GuideBook (G key)
- Pointers to relevant Quiz NPCs
- Connection to player progression

## Visual Design

### Guide Dialog Box Features
- Clean, informative layout
- Topic-based organization
- Visual icons for different content types
- Easy navigation controls
- Personality-consistent styling

### Content Presentation
- Scrollable text sections for detailed information
- Highlighted tips and warnings
- Interactive examples where applicable
- Progress indicators for multi-step guides

## Implementation Standards

### 1. Consistent API
- Standardized method names across all Guide NPCs
- Uniform configuration format
- Shared utility functions

### 2. Performance Optimization
- Efficient dialog state management
- Memory-conscious content loading
- Smooth animations and transitions

### 3. Maintainability
- Modular topic content structure
- Clear separation of concerns
- Comprehensive documentation

## Mr. Gemx as Template Implementation

### Personality: The Knowledgeable Mentor
- Friendly, approachable guide
- Encouraging tone for new players
- Expert knowledge with practical advice

### Topics Structure
1. Welcome & Introduction
2. Game Controls
3. NPCs & Quizzes
4. Quiztals & Rewards
5. Inventory System
6. Gemante NFTs
7. Pro Tips & Strategies

### Unique Features
- References to the full GuideBook
- Pointers to relevant Quiz NPCs for deeper learning
- Contextual tips based on player progression

## Future Guide NPCs

### Template Reusability
- Base GuideNPC class for inheritance
- Configurable topic content
- Swappable personality elements
- Extensible navigation system

### Customization Points
- Visual appearance and animations
- Personality-specific language and tone
- Topic-specific content
- Unique interaction elements

## Benefits

### Player Experience
- Intuitive guidance system
- Reduced cognitive load for new players
- Flexible learning paths
- Personality-driven engagement

### Development Efficiency
- Reusable architectural foundation
- Standardized implementation process
- Easy content updates and maintenance
- Consistent user experience across NPCs

### Scalability
- Template for future Guide NPCs
- Modular content management
- Extensible feature set
- Integration with existing systems