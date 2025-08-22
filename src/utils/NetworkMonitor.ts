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
  window.addEventListener('online', () => {
    this.isOnline = true;
    this.updateNetworkStatusUI();
    this.notifyNetworkStatusChange();
  });

  window.addEventListener('offline', () => {
    this.isOnline = false;
    this.updateNetworkStatusUI();
    this.notifyNetworkStatusChange();
  });
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
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });
      
      // Create the fetch promise
      const fetchPromise = fetch('https://httpbin.org/get', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      // Race the promises to implement timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!response.ok) {
        throw new Error('Network response not ok');
      }
      
      // If we get here, we're online
      if (!this.isOnline) {
        this.isOnline = true;
        this.updateNetworkStatusUI();
        this.notifyNetworkStatusChange();
      }
    } catch (error) {
      // If we're already marked as offline, don't update UI again
      if (this.isOnline) {
        this.isOnline = false;
        this.updateNetworkStatusUI();
        this.notifyNetworkStatusChange();
      }
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
      this.networkStatusContainer.setVisible(!this.isOnline);
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
  this.networkStatusChangeCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error in network status change callback:', error);
    }
  });
}

public destroy() {
  if (this.checkTimer) {
    this.checkTimer.remove();
  }
  
  if (this.networkStatusContainer) {
    this.networkStatusContainer.destroy();
  }
  
  NetworkMonitor.instance = null as any;
}
}
