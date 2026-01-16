# Game Controls

## Menu
- **Find Match**: Search for online opponent (requires 2 players)
- **Local Test**: Start with test units for development

## In-Game

### Camera
- **W/A/S/D** or **Arrow Keys**: Pan camera
- **Mouse Wheel**: Zoom in/out

### Planning Phase
1. **Left Click on Your Unit**: Select unit (yellow border appears)
2. **Left Click on Ground**: Set movement destination for selected unit
   - Blue line shows planned path
   - Blue circle shows target position
   - Unit border turns blue when action is planned
3. **Right Click on Enemy Unit**: Plan to shoot that enemy
   - Red line shows line of fire
   - Red crosshair on target
   - Hover over enemy to see hit chance
4. **READY Button** (top-right): Execute all planned actions

### Execution Phase
- Watch units execute their planned actions
- No input allowed during execution

## UI Display

Top-left corner shows:
- Current phase (PLANNING / EXECUTION / ROUND END)
- Round number and tick count
- Number of alive units
- Number of planned actions
- Selected unit ID (if any)

## Unit Display

Each unit shows:
- **Circle color**: Green (friendly) or Red (enemy)
- **Border color**: 
  - White (normal)
  - Yellow (selected)
  - Blue (has planned action)
- **Health bar**: Above unit, color-coded by health
- **Direction arrow**: Points in movement direction
- **Unit ID**: Text inside circle

## Planning Workflow

**Movement:**
1. Click a green (friendly) unit to select it
2. Click where you want it to move
3. Repeat for other units

**Shooting:**
1. Click a green unit to select it
2. Right-click an enemy (red) unit to shoot
3. Hover over enemies to see hit chance

**Execute:**
4. Click READY when done planning
5. Watch execution phase

## Tips

- You can only select your own units (green)
- Clicking enemy units does nothing
- You can change a unit's destination by selecting it again and clicking a new location
- The "Planned Actions" counter shows how many units have orders
