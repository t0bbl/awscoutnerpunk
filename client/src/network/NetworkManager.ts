import type { PlayerAction, GameState } from 'shared';

export class NetworkManager {
  private ws: WebSocket | null = null;
  private playerId: string | null = null;
  
  // Callbacks for game events
  public onGameState: ((state: GameState) => void) | null = null;
  public onMatchStart: ((matchId: string, state: GameState) => void) | null = null;
  public onConnected: ((playerId: string) => void) | null = null;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected to server');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      // Reconnect after delay
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'connected':
        this.playerId = data.playerId;
        console.log('Assigned player ID:', this.playerId);
        if (this.onConnected && this.playerId) {
          this.onConnected(this.playerId);
        }
        break;
      case 'gameState':
        if (this.onGameState) {
          this.onGameState(data.state);
        }
        break;
      case 'matchStart':
        console.log('Match started:', data.matchId);
        if (this.onMatchStart) {
          this.onMatchStart(data.matchId, data.gameState);
        }
        break;
    }
  }

  sendAction(action: PlayerAction) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'action', action }));
    }
  }

  sendReady() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ready' }));
    }
  }

  findMatch() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'findMatch' }));
    }
  }

  getPlayerId(): string | null {
    return this.playerId;
  }
}
