import type { PlayerAction, GameState, Unit } from 'shared';
import { ActionType, UNIT_MOVE_SPEED } from 'shared';

/**
 * Manages planned actions for units and tracks execution progress
 */
export class ActionManager {
  private plannedActions: Map<string, PlayerAction[]> = new Map();
  private actionProgress: Map<string, number> = new Map();
  private previousActionStates: Map<string, { magazineAmmo: number }> = new Map();

  /**
   * Add an action to a unit's action queue
   */
  addAction(unitId: string, action: PlayerAction): void {
    const existing = this.plannedActions.get(unitId) || [];
    existing.push(action);
    this.plannedActions.set(unitId, existing);
  }

  /**
   * Get all actions for a unit
   */
  getActions(unitId: string): PlayerAction[] {
    return this.plannedActions.get(unitId) || [];
  }

  /**
   * Get all planned actions (for all units)
   */
  getAllActions(): Map<string, PlayerAction[]> {
    return this.plannedActions;
  }

  /**
   * Get the current action being executed for each unit
   */
  getCurrentActions(): PlayerAction[] {
    const currentActions: PlayerAction[] = [];
    
    this.plannedActions.forEach((actions, unitId) => {
      const actionIndex = this.actionProgress.get(unitId) || 0;
      
      if (actionIndex < actions.length) {
        currentActions.push(actions[actionIndex]);
      }
    });
    
    return currentActions;
  }

  /**
   * Get the last action for each unit (for timeline display)
   */
  getLastActions(): Map<string, PlayerAction> {
    const result = new Map<string, PlayerAction>();
    this.plannedActions.forEach((actions, unitId) => {
      if (actions.length > 0) {
        result.set(unitId, actions[actions.length - 1]);
      }
    });
    return result;
  }

  /**
   * Capture state before simulation tick for shoot actions
   */
  capturePreTickState(currentActions: PlayerAction[], state: GameState): void {
    currentActions.forEach(action => {
      if (action.actionType === ActionType.SHOOT) {
        const unit = state.units.find(u => u.id === action.unitId);
        if (unit && !this.previousActionStates.has(action.unitId)) {
          this.previousActionStates.set(action.unitId, {
            magazineAmmo: unit.magazineAmmo
          });
        }
      }
    });
  }

  /**
   * Update action progress based on completion
   */
  updateProgress(state: GameState): void {
    this.plannedActions.forEach((actions, unitId) => {
      const actionIndex = this.actionProgress.get(unitId) || 0;
      if (actionIndex >= actions.length) return;
      
      const currentAction = actions[actionIndex];
      const unit = state.units.find(u => u.id === unitId);
      if (!unit) return;
      
      const isComplete = this.isActionComplete(currentAction, unit);
      
      if (isComplete) {
        const nextIndex = actionIndex + 1;
        this.actionProgress.set(unitId, nextIndex);
        this.previousActionStates.delete(unitId);
      }
    });
  }

  /**
   * Check if an action is complete
   */
  private isActionComplete(action: PlayerAction, unit: Unit): boolean {
    if (action.actionType === ActionType.MOVE && action.targetPosition) {
      const distance = Math.sqrt(
        Math.pow(unit.position.x - action.targetPosition.x, 2) +
        Math.pow(unit.position.y - action.targetPosition.y, 2)
      );
      return distance < (UNIT_MOVE_SPEED * 2);
    }
    
    if (action.actionType === ActionType.SHOOT) {
      const prevState = this.previousActionStates.get(unit.id);
      if (prevState) {
        return prevState.magazineAmmo > unit.magazineAmmo;
      }
    }
    
    return false;
  }

  /**
   * Initialize action progress for execution
   */
  startExecution(): void {
    this.actionProgress.clear();
    this.previousActionStates.clear();
    this.plannedActions.forEach((actions, unitId) => {
      this.actionProgress.set(unitId, 0);
    });
  }

  /**
   * Clear all actions and progress
   */
  clear(): void {
    this.plannedActions.clear();
    this.actionProgress.clear();
    this.previousActionStates.clear();
  }

  /**
   * Check if a unit has any planned actions
   */
  hasActions(unitId: string): boolean {
    const actions = this.plannedActions.get(unitId);
    return actions !== undefined && actions.length > 0;
  }

  /**
   * Get the number of actions for a unit
   */
  getActionCount(unitId: string): number {
    return this.plannedActions.get(unitId)?.length || 0;
  }
}
