import Phaser from 'phaser';
import type { GameState, Unit, Vector2, PlayerAction } from 'shared';
import { GamePhase, ActionType, Simulation, WEAPON_STATS } from 'shared';

export class GameScene extends Phaser.Scene {
  private unitSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private currentState: GameState | null = null;
  private playerId: string | null = null;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private uiText!: Phaser.GameObjects.Text;
  private selectedUnit: string | null = null;
  private plannedActions: Map<string, PlayerAction> = new Map();
  private movementPreviewGraphics!: Phaser.GameObjects.Graphics;
  private shootingPreviewGraphics!: Phaser.GameObjects.Graphics;
  private readyButton!: Phaser.GameObjects.Text;
  private isLocalTest: boolean = false;
  private localSimulation: Simulation | null = null;
  private hoveredUnit: string | null = null;

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

    // Disable right-click context menu
    this.input.mouse?.disableContextMenu();

    // Draw ground grid
    this.drawGrid();

    // Graphics for movement preview
    this.movementPreviewGraphics = this.add.graphics();
    this.movementPreviewGraphics.setDepth(5);

    // Graphics for shooting preview
    this.shootingPreviewGraphics = this.add.graphics();
    this.shootingPreviewGraphics.setDepth(6);

    // UI Text
    this.uiText = this.add.text(10, 10, 'Connecting...', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setScrollFactor(0).setDepth(1000);

    // Ready button
    this.readyButton = this.add.text(this.cameras.main.width - 10, 10, 'READY', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 20, y: 10 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000).setInteractive();

    this.readyButton.on('pointerover', () => {
      this.readyButton.setBackgroundColor('#00ff00');
    });

    this.readyButton.on('pointerout', () => {
      this.readyButton.setBackgroundColor('#00aa00');
    });

    this.readyButton.on('pointerdown', () => {
      this.handleReadyButton();
    });

    // Get network manager
    const network = (window as any).network;
    
    // Set playerId for local testing if not connected
    this.playerId = network?.getPlayerId() || 'player1';
    console.log('Player ID:', this.playerId);

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
      if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer.worldX, pointer.worldY);
      } else {
        this.handleClick(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer.worldX, pointer.worldY);
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
    // Use actual playerId for friendly units
    const friendlyPlayerId = this.playerId || 'player1';
    const enemyPlayerId = 'enemy_ai';

    const testState: GameState = {
      tick: 0,
      round: 1,
      phase: GamePhase.PLANNING,
      seed: 12345,
      units: [
        this.createTestUnit('p1_unit1', friendlyPlayerId, { x: 100, y: 100 }),
        this.createTestUnit('p1_unit2', friendlyPlayerId, { x: 150, y: 100 }),
        this.createTestUnit('p1_unit3', friendlyPlayerId, { x: 200, y: 100 }),
        this.createTestUnit('p2_unit1', enemyPlayerId, { x: 1100, y: 600 }),
        this.createTestUnit('p2_unit2', enemyPlayerId, { x: 1050, y: 600 }),
        this.createTestUnit('p2_unit3', enemyPlayerId, { x: 1000, y: 600 }),
      ],
    };

    console.log('Test state created with friendly units for:', friendlyPlayerId);
    
    // Enable local test mode
    this.isLocalTest = true;
    this.localSimulation = new Simulation(testState);
    
    this.handleGameStateUpdate(testState);
  }

  private createTestUnit(id: string, playerId: string, pos: Vector2): Unit {
    const weapon = 'USP' as any;
    const weaponStats = WEAPON_STATS[weapon];
    
    return {
      id,
      playerId,
      position: pos,
      health: 100,
      weapon,
      hasKevlar: false,
      hasHelmet: false,
      isAlive: true,
      stance: 'STANDING' as any,
      velocity: { x: 0, y: 0 },
      isMoving: false,
      visibleEnemyIds: [],
      lastKnownEnemyPositions: new Map(),
      hasShot: false,
      magazineAmmo: weaponStats.magazineSize,
      isReloading: false,
      reloadTimeRemaining: 0,
      accuracyBloom: 0,
      lastShotTime: 0,
    };
  }

  private handleGameStateUpdate(state: GameState) {
    this.currentState = state;
    this.updateUnits(state);
    this.updateUI(state);
    this.drawMovementPreviews();
    this.drawShootingPreviews();
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
    container.setData('unitId', unit.id);
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
    } else if (this.plannedActions.has(unit.id)) {
      body.setStrokeStyle(3, 0x00aaff); // Blue for units with planned actions
    } else {
      body.setStrokeStyle(2, 0xffffff);
    }
  }

  private updateUI(state: GameState) {
    const phaseText = state.phase === GamePhase.PLANNING ? 'PLANNING' : 
                      state.phase === GamePhase.EXECUTION ? 'EXECUTION' : 'ROUND END';
    
    const aliveUnits = state.units.filter(u => u.isAlive).length;
    const plannedCount = this.plannedActions.size;
    
    const lines = [
      `Phase: ${phaseText}`,
      `Round: ${state.round} | Tick: ${state.tick}`,
      `Units Alive: ${aliveUnits}`,
      `Planned Actions: ${plannedCount}`,
    ];

    if (this.selectedUnit) {
      const unit = state.units.find(u => u.id === this.selectedUnit);
      if (unit) {
        const weaponStats = WEAPON_STATS[unit.weapon];
        const bloomPercent = (unit.accuracyBloom * 100).toFixed(0);
        const reloadStatus = unit.isReloading ? ` RELOADING ${unit.reloadTimeRemaining.toFixed(1)}s` : '';
        
        lines.push(`Selected: ${this.selectedUnit}`);
        lines.push(`HP: ${unit.health} | Ammo: ${unit.magazineAmmo}/${weaponStats.magazineSize}${reloadStatus}`);
        lines.push(`Bloom: ${bloomPercent}% | Accuracy: ${((1 - unit.accuracyBloom) * 100).toFixed(0)}%`);
      }
    }

    if (this.hoveredUnit && this.selectedUnit) {
      const shooter = state.units.find(u => u.id === this.selectedUnit);
      const target = state.units.find(u => u.id === this.hoveredUnit);
      if (shooter && target && shooter.playerId !== target.playerId) {
        const hitChance = this.calculateHitChance(shooter, target);
        lines.push(`Hit Chance: ${(hitChance * 100).toFixed(0)}%`);
      }
    }
    
    this.uiText.setText(lines.filter(Boolean).join('\n'));

    // Show/hide ready button based on phase
    this.readyButton.setVisible(state.phase === GamePhase.PLANNING);
  }

  private handleClick(worldX: number, worldY: number) {
    console.log(`Click at (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
    
    // Only allow planning during planning phase
    if (this.currentState?.phase !== GamePhase.PLANNING) {
      console.log('Not in planning phase');
      return;
    }

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
      // Check if it's our unit
      const unit = this.currentState?.units.find(u => u.id === clickedUnit);
      if (unit && unit.playerId === this.playerId) {
        this.selectedUnit = clickedUnit;
        console.log('Selected unit:', clickedUnit);
      } else {
        console.log('Cannot select enemy unit');
      }
      
      // Force update to show selection
      if (this.currentState) {
        this.updateUnits(this.currentState);
        this.updateUI(this.currentState);
      }
    } else {
      // Clicked on ground
      if (this.selectedUnit && this.currentState) {
        const unit = this.currentState.units.find(u => u.id === this.selectedUnit);
        if (unit && unit.playerId === this.playerId) {
          const existingAction = this.plannedActions.get(this.selectedUnit);
          
          // If unit already has a shoot action, add movement to it
          if (existingAction && existingAction.actionType === ActionType.SHOOT) {
            console.log(`Adding movement to shoot action for ${this.selectedUnit}`);
            existingAction.moveBeforeAction = true;
            existingAction.targetPosition = { x: worldX, y: worldY };
            this.plannedActions.set(this.selectedUnit, existingAction);
          } else {
            // Create new move action
            console.log(`Planning move for ${this.selectedUnit} to (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
            const action: PlayerAction = {
              unitId: this.selectedUnit,
              actionType: ActionType.MOVE,
              targetPosition: { x: worldX, y: worldY },
            };
            this.plannedActions.set(this.selectedUnit, action);
          }
          
          this.drawMovementPreviews();
          this.drawShootingPreviews();
        }
      }
      
      this.selectedUnit = null;
      
      // Force update to clear selection
      if (this.currentState) {
        this.updateUnits(this.currentState);
        this.updateUI(this.currentState);
      }
    }
  }

  private drawMovementPreviews() {
    this.movementPreviewGraphics.clear();

    if (!this.currentState) return;

    // Draw planned movements
    this.plannedActions.forEach((action, unitId) => {
      // Show movement for MOVE actions or SHOOT actions with moveBeforeAction
      const hasMovement = (action.actionType === ActionType.MOVE) || 
                          (action.moveBeforeAction && action.targetPosition);
      
      if (!hasMovement || !action.targetPosition) return;

      const unit = this.currentState!.units.find(u => u.id === unitId);
      if (!unit) return;

      // Draw line from unit to target
      this.movementPreviewGraphics.lineStyle(2, 0x00aaff, 0.8);
      this.movementPreviewGraphics.lineBetween(
        unit.position.x,
        unit.position.y,
        action.targetPosition.x,
        action.targetPosition.y
      );

      // Draw target marker
      this.movementPreviewGraphics.fillStyle(0x00aaff, 0.5);
      this.movementPreviewGraphics.fillCircle(action.targetPosition.x, action.targetPosition.y, 8);
      
      this.movementPreviewGraphics.lineStyle(2, 0x00aaff, 1);
      this.movementPreviewGraphics.strokeCircle(action.targetPosition.x, action.targetPosition.y, 8);
    });
  }

  private handleReadyButton() {
    if (this.currentState?.phase !== GamePhase.PLANNING) return;

    console.log('Ready! Planned actions:', this.plannedActions);

    if (this.isLocalTest && this.localSimulation) {
      // Local test mode - run simulation locally
      console.log('Running local simulation...');
      
      // Switch simulation to execution phase
      this.localSimulation.setPhase(GamePhase.EXECUTION);
      
      // Collect all actions
      const actions = Array.from(this.plannedActions.values());
      console.log('Executing actions:', actions);
      
      // Update UI to show execution phase
      if (this.currentState) {
        this.currentState.phase = GamePhase.EXECUTION;
        this.updateUI(this.currentState);
      }
      
      // Run simulation for a few ticks
      let tickCount = 0;
      const maxTicks = 120; // 2 seconds at 60 ticks/sec
      
      const tickInterval = setInterval(() => {
        if (!this.localSimulation) {
          clearInterval(tickInterval);
          return;
        }

        // Pass actions every tick so movement continues
        const newState = this.localSimulation.tick(actions);
        
        if (tickCount % 10 === 0) { // Log every 10 ticks
          console.log(`Tick ${tickCount}: Unit positions:`, 
            newState.units.map(u => ({ id: u.id, x: u.position.x.toFixed(0), y: u.position.y.toFixed(0), hp: u.health, alive: u.isAlive }))
          );
        }
        
        this.handleGameStateUpdate(newState);
        
        tickCount++;
        
        // Stop after max ticks or if phase changed
        if (tickCount >= maxTicks || newState.phase !== GamePhase.EXECUTION) {
          clearInterval(tickInterval);
          console.log('Execution complete at tick', tickCount);
          
          // Return to planning phase
          this.localSimulation.setPhase(GamePhase.PLANNING);
          newState.phase = GamePhase.PLANNING;
          this.handleGameStateUpdate(newState);
        }
      }, 16); // ~60 ticks per second
      
    } else {
      // Online mode - send to server
      const network = (window as any).network;
      if (network) {
        this.plannedActions.forEach(action => {
          network.sendAction(action);
        });
        network.sendReady();
      }
    }

    // Clear planned actions
    this.plannedActions.clear();
    this.drawMovementPreviews();
    
    if (this.currentState) {
      this.updateUnits(this.currentState);
    }
  }

  private setupCameraControls() {
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      const zoomAmount = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(this.camera.zoom + zoomAmount, 0.5, 2);
      this.camera.setZoom(newZoom);
    });
  }

  private handleRightClick(worldX: number, worldY: number) {
    console.log(`Right click at (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
    
    // Only allow planning during planning phase
    if (this.currentState?.phase !== GamePhase.PLANNING) {
      console.log('Not in planning phase');
      return;
    }

    if (!this.selectedUnit) {
      console.log('No unit selected');
      return;
    }

    // Check if clicked on an enemy unit
    let clickedUnit: string | null = null;

    this.unitSprites.forEach((container, id) => {
      const bounds = new Phaser.Geom.Circle(container.x, container.y, 20);
      if (Phaser.Geom.Circle.Contains(bounds, worldX, worldY)) {
        clickedUnit = id;
      }
    });

    if (clickedUnit) {
      const shooter = this.currentState.units.find(u => u.id === this.selectedUnit);
      const target = this.currentState.units.find(u => u.id === clickedUnit);

      if (shooter && target && shooter.playerId !== target.playerId) {
        console.log(`Planning shoot: ${this.selectedUnit} -> ${clickedUnit}`);
        
        const existingAction = this.plannedActions.get(this.selectedUnit);
        
        // Create shoot action, preserving any existing movement
        const action: PlayerAction = {
          unitId: this.selectedUnit,
          actionType: ActionType.SHOOT,
          targetUnitId: clickedUnit,
          moveBeforeAction: existingAction?.actionType === ActionType.MOVE,
          targetPosition: existingAction?.targetPosition,
        };
        
        this.plannedActions.set(this.selectedUnit, action);
        this.drawShootingPreviews();
        this.drawMovementPreviews();
        
        if (this.currentState) {
          this.updateUnits(this.currentState);
          this.updateUI(this.currentState);
        }
      } else {
        console.log('Cannot shoot friendly unit');
      }
    }
  }

  private handlePointerMove(worldX: number, worldY: number) {
    if (!this.currentState) return;

    // Find hovered unit
    let hoveredUnit: string | null = null;

    this.unitSprites.forEach((container, id) => {
      const bounds = new Phaser.Geom.Circle(container.x, container.y, 20);
      if (Phaser.Geom.Circle.Contains(bounds, worldX, worldY)) {
        hoveredUnit = id;
      }
    });

    if (hoveredUnit !== this.hoveredUnit) {
      this.hoveredUnit = hoveredUnit;
      this.updateUI(this.currentState);
    }
  }

  private drawShootingPreviews() {
    this.shootingPreviewGraphics.clear();

    if (!this.currentState) return;

    // Draw planned shooting actions
    this.plannedActions.forEach((action, unitId) => {
      if (action.actionType !== ActionType.SHOOT || !action.targetUnitId) return;

      const shooter = this.currentState!.units.find(u => u.id === unitId);
      const target = this.currentState!.units.find(u => u.id === action.targetUnitId);
      
      if (!shooter || !target) return;

      // Draw line from shooter to target
      this.shootingPreviewGraphics.lineStyle(2, 0xff0000, 0.8);
      this.shootingPreviewGraphics.lineBetween(
        shooter.position.x,
        shooter.position.y,
        target.position.x,
        target.position.y
      );

      // Draw crosshair on target
      const size = 10;
      this.shootingPreviewGraphics.lineStyle(2, 0xff0000, 1);
      this.shootingPreviewGraphics.lineBetween(
        target.position.x - size,
        target.position.y,
        target.position.x + size,
        target.position.y
      );
      this.shootingPreviewGraphics.lineBetween(
        target.position.x,
        target.position.y - size,
        target.position.x,
        target.position.y + size
      );
    });
  }

  private calculateHitChance(shooter: Unit, target: Unit): number {
    const weaponStats = WEAPON_STATS[shooter.weapon];
    const distance = Math.sqrt(
      Math.pow(target.position.x - shooter.position.x, 2) +
      Math.pow(target.position.y - shooter.position.y, 2)
    );
    
    // Base accuracy from weapon
    let accuracy = weaponStats.accuracy;
    
    // Distance penalty
    const optimalRange = weaponStats.optimalRange;
    if (distance > optimalRange) {
      const rangePenalty = (distance - optimalRange) / optimalRange;
      accuracy *= Math.max(0.3, 1 - rangePenalty * 0.5);
    }
    
    // Movement penalty for shooter
    if (shooter.isMoving) {
      accuracy *= 0.5;
    }
    
    // Movement bonus for target
    if (target.isMoving) {
      accuracy *= 0.7;
    }
    
    return Math.max(0.05, Math.min(0.95, accuracy));
  }

  update(_time: number, _delta: number) {
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
