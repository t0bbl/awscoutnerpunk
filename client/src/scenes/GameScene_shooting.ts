// Shooting-related methods for GameScene
// This file contains the shooting mechanics implementation

import type { Unit, PlayerAction } from 'shared';
import { ActionType } from 'shared';
import { WEAPON_STATS } from 'shared';

export function handleRightClick(this: any, worldX: number, worldY: number) {
  console.log(`Right click at (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
  
  // Only allow planning during planning phase
  if (this.currentState?.phase !== 'PLANNING') {
    console.log('Not in planning phase');
    return;
  }

  if (!this.selectedUnit) {
    console.log('No unit selected');
    return;
  }

  // Check if clicked on an enemy unit
  let clickedUnit: string | null = null;

  this.unitSprites.forEach((container: any, id: string) => {
    const bounds = { x: container.x, y: container.y, radius: 20 };
    const distance = Math.sqrt(
      Math.pow(worldX - bounds.x, 2) + Math.pow(worldY - bounds.y, 2)
    );

    if (distance <= bounds.radius) {
      clickedUnit = id;
    }
  });

  if (clickedUnit) {
    const shooter = this.currentState.units.find((u: Unit) => u.id === this.selectedUnit);
    const target = this.currentState.units.find((u: Unit) => u.id === clickedUnit);

    if (shooter && target && shooter.playerId !== target.playerId) {
      console.log(`Planning shoot: ${this.selectedUnit} -> ${clickedUnit}`);
      
      // Create shoot action
      const action: PlayerAction = {
        unitId: this.selectedUnit,
        actionType: ActionType.SHOOT,
        targetUnitId: clickedUnit,
      };
      
      this.plannedActions.set(this.selectedUnit, action);
      this.drawShootingPreviews();
      this.updateUI(this.currentState);
    } else {
      console.log('Cannot shoot friendly unit');
    }
  }
}

export function handlePointerMove(this: any, worldX: number, worldY: number) {
  if (!this.currentState) return;

  // Find hovered unit
  let hoveredUnit: string | null = null;

  this.unitSprites.forEach((container: any, id: string) => {
    const bounds = { x: container.x, y: container.y, radius: 20 };
    const distance = Math.sqrt(
      Math.pow(worldX - bounds.x, 2) + Math.pow(worldY - bounds.y, 2)
    );

    if (distance <= bounds.radius) {
      hoveredUnit = id;
    }
  });

  if (hoveredUnit !== this.hoveredUnit) {
    this.hoveredUnit = hoveredUnit;
    this.updateUI(this.currentState);
  }
}

export function drawShootingPreviews(this: any) {
  this.shootingPreviewGraphics.clear();

  if (!this.currentState) return;

  // Draw planned shooting actions
  this.plannedActions.forEach((action: PlayerAction, unitId: string) => {
    if (action.actionType !== ActionType.SHOOT || !action.targetUnitId) return;

    const shooter = this.currentState!.units.find((u: Unit) => u.id === unitId);
    const target = this.currentState!.units.find((u: Unit) => u.id === action.targetUnitId);
    
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

export function calculateHitChance(this: any, shooter: Unit, target: Unit): number {
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
