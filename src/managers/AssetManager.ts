import Phaser from 'phaser';

interface NPCAssetConfig {
  avatarKey: string;
  avatarPath: string;
  spriteKey: string;
  spritePath: string;
  frameWidth: number;
  frameHeight: number;
}

interface PlayerAssetConfig {
  character: string;
  walkPath: string;
  idlePath: string;
  frameWidth: number;
  frameHeight: number;
}

interface UIAssetConfig {
  key: string;
  path: string;
}

interface AudioAssetConfig {
  key: string;
  path: string;
}

export default class AssetManager {
  private scene: Phaser.Scene;
  private static instance: AssetManager;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public static getInstance(scene: Phaser.Scene): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager(scene);
    }
    AssetManager.instance.scene = scene;
    return AssetManager.instance;
  }

  /**
   * Load all game assets in organized groups
   */
  public loadAllAssets(): void {
    this.loadNPCAssets();
    this.loadPlayerAssets();
    this.loadUIAssets();
    this.loadAudioAssets();
    this.loadPetAssets();
  }

  /**
   * Load all NPC-related assets
   */
  private loadNPCAssets(): void {
    const npcConfigs: NPCAssetConfig[] = [
      {
        avatarKey: 'npc_huntboy_avatar',
        avatarPath: 'assets/npc/npc_huntboy_avatar.png',
        spriteKey: 'npc_huntboy',
        spritePath: 'assets/npc/npc_huntboy_idle_1.png',
        frameWidth: 32,
        frameHeight: 53
      },
      {
        avatarKey: 'npc_basesage_avatar',
        avatarPath: 'assets/npc/npc_basesage_avatar.png',
        spriteKey: 'base_sage',
        spritePath: 'assets/npc/npc_basesage_idle_1.png',
        frameWidth: 32,
        frameHeight: 64
      },
      {
        avatarKey: 'npc_mintgirl_avatar',
        avatarPath: 'assets/npc/npc_mintgirl_avatar.png',
        spriteKey: 'mint_girl',
        spritePath: 'assets/npc/npc_mintgirl_idle_1.png',
        frameWidth: 32,
        frameHeight: 53
      },
      {
        avatarKey: 'npc_mrgemx_avatar',
        avatarPath: 'assets/npc/npc_mrgemx_avatar.png',
        spriteKey: 'mr_gemx',
        spritePath: 'assets/npc/npc_mrgemx_idle_1.png',
        frameWidth: 32,
        frameHeight: 64
      },
      {
        avatarKey: 'npc_securitykai_avatar',
        avatarPath: 'assets/npc/npc_securitykai_avatar.png',
        spriteKey: 'securitykai',
        spritePath: 'assets/npc/npc_securitykai_idle_1.png',
        frameWidth: 32,
        frameHeight: 53
      },
      {
        avatarKey: 'npc_walletsafetyfriend_avatar',
        avatarPath: 'assets/npc/npc_walletsafetyfriend_avatar.png',
        spriteKey: 'wallet_safety_friend',
        spritePath: 'assets/npc/npc_walletsafetyfriend_idle_1.png',
        frameWidth: 32,
        frameHeight: 64
      },
      {
        avatarKey: 'npc_dexpertgal_avatar',
        avatarPath: 'assets/npc/npc_dexpertgal_avatar.png',
        spriteKey: 'dexpert_gal',
        spritePath: 'assets/npc/npc_dexpertgal_idle_1.png',
        frameWidth: 32,
        frameHeight: 64
      },
      {
        avatarKey: 'npc_nftcyn_avatar',
        avatarPath: 'assets/npc/npc_nftcyn_avatar.png',
        spriteKey: 'nft_cyn',
        spritePath: 'assets/npc/npc_nftcyn_idle_1.png',
        frameWidth: 32,
        frameHeight: 53
      },
      {
        avatarKey: 'npc_profchain_avatar',
        avatarPath: 'assets/npc/npc_profchain_avatar.png',
        spriteKey: 'prof_chain',
        spritePath: 'assets/npc/npc_profchain_idle_1.png',
        frameWidth: 32,
        frameHeight: 64
      },
      {
        avatarKey: 'npc_smartcontractguy_avatar',
        avatarPath: 'assets/npc/npc_smartcontractguy_avatar.png',
        spriteKey: 'smart_contract_guy',
        spritePath: 'assets/npc/npc_smartcontractguy_idle_1.png',
        frameWidth: 32,
        frameHeight: 64
      }
    ];

    // Load NPC assets
    npcConfigs.forEach(config => {
      this.scene.load.image(config.avatarKey, config.avatarPath);
      this.scene.load.spritesheet(config.spriteKey, config.spritePath, {
        frameWidth: config.frameWidth,
        frameHeight: config.frameHeight
      });
    });
  }

  /**
   * Load all player character assets
   */
  private loadPlayerAssets(): void {
    const characters = ['lsxd', 'penski', 'sarah', 'xander'];
    
    characters.forEach(character => {
      const walkConfig: PlayerAssetConfig = {
        character,
        walkPath: `assets/player/player_${character}_walk_1.png`,
        idlePath: `assets/player/player_${character}_idle_1.png`,
        frameWidth: 32,
        frameHeight: 53
      };

      this.scene.load.spritesheet(`player_${character}_walk_1`, walkConfig.walkPath, {
        frameWidth: walkConfig.frameWidth,
        frameHeight: walkConfig.frameHeight
      });

      this.scene.load.spritesheet(`player_${character}_idle_1`, walkConfig.idlePath, {
        frameWidth: walkConfig.frameWidth,
        frameHeight: walkConfig.frameHeight
      });
    });
  }

  /**
   * Load UI and control assets
   */
  private loadUIAssets(): void {
    const uiAssets: UIAssetConfig[] = [
      { key: 'joystick', path: 'assets/ui/joystick.png' },
      { key: 'joystick-base', path: 'assets/ui/joystick-base.png' },
      { key: 'button-interact', path: 'assets/ui/button-interact.png' }
    ];

    uiAssets.forEach(asset => {
      this.scene.load.image(asset.key, asset.path);
    });
  }

  /**
   * Load audio assets
   */
  private loadAudioAssets(): void {
    const audioAssets: AudioAssetConfig[] = [
      { key: 'moblin-giftbox', path: 'assets/audio/Moblin_giftbox.wav' }
    ];

    audioAssets.forEach(asset => {
      this.scene.load.audio(asset.key, asset.path);
    });
  }

  /**
   * Load pet-related assets
   */
  private loadPetAssets(): void {
    this.scene.load.spritesheet('moblin_walk', 'assets/pets/moblin_walk.png', {
      frameWidth: 32,
      frameHeight: 53
    });

    this.scene.load.spritesheet('moblin_idle', 'assets/pets/moblin_idle.png', {
      frameWidth: 32,
      frameHeight: 53
    });
  }

  /**
   * Get NPC asset configuration by NPC type
   */
  public getNPCAssetKeys(npcType: string): { avatarKey: string; spriteKey: string } | null {
    const assetMap: { [key: string]: { avatarKey: string; spriteKey: string } } = {
      'huntboy': { avatarKey: 'npc_huntboy_avatar', spriteKey: 'npc_huntboy' },
      'basesage': { avatarKey: 'npc_basesage_avatar', spriteKey: 'base_sage' },
      'mintgirl': { avatarKey: 'npc_mintgirl_avatar', spriteKey: 'mint_girl' },
      'mrgemx': { avatarKey: 'npc_mrgemx_avatar', spriteKey: 'mr_gemx' },
      'securitykai': { avatarKey: 'npc_securitykai_avatar', spriteKey: 'securitykai' },
      'walletsafetyfriend': { avatarKey: 'npc_walletsafetyfriend_avatar', spriteKey: 'wallet_safety_friend' },
      'dexpertgal': { avatarKey: 'npc_dexpertgal_avatar', spriteKey: 'dexpert_gal' },
      'nftcyn': { avatarKey: 'npc_nftcyn_avatar', spriteKey: 'nft_cyn' },
      'profchain': { avatarKey: 'npc_profchain_avatar', spriteKey: 'prof_chain' },
      'smartcontractguy': { avatarKey: 'npc_smartcontractguy_avatar', spriteKey: 'smart_contract_guy' }
    };

    return assetMap[npcType.toLowerCase()] || null;
  }

  /**
   * Get player asset keys by character
   */
  public getPlayerAssetKeys(character: string): { walkKey: string; idleKey: string } {
    return {
      walkKey: `player_${character}_walk_1`,
      idleKey: `player_${character}_idle_1`
    };
  }

  /**
   * Check if all required assets are loaded
   */
  public areAssetsLoaded(): boolean {
    const requiredAssets = [
      'joystick',
      'joystick-base', 
      'button-interact',
      'moblin_walk',
      'moblin_idle',
      'moblin-giftbox'
    ];

    return requiredAssets.every(key => this.scene.textures.exists(key) || this.scene.cache.audio.exists(key));
  }

  /**
   * Preload validation - called after preload to ensure all assets loaded correctly
   */
  public validateAssets(): { success: boolean; missingAssets: string[] } {
    const missingAssets: string[] = [];
    const requiredTextures = [
      'joystick', 'joystick-base', 'button-interact',
      'moblin_walk', 'moblin_idle'
    ];
    const requiredAudio = ['moblin-giftbox'];

    // Check textures
    requiredTextures.forEach(key => {
      if (!this.scene.textures.exists(key)) {
        missingAssets.push(`texture: ${key}`);
      }
    });

    // Check audio
    requiredAudio.forEach(key => {
      if (!this.scene.cache.audio.exists(key)) {
        missingAssets.push(`audio: ${key}`);
      }
    });

    return {
      success: missingAssets.length === 0,
      missingAssets
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    AssetManager.instance = null as any;
  }
}