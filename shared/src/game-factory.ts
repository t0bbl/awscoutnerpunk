// Factory functions for creating game objects
import { 
  GameState, 
  Unit, 
  Vector2, 
  WeaponType, 
  UnitStance,
  GamePhase,
} from './types';
import { UNIT_MAX_HEALTH } from './constants';

export function createInitialGameState(
  player1Id: string,
  player2Id: string,
  seed: number = Date.now()
): GameState {
  const units: Unit[] = [
    // Player 1 units
    createUnit('p1_unit1', player1Id, { x: 10, y: 10 }, WeaponType.USP),
    createUnit('p1_unit2', player1Id, { x: 15, y: 10 }, WeaponType.GLOCK),
    createUnit('p1_unit3', player1Id, { x: 20, y: 10 }, WeaponType.M4),
    
    // Player 2 units
    createUnit('p2_unit1', player2Id, { x: 110, y: 70 }, WeaponType.USP),
    createUnit('p2_unit2', player2Id, { x: 105, y: 70 }, WeaponType.GLOCK),
    createUnit('p2_unit3', player2Id, { x: 100, y: 70 }, WeaponType.AK),
  ];

  return {
    tick: 0,
    round: 1,
    phase: GamePhase.PLANNING,
    units,
    seed,
    planningTimeRemaining: 30000,
  };
}

export function createUnit(
  id: string,
  playerId: string,
  position: Vector2,
  weapon: WeaponType
): Unit {
  return {
    id,
    playerId,
    position: { ...position },
    health: UNIT_MAX_HEALTH,
    weapon,
    hasKevlar: false,
    hasHelmet: false,
    isAlive: true,
    stance: UnitStance.STANDING,
    velocity: { x: 0, y: 0 },
    isMoving: false,
    visibleEnemyIds: [],
    lastKnownEnemyPositions: new Map(),
  };
}
