import Phaser from "phaser";
import { NetworkMonitor } from "../utils/NetworkMonitor";
import { showOptimizedRewardDialog, OptimizedRewardDialogData } from "../utils/OptimizedRewardDialog";
import { showGuideConversationDialog, GuideConversationDialogData } from "../utils/GuideConversationDialog";
import { showOptimizedGuideDialog, OptimizedGuideDialogData } from "../utils/OptimizedGuideDialog";

// Guide topic structure
export interface GuideContentSection {
  type: 'text' | 'tip' | 'warning' | 'example';
  content: string;
  icon?: string;
}

export interface NavigationOption {
  text: string;
  targetTopic: string;
  isBack?: boolean;
  isMainMenu?: boolean;
  isExit?: boolean;
  icon?: string;
}

export interface GuideTopic {
  id: string;
  title: string;
  content: GuideContentSection[];
  navigationOptions: NavigationOption[];
}

export default class GuideNPC extends Phaser.Physics.Arcade.Sprite {
  protected nameLabel!: Phaser.GameObjects.Text;
  protected shoutOutText!: Phaser.GameObjects.Text;
  protected networkMonitor: NetworkMonitor;
  protected currentDialog: any = null;
  protected currentTopic: string = 'welcome';
  protected conversationHistory: string[] = [];
  protected guideTopics: GuideTopic[] = [];
  protected npcName: string = "Guide NPC";
  protected npcAvatar: string = "npc_guide_avatar";

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setDepth(1);

    // Get network monitor instance
    this.networkMonitor = NetworkMonitor.getInstance(scene);
    
