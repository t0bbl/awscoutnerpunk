import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Title
    this.add.text(centerX, centerY - 100, 'Tactical Game', {
      fontSize: '64px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Connection status
    const network = (window as any).network;
    const statusText = this.add.text(centerX, centerY, 'Connecting...', {
      fontSize: '20px',
      color: '#ffaa00',
    }).setOrigin(0.5);

    network.onConnected = (playerId: string) => {
      statusText.setText(`Connected as ${playerId}`);
      statusText.setColor('#00ff00');

      // Show buttons
      this.createButton(centerX, centerY + 80, 'Find Match', () => {
        console.log('Finding match...');
        network.findMatch();
        statusText.setText('Looking for opponent...');
        statusText.setColor('#ffaa00');
      });

      this.createButton(centerX, centerY + 140, 'Local Test', () => {
        console.log('Starting local test...');
        this.scene.start('GameScene');
      });
    };

    // Listen for match start
    network.onMatchStart = (matchId: string, state: any) => {
      console.log('Match found! Starting game...');
      this.scene.start('GameScene');
    };
  }

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const button = this.add.text(x, y, text, {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive();

    button.on('pointerover', () => {
      button.setBackgroundColor('#555555');
    });

    button.on('pointerout', () => {
      button.setBackgroundColor('#333333');
    });

    button.on('pointerdown', () => {
      button.setBackgroundColor('#777777');
    });

    button.on('pointerup', () => {
      button.setBackgroundColor('#555555');
      callback();
    });

    return button;
  }
}
