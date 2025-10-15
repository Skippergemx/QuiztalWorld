  export interface DialogOption {
  text: string;
  nextDialog?: string;
}
export interface DialogStep {
  text: string;
  avatar?: string;
  options?: DialogOption[];
  isExitDialog?: boolean;
}

export interface Dialog {
  id: string;
  text?: string;
  avatar?: string;
  sequence?: DialogStep[];
  options?: DialogOption[];
  isExitDialog?: boolean;
}

export interface NPCDialogData {
  npcId: string;
  npcName: string;
  theme: string;
  description: string;
  shoutMessages: string[];
  networkOfflineMessages: string[];
  dialogs: { [key: string]: Dialog };
}

export class NPCDialogManager {
  private static instance: NPCDialogManager;
  private dialogData: Map<string, NPCDialogData> = new Map();
  private isReady: boolean = false;

  private constructor() {}

  public static getInstance(): NPCDialogManager {
    if (!NPCDialogManager.instance) {
      NPCDialogManager.instance = new NPCDialogManager();
    }
    return NPCDialogManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Load Mr Gemx dialog data
      await this.loadDialogData('mrgemx');
      this.isReady = true;
      console.log('NPCDialogManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NPCDialogManager:', error);
    }
  }

  private async loadDialogData(npcId: string): Promise<void> {
    try {
      const response = await fetch(`src/data/dialogs/npc-${npcId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load dialog data for ${npcId}: ${response.status}`);
      }
      
      const data: NPCDialogData = await response.json();
      this.dialogData.set(npcId, data);
      console.log(`Loaded dialog data for ${npcId}`);
    } catch (error) {
      console.error(`Error loading dialog data for ${npcId}:`, error);
      throw error;
    }
  }

  public getDialogData(npcId: string): NPCDialogData | null {
    return this.dialogData.get(npcId) || null;
  }

  public getDialog(npcId: string, dialogId: string): Dialog | null {
    const npcData = this.dialogData.get(npcId);
    if (!npcData) {
      console.error(`No dialog data found for NPC: ${npcId}`);
      return null;
    }

    const dialog = npcData.dialogs[dialogId];
    if (!dialog) {
      console.error(`No dialog found with ID: ${dialogId} for NPC: ${npcId}`);
      return null;
    }

    return dialog;
  }

  public getShoutMessages(npcId: string): string[] {
    const npcData = this.dialogData.get(npcId);
    return npcData?.shoutMessages || [];
  }

  public getNetworkOfflineMessages(npcId: string): string[] {
    const npcData = this.dialogData.get(npcId);
    return npcData?.networkOfflineMessages || [];
  }

  public isManagerReady(): boolean {
    return this.isReady;
  }
}