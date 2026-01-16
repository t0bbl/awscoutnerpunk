# Rendering System

## Overview

The client uses Phaser 3 to render the game state. The rendering is completely separate from simulation - the client just visualizes what the server tells it.

## Scenes

### MenuScene
- Connection status display
- "Find Match" button (connects to real multiplayer)
- "Local Test" button (shows test units for development)

### GameScene
Main gameplay scene with:
- Unit rendering (circles with health bars)
- Grid background
- Camera controls (WASD + mouse wheel zoom)
- Unit selection (click to select)
- UI overlay (phase, round, tick count)

## Unit Visualization

Each unit is rendered as a `Phaser.GameObjects.Container` with:

**Components:**
- **Body**: Colored circle (green = friendly, red = enemy)
- **Direction indicator**: Triangle showing movement direction
- **Health bar**: Color-coded (green > yellow > red)
- **ID text**: Shows unit identifier
- **Selection highlight**: Yellow border when selected

**Colors:**
- Your units: Green (#00ff00)
- Enemy units: Red (#ff0000)
- Selected unit: Yellow border (#ffff00)

## Camera Controls

- **WASD / Arrow Keys**: Pan camera
- **Mouse Wheel**: Zoom in/out (0.5x - 2x)

## Interaction

**Click on unit**: Select it (shows yellow border)
**Click on ground**: Move selected unit (TODO: send action to server)

## State Updates

The scene listens for state updates via NetworkManager callbacks:

```typescript
network.onGameState = (state: GameState) => {
  // Update all unit positions, health, etc.
};

network.onMatchStart = (matchId: string, state: GameState) => {
  // Initialize match
};
```

## Local Testing

The "Local Test" button creates a test state with 6 units (3 per team) for development without needing a server match.

## Next Steps

- [ ] Add movement path preview
- [ ] Show overwatch cones
- [ ] Render grenade trajectories
- [ ] Add cover visualization
- [ ] Show fog of war
- [ ] Add shooting animations
- [ ] Implement action planning UI
