# Refactoring Plan

## Current Working Features (DO NOT BREAK!)

### Multiple Actions System
✅ Units can have multiple planned actions (moves and shoots)
✅ Actions execute sequentially, one at a time
✅ Movement: Unit moves through waypoints in order
✅ Shooting: Unit shoots targets one by one
✅ hasShot flag resets between shooting actions
✅ Accuracy bloom increases with each shot
✅ Magazine system with reload
✅ Visual feedback: muzzle flash, bullet tracers, hit/miss indicators

### Manual Test Cases (verify after refactoring)
1. **Multiple Waypoints**: Click ground 3 times → unit moves through all 3 waypoints
2. **Multiple Shots**: Right-click 3 enemies → unit shoots all 3 in sequence
3. **Mixed Sequence**: move → shoot → move → shoot → unit executes all actions
4. **Accuracy Bloom**: Multiple shots → bloom increases, accuracy decreases
5. **Magazine Empty**: Shoot until empty → reload triggers automatically

## Code Cleanup Targets

### GameScene.ts (client/src/scenes/GameScene.ts)
**Issues:**
- Too many responsibilities (rendering, input, simulation, action tracking)
- Long methods (handleReadyButton is 100+ lines)
- Duplicate state tracking (previousUnitStates, previousActionStates)
- Mixed concerns (UI updates, game logic, action management)

**Refactoring:**
1. Extract ActionManager class
   - Manages plannedActions Map
   - Tracks actionProgress
   - Handles action completion detection
   - Methods: addAction, getCurrentActions, updateProgress, clear

2. Extract InputHandler class
   - Handles click, right-click, pointer move
   - Manages selectedUnit
   - Methods: handleClick, handleRightClick, handlePointerMove

3. Extract ExecutionManager class
   - Manages execution phase
   - Handles tick loop
   - Coordinates with ActionManager
   - Methods: startExecution, stopExecution, tick

4. Simplify GameScene
   - Keep only: scene lifecycle, rendering, coordination
   - Delegate to managers
   - Cleaner, more testable

### Simulation.ts (shared/src/simulation.ts)
**Issues:**
- resetUnitHasShot is a workaround for action sequencing
- hasShot flag design is awkward for multiple actions

**Refactoring:**
1. Consider removing hasShot flag entirely
   - Use cooldown/fire rate instead
   - More flexible for multiple actions
   - Cleaner design

2. OR: Make hasShot per-action instead of per-round
   - Track last shot tick
   - Allow multiple shots with proper timing

### TimelineUI.ts (client/src/ui/TimelineUI.ts)
**Issues:**
- Only shows last action per unit
- Doesn't visualize full action sequence
- Timeline interaction not implemented

**Future Work** (not urgent):
- Show all actions with timing
- Click timeline to schedule actions
- Drag to reschedule

### Types (shared/src/types.ts)
**Issues:**
- PlayerAction has optional fields that make it confusing
- moveBeforeAction is a hack for move-then-shoot

**Refactoring:**
1. Consider separate action types:
   ```typescript
   type MoveAction = { type: 'MOVE', unitId: string, target: Vector2 }
   type ShootAction = { type: 'SHOOT', unitId: string, targetId: string }
   type PlayerAction = MoveAction | ShootAction
   ```

2. Remove moveBeforeAction - client handles sequencing

## Refactoring Order

### Phase 1: Extract Managers (Low Risk)
1. Create ActionManager class
2. Create InputHandler class
3. Update GameScene to use them
4. Test manually

### Phase 2: Simplify Simulation (Medium Risk)
1. Review hasShot flag usage
2. Design better solution
3. Implement and test

### Phase 3: Clean Up Types (Low Risk)
1. Simplify PlayerAction
2. Remove unused fields
3. Update all usages

### Phase 4: Polish (Low Risk)
1. Remove console.logs
2. Add proper error handling
3. Add comments
4. Format code

## Success Criteria
- All manual test cases still pass
- Code is more readable
- Classes have single responsibilities
- No duplicate logic
- Easier to add new features

## Notes
- Do ONE phase at a time
- Test after each change
- Keep git commits small
- Can rollback if something breaks
