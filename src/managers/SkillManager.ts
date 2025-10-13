import Phaser from 'phaser';

export interface Skill {
  id: string;
  name: string;
  description: string;
  effects: string;
  cooldown?: number; // in seconds
  activationMethod: string;
  status: 'ready' | 'active' | 'cooldown' | 'locked';
  icon?: string; // Optional icon path
  requiredNFT?: string; // Optional NFT requirement
  lastUsed?: number; // Timestamp of last use
}

export default class SkillManager {
  private scene: Phaser.Scene;
  private skills: Skill[] = [];
  private static instance: SkillManager;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeSkills();
  }

  public static getInstance(scene: Phaser.Scene): SkillManager {
    if (!SkillManager.instance) {
      SkillManager.instance = new SkillManager(scene);
    }
    SkillManager.instance.scene = scene;
    return SkillManager.instance;
  }

  private initializeSkills(): void {
    // Initialize with the Speed Boost and Moblin Pet skills
    this.skills = [
      {
        id: 'speed-boost',
        name: '🚀 Speed Boost',
        description: 'Temporarily doubles your movement speed',
        effects: '2x movement speed for 10 seconds',
        cooldown: 30,
        activationMethod: 'Press \'N\' key',
        status: 'ready'
      },
      {
        id: 'moblin-pet',
        name: '🐾 Moblin Pet Power-Up',
        description: 'Summon your loyal Moblin companion',
        effects: 'Follows player, collects gift boxes for rewards',
        activationMethod: 'Automatic (when NFTs verified)',
        status: 'active',
        requiredNFT: 'Any Quiztal NFT'
      }
    ];
  }

  /**
   * Get all skills
   */
  public getSkills(): Skill[] {
    return [...this.skills]; // Return a copy to prevent external modification
  }

  /**
   * Get a specific skill by ID
   */
  public getSkillById(id: string): Skill | undefined {
    return this.skills.find(skill => skill.id === id);
  }

  /**
   * Update skill status
   */
  public updateSkillStatus(id: string, status: 'ready' | 'active' | 'cooldown' | 'locked'): void {
    const skill = this.getSkillById(id);
    if (skill) {
      skill.status = status;
      if (status === 'cooldown' && skill.cooldown) {
        skill.lastUsed = Date.now();
      }
    }
  }

  /**
   * Check if a skill is ready to use
   */
  public isSkillReady(id: string): boolean {
    const skill = this.getSkillById(id);
    if (!skill) return false;

    if (skill.status !== 'ready') {
      return false;
    }

    // Check cooldown if applicable
    if (skill.cooldown && skill.lastUsed) {
      const timeSinceLastUse = (Date.now() - skill.lastUsed) / 1000; // in seconds
      return timeSinceLastUse >= skill.cooldown;
    }

    return true;
  }

  /**
   * Use a skill
   */
  public useSkill(id: string): boolean {
    const skill = this.getSkillById(id);
    if (!skill) return false;

    if (this.isSkillReady(id)) {
      // Mark skill as on cooldown if it has one
      if (skill.cooldown) {
        this.updateSkillStatus(id, 'cooldown');
        // Set up cooldown timer to reset status
        this.scene.time.delayedCall(skill.cooldown * 1000, () => {
          this.updateSkillStatus(id, 'ready');
        });
      } else {
        // For permanent skills like the Moblin pet, mark as active
        this.updateSkillStatus(id, 'active');
      }
      return true;
    }
    return false;
  }

  /**
   * Add a new skill
   */
  public addSkill(skill: Skill): void {
    // Check if skill already exists
    if (!this.getSkillById(skill.id)) {
      this.skills.push(skill);
    }
  }

  /**
   * Remove a skill
   */
  public removeSkill(id: string): void {
    this.skills = this.skills.filter(skill => skill.id !== id);
  }

  /**
   * Get skill status text for display
   */
  public getSkillStatusText(id: string): string {
    const skill = this.getSkillById(id);
    if (!skill) return 'Unknown';

    switch (skill.status) {
      case 'ready':
        return '[Ready]';
      case 'active':
        return '[Active]';
      case 'cooldown':
        if (skill.cooldown && skill.lastUsed) {
          const timeSinceLastUse = (Date.now() - skill.lastUsed) / 1000; // in seconds
          const timeLeft = Math.max(0, skill.cooldown - timeSinceLastUse);
          return `[Cooldown: ${Math.ceil(timeLeft)}s]`;
        }
        return '[Cooldown]';
      case 'locked':
        return '[Locked]';
      default:
        return '[Unknown]';
    }
  }

  /**
   * Check if player has required NFT for a skill
   */
  public hasRequiredNFT(id: string): boolean {
    const skill = this.getSkillById(id);
    if (!skill || !skill.requiredNFT) return true; // No requirement means accessible to all

    // Check if player has NFTs
    const nftsStr = localStorage.getItem('quiztal-nfts');
    if (!nftsStr) return false;

    try {
      const nfts = JSON.parse(nftsStr);
      return nfts && nfts.length > 0;
    } catch (error) {
      console.error('Error parsing NFT data:', error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Don't nullify the instance to allow for recreation
    // Just reset the scene reference
    this.scene = null as any;
  }

  /**
   * Reset the singleton instance
   */
  public static resetInstance(): void {
    SkillManager.instance = null as any;
  }
}