import Phaser from "phaser";

export class SimpleDialogBox {
  private scene: Phaser.Scene;
  private dialogContainer: Phaser.GameObjects.Container;
  private dialogText: Phaser.GameObjects.Text;
  private optionsContainer: Phaser.GameObjects.Container;
  private avatar: Phaser.GameObjects.Image;
  private boxWidth: number = 650;
  private boxHeight: number = 160;
  private currentDialogIndex: number = 0;
  private dialogData: {
    text: string;
    avatar?: string;
    isExitDialog?: boolean;
    options?: { text: string; callback: () => void }[];
  }[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.dialogContainer = scene.add.container(0, 0);

    scene.events.once('create', () => {
      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.on('cameramove', this.updatePosition, this);
        scene.cameras.main.on('scroll', this.updatePosition, this);
        scene.cameras.main.on('followupdate', this.updatePosition, this);
      }
    });

    this.updatePosition();
    this.dialogContainer.setDepth(1000);

    scene.events.on('shutdown', () => {
      if (scene.cameras && scene.cameras.main) {
        scene.cameras.main.off('cameramove', this.updatePosition);
        scene.cameras.main.off('scroll', this.updatePosition);
        scene.cameras.main.off('followupdate', this.updatePosition);
      }
    });

    const dialogBg = scene.add.graphics();
    dialogBg.fillStyle(0x002b36, 0.95);
    dialogBg.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, 20);
    dialogBg.lineStyle(4, 0x00ff00, 1);
    dialogBg.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, 20);
    this.dialogContainer.add(dialogBg);

    this.avatar = scene.add.image(70, this.boxHeight / 2, "npc_mintgirl_avatar")
      .setDisplaySize(90, 90)
      .setOrigin(0.5)
      .setVisible(false);
    this.dialogContainer.add(this.avatar);

    this.dialogText = scene.add.text(140, 20, "", {
      fontSize: "18px",
      fontFamily: "monospace",
      color: "#00ff00",
      wordWrap: { width: 440, useAdvancedWrap: true },
      align: "left",
      lineSpacing: 6,
      shadow: { offsetX: 2, offsetY: 2, color: "#003300", blur: 5, fill: true }
    });
    this.dialogContainer.add(this.dialogText);

    this.optionsContainer = scene.add.container(0, 0);
    this.dialogContainer.add(this.optionsContainer);

    this.dialogContainer.setVisible(false);
  }

  private updatePosition = () => {
    if (!this.scene?.cameras?.main || !this.dialogContainer) {
      return;
    }

    const camera = this.scene.cameras.main;
    const centerX = (camera.scrollX + camera.width / 2) || 0;
    const centerY = (camera.scrollY + camera.height / 2) || 0;

    this.dialogContainer.setPosition(
      centerX - this.boxWidth / 2,
      centerY - this.boxHeight / 2
    );
  };

  private setAvatar(textureKey: string) {
    if (this.scene.textures.exists(textureKey)) {
      this.avatar.setTexture(textureKey).setVisible(true);
      console.log(`Avatar set to: ${textureKey}`);
    } else {
      this.avatar.setVisible(false);
      console.log(`No texture found for avatar: ${textureKey}`);
    }
  }

  public showDialog(dialogData: {
    text: string;
    avatar?: string;
    isExitDialog?: boolean;
    options?: { text: string; callback: () => void }[];
  }[]) {
    if (!Array.isArray(dialogData) || dialogData.length === 0) {
      console.error("Invalid dialog data provided");
      return;
    }

    console.log("Dialog triggered", dialogData);

    this.dialogData = dialogData;
    this.currentDialogIndex = 0;

    this.updatePosition();

    this.dialogContainer.setAlpha(1);
    this.dialogContainer.setVisible(true);
    this.dialogContainer.setDepth(1000);

    const firstDialog = dialogData[0];
    if (firstDialog && firstDialog.avatar) {
      this.setAvatar(firstDialog.avatar);
    } else {
      this.avatar.setVisible(false);
    }

    this.displayNext();
  }

  private displayNext() {
    if (this.currentDialogIndex >= this.dialogData.length) {
      this.closeDialog();
      return;
    }

    const currentDialog = this.dialogData[this.currentDialogIndex];
    this.dialogText.setText(currentDialog.text);
    this.optionsContainer.removeAll(true);

    if (currentDialog.avatar) {
      this.setAvatar(currentDialog.avatar);
    } else {
      this.avatar.setVisible(false);
    }

    // If options are present
    if (currentDialog.options) {
      let yOffset = 50;
      currentDialog.options.forEach((option) => {
        const optionText = this.scene.add.text(140, this.dialogText.y + yOffset, `➡️ ${option.text}`, {
          fontSize: "16px",
          color: "#00ff00",
          fontFamily: "monospace",
          shadow: { offsetX: 2, offsetY: 2, color: "#003300", blur: 5, fill: true }
        })
        .setInteractive()
        .on("pointerdown", () => {
          console.log(`Option selected: ${option.text}`);
          option.callback();
          this.closeDialog();
        });

        this.optionsContainer.add(optionText);
        yOffset += 30;
      });
    } else {
      // Click-to-dismiss next dialog entry
      this.dialogContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.boxWidth, this.boxHeight), Phaser.Geom.Rectangle.Contains);
      this.dialogContainer.once("pointerdown", () => {
        this.dialogContainer.disableInteractive();
        this.currentDialogIndex++;
        this.displayNext();
      });
    }
  }

  private closeDialog() {
    console.log("Closing dialog");

    this.dialogContainer.setVisible(false);
    this.dialogContainer.setAlpha(1);
    this.avatar.setVisible(false);

    console.log("Dialog box instantly closed.");
  }

  public close() {
    this.closeDialog();
  }
}




export function showDialog(scene: Phaser.Scene, dialogData: {
  text: string;
  avatar?: string;
  isExitDialog?: boolean;
  options?: { text: string; callback: () => void }[];
}[]) {
  try {
    if (!scene || !scene.add) {
      console.error('Invalid scene provided to showDialog');
      return;
    }

    if (!Array.isArray(dialogData) || dialogData.length === 0) {
      console.error('Invalid or empty dialog data provided');
      return;
    }

    const dialog = new SimpleDialogBox(scene);
    dialog.showDialog(dialogData);

  } catch (error) {
    console.error('Error showing dialog:', error);
  }
}

