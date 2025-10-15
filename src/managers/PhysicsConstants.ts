class PhysicsConstants {
  // Layer names
  public static readonly LAYER_GROUND = 'Ground';
  public static readonly LAYER_FURNITURE = 'Furniture';
  public static readonly LAYER_DECO_FURNITURE = 'Deco Furniture';
  public static readonly LAYER_BUSHES = 'Bushes';
  public static readonly LAYER_HOUSES = 'Houses';

  // Layer configuration
  public static readonly LAYER_CONFIG = {
    [PhysicsConstants.LAYER_GROUND]: { depth: 0, hasCollision: false },
    [PhysicsConstants.LAYER_FURNITURE]: { depth: 1, hasCollision: true },
    [PhysicsConstants.LAYER_DECO_FURNITURE]: { depth: 2, hasCollision: true },
    [PhysicsConstants.LAYER_BUSHES]: { depth: 3, hasCollision: true },
    [PhysicsConstants.LAYER_HOUSES]: { depth: 4, hasCollision: true }
  };

  // Default gravity values
  public static readonly DEFAULT_GRAVITY = {
    x: 0,
    y: 0
  };

  // Debug settings
  public static readonly ENABLE_DEBUG_LOGS = false; // Set to true for debug logs
}

export { PhysicsConstants };