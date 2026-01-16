// Game constants

export const TICK_RATE = 60; // Fixed 60 ticks per second
export const TICK_DURATION_MS = 1000 / TICK_RATE;

export const PLANNING_PHASE_DURATION_MS = 30000; // 30 seconds

export const WEAPON_STATS = {
  USP: {
    damage: 35,
    accuracy: 0.85,
    reactionSpeed: 0.7,
    optimalRange: 15,
  },
  GLOCK: {
    damage: 28,
    accuracy: 0.80,
    reactionSpeed: 0.75,
    optimalRange: 12,
  },
  DEAGLE: {
    damage: 65,
    accuracy: 0.75,
    reactionSpeed: 0.5,
    optimalRange: 20,
  },
  M4: {
    damage: 33,
    accuracy: 0.90,
    reactionSpeed: 0.6,
    optimalRange: 30,
  },
  AK: {
    damage: 36,
    accuracy: 0.88,
    reactionSpeed: 0.58,
    optimalRange: 30,
  },
  AWP: {
    damage: 115,
    accuracy: 0.95,
    reactionSpeed: 0.3,
    optimalRange: 50,
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
