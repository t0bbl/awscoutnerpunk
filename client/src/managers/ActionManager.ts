import type { PlayerAction, GameState, Unit } from 'shared';
import { ActionType, UNIT_MOVE_SPEED } from 'shared';

/**
 * Manages planned actions for units and tracks execution progress.
 * 
 * This class handles:
 * - Storing multiple actions per unit in execution order
 * - Tracking which action each unit is currently executing
 * - Detecting when actions complete
 * - Managing state for action completion detection
 * 
 * @example
 * ```typescript
 * const manager = new ActionManager();
 * manager.addAction('unit1', moveAction);
 * manager.addAction('unit1', shootAction);
 * manager.startExecution();
 * 
 * // During execution loop:
 * const currentActions = manager.getCurrentActions();
 * // ... run simulation tick ...
 * manager.updateProgress(newState);
 * ```
 */
export class ActionManager {
  private plannedActions: Map<string, PlayerAction[]> = new Map();
  private actionProgress: Map<string, number> = new Map();
  private previousActionStates: Map<string, { magazineAmmo: number }> = new Map();

  /**
   * Add an action to a unit's action queue.
   * Actions are executed in the order they are added.
   * 
   * @param unitId - The ID of the unit to add the action to
   * @param action - The action to add
   */
  addAction(unitId: string, action: PlayerAction): void {
    const existing = this.plannedActions.get(unitId) || [];
    existing.push(action);
    this.plannedActions.set(unitId, existing);
  }

  /**
   * Get all actions for a specific unit.
   * 
   * @param unitId - The ID of the unit
   * @returns Array of actions for the unit, or empty array if none
   */
  getActions(unitId: string): PlayerAction[] {
    return this.plannedActions.get(unitId) || [];
  }

  /**
   * Get all planned actions for all units.
   * 
   * @returns Map of unitId to array of actions
   */
  getAllActions(): Map<string, PlayerAction[]> {
    return this.plannedActions;
  }

  /**
   * Get the current action being executed for each unit.
   * Only returns actions that haven't completed yet.
   * 
   * @returns Array of actions currently being executed
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
   * Get the last action for each unit (for timeline display).
   * Used to show a simplified view of planned actions.
   * 
   * @returns Map of unitId to their last planned action
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
   * Capture state before simulation tick for shoot actions.
   * This stores the unit's ammo count before they shoot, so we can
   * detect when the shot completes by comparing ammo after the tick.
   * 
   * @param currentActions - Actions being executed this tick
   * @param state - Current game state
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
   * Update action progress based on completion.
   * Checks if the current action for each unit has completed,
   * and if so, advances to the next action in their queue.
   * 
   * @param state - Game state after simulation tick
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
   * Check if an action is complete.
   * 
   * Movement: Complete when unit is within 2 steps of target
   * Shooting: Complete when ammo has decreased (shot was fired)
   * 
   * @param action - The action to check
   * @param unit - The unit performing the action
   * @returns true if action is complete, false otherwise
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
   * Initialize action progress for execution phase.
   * Resets all progress tracking and prepares for execution.
   * Call this when transitioning from planning to execution phase.
   */
  startExecution(): void {
    this.actionProgress.clear();
    this.previousActionStates.clear();
    this.plannedActions.forEach((actions, unitId) => {
      this.actionProgress.set(unitId, 0);
    });
  }

  /**
   * Clear all actions and progress.
   * Removes all planned actions and resets tracking state.
   * Call this after execution completes or when canceling actions.
   */
  clear(): void {
    this.plannedActions.clear();
    this.actionProgress.clear();
    this.previousActionStates.clear();
  }

  /**
   * Check if a unit has any planned actions.
   * 
   * @param unitId - The ID of the unit to check
   * @returns true if unit has actions, false otherwise
   */
  hasActions(unitId: string): boolean {
    const actions = this.plannedActions.get(unitId);
    return actions !== undefined && actions.length > 0;
  }

  /**
   * Get the number of actions for a unit.
   * 
   * @param unitId - The ID of the unit
   * @returns Number of planned actions, or 0 if none
   */
  getActionCount(unitId: string): number {
    return this.plannedActions.get(unitId)?.length || 0;
  }
}
