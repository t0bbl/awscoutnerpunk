import Phaser from 'phaser';
import type { GameState, Unit, Vector2 } from 'shared';
import { GamePhase } from 'shared';

export class GameScene extends Phaser.Scene {
  private unitSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private currentState: GameState | null = null;
  private playerId: string | null = null;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private uiText!: Phaser.GameObjects.Text;
  private selectedUnit: string | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // We'll use simple shapes for now
  }

  create() {
    // Setup camera
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor('#1a1a1a');
    this.camera.setZoom(1);

    // Draw ground grid
    this.drawGrid();

    // UI Text
    this.uiText = this.add.text(10, 10, 'Connecting...', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setScrollFactor(0).setDepth(1000);

    // Get network manager
    const network = (window as any).network;
    this.playerId = network?.getPlayerId();

    // Listen for game state updates
    if (network) {
      network.onGameState = (state: GameState) => {
        this.handleGameStateUpdate(state);
      };

      network.onMatchStart = (matchId: string, state: GameState) => {
        console.log('Match started:', matchId);
        this.handleGameStateUpdate(state);
      };
    }

    // Input handling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer.worldX, pointer.worldY);
    });

    // Camera controls
    this.setupCameraControls();

    // Create test state for local testing
    this.createTestState();
  }

  private drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.5);

    // Draw grid lines
    for (let x = 0; x <= 1280; x += 40) {
      graphics.lineBetween(x, 0, x, 720);
    }
    for (let y = 0; y <= 720; y += 40) {
      graphics.lineBetween(0, y, 1280, y);
    }
  }

  private createTestState() {
    // Create a test state for local development
    const testState: GameState = {
      tick: 0,
      round: 1,
      phase: GamePhase.PLANNING,
      seed: 12345,
      units: [
        this.createTestUnit('p1_unit1', 'player1', { x: 100, y: 100 }, '#00ff00'),
        this.createTestUnit('p1_unit2', 'player1', { x: 150, y: 100 }, '#00ff00'),
        this.createTestUnit('p1_unit3', 'player1', { x: 200, y: 100 }, '#00ff00'),
        this.createTestUnit('p2_unit1', 'player2', { x: 1100, y: 600 }, '#ff0000'),
        this.createTestUnit('p2_unit2', 'player2', { x: 1050, y: 600 }, '#ff0000'),
        this.createTestUnit('p2_unit3', 'player2', { x: 1000, y: 600 }, '#ff0000'),
      ],
    };

    this.handleGameStateUpdate(testState);
  }

  private createTestUnit(id: string, playerId: string, pos: Vector2, color: string): Unit {
    return {
      id,
      playerId,
      position: pos,
      health: 100,
      weapon: 'USP' as any,
      hasKevlar: false,
      hasHelmet: false,
      isAlive: true,
      stance: 'STANDING' as any,
      velocity: { x: 0, y: 0 },
      isMoving: false,
      visibleEnemyIds: [],
      lastKnownEnemyPositions: new Map(),
    };
  }

  private handleGameStateUpdate(state: GameState) {
    this.currentState = state;
    this.updateUnits(state);
    this.updateUI(state);
  }

  private updateUnits(state: GameState) {
    // Remove dead units
    this.unitSprites.forEach((sprite, id) => {
      const unit = state.units.find(u => u.id === id);
      if (!unit || !unit.isAlive) {
        sprite.destroy();
        this.unitSprites.delete(id);
      }
    });

    // Update or create unit sprites
    state.units.forEach(unit => {
      if (!unit.isAlive) return;

      let container = this.unitSprites.get(unit.id);
      
      if (!container) {
        container = this.createUnitSprite(unit);
        this.unitSprites.set(unit.id, container);
      }

      this.updateUnitSprite(container, unit);
    });
  }

  private createUnitSprite(unit: Unit): Phaser.GameObjects.Container {
    const container = this.add.container(unit.position.x, unit.position.y);

    // Determine color based on player
    const isOwnUnit = unit.playerId === this.playerId;
    const color = isOwnUnit ? 0x00ff00 : 0xff0000;

    // Unit body (circle)
    const body = this.add.circle(0, 0, 15, color, 1);
    body.setStrokeStyle(2, 0xffffff);

    // Direction indicator (small triangle)
    const direction = this.add.triangle(0, -20, 0, 0, -5, 10, 5, 10, color, 1);

    // Health bar background
    const healthBg = this.add.rectangle(0, -30, 30, 4, 0x000000, 0.8);
    
    // Health bar
    const healthBar = this.add.rectangle(-15, -30, 30, 4, 0x00ff00, 1);
    healthBar.setOrigin(0, 0.5);

    // Unit ID text
    const idText = this.add.text(0, 0, unit.id.split('_')[1], {
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([body, direction, healthBg, healthBar, idText]);
    container.setData('body', body);
    container.setData('healthBar', healthBar);
    container.setData('direction', direction);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 15), Phaser.Geom.Circle.Contains);

    return container;
  }

  private updateUnitSprite(container: Phaser.GameObjects.Container, unit: Unit) {
    // Update position
    container.setPosition(unit.position.x, unit.position.y);

    // Update health bar
    const healthBar = container.getData('healthBar') as Phaser.GameObjects.Rectangle;
    const healthPercent = unit.health / 100;
    healthBar.width = 30 * healthPercent;
    
    // Color based on health
    if (healthPercent > 0.6) {
      healthBar.setFillStyle(0x00ff00);
    } else if (healthPercent > 0.3) {
      healthBar.setFillStyle(0xffaa00);
    } else {
      healthBar.setFillStyle(0xff0000);
    }

    // Update direction indicator based on velocity
    const direction = container.getData('direction') as Phaser.GameObjects.Triangle;
    if (unit.isMoving && (unit.velocity.x !== 0 || unit.velocity.y !== 0)) {
      const angle = Math.atan2(unit.velocity.y, unit.velocity.x);
      direction.setRotation(angle + Math.PI / 2);
      direction.setAlpha(1);
    } else {
      direction.setAlpha(0.3);
    }

    // Highlight selected unit
    const body = container.getData('body') as Phaser.GameObjects.Arc;
    if (this.selectedUnit === unit.id) {
      body.setStrokeStyle(3, 0xffff00);
    } else {
      body.setStrokeStyle(2, 0xffffff);
    }
  }

  private updateUI(state: GameState) {
    const phaseText = state.phase === GamePhase.PLANNING ? 'PLANNING' : 
                      state.phase === GamePhase.EXECUTION ? 'EXECUTION' : 'ROUND END';
    
    const aliveUnits = state.units.filter(u => u.isAlive).length;
    
    this.uiText.setText([
      `Phase: ${phaseText}`,
      `Round: ${state.round} | Tick: ${state.tick}`,
      `Units Alive: ${aliveUnits}`,
      this.selectedUnit ? `Selected: ${this.selectedUnit}` : '',
    ].filter(Boolean).join('\n'));
  }

  private handleClick(worldX: number, worldY: number) {
    console.log(`Click at (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
    
    // Check if clicked on a unit
    let clickedUnit: string | null = null;

    this.unitSprites.forEach((container, id) => {
      const bounds = new Phaser.Geom.Circle(
        container.x,
        container.y,
        20 // Slightly larger hit area
      );

      if (Phaser.Geom.Circle.Contains(bounds, worldX, worldY)) {
        clickedUnit = id;
        console.log(`Hit unit: ${id} at (${container.x}, ${container.y})`);
      }
    });

    if (clickedUnit) {
      this.selectedUnit = clickedUnit;
      console.log('Selected unit:', clickedUnit);
      
      // Force update to show selection
      if (this.currentState) {
        this.updateUnits(this.currentState);
        this.updateUI(this.currentState);
      }
    } else {
      // Clicked on ground - move selected unit
      if (this.selectedUnit && this.currentState) {
        console.log(`Move ${this.selectedUnit} to (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
        // TODO: Send move action to server
      }
      this.selectedUnit = null;
      
      // Force update to clear selection
      if (this.currentState) {
        this.updateUnits(this.currentState);
        this.updateUI(this.currentState);
      }
    }
  }

  private setupCameraControls() {
    const cursors = this.input.keyboard?.createCursorKeys();
    
    // WASD controls
    const keyW = this.input.keyboard?.addKey('W');
    const keyA = this.input.keyboard?.addKey('A');
    const keyS = this.input.keyboard?.addKey('S');
    const keyD = this.input.keyboard?.addKey('D');

    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      const zoomAmount = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(this.camera.zoom + zoomAmount, 0.5, 2);
      this.camera.setZoom(newZoom);
    });
  }

  update(time: number, delta: number) {
    // Camera movement
    const cursors = this.input.keyboard?.createCursorKeys();
    const speed = 5;

    if (cursors?.left.isDown || this.input.keyboard?.addKey('A').isDown) {
      this.camera.scrollX -= speed;
    }
    if (cursors?.right.isDown || this.input.keyboard?.addKey('D').isDown) {
      this.camera.scrollX += speed;
    }
    if (cursors?.up.isDown || this.input.keyboard?.addKey('W').isDown) {
      this.camera.scrollY -= speed;
    }
    if (cursors?.down.isDown || this.input.keyboard?.addKey('S').isDown) {
      this.camera.scrollY += speed;
    }
  }
}