    // Register for network status change notifications
    this.networkMonitor.addNetworkStatusChangeListener(() => {
      // Trigger a shout when network status changes
      this.triggerNetworkStatusShout();
    });
  }

  protected initializeGuideTopics(): void {
    // This method should be overridden by subclasses to define their topics
    this.guideTopics = [];
  }

  protected getTopicById(topicId: string): GuideTopic | undefined {
    return this.guideTopics.find(topic => topic.id === topicId);
  }

  public interact() {
    // Check network connectivity before allowing interactions
    if (!this.networkMonitor.getIsOnline()) {
      console.log(`${this.npcName}: Network offline - showing offline message`);
      this.showOfflineDialog();
      return;
    }
    
    const player = this.getClosestPlayer();

    if (player) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      console.log(`${this.npcName}: Distance to player:`, distance);

      if (distance <= 100) {
        console.log(`${this.npcName}: Showing dialog`);
        this.showTopic(this.currentTopic);
      } else {
        console.log(`${this.npcName}: Player too far away`);
      }
    }
  }

  protected showOfflineDialog(): void {
    const offlineDialogData: OptimizedRewardDialogData = {
      npcName: this.npcName,
      npcAvatar: this.npcAvatar,
      rewardMessage: "🚫 Network connection lost! Please check your internet connection to continue playing.",
      rewardAmount: 0,
      onClose: () => {
        this.currentDialog = null;
      }
    };

    const dialog = showOptimizedRewardDialog(this.scene, offlineDialogData);
    this.currentDialog = dialog;
  }

  protected showTopic(topicId: string): void {
    const topic = this.getTopicById(topicId);
    if (!topic) {
      console.error(`${this.npcName}: Topic ${topicId} not found`);
      return;
    }

    // Add to conversation history (unless it's back navigation)
    if (!this.conversationHistory.includes(topicId) && topicId !== 'goodbye') {
      this.conversationHistory.push(this.currentTopic);
    }
    
    this.currentTopic = topicId;

    // Format content for display
    let contentText = "";
    topic.content.forEach(section => {
      switch (section.type) {
        case 'tip':
          contentText += `💡 TIP: ${section.content}\n\n`;
          break;
        case 'warning':
          contentText += `⚠️ WARNING: ${section.content}\n\n`;
          break;
        case 'example':
          contentText += `📝 EXAMPLE: ${section.content}\n\n`;
          break;
        default:
          contentText += `${section.content}\n\n`;
      }
    });

    // Use the new conversation dialog
    const conversationDialogData: GuideConversationDialogData = {
      npcName: this.npcName,
      npcAvatar: this.npcAvatar,
      title: topic.title,
      content: contentText,
      navigationOptions: topic.navigationOptions.map(option => ({
        text: option.text,
        icon: option.icon
      })),
      onOptionSelected: (_selectedOption: string, optionIndex: number) => {
        this.handleNavigationSelection(topic, optionIndex);
      },
      onClose: () => {
        this.currentDialog = null;
      }
    };

    const dialog = showGuideConversationDialog(this.scene, conversationDialogData);
    this.currentDialog = dialog;
  }

  protected handleNavigationSelection(topic: GuideTopic, optionIndex: number): void {
    const selectedOption = topic.navigationOptions[optionIndex];
    if (selectedOption) {
      if (selectedOption.isExit || selectedOption.targetTopic === 'goodbye') {
        this.navigateToTopic('goodbye');
      } else if (selectedOption.isMainMenu) {
        this.navigateToTopic('mainmenu');
      } else if (selectedOption.isBack) {
        this.navigateToTopic('back');
      } else {
        this.navigateToTopic(selectedOption.targetTopic);
      }
    }
    // Reset currentDialog to allow re-interaction
    this.currentDialog = null;
  }

  protected navigateToTopic(topicId: string): void {
    if (topicId === 'back') {
      // Go back to the previous topic
      if (this.conversationHistory.length > 0) {
        const previousTopic = this.conversationHistory.pop() || 'welcome';
        this.showTopic(previousTopic);
      } else {
        this.showTopic('welcome');
      }
    } else if (topicId === 'mainmenu') {
      // Clear history and go to main menu
      this.conversationHistory = [];
      this.showTopic('welcome');
    } else if (topicId === 'exit' || topicId === 'goodbye') {
      // Show goodbye message
      this.showGoodbye();
    } else {
      // Navigate to the specified topic
      this.showTopic(topicId);
    }
  }

  protected showGoodbye(): void {
    const goodbyeDialogData: OptimizedRewardDialogData = {
      npcName: this.npcName,
      npcAvatar: this.npcAvatar,
      rewardMessage: "Thanks for stopping by! I'll be here if you need any more help. Remember, you can always press G to open the full Guide Book! ✨",
      rewardAmount: 0,
      onClose: () => {
        this.currentDialog = null;
        this.currentTopic = 'welcome';
        this.conversationHistory = [];
      }
    };

    const dialog = showOptimizedRewardDialog(this.scene, goodbyeDialogData);
    this.currentDialog = dialog;
  }

  /**
   * Show shortcut keys using the simplified OptimizedGuideDialog
   * @param title The title for the dialog
   * @param content The content to display
   * @param options The options to show (typically just "OK" or "Got it!")
   */
  protected showShortcutKeys(title: string, content: string, options: string[] = ["Got it!"]): void {
    const shortcutDialogData: OptimizedGuideDialogData = {
      npcName: this.npcName,
      npcAvatar: this.npcAvatar,
      title: title,
      content: content,
      options: options,
      onOptionSelected: (_selectedOption: string, _optionIndex: number) => {
        this.currentDialog = null;
      },
      onClose: () => {
        this.currentDialog = null;
      }
    };

    const dialog = showOptimizedGuideDialog(this.scene, shortcutDialogData);
    this.currentDialog = dialog;
  }

  protected getClosestPlayer(): Phaser.Physics.Arcade.Sprite | null {
    let closestPlayer = null;
    let minDistance = Number.MAX_VALUE;

    this.scene.children.each((child) => {
      if (child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key.includes("player")) {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestPlayer = child;
        }
      }
    });

    return closestPlayer;
  }

  protected triggerNetworkStatusShout(): void {
    // This should be overridden by subclasses
    let message: string;
    
    if (!this.networkMonitor.getIsOnline()) {
      message = `🚨 Network connection lost! ${this.npcName}'s guidance disabled! 🚫`;
    } else {
      message = `✅ Network connection restored! ${this.npcName}'s guidance available! 🌐`;
    }
    
    this.showShout(message);
  }

  protected showShout(message: string): void {
    if (this.shoutOutText) {
      this.shoutOutText.setText(message).setAlpha(1);

      this.scene.tweens.add({
        targets: this.shoutOutText,
        alpha: 0,
        duration: 2000,
        delay: 3000,
      });
    }
  }
  
  /**
   * Check if player has enough stamina to interact with this NPC
   * @returns true if player has enough stamina, false otherwise
   */
  protected checkPlayerStamina(): boolean {
    // Try to get PlayerManager from the scene
    let playerManager = null;
    
    // First try to get it directly from the scene
    if (this.scene && (this.scene as any).playerManager) {
      playerManager = (this.scene as any).playerManager;
    } else {
      // Try to get it from the GameScene
      try {
        const gameScene = this.scene.game.scene.getScene('GameScene');
        if (gameScene && (gameScene as any).playerManager) {
          playerManager = (gameScene as any).playerManager;
        }
      } catch (e) {
        console.warn('GuideNPC: Could not access GameScene to get playerManager', e);
      }
    }
    
    // If we have access to PlayerManager, check stamina
    if (playerManager && typeof playerManager.getCurrentStamina === 'function') {
      const currentStamina = playerManager.getCurrentStamina();
      console.log(`📱 GuideNPC: Current stamina is ${currentStamina}`);
      
      if (currentStamina < 10) {
        console.log('❌ GuideNPC: Not enough stamina to interact with NPC (minimum 10 required)');
        // Show UI feedback to player about insufficient stamina
        if (typeof playerManager.showStaminaLowFeedback === 'function') {
          playerManager.showStaminaLowFeedback();
        }
        return false;
      }
      return true;
    } else {
      console.warn('❌ GuideNPC: Could not access PlayerManager for stamina check');
      // If we can't check stamina, allow interaction (fail open)
      return true;
    }
  }

  // Cleanup method
  public destroy(fromScene?: boolean): void {
    if (this.nameLabel) this.nameLabel.destroy();
    if (this.shoutOutText) this.shoutOutText.destroy();
    super.destroy(fromScene);
  }
}