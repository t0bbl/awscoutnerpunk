import express from 'express';
import { WebSocketServer } from 'ws';
import { config } from './config';
import { connectDatabase } from './database';
import { GameServer } from './game-server';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const server = app.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);
  
  // Connect to MongoDB
  await connectDatabase();
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server });
  const gameServer = new GameServer(wss);
  
  console.log('Game server ready');
});
