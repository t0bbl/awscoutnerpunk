# Simulation System

## Overview

The core simulation engine is fully deterministic and runs identically on both client and server. This ensures perfect replay capability and prevents desync issues.

## Key Features

### Deterministic Execution
- Fixed tick rate (60 ticks/second)
- Seeded random number generator (LCG algorithm)
- No frame-rate dependent logic
- Identical results given same seed and inputs

### Action Priority System
Actions are resolved in strict priority order:
1. **Overwatch** (highest priority)
2. **Shoot** / **Throw Grenade**
3. **Move** (lowest priority)

Within the same priority level, weapon reaction speed determines order (faster weapons go first).

### Combat System

**Hit Chance Calculation:**
```
Base Accuracy (from weapon)
- Distance penalty (beyond optimal range)
- Shooter movement penalty (50% if moving)
- Target movement bonus (30% harder to hit)
= Final hit chance (clamped 5%-95%)
```

**Damage:**
- Direct from weapon stats
- TODO: Kevlar/helmet reduction
- TODO: Cover bonuses

### Visibility System
- Units can see enemies within visibility range (50 units)
- Last known positions are tracked
- TODO: Line-of-sight checks with obstacles
- TODO: Fog of war rendering

## Game Phases

1. **PLANNING** - Players plan actions (30 seconds)
2. **EXECUTION** - Actions execute simultaneously, deterministic
3. **ROUND_END** - One team eliminated

## Testing

Run simulation tests:
```bash
npx tsx shared/src/simulation.test.ts
```

Tests verify:
- State initialization
- Tick progression
- Unit movement
- Deterministic RNG (same seed = same results)

## Usage Example

```typescript
import { Simulation, createInitialGameState } from 'shared';

// Create game
const state = createInitialGameState('player1', 'player2', 12345);
const sim = new Simulation(state);

// Execute actions
const actions = [{
  unitId: 'p1_unit1',
  actionType: ActionType.MOVE,
  targetPosition: { x: 20, y: 20 },
}];

const newState = sim.tick(actions);
```

## Next Steps

- [ ] Implement overwatch triggering
- [ ] Add grenade physics
- [ ] Line-of-sight checks
- [ ] Cover system
- [ ] Kevlar/helmet damage reduction
- [ ] Stance (crouch) mechanics
