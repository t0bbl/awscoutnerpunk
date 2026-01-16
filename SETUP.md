# Setup Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **MongoDB** - Choose one:
   - Local: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs all dependencies for client, server, and shared packages.

### 2. Configure Environment

Copy the example env file:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` if needed (defaults work for local MongoDB).

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
Update `MONGODB_URI` in `server/.env` with your connection string.

### 4. Run the Game

```bash
npm run dev
```

This starts:
- Client at `http://localhost:5173`
- Server at `http://localhost:3000`

## Debugging

### VS Code Debugger Setup

The project includes pre-configured debugger settings in `.vscode/launch.json`.

**Available configurations:**

1. **Debug Server** - Attach to Node.js server
2. **Debug Client** - Launch Chrome with debugging
3. **Debug Full Stack** - Debug both simultaneously

**How to use:**

1. Start dev servers: `npm run dev`
2. Open Debug panel: `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
3. Select "Debug Full Stack" from dropdown
4. Press `F5` or click green play button

**Setting breakpoints:**

- **Server**: Open any `.ts` file in `server/src/`, click left of line number
- **Client**: Open any `.ts` file in `client/src/`, click left of line number

The debugger will pause execution when breakpoints are hit.

### Manual Debugging

**Server only:**
```bash
npm run dev:server
```

Then attach VS Code debugger using "Debug Server" configuration.

**Client only:**
```bash
npm run dev:client
```

Open Chrome DevTools (`F12`) for debugging.

## Project Structure

```
├── client/              # Phaser 3 frontend
│   ├── src/
│   │   ├── main.ts      # Entry point
│   │   ├── scenes/      # Phaser scenes
│   │   └── network/     # WebSocket client
│   └── index.html
├── server/              # Node.js backend
│   ├── src/
│   │   ├── index.ts     # Entry point
│   │   ├── game-server.ts  # WebSocket game logic
│   │   ├── database.ts  # MongoDB connection
│   │   └── config.ts    # Environment config
│   └── .env
├── shared/              # Shared code
│   └── src/
│       ├── types.ts     # Type definitions
│       ├── simulation.ts  # Deterministic game logic
│       └── constants.ts # Game constants
└── .vscode/
    └── launch.json      # Debugger config
```

## Common Commands

```bash
# Development
npm run dev              # Run both client + server
npm run dev:client       # Run client only
npm run dev:server       # Run server only (with debugger)

# Building
npm run build            # Build all packages
npm run clean            # Clean build artifacts

# Individual packages
npm run build -w client  # Build client only
npm run build -w server  # Build server only
npm run build -w shared  # Build shared only
```

## Troubleshooting

**Port already in use:**
- Client (5173): Change in `client/vite.config.ts`
- Server (3000): Change `PORT` in `server/.env`

**MongoDB connection failed:**
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `server/.env`

**Debugger not attaching:**
- Ensure server is running with `npm run dev:server`
- Check port 9229 is not in use
- Restart VS Code

**Module not found errors:**
- Run `npm install` in root directory
- Rebuild shared: `npm run build -w shared`

## Next Steps

- Read `README.md` for architecture overview
- Check game specs in the original prompt
- Start implementing core systems in `shared/src/simulation.ts`
