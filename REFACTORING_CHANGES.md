# GameScene Refactoring - ActionManager Integration

## Changes to Make

### 1. Add Import
```typescript
import { ActionManager } from '../managers/ActionManager';
```

### 2. Replace Private Fields
**Remove:**
```typescript
private plannedActions: Map<string, PlayerAction[]> = new Map();
private actionProgress: Map<string, number> = new Map();
private previousActionStates: Map<string, { magazineAmmo: number }> = new Map();
```

**Add:**
```typescript
private actionManager: ActionManager = new ActionManager();
```

### 3. Update Methods

#### handleClick()
**Change:**
```typescript
const existing = this.plannedActions.get(this.selectedUnit) || [];
existing.push(action);
this.plannedActions.set(this.selectedUnit, existing);
```

**To:**
```typescript
this.actionManager.addAction(this.selectedUnit, action);
```

#### handleRightClick()
**Change:**
```typescript
const existing = this.plannedActions.get(this.selectedUnit) || [];
existing.push(action);
this.plannedActions.set(this.selectedUnit, existing);
```

**To:**
```typescript
this.actionManager.addAction(this.selectedUnit, action);
```

#### drawMovementPreviews()
**Change:**
```typescript
this.plannedActions.forEach((actions, unitId) => {
```

**To:**
```typescript
this.actionManager.getAllActions().forEach((actions, unitId) => {
```

#### drawShootingPreviews()
**Change:**
```typescript
this.plannedActions.forEach((actions, unitId) => {
```

**To:**
```typescript
this.actionManager.getAllActions().forEach((actions, unitId) => {
```

#### updateUI()
**Change:**
```typescript
const plannedCount = this.plannedActions.size;
```

**To:**
```typescript
const plannedCount = this.actionManager.getAllActions().size;
```

#### updateUnitSprite()
**Change:**
```typescript
} else if (this.plannedActions.has(unit.id)) {
```

**To:**
```typescript
} else if (this.actionManager.hasActions(unit.id)) {
```

#### getLastActionsForTimeline()
**Change:**
```typescript
const result = new Map<string, PlayerAction>();
this.plannedActions.forEach((actions, unitId) => {
  if (actions.length > 0) {
    result.set(unitId, actions[actions.length - 1]);
  }
});
return result;
```

**To:**
```typescript
return this.actionManager.getLastActions();
```

#### handleReadyButton()
**Change:**
```typescript
this.actionProgress.clear();
this.previousActionStates.clear();
this.plannedActions.forEach((actions, unitId) => {
  this.actionProgress.set(unitId, 0);
});
```

**To:**
```typescript
this.actionManager.startExecution();
```

**Change:**
```typescript
const currentActions = this.getCurrentActions();
```

**To:**
```typescript
const currentActions = this.actionManager.getCurrentActions();
```

**Change:**
```typescript
this.capturePreTickState(currentActions);
```

**To:**
```typescript
if (this.currentState) {
  this.actionManager.capturePreTickState(currentActions, this.currentState);
}
```

**Change:**
```typescript
this.updateActionProgress(newState);
```

**To:**
```typescript
this.actionManager.updateProgress(newState);
```

**Change:**
```typescript
this.actionProgress.clear();
this.plannedActions.clear();
```

**To:**
```typescript
this.actionManager.clear();
```

#### Remove These Methods (now in ActionManager)
- `getCurrentActions()`
- `capturePreTickState()`
- `updateActionProgress()`

## Testing After Changes
1. Build: `npm run build` in client folder
2. Manual test: Multiple waypoints
3. Manual test: Multiple shots
4. Manual test: Mixed sequence

## Benefits
- GameScene is 150+ lines shorter
- Action management logic is isolated and testable
- Clearer separation of concerns
- Easier to add new action types
