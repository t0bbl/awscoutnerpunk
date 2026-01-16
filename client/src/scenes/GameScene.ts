import Phaser from 'phaser';
import type { GameState, Unit, Vector2, PlayerAction } from 'shared';
import { GamePhase, ActionType, Simulation, WEAPON_STATS, TICK_DURATION_S, WeaponType, EXECUTION_PHASE_TICKS } from 'shared';
import { TimelineUI_v2 } from '../ui/TimelineUI';
import { ActionManager } from '../managers/ActionManager';

export class GameScene extends Phaser.Scene {
  private unitSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private currentState: GameState | null = null;
  private playerId: string | null = null;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private uiText!: Phaser.GameObjects.Text;
  private selectedUnit: string | null = null;
  private actionManager: ActionManager = new ActionManager();
  private movementPreviewGraphics!: Phaser.GameObjects.Graphics;
  private shootingPreviewGraphics!: Phaser.GameObjects.Graphics;
  private readyButton!: Phaser.GameObjects.Text;
  private isLocalTest: boolean = false;
  private localSimulation: Simulation | null = null;
  private hoveredUnit: string | null = null;
  private timeline: TimelineUI_v2 | null = null;
  private executionTime: number = 0;
  private effectsGraphics!: Phaser.GameObjects.Graphics;
  private previousUnitStates: Map<string, { magazineAmmo: number, health: number }> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // We'll use simple shapes for now
  }

  create() {
    // Setup main camera for game world
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

    // Graphics for visual effects (muzzle flash, tracers)
    this.effectsGraphics = this.add.graphics();
    this.effectsGraphics.setDepth(100);

    // UI Text - fixed to screen
    this.uiText = this.add.text(10, 10, 'Connecting...', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setScrollFactor(0).setDepth(1000);

    // Ready button - fixed to screen
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

    // Listen for game state updates
    if (network) {
      network.onGameState = (state: GameState) => {
        this.handleGameStateUpdate(state);
      };

      network.onMatchStart = (matchId: string, state: GameState) => {
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

    // Create timeline UI (positioned at bottom of screen)
    const timelineY = this.cameras.main.height - 150;
    this.timeline = new TimelineUI_v2(this, 340, timelineY);
    this.timeline.setVisible(false);

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
    
    // Enable local test mode
    this.isLocalTest = true;
    this.localSimulation = new Simulation(testState);
    
    this.handleGameStateUpdate(testState);
  }

  private createTestUnit(id: string, playerId: string, pos: Vector2): Unit {
    const weapon: WeaponType = WeaponType.USP;
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
    
    // Update timeline
    if (this.timeline) {
      const showTimeline = state.phase === GamePhase.PLANNING || state.phase === GamePhase.EXECUTION;
      this.timeline.setVisible(showTimeline);
      
      if (showTimeline) {
        // Convert arrays to single actions for timeline
        this.timeline.update(this.executionTime, this.getLastActionsForTimeline(), state);
      }
    }
  }

  private getLastActionsForTimeline(): Map<string, PlayerAction> {
    return this.actionManager.getLastActions();
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
    } else if (this.actionManager.hasActions(unit.id)) {
      body.setStrokeStyle(3, 0x00aaff); // Blue for units with planned actions
    } else {
      body.setStrokeStyle(2, 0xffffff);
    }
  }

  private updateUI(state: GameState) {
    const phaseText = state.phase === GamePhase.PLANNING ? 'PLANNING' : 
                      state.phase === GamePhase.EXECUTION ? 'EXECUTION' : 'ROUND END';
    
    const aliveUnits = state.units.filter(u => u.isAlive).length;
    const plannedCount = this.actionManager.getAllActions().size;
    
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
    // Only allow planning during planning phase
    if (this.currentState?.phase !== GamePhase.PLANNING) {
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
      }
    });

    if (clickedUnit) {
      // Check if it's our unit
      const unit = this.currentState?.units.find(u => u.id === clickedUnit);
      if (unit && unit.playerId === this.playerId) {
        this.selectedUnit = clickedUnit;
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
          // Create new move action
          const action: PlayerAction = {
            unitId: this.selectedUnit,
            actionType: ActionType.MOVE,
            targetPosition: { x: worldX, y: worldY },
          };
          
          // Add to action manager
          this.actionManager.addAction(this.selectedUnit, action);
          
          this.drawMovementPreviews();
          this.drawShootingPreviews();
          
          // Update timeline
          if (this.timeline && this.currentState) {
            this.timeline.update(this.executionTime, this.getLastActionsForTimeline(), this.currentState);
          }
        }
      }
      
      // Don't clear selection - keep it sticky
      // this.selectedUnit = null;
      
      // Force update to show changes
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
    this.actionManager.getAllActions().forEach((actions, unitId) => {
      const unit = this.currentState!.units.find(u => u.id === unitId);
      if (!unit) return;

      // Start from unit's current position
      let currentPos = { x: unit.position.x, y: unit.position.y };

      // Draw each movement action in sequence
      actions.forEach((action, index) => {
        // Show movement for MOVE actions or SHOOT actions with moveBeforeAction
        const hasMovement = (action.actionType === ActionType.MOVE) || 
                            (action.moveBeforeAction && action.targetPosition);
        
        if (!hasMovement || !action.targetPosition) return;

        // Draw line from current position to target
        this.movementPreviewGraphics.lineStyle(2, 0x00aaff, 0.8);
        this.movementPreviewGraphics.lineBetween(
          currentPos.x,
          currentPos.y,
          action.targetPosition.x,
          action.targetPosition.y
        );

        // Draw target marker
        this.movementPreviewGraphics.fillStyle(0x00aaff, 0.5);
        this.movementPreviewGraphics.fillCircle(action.targetPosition.x, action.targetPosition.y, 8);
        
        this.movementPreviewGraphics.lineStyle(2, 0x00aaff, 1);
        this.movementPreviewGraphics.strokeCircle(action.targetPosition.x, action.targetPosition.y, 8);

        // Draw waypoint number
        const waypointText = this.add.text(action.targetPosition.x, action.targetPosition.y - 15, `${index + 1}`, {
          fontSize: '12px',
          color: '#00aaff',
          backgroundColor: '#000000',
          padding: { x: 3, y: 2 }
        }).setOrigin(0.5);
        
        // Clean up text after a frame
        this.time.delayedCall(0, () => waypointText.destroy());

        // Update current position for next action
        currentPos = { x: action.targetPosition.x, y: action.targetPosition.y };
      });
    });
  }

  private handleReadyButton() {
    if (this.currentState?.phase !== GamePhase.PLANNING) return;

    if (this.isLocalTest && this.localSimulation) {
      // Local test mode - run simulation locally
      
      // Reset execution time and initialize action manager
      this.executionTime = 0;
      this.actionManager.startExecution();
      
      // Switch simulation to execution phase
      this.localSimulation.setPhase(GamePhase.EXECUTION);
      
      // Initialize previous unit states for shot detection
      this.previousUnitStates.clear();
      if (this.currentState) {
        this.currentState.units.forEach(unit => {
          this.previousUnitStates.set(unit.id, {
            magazineAmmo: unit.magazineAmmo,
            health: unit.health
          });
        });
      }
      
      // Update UI to show execution phase
      if (this.currentState) {
        this.currentState.phase = GamePhase.EXECUTION;
        this.updateUI(this.currentState);
      }
      
      // Run simulation for execution phase duration
      let tickCount = 0;
      const maxTicks = EXECUTION_PHASE_TICKS; // 3 seconds at 60 ticks/sec = 180 ticks
      
      const tickInterval = setInterval(() => {
        if (!this.localSimulation) {
          clearInterval(tickInterval);
          return;
        }

        // Update execution time
        this.executionTime += TICK_DURATION_S;

        // Get current actions for each unit based on their progress
        const currentActions = this.actionManager.getCurrentActions();
        
        // Capture state BEFORE tick for shoot action completion detection
        if (this.currentState) {
          this.actionManager.capturePreTickState(currentActions, this.currentState);
        }
        
        // Reset hasShot flags for shoot actions
        currentActions.forEach(action => {
          if (action.actionType === ActionType.SHOOT && this.localSimulation) {
            const simState = this.localSimulation.getState();
            const unit = simState.units.find(u => u.id === action.unitId);
            if (unit?.hasShot) {
              this.localSimulation.resetUnitHasShot(action.unitId);
            }
          }
        });
        
        // Pass current actions to simulation
        const newState = this.localSimulation.tick(currentActions);
        
        // Update action progress based on completion
        this.actionManager.updateProgress(newState);
        
        // Detect and visualize shooting (this updates previousUnitStates)
        this.detectShooting(newState);
        
        this.handleGameStateUpdate(newState);
        
        tickCount++;
        
        // Stop after max ticks or if phase changed
        if (tickCount >= maxTicks || newState.phase !== GamePhase.EXECUTION) {
          clearInterval(tickInterval);
          
          // Reset execution time and clear actions
          this.executionTime = 0;
          this.actionManager.clear();
          this.drawMovementPreviews();
          this.drawShootingPreviews();
          
          // Return to planning phase
          this.localSimulation.setPhase(GamePhase.PLANNING);
          newState.phase = GamePhase.PLANNING;
          this.handleGameStateUpdate(newState);
        }
      }, 1000 / 60); // Exactly 60 ticks per second (16.666ms)
      
    } else {
      // Online mode - send to server
      const network = (window as any).network;
      if (network) {
        this.actionManager.getAllActions().forEach(actions => {
          actions.forEach(action => {
            network.sendAction(action);
          });
        });
        network.sendReady();
      }
      
      // Clear planned actions only in online mode
      this.actionManager.clear();
      this.drawMovementPreviews();
      
      if (this.currentState) {
        this.updateUnits(this.currentState);
      }
    }
  }

  private setupCameraControls() {
    // Zoom disabled for now - will fix later
    /*
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      const zoomAmount = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(this.camera.zoom + zoomAmount, 0.5, 2);
      this.camera.setZoom(newZoom);
    });
    */
  }

  private handleRightClick(worldX: number, worldY: number) {
    // Only allow planning during planning phase
    if (this.currentState?.phase !== GamePhase.PLANNING) {
      return;
    }

    if (!this.selectedUnit) {
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
        // Create shoot action
        const action: PlayerAction = {
          unitId: this.selectedUnit,
          actionType: ActionType.SHOOT,
          targetUnitId: clickedUnit,
        };
        
        // Add to action manager
        this.actionManager.addAction(this.selectedUnit, action);
        
        this.drawShootingPreviews();
        this.drawMovementPreviews();
        
        if (this.currentState) {
          this.updateUnits(this.currentState);
          this.updateUI(this.currentState);
          
          // Update timeline with new actions
          if (this.timeline) {
            this.timeline.update(this.executionTime, this.getLastActionsForTimeline(), this.currentState);
          }
        }
      }
    } else {
      // Don't deselect - keep selection sticky
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
    this.actionManager.getAllActions().forEach((actions, unitId) => {
      const shooter = this.currentState!.units.find(u => u.id === unitId);
      if (!shooter) return;

      // Track position through movement actions
      let currentPos = { x: shooter.position.x, y: shooter.position.y };

      actions.forEach(action => {
        // Update position if this is a movement action
        if (action.actionType === ActionType.MOVE && action.targetPosition) {
          currentPos = { x: action.targetPosition.x, y: action.targetPosition.y };
        }

        // Draw shooting action
        if (action.actionType === ActionType.SHOOT && action.targetUnitId) {
          const target = this.currentState!.units.find(u => u.id === action.targetUnitId);
          if (!target) return;

          // Determine shooting position (after movement if move-and-shoot)
          let shootFromX = currentPos.x;
          let shootFromY = currentPos.y;
          
          if (action.moveBeforeAction && action.targetPosition) {
            shootFromX = action.targetPosition.x;
            shootFromY = action.targetPosition.y;
            currentPos = { x: shootFromX, y: shootFromY };
          }

          // Draw line from shooting position to target
          this.shootingPreviewGraphics.lineStyle(2, 0xff0000, 0.8);
          this.shootingPreviewGraphics.lineBetween(
            shootFromX,
            shootFromY,
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
        }
      });
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
    // Update UI positions to stay on screen
    this.updateUIPositions();
    
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

  private updateUIPositions() {
    // Keep UI elements fixed to screen corners
    const cam = this.cameras.main;
    
    // Top-left text
    this.uiText.setPosition(10, 10);
    
    // Top-right ready button
    this.readyButton.setPosition(cam.width - 10, 10);
  }

  private showMuzzleFlash(x: number, y: number) {
    this.effectsGraphics.fillStyle(0xffff00, 1);
    this.effectsGraphics.fillCircle(x, y, 15);
    
    this.time.delayedCall(100, () => {
      this.effectsGraphics.clear();
    });
  }

  private showBulletTracer(fromX: number, fromY: number, toX: number, toY: number, hit: boolean) {
    this.effectsGraphics.lineStyle(3, hit ? 0xff0000 : 0xffaa00, 1);
    this.effectsGraphics.lineBetween(fromX, fromY, toX, toY);
    
    if (hit) {
      this.effectsGraphics.fillStyle(0xff0000, 0.8);
      this.effectsGraphics.fillCircle(toX, toY, 15);
    } else {
      const missOffsetX = (Math.random() - 0.5) * 60;
      const missOffsetY = (Math.random() - 0.5) * 60;
      this.effectsGraphics.fillStyle(0x888888, 0.6);
      this.effectsGraphics.fillCircle(toX + missOffsetX, toY + missOffsetY, 8);
    }
    
    this.time.delayedCall(300, () => {
      this.effectsGraphics.clear();
    });
  }

  private detectShooting(newState: GameState) {
    newState.units.forEach(unit => {
      const prevState = this.previousUnitStates.get(unit.id);
      if (prevState && prevState.magazineAmmo > unit.magazineAmmo) {
        const shooter = unit;
        
        const target = newState.units.find(u => {
          const prevTarget = this.previousUnitStates.get(u.id);
          return prevTarget && prevTarget.health > u.health;
        });
        
        this.showMuzzleFlash(shooter.position.x, shooter.position.y);
        
        if (target) {
          const hit = this.previousUnitStates.get(target.id)!.health > target.health;
          this.showBulletTracer(
            shooter.position.x,
            shooter.position.y,
            target.position.x,
            target.position.y,
            hit
          );
        }
      }
      
      this.previousUnitStates.set(unit.id, {
        magazineAmmo: unit.magazineAmmo,
        health: unit.health
      });
    });
  }

}
