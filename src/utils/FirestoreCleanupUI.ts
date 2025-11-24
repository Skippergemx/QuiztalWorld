/**
 * Firestore Cleanup UI Component
 * 
 * This component provides a simple UI for clearing Firestore data during development.
 * It should only be used in development environments.
 */

export class FirestoreCleanupUI {
  private container!: HTMLElement;
  private playerIdInput!: HTMLInputElement;
  private statusElement!: HTMLElement;

  constructor() {
    this.createUI();
  }

  private createUI(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '10px';
    this.container.style.right = '10px';
    this.container.style.backgroundColor = '#f0f0f0';
    this.container.style.padding = '10px';
    this.container.style.border = '1px solid #ccc';
    this.container.style.borderRadius = '5px';
    this.container.style.zIndex = '10000';
    this.container.style.fontFamily = 'Arial, sans-serif';
    this.container.style.fontSize = '12px';
    this.container.style.maxWidth = '300px';

    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Firestore Cleanup';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#333';
    this.container.appendChild(title);

    // Create player ID input
    const idLabel = document.createElement('label');
    idLabel.textContent = 'Player ID:';
    idLabel.style.display = 'block';
    idLabel.style.marginBottom = '5px';
    this.container.appendChild(idLabel);

    this.playerIdInput = document.createElement('input');
    this.playerIdInput.type = 'text';
    this.playerIdInput.placeholder = 'Enter player ID';
    this.playerIdInput.style.width = '100%';
    this.playerIdInput.style.padding = '5px';
    this.playerIdInput.style.marginBottom = '10px';
    this.playerIdInput.style.boxSizing = 'border-box';
    this.container.appendChild(this.playerIdInput);

    // Create buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '5px';
    this.container.appendChild(buttonContainer);

    // Clear Inventory button
    const clearInventoryBtn = document.createElement('button');
    clearInventoryBtn.textContent = 'Clear Inventory';
    clearInventoryBtn.style.padding = '8px';
    clearInventoryBtn.style.backgroundColor = '#ff6b6b';
    clearInventoryBtn.style.color = 'white';
    clearInventoryBtn.style.border = 'none';
    clearInventoryBtn.style.borderRadius = '3px';
    clearInventoryBtn.style.cursor = 'pointer';
    clearInventoryBtn.addEventListener('click', () => this.clearInventory());
    buttonContainer.appendChild(clearInventoryBtn);

    // Clear All Data button
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = 'Clear All Player Data';
    clearAllBtn.style.padding = '8px';
    clearAllBtn.style.backgroundColor = '#ff4757';
    clearAllBtn.style.color = 'white';
    clearAllBtn.style.border = 'none';
    clearAllBtn.style.borderRadius = '3px';
    clearAllBtn.style.cursor = 'pointer';
    clearAllBtn.addEventListener('click', () => this.clearAllData());
    buttonContainer.appendChild(clearAllBtn);

    // Status element
    this.statusElement = document.createElement('div');
    this.statusElement.style.marginTop = '10px';
    this.statusElement.style.padding = '5px';
    this.statusElement.style.borderRadius = '3px';
    this.statusElement.style.display = 'none';
    this.container.appendChild(this.statusElement);

    // Add to document
    document.body.appendChild(this.container);
  }

  private async clearInventory(): Promise<void> {
    const playerId = this.playerIdInput.value.trim();
    if (!playerId) {
      this.showStatus('Please enter a player ID', 'error');
      return;
    }

    this.showStatus('Clearing inventory...', 'info');
    
    try {
      // Dynamically import the cleanup function to avoid bundling it in production
      const { clearPlayerInventory } = await import('./DatabaseCleanup');
      await clearPlayerInventory(playerId);
      this.showStatus('Inventory cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing inventory:', error);
      this.showStatus(`Error: ${(error as Error).message}`, 'error');
    }
  }

  private async clearAllData(): Promise<void> {
    const playerId = this.playerIdInput.value.trim();
    if (!playerId) {
      this.showStatus('Please enter a player ID', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to clear ALL data for player ${playerId}? This cannot be undone.`)) {
      return;
    }

    this.showStatus('Clearing all player data...', 'info');
    
    try {
      // Dynamically import the cleanup function to avoid bundling it in production
      const { clearAllPlayerData } = await import('./DatabaseCleanup');
      await clearAllPlayerData(playerId);
      this.showStatus('All player data cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing all data:', error);
      this.showStatus(`Error: ${(error as Error).message}`, 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    this.statusElement.textContent = message;
    this.statusElement.style.display = 'block';

    switch (type) {
      case 'success':
        this.statusElement.style.backgroundColor = '#d4edda';
        this.statusElement.style.color = '#155724';
        this.statusElement.style.border = '1px solid #c3e6cb';
        break;
      case 'error':
        this.statusElement.style.backgroundColor = '#f8d7da';
        this.statusElement.style.color = '#721c24';
        this.statusElement.style.border = '1px solid #f5c6cb';
        break;
      case 'info':
        this.statusElement.style.backgroundColor = '#d1ecf1';
        this.statusElement.style.color = '#0c5460';
        this.statusElement.style.border = '1px solid #bee5eb';
        break;
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.statusElement.style.display = 'none';
    }, 5000);
  }

  // Method to remove the UI (useful for cleanup)
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Only initialize in development environment
if (import.meta.env.DEV) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new FirestoreCleanupUI();
    });
  } else {
    new FirestoreCleanupUI();
  }
}