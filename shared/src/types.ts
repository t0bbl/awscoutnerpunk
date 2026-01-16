// Core game types

export interface Vector2 {
  x: number;
  y: number;
}

export enum WeaponType {
  USP = 'USP',
  GLOCK = 'GLOCK',
  DEAGLE = 'DEAGLE',
  M4 = 'M4',
  AK = 'AK',
  AWP = 'AWP',
}

export enum GrenadeType {
  FRAG = 'FRAG',
  SMOKE = 'SMOKE',
  FLASH = 'FLASH',
  FIRE = 'FIRE',
}

export enum CoverType {
  NONE = 'NONE',
  HALF = 'HALF',
  FULL = 'FULL',
}

export enum ActionType {
  IDLE = 'IDLE',
  MOVE = 'MOVE',
  SHOOT = 'SHOOT',
  OVERWATCH = 'OVERWATCH',
  THROW_GRENADE = 'THROW_GRENADE',
}

export enum UnitStance {
  STANDING = 'STANDING',
  CROUCHING = 'CROUCHING',
}

export interface Unit {
  id: string;
  playerId: string;
  position: Vector2;
  health: number;
  weapon: WeaponType;
  hasKevlar: boolean;
  hasHelmet: boolean;
  isAlive: boolean;
  stance: UnitStance;
  velocity: Vector2;
  isMoving: boolean;
  visibleEnemyIds: string[];
  lastKnownEnemyPositions: Map<string, Vector2>;
}

export interface PlayerAction {
  unitId: string;
  actionType: ActionType;
  targetPosition?: Vector2;
  targetUnitId?: string;
  grenadeType?: GrenadeType;
  overwatchDirection?: Vector2;
  overwatchAngle?: number;
}

export interface MoveAction extends PlayerAction {
  actionType: ActionType.MOVE;
  targetPosition: Vector2;
}

export interface ShootAction extends PlayerAction {
  actionType: ActionType.SHOOT;
  targetUnitId: string;
}

export interface OverwatchAction extends PlayerAction {
  actionType: ActionType.OVERWATCH;
  overwatchDirection: Vector2;
  overwatchAngle: number;
}

export enum GamePhase {
  PLANNING = 'PLANNING',
  EXECUTION = 'EXECUTION',
  ROUND_END = 'ROUND_END',
}

export interface GameState {
  tick: number;
  round: number;
  phase: GamePhase;
  units: Unit[];
  seed: number;
  planningTimeRemaining?: number;
}

export interface MatchResult {
  winnerId: string;
  rounds: number;
  timestamp: number;
}
