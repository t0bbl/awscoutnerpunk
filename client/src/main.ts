import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { NetworkManager } from './network/NetworkManager';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#2d2d2d',
  scene: [MenuScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

// Initialize network manager
const network = new NetworkManager('ws://localhost:3000');

// Start game
const game = new Phaser.Game(config);

// Make network available globally
(window as any).network = network;
