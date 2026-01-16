# Next Steps for Timeline Planning

## What We Accomplished This Session ✓
1. **Basic game mechanics working**
   - Movement, shooting, accuracy bloom, magazine system
   - 3-second execution phase
   - Timeline visualization
   - Visual effects (muzzle flash, bullet tracers)
   
2. **UI improvements**
   - Fixed UI positioning (doesn't scroll with camera)
   - Disabled zoom (will fix later with proper UI camera)
   
3. **Mode system started**
   - Added MOVE MODE and SHOOT MODE buttons
   - Buttons highlight active mode
   - Click behavior changes based on mode

## Current Issue
- File got corrupted during refactor to support multiple actions per unit
- Need to clean up and complete the refactor

## What Needs to Be Done

### Immediate (Fix Current Code)
1. Clean up GameScene.ts - remove duplicate methods
2. Complete the refactor to `Map<string, PlayerAction[]>`
3. Test that multiple actions work (move, move, shoot, shoot)

### Short Term (Multiple Actions Working)
1. Show all waypoints connected with lines
2. Show all shoot targets with crosshairs
3. Execute actions in sequence during execution phase
4. Update timeline to show all actions

### Medium Term (Timeline Interaction)
1. Make timeline clickable
2. Click timeline to schedule action at specific time
3. Drag actions on timeline to reschedule
4. Right-click to delete actions

### Long Term (Full System)
1. Separate tracks for movement vs shooting
2. Validation (prevent overlapping actions)
3. Show action conflicts
4. Undo/redo system
5. Save/load action plans

## Technical Approach

### Data Structure
```typescript
// Current (broken):
private plannedActions: Map<string, PlayerAction[]>;

// Each unit has an array of actions
// Actions execute in order during execution phase
```

### Execution
- Simulation needs to handle multiple actions per unit
- Actions execute sequentially (move to waypoint 1, then waypoint 2, then shoot)
- Timeline shows when each action happens based on cumulative time

### UI Flow
1. Select unit
2. Choose mode (MOVE or SHOOT)
3. Click world to add action
4. Repeat to add more actions
5. Click READY to execute all

## Files to Fix
- `client/src/scenes/GameScene.ts` - Main file with corruption
- `shared/src/simulation.ts` - May need updates for multiple actions
- `client/src/ui/TimelineUI.ts` - Update to show multiple actions

## Recommendation
Start fresh session with clean GameScene.ts, implementing multiple actions properly from the start.
