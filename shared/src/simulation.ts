// Deterministic simulation engine
import { 
  GameState, 
  PlayerAction, 
  Unit, 
  Vector2, 
  ActionType,
  GamePhase,
  MoveAction,
  ShootAction,
  OverwatchAction,
  WeaponType,
} from './types';
import { 
  UNIT_MOVE_SPEED, 
  VISIBILITY_RANGE,
  WEAPON_STATS,
  UNIT_MAX_HEALTH,
} from './constants';

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Simple LCG for deterministic randomness
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export class Simulation {
  private state: GameState;
  private rng: SeededRandom;

  constructor(initialState: GameState) {
    this.state = this.cloneState(initialState);
    this.rng = new SeededRandom(initialState.seed);
  }

  tick(actions: PlayerAction[]): GameState {
    this.state.tick++;
    
    if (this.state.phase === GamePhase.EXECUTION) {
      this.executeActions(actions);
      this.updateVisibility();
      this.checkRoundEnd();
    }
    
    return this.cloneState(this.state);
  }

  private executeActions(actions: PlayerAction[]): void {
    // Sort actions by priority: overwatch > shoot > move
    const sortedActions = this.sortActionsByPriority(actions);
    
    for (const action of sortedActions) {
      const unit = this.getUnit(action.unitId);
      if (!unit || !unit.isAlive) continue;

      switch (action.actionType) {
        case ActionType.MOVE:
          this.processMove(unit, action as MoveAction);
          break;
        case ActionType.SHOOT:
          this.processShoot(unit, action as ShootAction);
          break;
        case ActionType.OVERWATCH:
          this.processOverwatch(unit, action as OverwatchAction);
          break;
      }
    }
  }

  private sortActionsByPriority(actions: PlayerAction[]): PlayerAction[] {
    const priority = {
      [ActionType.OVERWATCH]: 0,
      [ActionType.SHOOT]: 1,
      [ActionType.MOVE]: 2,
      [ActionType.THROW_GRENADE]: 1,
      [ActionType.IDLE]: 3,
    };

    return [...actions].sort((a, b) => {
      const aPrio = priority[a.actionType];
      const bPrio = priority[b.actionType];
      
      if (aPrio !== bPrio) return aPrio - bPrio;
      
      // If same priority, use weapon reaction speed
      const unitA = this.getUnit(a.unitId);
      const unitB = this.getUnit(b.unitId);
      
      if (unitA && unitB) {
        const reactionA = WEAPON_STATS[unitA.weapon].reactionSpeed;
        const reactionB = WEAPON_STATS[unitB.weapon].reactionSpeed;
        return reactionB - reactionA; // Higher reaction speed goes first
      }
      
      return 0;
    });
  }

  private processMove(unit: Unit, action: MoveAction): void {
    if (!action.targetPosition) return;

    const direction = this.normalize({
      x: action.targetPosition.x - unit.position.x,
      y: action.targetPosition.y - unit.position.y,
    });

    const distance = this.distance(unit.position, action.targetPosition);
    const moveDistance = Math.min(UNIT_MOVE_SPEED, distance);

    unit.position.x += direction.x * moveDistance;
    unit.position.y += direction.y * moveDistance;
    unit.isMoving = moveDistance > 0.1;
    unit.velocity = direction;
  }

  private processShoot(unit: Unit, action: ShootAction): void {
    const target = this.getUnit(action.targetUnitId);
    if (!target || !target.isAlive) return;

    const hitChance = this.calculateHitChance(unit, target);
    const roll = this.rng.next();

    if (roll <= hitChance) {
      const damage = WEAPON_STATS[unit.weapon].damage;
      target.health -= damage;
      
      if (target.health <= 0) {
        target.health = 0;
        target.isAlive = false;
      }
    }
  }

  private processOverwatch(unit: Unit, action: OverwatchAction): void {
    // Overwatch is passive - it triggers when enemies move into cone
    // For now, just mark the unit as in overwatch state
    unit.isMoving = false;
  }

  private calculateHitChance(shooter: Unit, target: Unit): number {
    const weaponStats = WEAPON_STATS[shooter.weapon];
    const distance = this.distance(shooter.position, target.position);
    
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

  private updateVisibility(): void {
    // Clear all visibility
    for (const unit of this.state.units) {
      unit.visibleEnemyIds = [];
    }

    // Check visibility between all units
    for (let i = 0; i < this.state.units.length; i++) {
      for (let j = i + 1; j < this.state.units.length; j++) {
        const unitA = this.state.units[i];
        const unitB = this.state.units[j];

        // Only check between different teams
        if (unitA.playerId === unitB.playerId) continue;
        if (!unitA.isAlive || !unitB.isAlive) continue;

        const distance = this.distance(unitA.position, unitB.position);
        
        if (distance <= VISIBILITY_RANGE) {
          // TODO: Add line-of-sight check with obstacles
          unitA.visibleEnemyIds.push(unitB.id);
          unitB.visibleEnemyIds.push(unitA.id);
          
          // Update last known positions
          unitA.lastKnownEnemyPositions.set(unitB.id, { ...unitB.position });
          unitB.lastKnownEnemyPositions.set(unitA.id, { ...unitA.position });
        }
      }
    }
  }

  private checkRoundEnd(): void {
    const alivePlayers = new Set(
      this.state.units.filter(u => u.isAlive).map(u => u.playerId)
    );

    if (alivePlayers.size <= 1) {
      this.state.phase = GamePhase.ROUND_END;
    }
  }

  private getUnit(unitId: string): Unit | undefined {
    return this.state.units.find(u => u.id === unitId);
  }

  private distance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private normalize(v: Vector2): Vector2 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  }

  private cloneState(state: GameState): GameState {
    return {
      ...state,
      units: state.units.map(u => ({
        ...u,
        position: { ...u.position },
        velocity: { ...u.velocity },
        visibleEnemyIds: [...u.visibleEnemyIds],
        lastKnownEnemyPositions: new Map(u.lastKnownEnemyPositions),
      })),
    };
  }

  getState(): GameState {
    return this.cloneState(this.state);
  }

  setPhase(phase: GamePhase): void {
    this.state.phase = phase;
  }
}
