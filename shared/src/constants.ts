// Game constants

export const TICK_RATE = 60; // Fixed 60 ticks per second
export const TICK_DURATION_MS = 1000 / TICK_RATE;
export const TICK_DURATION_S = 1 / TICK_RATE; // For time-based calculations

export const PLANNING_PHASE_DURATION_MS = 30000; // 30 seconds
export const EXECUTION_PHASE_DURATION_S = 3.0; // 3 seconds of execution
export const EXECUTION_PHASE_TICKS = EXECUTION_PHASE_DURATION_S * TICK_RATE; // 180 ticks

export const WEAPON_STATS = {
  USP: {
    damage: 35,
    accuracy: 0.85,
    reactionSpeed: 0.7,
    optimalRange: 15,
    magazineSize: 12,
    reloadTime: 1.5, // seconds
    bloomPerShot: 0.15, // Accuracy loss per shot
    bloomRecoveryRate: 0.3, // Accuracy recovery per second
    fireRate: 0.6, // Seconds between shots
  },
  GLOCK: {
    damage: 28,
    accuracy: 0.80,
    reactionSpeed: 0.75,
    optimalRange: 12,
    magazineSize: 17,
    reloadTime: 1.5,
    bloomPerShot: 0.12,
    bloomRecoveryRate: 0.35,
    fireRate: 0.5,
  },
  DEAGLE: {
    damage: 65,
    accuracy: 0.75,
    reactionSpeed: 0.5,
    optimalRange: 20,
    magazineSize: 7,
    reloadTime: 2.0,
    bloomPerShot: 0.25,
    bloomRecoveryRate: 0.2,
    fireRate: 0.8,
  },
  M4: {
    damage: 33,
    accuracy: 0.90,
    reactionSpeed: 0.6,
    optimalRange: 30,
    magazineSize: 30,
    reloadTime: 2.5,
    bloomPerShot: 0.10,
    bloomRecoveryRate: 0.4,
    fireRate: 0.4,
  },
  AK: {
    damage: 36,
    accuracy: 0.88,
    reactionSpeed: 0.58,
    optimalRange: 30,
    magazineSize: 30,
    reloadTime: 2.5,
    bloomPerShot: 0.12,
    bloomRecoveryRate: 0.35,
    fireRate: 0.4,
  },
  AWP: {
    damage: 115,
    accuracy: 0.95,
    reactionSpeed: 0.3,
    optimalRange: 50,
    magazineSize: 5,
    reloadTime: 3.0,
    bloomPerShot: 0.30,
    bloomRecoveryRate: 0.15,
    fireRate: 1.5,
  },
} as const;

export const UNIT_MAX_HEALTH = 100;
export const KEVLAR_DAMAGE_REDUCTION = 0.5;
export const HELMET_HEADSHOT_PROTECTION = 0.7;

export const UNIT_MOVE_SPEED = 5.0; // units per tick
export const UNIT_SPRINT_SPEED = 7.5;
export const UNIT_CROUCH_SPEED = 3.0;

export const VISIBILITY_RANGE = 50.0;
export const OVERWATCH_DEFAULT_ANGLE = 60; // degrees

export const COVER_HALF_HEIGHT = 1.0;
export const COVER_FULL_HEIGHT = 2.0;

// Accuracy penalties
export const MOVING_SHOOTER_PENALTY = 0.3; // 70% accuracy penalty when moving and shooting
export const MOVING_TARGET_BONUS = 0.3; // 30% harder to hit moving targets
