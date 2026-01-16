# Tactical Multiplayer Game

A deterministic, round-based tactical game inspired by Counter-Strike, Phantom Brigade, and XCOM.

## Architecture

- **Client**: Phaser 3 + TypeScript (browser-based)
- **Server**: Node.js + TypeScript (authoritative simulation)
- **Shared**: Common game logic, types, and deterministic simulation
- **Database**: MongoDB (player data, match history, replay metadata)

## Project Structure

```
├── client/          # Phaser 3 client (Vite)
├── server/          # Node.js WebSocket + REST server
├── shared/          # Shared simulation & types
├── package.json     # Root workspace config
└── .vscode/         # Debugger configurations
```

## Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)

### Installation

```bash
npm install
```

### Environment Configuration

Create `.env` files:

**server/.env**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tactical-game
NODE_ENV=development
```

### Running the Game

**Development (both client + server):**
```bash
npm run dev
```

**Client only:**
```bash
npm run dev:client
```

**Server only:**
```bash
npm run dev:server
```

The client will be available at `http://localhost:5173`
The server will run on `http://localhost:3000`

## Debugging

### VS Code Debugger

This project includes pre-configured launch configurations:

1. **Debug Server**: Attach to the Node.js server
2. **Debug Client**: Launch Chrome with client debugging
3. **Debug Full Stack**: Debug both simultaneously

**To use:**
1. Start the dev servers: `npm run dev`
2. Open VS Code Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
3. Select configuration and press F5

See `.vscode/launch.json` for details.

## Core Principles

- **Deterministic**: Fixed tick rate, seeded RNG, no frame-dependent logic
- **Server-Authoritative**: All gameplay resolved on server
- **Replay-First**: Every match is fully replayable
- **Multiplayer-Native**: WebSocket for real-time, REST for persistence

## Development Workflow

1. Shared logic goes in `shared/` (simulation, types, constants)
2. Client renders and sends inputs only
3. Server runs authoritative simulation
4. Both client and server import from `shared/`

## Building for Production

```bash
npm run build
```

Outputs:
- `client/dist/` - Static files for hosting
- `server/dist/` - Compiled Node.js server
- `shared/dist/` - Compiled shared library
