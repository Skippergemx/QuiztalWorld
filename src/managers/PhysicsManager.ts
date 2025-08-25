import Phaser from 'phaser';

interface PhysicsConfig {
  worldBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  gravity: {
    x: number;
    y: number;
  };
}

interface LayerInfo {
  name: string;
  layer: Phaser.Tilemaps.TilemapLayer;
  hasCollision: boolean;
}

export default class PhysicsManager {
  private scene: Phaser.Scene;
  private tilemap?: Phaser.Tilemaps.Tilemap;
  private layers: Map<string, LayerInfo> = new Map();
  private collisionLayers: Phaser.Tilemaps.TilemapLayer[] = [];
  private static instance: PhysicsManager;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public static getInstance(scene: Phaser.Scene): PhysicsManager {
    if (!PhysicsManager.instance) {
      PhysicsManager.instance = new PhysicsManager(scene);
    }
    PhysicsManager.instance.scene = scene;
    return PhysicsManager.instance;
  }

  /**
   * Initialize the physics world and set up tilemap layers
   */
  public initializePhysicsWorld(tilemap: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset): void {
    console.log('⚡ PhysicsManager: Initializing physics world...');
    
    this.tilemap = tilemap;
    this.setupWorldBounds(tilemap);
    this.createLayers(tilemap, tileset);
    this.setupLayerCollisions();
    
    console.log('✅ PhysicsManager: Physics world initialized successfully');
  }

  /**
   * Set up world bounds based on tilemap size
   */
  public setupWorldBounds(tilemap: Phaser.Tilemaps.Tilemap): void {
    console.log('🌍 PhysicsManager: Setting up world bounds...');
    
    this.scene.physics.world.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels);
    
