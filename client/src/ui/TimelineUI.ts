import Phaser from 'phaser';
import type { GameState, PlayerAction } from 'shared';
import { ActionType, EXECUTION_PHASE_DURATION_S } from 'shared';

export class TimelineUI_v2 {
  private static readonly VERSION = 'v4-renamed-class';
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private timelineWidth: number = 600;
  private timelineHeight: number = 100;
  private x: number;
  private y: number;
  private currentTime: number = 0;
  private maxTime: number = EXECUTION_PHASE_DURATION_S;
  private actionBars: Map<string, Phaser.GameObjects.Rectangle[]> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(900);

    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(900);

    // Add static labels once (0s, 1s, 2s, 3s)
    for (let i = 0; i <= 3; i++) {
      const labelX = this.x + (i / 3) * this.timelineWidth;
      const timeText = this.scene.add.text(labelX, this.y + this.timelineHeight + 5, `${i}s`, {
        fontSize: '12px',
        color: '#888888',
      }).setOrigin(0.5, 0).setDepth(900);
      
      this.container.add(timeText);
    }

    // Title
    const title = this.scene.add.text(this.x + this.timelineWidth / 2, this.y - 20, 'EXECUTION TIMELINE', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(900);
    
    this.container.add(title);

    this.draw();
  }

  private draw() {
    // Background
    this.graphics.fillStyle(0x000000, 0.8);
    this.graphics.fillRect(this.x, this.y, this.timelineWidth, this.timelineHeight);

    // Border
    this.graphics.lineStyle(2, 0xffffff, 0.5);
    this.graphics.strokeRect(this.x, this.y, this.timelineWidth, this.timelineHeight);

    // Time markers (0s, 1s, 2s, 3s)
    const numMarkers = 3;
    this.graphics.lineStyle(1, 0x666666, 0.5);
    
    for (let i = 0; i <= numMarkers; i++) {
      const x = this.x + (i / numMarkers) * this.timelineWidth;
      this.graphics.lineBetween(x, this.y, x, this.y + this.timelineHeight);
    }
  }

  update(currentTime: number, plannedActions: Map<string, PlayerAction>, gameState: GameState | null) {
    this.currentTime = currentTime;
    
    // Clear old action bars FIRST
    this.actionBars.forEach(bars => {
      bars.forEach(bar => bar.destroy());
    });
    this.actionBars.clear();
    
    // Redraw background and grid AFTER clearing bars
    this.graphics.clear();
    this.draw();

    if (!gameState) return;

    // Draw action bars for each unit
    let unitIndex = 0;
    const unitHeight = 25; // Increased from 15 for visibility
    const unitSpacing = 8;

    plannedActions.forEach((action, unitId) => {
      const unit = gameState.units.find(u => u.id === unitId);
      if (!unit) return;

      const yPos = this.y + 10 + unitIndex * (unitHeight + unitSpacing);
      
      // Draw action bar based on type
      if (action.actionType === ActionType.MOVE && action.targetPosition) {
        const distance = Math.sqrt(
          Math.pow(action.targetPosition.x - unit.position.x, 2) +
          Math.pow(action.targetPosition.y - unit.position.y, 2)
        );
        const speedPerSecond = 5.0 * 60;
        const duration = distance / speedPerSecond;
        const width = (duration / this.maxTime) * this.timelineWidth;
        
        const bar = this.scene.add.rectangle(
          0,
          yPos - this.y,
          Math.max(width, 20),
          unitHeight,
          0x00aaff,
          1.0
        ).setOrigin(0, 0).setDepth(902);
        
        this.container.add(bar);
        
        if (!this.actionBars.has(unitId)) {
          this.actionBars.set(unitId, []);
        }
        this.actionBars.get(unitId)!.push(bar);
      }
      
      if (action.actionType === ActionType.SHOOT) {
        // If moving before shooting, draw the movement bar first
        if (action.moveBeforeAction && action.targetPosition) {
          const distance = Math.sqrt(
            Math.pow(action.targetPosition.x - unit.position.x, 2) +
            Math.pow(action.targetPosition.y - unit.position.y, 2)
          );
          const speedPerSecond = 5.0 * 60;
          const moveDuration = distance / speedPerSecond;
          const moveWidth = (moveDuration / this.maxTime) * this.timelineWidth;
          
          const moveBar = this.scene.add.rectangle(
            0,
            yPos - this.y,
            Math.max(moveWidth, 20),
            unitHeight,
            0x00aaff,
            1.0
          ).setOrigin(0, 0).setDepth(902);
          
          this.container.add(moveBar);
          
          if (!this.actionBars.has(unitId)) {
            this.actionBars.set(unitId, []);
          }
          this.actionBars.get(unitId)!.push(moveBar);
        }
        
        const shootTime = action.moveBeforeAction && action.targetPosition ? 
          this.calculateMoveTime(unit.position, action.targetPosition) : 0;
        
        const xPos = this.x + (shootTime / this.maxTime) * this.timelineWidth;
        const shootDuration = 0.6;
        const width = (shootDuration / this.maxTime) * this.timelineWidth;
        
        const bar = this.scene.add.rectangle(
          xPos - this.x,
          yPos - this.y,
          Math.max(width, 20),
          unitHeight,
          0xff0000,
          1.0
        ).setOrigin(0, 0).setDepth(902);
        
        this.container.add(bar);
        
        if (!this.actionBars.has(unitId)) {
          this.actionBars.set(unitId, []);
        }
        this.actionBars.get(unitId)!.push(bar);
      }

      unitIndex++;
    });

    // Draw playhead on top
    const playheadX = this.x + (this.currentTime / this.maxTime) * this.timelineWidth;
    this.graphics.lineStyle(2, 0xffff00, 1);
    this.graphics.lineBetween(playheadX, this.y, playheadX, this.y + this.timelineHeight);
  }

  private calculateMoveTime(from: { x: number, y: number }, to: { x: number, y: number }): number {
    const distance = Math.sqrt(
      Math.pow(to.x - from.x, 2) +
      Math.pow(to.y - from.y, 2)
    );
    const speedPerSecond = 5.0 * 60;
    return distance / speedPerSecond;
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
    this.graphics.setVisible(visible);
  }

  setScale(scale: number) {
    this.container.setScale(scale);
    this.graphics.setScale(scale);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getGraphics(): Phaser.GameObjects.Graphics {
    return this.graphics;
  }

  setPosition(x: number, y: number) {
    // Update position
    const deltaX = x - this.x;
    const deltaY = y - this.y;
    
    this.x = x;
    this.y = y;
    
    // Move container
    this.container.setPosition(x, y);
    
    // Redraw graphics at new position
    this.graphics.clear();
    this.draw();
  }

  destroy() {
    this.container.destroy();
    this.graphics.destroy();
  }
}
