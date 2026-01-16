// MongoDB schema definitions

export interface PlayerDocument {
  _id: string;
  username: string;
  createdAt: Date;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    roundsWon: number;
    kills: number;
    deaths: number;
  };
}

export interface MatchDocument {
  _id: string;
  players: string[]; // Player IDs
  winnerId: string;
  rounds: number;
  startedAt: Date;
  endedAt: Date;
  replayId: string;
}

export interface ReplayDocument {
  _id: string;
  matchId: string;
  seed: number;
  actions: any[]; // Serialized player actions per tick
  metadata: {
    duration: number;
    mapName: string;
    playerCount: number;
  };
  createdAt: Date;
}