    console.log(`✅ PhysicsManager: World bounds set to ${tilemap.widthInPixels} x ${tilemap.heightInPixels}`);
  }

  /**
   * Create all tilemap layers
   */
  public createLayers(tilemap: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset): void {
    console.log('🏗️ PhysicsManager: Creating tilemap layers...');
    
    const layerNames = [
      'Ground',
      'Furniture', 
      'Deco Furniture',
      'Bushes',
      'Houses'
    ];

    layerNames.forEach((layerName, index) => {
      try {
        const layer = tilemap.createLayer(layerName, tileset);
        
        if (layer) {
          // Set depth for proper rendering order
          layer.setDepth(index);
          
          const layerInfo: LayerInfo = {
            name: layerName,
            layer: layer,
            hasCollision: layerName !== 'Ground' // Ground typically doesn't have collision
          };
          
          this.layers.set(layerName, layerInfo);
          
          if (layerInfo.hasCollision) {
            this.collisionLayers.push(layer);
          }
          
          console.log(`✅ PhysicsManager: Created layer '${layerName}' (depth: ${index}, collision: ${layerInfo.hasCollision})`);
        } else {
          console.warn(`⚠️ PhysicsManager: Failed to create layer '${layerName}'`);
        }
      } catch (error) {
        console.error(`❌ PhysicsManager: Error creating layer '${layerName}':`, error);
      }
    });
  }

  /**
   * Set up collision properties for all layers
   */
  public setupLayerCollisions(): void {
    console.log('💥 PhysicsManager: Setting up layer collisions...');
    
    let collisionCount = 0;
    
    this.layers.forEach((layerInfo, layerName) => {
      if (layerInfo.hasCollision) {
        try {
          layerInfo.layer.setCollisionByProperty({ collides: true });
          collisionCount++;
          console.log(`✅ PhysicsManager: Set collision for '${layerName}'`);
        } catch (error) {
          console.error(`❌ PhysicsManager: Error setting collision for '${layerName}':`, error);
        }
      }
    });
    
    console.log(`✅ PhysicsManager: Set up collisions for ${collisionCount} layers`);
  }

  /**
   * Add player collisions with all collision layers
   */
  public setupPlayerCollisions(player: Phaser.Physics.Arcade.Sprite): void {
    console.log('👤 PhysicsManager: Setting up player collisions...');
    
    let colliderCount = 0;
    
    this.collisionLayers.forEach((layer) => {
      try {
        this.scene.physics.add.collider(player, layer);
        colliderCount++;
      } catch (error) {
        console.error('❌ PhysicsManager: Error adding player collider:', error);
      }
    });
    
    console.log(`✅ PhysicsManager: Added ${colliderCount} player colliders`);
  }

  /**
   * Add NPC collisions with all collision layers
   */
  public setupNPCCollisions(npc: Phaser.Physics.Arcade.Sprite): void {
    this.collisionLayers.forEach((layer) => {
      try {
        this.scene.physics.add.collider(npc, layer);
      } catch (error) {
        console.error('❌ PhysicsManager: Error adding NPC collider:', error);
      }
    });
  }

  /**
   * Add pet collisions with all collision layers  
   */
  public setupPetCollisions(pet: Phaser.Physics.Arcade.Sprite): void {
    this.collisionLayers.forEach((layer) => {
      try {
        this.scene.physics.add.collider(pet, layer);
      } catch (error) {
        console.error('❌ PhysicsManager: Error adding pet collider:', error);
      }
    });
  }

  /**
   * Create a collision between two physics objects
   */
  public addCollision(objectA: Phaser.Physics.Arcade.Sprite, objectB: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.collider(objectA, objectB);
  }

  /**
   * Create an overlap detection between two physics objects
   */
  public addOverlap(
    objectA: Phaser.Physics.Arcade.Sprite, 
    objectB: Phaser.Physics.Arcade.Sprite,
    callback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    processCallback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    callbackContext?: any
  ): Phaser.Physics.Arcade.Collider {
    return this.scene.physics.add.overlap(objectA, objectB, callback, processCallback, callbackContext);
  }

  /**
   * Get a specific layer by name
   */
  public getLayer(layerName: string): Phaser.Tilemaps.TilemapLayer | null {
    const layerInfo = this.layers.get(layerName);
    return layerInfo ? layerInfo.layer : null;
  }

  /**
   * Get all layers
   */
  public getAllLayers(): Map<string, LayerInfo> {
    return this.layers;
  }

  /**
   * Get all collision layers
   */
  public getCollisionLayers(): Phaser.Tilemaps.TilemapLayer[] {
    return this.collisionLayers;
  }

  /**
   * Check if a position is within world bounds
   */
  public isPositionInBounds(x: number, y: number): boolean {
    if (!this.tilemap) return false;
    
    return x >= 0 && 
           x <= this.tilemap.widthInPixels && 
           y >= 0 && 
           y <= this.tilemap.heightInPixels;
  }

  /**
   * Get world dimensions
   */
  public getWorldDimensions(): { width: number; height: number } {
    if (!this.tilemap) {
      return { width: 0, height: 0 };
    }
    
    return {
      width: this.tilemap.widthInPixels,
      height: this.tilemap.heightInPixels
    };
  }

  /**
   * Enable or disable physics for an object
   */
  public setPhysicsEnabled(object: Phaser.GameObjects.GameObject, enabled: boolean): void {
    if (object instanceof Phaser.Physics.Arcade.Sprite && object.body) {
      object.body.enable = enabled;
    }
  }

  /**
   * Set object to be immovable (won't be affected by collisions)
   */
  public setImmovable(object: Phaser.Physics.Arcade.Sprite, immovable: boolean = true): void {
    if (object.body) {
      object.setImmovable(immovable);
    }
  }

  /**
   * Set world bounds collision for an object
   */
  public setWorldBoundsCollision(object: Phaser.Physics.Arcade.Sprite, collide: boolean = true): void {
    object.setCollideWorldBounds(collide);
  }

  /**
   * Update physics configuration
   */
  public updatePhysicsConfig(config: Partial<PhysicsConfig>): void {
    if (config.worldBounds) {
      this.scene.physics.world.setBounds(
        config.worldBounds.x,
        config.worldBounds.y,
        config.worldBounds.width,
        config.worldBounds.height
      );
    }

    if (config.gravity) {
      this.scene.physics.world.gravity.x = config.gravity.x;
      this.scene.physics.world.gravity.y = config.gravity.y;
    }
  }

  /**
   * Check if two objects are colliding
   */
  public areObjectsColliding(objectA: Phaser.Physics.Arcade.Sprite, objectB: Phaser.Physics.Arcade.Sprite): boolean {
    return this.scene.physics.overlap(objectA, objectB);
  }

  /**
   * Get distance between two physics objects
   */
  public getDistanceBetween(objectA: Phaser.Physics.Arcade.Sprite, objectB: Phaser.Physics.Arcade.Sprite): number {
    return Phaser.Math.Distance.Between(objectA.x, objectA.y, objectB.x, objectB.y);
  }

  /**
   * Check if object is within range of another object
   */
  public isInRange(objectA: Phaser.Physics.Arcade.Sprite, objectB: Phaser.Physics.Arcade.Sprite, range: number): boolean {
    return this.getDistanceBetween(objectA, objectB) <= range;
  }

  /**
   * Validate physics setup
   */
  public validatePhysicsSetup(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if tilemap exists
    if (!this.tilemap) {
      issues.push('Tilemap not initialized');
    }

    // Check if layers are created
    if (this.layers.size === 0) {
      issues.push('No layers created');
    }

    // Check if collision layers exist
    if (this.collisionLayers.length === 0) {
      issues.push('No collision layers found');
    }

    // Check world bounds
    const worldBounds = this.scene.physics.world.bounds;
    if (worldBounds.width <= 0 || worldBounds.height <= 0) {
      issues.push('Invalid world bounds');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get debug information about physics setup
   */
  public getDebugInfo(): any {
    const worldBounds = this.scene.physics.world.bounds;
    
    return {
      tilemapExists: !!this.tilemap,
      worldBounds: {
        x: worldBounds.x,
        y: worldBounds.y,
        width: worldBounds.width,
        height: worldBounds.height
      },
      layerCount: this.layers.size,
      collisionLayerCount: this.collisionLayers.length,
      layers: Array.from(this.layers.entries()).map(([name, info]) => ({
        name,
        hasCollision: info.hasCollision,
        depth: info.layer.depth
      })),
      gravity: {
        x: this.scene.physics.world.gravity.x,
        y: this.scene.physics.world.gravity.y
      }
    };
  }

  /**
   * Clean up physics resources
   */
  public destroy(): void {
    console.log('🧹 PhysicsManager: Cleaning up physics resources...');
    
    this.layers.clear();
    this.collisionLayers = [];
    this.tilemap = undefined;
    PhysicsManager.instance = null as any;
    
    console.log('✅ PhysicsManager: Cleanup complete');
  }
}