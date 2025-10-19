import Phaser from "phaser";

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private scene: Phaser.Scene;
  private isOnline: boolean = navigator.onLine;
  private networkStatusText: Phaser.GameObjects.Text | null = null;
  private networkStatusContainer: Phaser.GameObjects.Container | null = null;
  private checkInterval: number = 5000; // Check every 5 seconds
  private checkTimer: Phaser.Time.TimerEvent | null = null;
  private networkStatusChangeCallbacks: Array<() => void> = [];
  
  // Properly store references to event listener functions
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  
  // Track if we're showing online confirmation
  private showingOnlineConfirmation: boolean = false;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupEventListeners();
    this.startConnectivityChecks();
  }

  public static getInstance(scene: Phaser.Scene): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor(scene);
    }
    return NetworkMonitor.instance;
  }
  
private setupEventListeners() {
  // Store references to the event listener functions
  this.onlineHandler = () => {
    this.isOnline = true;
    this.updateNetworkStatusUI();
    this.notifyNetworkStatusChange();
  };

  this.offlineHandler = () => {
    this.isOnline = false;
    this.updateNetworkStatusUI();
    this.notifyNetworkStatusChange();
  };

  window.addEventListener('online', this.onlineHandler);
  window.addEventListener('offline', this.offlineHandler);
}

  private startConnectivityChecks() {
    // Periodic connectivity check
    this.checkTimer = this.scene.time.addEvent({
      delay: this.checkInterval,
      callback: this.checkConnectivity,
      callbackScope: this,
      loop: true
    });
  }

  private async checkConnectivity() {
    // Use multiple fallback endpoints for better reliability
    const endpoints = [
      'https://httpbin.org/get',
      'https://www.google.com',
      'https://1.1.1.1'
    ];

    let isReachable = false;
    
    for (const endpoint of endpoints) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 3000);
        });
        
        const fetchPromise = fetch(endpoint, {
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        if (response.ok) {
          isReachable = true;
          break;
        }
      } catch (error) {
        // Try next endpoint
        continue;
      }
    }
    
    if (isReachable !== this.isOnline) {
      this.isOnline = isReachable;
      this.updateNetworkStatusUI();
      this.notifyNetworkStatusChange();
    }
  }

  private updateNetworkStatusUI() {
    // Create or update network status UI
    if (!this.networkStatusContainer) {
      this.createNetworkStatusUI();
    }

    if (this.networkStatusText) {
      this.networkStatusText.setText(this.isOnline ? 'ONLINE' : 'OFFLINE');
      this.networkStatusText.setColor(this.isOnline ? '#00ff00' : '#ff0000');
    }

    if (this.networkStatusContainer) {
      // Show container briefly when coming online, always show when offline
      if (this.isOnline) {
        // Only show online confirmation if we were previously offline
        if (!this.showingOnlineConfirmation) {
          this.networkStatusContainer.setVisible(true);
          this.showingOnlineConfirmation = true;
          
          // Hide after 3 seconds
          this.scene.time.delayedCall(3000, () => {
            if (this.networkStatusContainer && this.getIsOnline()) {
              this.networkStatusContainer.setVisible(false);
              this.showingOnlineConfirmation = false;
            }
          });
        }
      } else {
        this.networkStatusContainer.setVisible(true);
        this.showingOnlineConfirmation = false;
      }
    }
  }

  private createNetworkStatusUI() {
    // Create a container for the network status indicator
    this.networkStatusContainer = this.scene.add.container(
      this.scene.scale.width - 100,
      50
    );

    // Background for the status indicator
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-60, -15, 120, 30, 5);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-60, -15, 120, 30, 5);

    // Status text
    this.networkStatusText = this.scene.add.text(0, 0, 'OFFLINE', {
      fontSize: '16px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add elements to container
    this.networkStatusContainer.add([bg, this.networkStatusText]);

    // Initially hide the container
    this.networkStatusContainer.setVisible(false);
  }
  
public getIsOnline(): boolean {
  return this.isOnline;
}

public addNetworkStatusChangeListener(callback: () => void): void {
  this.networkStatusChangeCallbacks.push(callback);
}

public removeNetworkStatusChangeListener(callback: () => void): void {
  const index = this.networkStatusChangeCallbacks.indexOf(callback);
  if (index !== -1) {
    this.networkStatusChangeCallbacks.splice(index, 1);
  }
}

private notifyNetworkStatusChange(): void {
  // Call all registered callbacks
  this.networkStatusChangeCallbacks.forEach((callback, index) => {
    try {
      callback();
    } catch (error) {
      console.error(`Error in network status change callback [${index}]:`, error);
    }
  });
}

public destroy() {
  // Clear the timer first
  if (this.checkTimer) {
    this.checkTimer.remove();
    this.checkTimer = null;
  }
  
  // Remove event listeners using the stored references
  if (this.onlineHandler) {
    window.removeEventListener('online', this.onlineHandler);
  }
  if (this.offlineHandler) {
    window.removeEventListener('offline', this.offlineHandler);
  }
  
  // Destroy UI elements
  if (this.networkStatusContainer) {
    this.networkStatusContainer.destroy();
    this.networkStatusContainer = null;
  }
  
  // Clear callbacks
  this.networkStatusChangeCallbacks = [];
  
  // Clear instance reference
  NetworkMonitor.instance = null as any;
}
}