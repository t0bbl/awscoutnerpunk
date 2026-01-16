# Timeline-Based Action Planning System

## Current Status
- Basic timeline visualization working (0-3 seconds)
- Shows movement bars (blue) and shooting bars (red)
- Single action per unit (move OR shoot, or move-then-shoot)
- Actions execute in sequence

## Goal: Advanced Timeline Planning
Allow players to schedule multiple actions at specific times within the 3-second execution window.

## Design

### UI Changes
1. **Timeline Tracks per Unit**
   - Each selected unit gets its own timeline track
   - Separate rows for: Movement, Shooting, (future: Grenades, Overwatch)
   
2. **Interactive Timeline**
   - Click on timeline to add actions at specific times
   - Drag actions to reschedule them
   - Right-click to delete actions
   - Visual feedback for valid/invalid placements

3. **Action Types**
   - **Movement Waypoints**: Click ground → Click timeline position → Creates waypoint
   - **Scheduled Shots**: Right-click enemy → Click timeline position → Schedules shot
   - Actions show duration/timing on timeline

### Data Structure Changes

```typescript
// New: Multiple scheduled actions per unit
interface ScheduledAction {
  action: PlayerAction;
  startTime: number; // Seconds into execution (0-3)
  duration: number; // How long the action takes
}

// GameScene
private plannedActions: Map<string, ScheduledAction[]> = new Map();
```

### Implementation Steps

#### Phase 1: Data Structure (NEXT)
- [ ] Change `plannedActions` from `Map<string, PlayerAction>` to `Map<string, ScheduledAction[]>`
- [ ] Update all code that reads/writes plannedActions
- [ ] Add `scheduledTime` field to PlayerAction type

#### Phase 2: Timeline Interaction
- [ ] Make timeline clickable to get time position
- [ ] Add mode selection: "Add Waypoint" vs "Add Shot"
- [ ] Click timeline → store pending action with time
- [ ] Click world → complete the action (position/target)

#### Phase 3: Multiple Waypoints
- [ ] Allow adding multiple movement waypoints
- [ ] Show path preview connecting all waypoints
- [ ] Calculate cumulative movement time
- [ ] Execute waypoints in sequence

#### Phase 4: Multiple Shots
- [ ] Allow scheduling multiple shots at different times
- [ ] Show shot bars at scheduled times
- [ ] Execute shots when execution time reaches scheduled time
- [ ] Handle ammo/reload constraints

#### Phase 5: Validation & Constraints
- [ ] Prevent overlapping actions
- [ ] Show invalid placements (red)
- [ ] Enforce reload times
- [ ] Check if unit can reach position in time

## Current Blockers
- Zoom functionality disabled (will fix later)
- Need to refactor action execution system in simulation.ts

## Notes
- Keep it simple initially - just waypoints and shots
- Add drag-to-reorder later
- Consider undo/redo system
