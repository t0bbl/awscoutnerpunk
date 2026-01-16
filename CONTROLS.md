# Game Controls

## Menu
- **Find Match**: Search for online opponent (requires 2 players)
- **Local Test**: Start with test units for development

## In-Game

### Camera
- **W/A/S/D** or **Arrow Keys**: Pan camera
- **Mouse Wheel**: Zoom in/out

### Unit Control
- **Left Click on Unit**: Select unit (yellow border appears)
- **Left Click on Ground**: Move selected unit (not yet implemented)

## UI Display

Top-left corner shows:
- Current phase (PLANNING / EXECUTION / ROUND END)
- Round number and tick count
- Number of alive units
- Selected unit ID (if any)

## Unit Display

Each unit shows:
- **Circle color**: Green (friendly) or Red (enemy)
- **Health bar**: Above unit, color-coded by health
- **Direction arrow**: Points in movement direction
- **Unit ID**: Text inside circle

## Development Tips

1. Use "Local Test" to see units without needing multiplayer
2. Click units to select them and see selection highlight
3. Use camera controls to explore the map
4. Watch the UI for game state updates
