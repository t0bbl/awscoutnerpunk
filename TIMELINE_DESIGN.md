# Timeline-Based Planning System

## Core Concept

Inspired by Phantom Brigade, we use a **fixed future window** instead of traditional turns.

### Key Principles

1. **Fixed Execution Window**: Planning phase schedules actions for the next 5-10 seconds
2. **Time-Based Actions**: Every action has start time and duration (not action points)
3. **Simultaneous Resolution**: All units on same timeline, deterministic execution
4. **Accuracy Bloom**: Post-shot inaccuracy that recovers over time
5. **Magazine Management**: Limited ammo with reload times

## Timeline Structure

```
Planning Phase (30 seconds):
├─ Player schedules actions on timeline
├─ See predicted outcomes
└─ Commit when ready

Execution Phase (5-10 seconds):
├─ All actions execute on shared timeline
├─ Deterministic resolution
└─ Return to planning
```

## Action Types & Timing

### Movement
- **Duration**: Distance / speed
- **Continuous**: Occupies entire duration
- **Can be interrupted**: By other actions

### Shooting
- **Single Shot**:
  - Aim time: 0.2s
  - Fire: 0.1s
  - Recovery: 0.3s
  - Total: ~0.6s per shot
- **Burst Fire**:
  - Multiple shots with bloom
  - Each shot increases inaccuracy
  - Recovery between bursts

### Reload
- **Duration**: Weapon-specific (1.5s - 3.0s)
- **Vulnerable**: Cannot shoot during reload
- **Automatic**: Triggered when magazine empty

### Overwatch
- **Duration**: Entire execution window
- **Conditional**: Triggers when enemy enters cone
- **Accuracy**: Depends on weapon state at trigger time

## Accuracy System

### Base Accuracy
- Weapon-specific base value
- Modified by distance, stance, cover

### Accuracy Bloom
```
After each shot:
- Accuracy decreases by bloom amount
- Recovers over time at recovery rate
- Stacks with multiple shots

Example (M4):
Shot 1 at t=0.0: 90% → 70% accuracy
Shot 2 at t=0.6: 70% → 50% accuracy
Wait until t=2.0: 50% → 80% recovered
```

### Bloom Parameters (per weapon)
- **Bloom per shot**: How much accuracy degrades
- **Recovery rate**: Accuracy regained per second
- **Max bloom**: Minimum accuracy floor

## Magazine System

### Magazine Size
- Weapon-specific (7-30 rounds)
- Tracked per unit
- Visible in planning UI

### Reload Mechanics
- **Automatic**: When magazine empty
- **Manual**: Player can schedule early reload
- **Duration**: 1.5s - 3.0s depending on weapon
- **Vulnerable**: Unit cannot fire during reload

### Tactical Implications
- Reload timing matters
- Overwatch during reload = death
- Burst control to avoid mid-fight reload

## Planning UI Requirements

### Timeline Visualization
- Horizontal time axis (0-5 seconds)
- Unit actions shown as bars
- Predicted enemy actions (last known)

### Per-Action Feedback
- **Movement**: Path, duration, exposure time
- **Shooting**: Hit chance per shot, bloom visualization
- **Reload**: Duration bar, vulnerability indicator
- **Overwatch**: Cone, trigger conditions, accuracy at trigger

### Real-Time Indicators
- Current accuracy (with bloom)
- Rounds remaining
- Reload status
- Action conflicts

## Implementation Phases

### Phase 1: Timeline Foundation ✓
- Fixed execution window
- Time-based action scheduling
- Simultaneous resolution

### Phase 2: Accuracy Bloom (Next)
- Per-weapon bloom parameters
- Accuracy degradation per shot
- Time-based recovery
- UI visualization

### Phase 3: Magazine System
- Magazine tracking
- Reload actions
- Automatic reload triggers
- Ammo UI

### Phase 4: Timeline UI
- Visual timeline editor
- Action bars
- Predicted outcomes
- Scrubbing/preview

### Phase 5: Advanced Overwatch
- Conditional triggers
- Accuracy at trigger time
- Reaction speed integration

## Why This Works

1. **Deterministic**: Same inputs = same outputs
2. **Readable**: Player sees exactly what will happen
3. **Skill-based**: Timing and positioning matter
4. **Fair**: No hidden mechanics or RNG surprises
5. **Replayable**: Perfect replay support
6. **CS-inspired**: Familiar accuracy/spray patterns
