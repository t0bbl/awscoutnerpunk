import { WebSocketServer, WebSocket } from 'ws';
import { Simulation, createInitialGameState } from 'shared';
import type { PlayerAction, GameState, GamePhase } from 'shared';
import { TICK_DURATION_MS } from 'shared';

interface Client {
  ws: WebSocket;
  playerId: string;
  isReady: boolean;
}

interface Match {
  id: string;
  players: string[];
  simulation: Simulation;
  pendingActions: Map<string, PlayerAction[]>;
  tickInterval?: NodeJS.Timeout;
}

export class GameServer {
  private clients: Map<string, Client> = new Map();
  private matches: Map<string, Match> = new Map();
  private waitingPlayers: string[] = [];

  constructor(private wss: WebSocketServer) {
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket) {
    const playerId = this.generatePlayerId();
    const client: Client = { ws, playerId, isReady: false };
    this.clients.set(playerId, client);

    console.log(`Player ${playerId} connected`);

    ws.on('message', (data) => {
      this.handleMessage(playerId, data.toString());
    });

    ws.on('close', () => {
      this.handleDisconnect(playerId);
    });

    // Send player their ID
    ws.send(JSON.stringify({ type: 'connected', playerId }));
  }

  private handleMessage(playerId: string, message: string) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'action':
          this.handlePlayerAction(playerId, data.action);
          break;
        case 'ready':
          this.handlePlayerReady(playerId);
          break;
        case 'findMatch':
          this.handleFindMatch(playerId);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private handlePlayerAction(playerId: string, action: PlayerAction) {
    const match = this.findMatchByPlayer(playerId);
    if (!match) return;

    if (!match.pendingActions.has(playerId)) {
      match.pendingActions.set(playerId, []);
    }
    
    match.pendingActions.get(playerId)!.push(action);
  }

  private handlePlayerReady(playerId: string) {
    const client = this.clients.get(playerId);
    if (!client) return;

    client.isReady = true;
    console.log(`Player ${playerId} ready`);

    const match = this.findMatchByPlayer(playerId);
    if (match && this.allPlayersReady(match)) {
      this.startExecutionPhase(match);
    }
  }

  private handleFindMatch(playerId: string) {
    this.waitingPlayers.push(playerId);
    console.log(`Player ${playerId} looking for match`);

    // Try to create a match if we have 2 players
    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers.shift()!;
      const player2 = this.waitingPlayers.shift()!;
      this.createMatch(player1, player2);
    }
  }

  private handleDisconnect(playerId: string) {
    this.clients.delete(playerId);
    this.waitingPlayers = this.waitingPlayers.filter(id => id !== playerId);
    
    // TODO: Handle match cleanup
    console.log(`Player ${playerId} disconnected`);
  }

  private createMatch(player1Id: string, player2Id: string) {
    const matchId = this.generateMatchId();
    const initialState = createInitialGameState(player1Id, player2Id);
    
    const match: Match = {
      id: matchId,
      players: [player1Id, player2Id],
      simulation: new Simulation(initialState),
      pendingActions: new Map(),
    };

    this.matches.set(matchId, match);
    console.log(`Match ${matchId} created: ${player1Id} vs ${player2Id}`);

    // Notify players
    this.sendToPlayers(match.players, {
      type: 'matchStart',
      matchId,
      gameState: match.simulation.getState(),
    });
  }

  private startExecutionPhase(match: Match) {
    console.log(`Match ${match.id}: Starting execution phase`);

    // Start simulation tick loop
    match.tickInterval = setInterval(() => {
      this.tickMatch(match);
    }, TICK_DURATION_MS);
  }

  private tickMatch(match: Match) {
    // Collect all pending actions
    const allActions: PlayerAction[] = [];
    match.pendingActions.forEach(actions => {
      allActions.push(...actions);
    });
    match.pendingActions.clear();

    // Execute simulation tick
    const newState = match.simulation.tick(allActions);

    // Broadcast state to all players
    this.sendToPlayers(match.players, {
      type: 'gameState',
      state: newState,
    });

    // Check if execution phase is complete
    if (newState.phase !== 'EXECUTION') {
      this.stopExecutionPhase(match);
    }
  }

  private stopExecutionPhase(match: Match) {
    if (match.tickInterval) {
      clearInterval(match.tickInterval);
      match.tickInterval = undefined;
    }

    const state = match.simulation.getState();
    
    if (state.phase === 'ROUND_END') {
      console.log(`Match ${match.id}: Round ended`);
      // TODO: Handle round end, start new round or end match
    }
  }

  private allPlayersReady(match: Match): boolean {
    return match.players.every(playerId => {
      const client = this.clients.get(playerId);
      return client?.isReady === true;
    });
  }

  private findMatchByPlayer(playerId: string): Match | undefined {
    for (const match of this.matches.values()) {
      if (match.players.includes(playerId)) {
        return match;
      }
    }
    return undefined;
  }

  private sendToPlayers(playerIds: string[], message: any) {
    const data = JSON.stringify(message);
    playerIds.forEach(playerId => {
      const client = this.clients.get(playerId);
      if (client?.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
