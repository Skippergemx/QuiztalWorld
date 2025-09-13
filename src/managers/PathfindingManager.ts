import Phaser from 'phaser';

interface Node {
  x: number;
  y: number;
  f: number;
  g: number;
  h: number;
  parent?: Node;
}

interface Point {
  x: number;
  y: number;
}

export default class PathfindingManager {
  private tilemap: Phaser.Tilemaps.Tilemap;
  private collisionLayers: Phaser.Tilemaps.TilemapLayer[];
  private tileSize: number;

  constructor(tilemap: Phaser.Tilemaps.Tilemap, collisionLayers: Phaser.Tilemaps.TilemapLayer[]) {
    this.tilemap = tilemap;
    this.collisionLayers = collisionLayers;
    this.tileSize = tilemap.tileWidth;
  }

  /**
   * Find a path between two points using A* algorithm
   * @param startX Start X position in world coordinates
   * @param startY Start Y position in world coordinates
   * @param endX End X position in world coordinates
   * @param endY End Y position in world coordinates
   * @returns Array of points representing the path, or null if no path found
   */
  public findPath(startX: number, startY: number, endX: number, endY: number): Point[] | null {
    console.log(`🔍 PathfindingManager: Finding path from (${startX}, ${startY}) to (${endX}, ${endY})`);
    
    // Convert world coordinates to tile coordinates
    const startTileX = Math.floor(startX / this.tileSize);
    const startTileY = Math.floor(startY / this.tileSize);
    const endTileX = Math.floor(endX / this.tileSize);
    const endTileY = Math.floor(endY / this.tileSize);
    
    console.log(`🔍 PathfindingManager: Tile coordinates from (${startTileX}, ${startTileY}) to (${endTileX}, ${endTileY})`);

    // Check if start or end positions are blocked
    if (this.isTileBlocked(startTileX, startTileY) || this.isTileBlocked(endTileX, endTileY)) {
      console.warn('🔍 PathfindingManager: Start or end position is blocked');
      return null;
    }

    // If start and end are the same tile, return a direct path
    if (startTileX === endTileX && startTileY === endTileY) {
      console.log('🔍 PathfindingManager: Start and end are the same tile, returning direct path');
      return [{ x: endX, y: endY }];
    }

    // Initialize open and closed lists
    const openList: Node[] = [];
    const closedList: Node[] = [];

    // Create start node
    const startNode: Node = {
      x: startTileX,
      y: startTileY,
      f: 0,
      g: 0,
      h: 0
    };

    openList.push(startNode);

    // A* algorithm
    while (openList.length > 0) {
      // Get node with lowest f cost
      let currentNode = openList[0];
      let currentIndex = 0;

      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i];
          currentIndex = i;
        }
      }

      // Remove current node from open list and add to closed list
      openList.splice(currentIndex, 1);
      closedList.push(currentNode);

      // Check if we've reached the target
      if (currentNode.x === endTileX && currentNode.y === endTileY) {
        console.log('🔍 PathfindingManager: Found path to target');
        // Reconstruct path
        const path: Point[] = [];
        let current: Node | undefined = currentNode;

        while (current) {
          // Convert tile coordinates back to world coordinates (center of tile)
          path.push({
            x: (current.x + 0.5) * this.tileSize,
            y: (current.y + 0.5) * this.tileSize
          });
          current = current.parent;
        }

        // Return reversed path (from start to end)
        console.log(`🔍 PathfindingManager: Path has ${path.length} points`);
        return path.reverse();
      }

      // Generate neighbors (8 directions: N, S, E, W, NE, NW, SE, SW)
      const neighbors = [
        { x: 0, y: -1 }, // North
        { x: 0, y: 1 },  // South
        { x: -1, y: 0 }, // West
        { x: 1, y: 0 },  // East
        { x: -1, y: -1 }, // Northwest
        { x: 1, y: -1 },  // Northeast
        { x: -1, y: 1 },  // Southwest
        { x: 1, y: 1 }   // Southeast
      ];

      for (const neighbor of neighbors) {
        const neighborX = currentNode.x + neighbor.x;
        const neighborY = currentNode.y + neighbor.y;

        // Check if neighbor is within bounds
        if (neighborX < 0 || neighborX >= this.tilemap.width || neighborY < 0 || neighborY >= this.tilemap.height) {
          continue;
        }

        // Check if neighbor is blocked
        if (this.isTileBlocked(neighborX, neighborY)) {
          continue;
        }

        // Check if neighbor is in closed list
        if (closedList.some(node => node.x === neighborX && node.y === neighborY)) {
          continue;
        }

        // Calculate costs
        // For diagonal moves, we use 1.414 (sqrt(2)) as the cost
        const isDiagonal = neighbor.x !== 0 && neighbor.y !== 0;
        const moveCost = isDiagonal ? 1.414 : 1;
        
        const gCost = currentNode.g + moveCost;
        
        // Check if neighbor is already in open list with lower g cost
        const existingNodeIndex = openList.findIndex(node => node.x === neighborX && node.y === neighborY);
        if (existingNodeIndex !== -1) {
          if (gCost < openList[existingNodeIndex].g) {
            // Update existing node with better path
            openList[existingNodeIndex].g = gCost;
            openList[existingNodeIndex].f = gCost + openList[existingNodeIndex].h;
            openList[existingNodeIndex].parent = currentNode;
          }
          continue;
        }

        // Calculate heuristic (Manhattan distance)
        const hCost = Math.abs(neighborX - endTileX) + Math.abs(neighborY - endTileY);
        
        // Create new node
        const newNode: Node = {
          x: neighborX,
          y: neighborY,
          g: gCost,
          h: hCost,
          f: gCost + hCost,
          parent: currentNode
        };

        openList.push(newNode);
      }
    }

    // No path found
    console.log('🔍 PathfindingManager: No path found');
    return null;
  }

  /**
   * Check if a tile is blocked by collision layers
   * @param tileX X coordinate in tile coordinates
   * @param tileY Y coordinate in tile coordinates
   * @returns true if tile is blocked, false otherwise
   */
  private isTileBlocked(tileX: number, tileY: number): boolean {
    console.log(`🔍 PathfindingManager: Checking if tile (${tileX}, ${tileY}) is blocked`);
    
    // Check each collision layer
    for (const layer of this.collisionLayers) {
      const tile = layer.getTileAt(tileX, tileY);
      if (tile && tile.properties.collides) {
        console.log(`🔍 PathfindingManager: Tile (${tileX}, ${tileY}) is blocked by layer ${layer.layer.name}`);
        return true;
      }
    }
    
    console.log(`🔍 PathfindingManager: Tile (${tileX}, ${tileY}) is not blocked`);
    return false;
  }

  /**
   * Check if a world position is blocked
   * @param x X position in world coordinates
   * @param y Y position in world coordinates
   * @returns true if position is blocked, false otherwise
   */
  public isPositionBlocked(x: number, y: number): boolean {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    return this.isTileBlocked(tileX, tileY);
  }
}