// Basic simulation tests
import { Simulation } from './simulation';
import { createInitialGameState } from './game-factory';
import { ActionType, GamePhase } from './types';

// Simple test runner
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Tests
test('Simulation initializes with correct state', () => {
  const state = createInitialGameState('p1', 'p2', 12345);
  const sim = new Simulation(state);
  
  const currentState = sim.getState();
  assert(currentState.tick === 0, 'Initial tick should be 0');
  assert(currentState.round === 1, 'Initial round should be 1');
  assert(currentState.units.length === 6, 'Should have 6 units');
  assert(currentState.seed === 12345, 'Seed should match');
});

test('Simulation tick increments', () => {
  const state = createInitialGameState('p1', 'p2');
  state.phase = GamePhase.EXECUTION;
  const sim = new Simulation(state);
  
  sim.tick([]);
  const newState = sim.getState();
  
  assert(newState.tick === 1, 'Tick should increment');
});

test('Unit movement works', () => {
  const state = createInitialGameState('p1', 'p2');
  state.phase = GamePhase.EXECUTION;
  const sim = new Simulation(state);
  
  const unit = state.units[0];
  const initialX = unit.position.x;
  
  sim.tick([{
    unitId: unit.id,
    actionType: ActionType.MOVE,
    targetPosition: { x: initialX + 10, y: unit.position.y },
  }]);
  
  const newState = sim.getState();
  const movedUnit = newState.units.find(u => u.id === unit.id)!;
  
  assert(movedUnit.position.x > initialX, 'Unit should have moved');
});

test('Deterministic RNG produces same results with same seed', () => {
  const state1 = createInitialGameState('p1', 'p2', 99999);
  const state2 = createInitialGameState('p1', 'p2', 99999);
  
  state1.phase = GamePhase.EXECUTION;
  state2.phase = GamePhase.EXECUTION;
  
  const sim1 = new Simulation(state1);
  const sim2 = new Simulation(state2);
  
  // Execute same actions
  const actions = [{
    unitId: state1.units[0].id,
    actionType: ActionType.SHOOT,
    targetUnitId: state1.units[3].id,
  }];
  
  const result1 = sim1.tick(actions);
  const result2 = sim2.tick(actions);
  
  const unit1 = result1.units.find(u => u.id === state1.units[3].id)!;
  const unit2 = result2.units.find(u => u.id === state2.units[3].id)!;
  
  assert(unit1.health === unit2.health, 'Health should be identical with same seed');
});

console.log('\nRunning simulation tests...\n');
