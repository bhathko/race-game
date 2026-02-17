import { GAMEPLAY } from "../config";

// ── Strategy Behavior Interface ─────────────────────────────────────────────

/**
 * Strategy Pattern — each racer is assigned a StrategyBehavior that
 * determines how it manages stamina, when it sprints, and how it
 * recovers from fatigue.
 *
 * Adding a new strategy requires only implementing this interface
 * and registering it in the STRATEGY_REGISTRY below.
 */
export interface StrategyBehavior {
  /** Unique identifier used in logs and UI. */
  readonly name: RacerStrategy;

  /** Multipliers applied to base stats at racer creation. */
  readonly statMultipliers: Readonly<{
    speed: number;
    accel: number;
    endurance: number;
  }>;

  /** Decide whether the racer should sprint this frame. */
  shouldSprint(ctx: SprintContext): boolean;

  /** Speed factor while in tired/recovery state (fraction of V_max). */
  tiredSpeedFactor(): number;

  /** Stamina threshold to exit the tired state. */
  tiredExitThreshold(maxStamina: number): number;
}

/** Context provided to the strategy's sprint decision each frame. */
export interface SprintContext {
  staminaPct: number; // 0-100
  raceProgress: number; // 0-1 (fraction of total distance covered)
  inClimaxPhase: boolean;
  inSprintZone: boolean; // near finish line
}

// ── Strategy types ──────────────────────────────────────────────────────────

export type RacerStrategy = "aggressive" | "pacer" | "conservative" | "closer";

// ── Concrete Strategies ─────────────────────────────────────────────────────

const S = GAMEPLAY.STRATEGIES;
const P = GAMEPLAY.PHYSICS;

/**
 * "Aggressive" — sprint hard, crash fast, recover quickly, repeat.
 * High speed, decent accel, LOW endurance — burns bright.
 */
const aggressiveStrategy: StrategyBehavior = {
  name: "aggressive",
  statMultipliers: {
    speed: S.AGGRESSIVE_SPEED_MULT,
    accel: S.AGGRESSIVE_ACCEL_MULT,
    endurance: S.AGGRESSIVE_ENDURANCE_MULT,
  },
  shouldSprint(ctx) {
    return ctx.inSprintZone || ctx.staminaPct > S.AGGRESSIVE_SPRINT_THRESHOLD;
  },
  tiredSpeedFactor: () => S.AGGRESSIVE_TIRED_SPEED,
  tiredExitThreshold: (max) => max * S.AGGRESSIVE_TIRED_EXIT,
};

/**
 * "Pacer" — rhythmic push-rest cycles.
 * Balanced stats, slightly above average endurance.
 */
const pacerStrategy: StrategyBehavior = {
  name: "pacer",
  statMultipliers: {
    speed: S.PACER_SPEED_MULT,
    accel: S.PACER_ACCEL_MULT,
    endurance: S.PACER_ENDURANCE_MULT,
  },
  shouldSprint(ctx) {
    return ctx.inSprintZone || ctx.staminaPct > S.PACER_SPRINT_THRESHOLD;
  },
  tiredSpeedFactor: () => P.TIRED_SPEED_FACTOR,
  tiredExitThreshold: (max) => max,
};

/**
 * "Conservative" — cruise most of the race, save for last 35 %.
 * Slow but tough — high endurance, low speed.
 */
const conservativeStrategy: StrategyBehavior = {
  name: "conservative",
  statMultipliers: {
    speed: S.CONSERVATIVE_SPEED_MULT,
    accel: S.CONSERVATIVE_ACCEL_MULT,
    endurance: S.CONSERVATIVE_ENDURANCE_MULT,
  },
  shouldSprint(ctx) {
    return (
      ctx.inSprintZone || ctx.raceProgress > 1 - S.CONSERVATIVE_PUSH_FRACTION
    );
  },
  tiredSpeedFactor: () => P.TIRED_SPEED_FACTOR,
  tiredExitThreshold: (max) => max,
};

/**
 * "Closer" — cruise until climax phase, then go all-out.
 * Fast accel for the surge, decent endurance for the push.
 */
const closerStrategy: StrategyBehavior = {
  name: "closer",
  statMultipliers: {
    speed: S.CLOSER_SPEED_MULT,
    accel: S.CLOSER_ACCEL_MULT,
    endurance: S.CLOSER_ENDURANCE_MULT,
  },
  shouldSprint(ctx) {
    return (
      ctx.inSprintZone ||
      ctx.inClimaxPhase ||
      ctx.raceProgress > 1 - S.CLOSER_PUSH_FRACTION
    );
  },
  tiredSpeedFactor: () => P.TIRED_SPEED_FACTOR,
  tiredExitThreshold: (max) => max,
};

// ── Strategy Registry ───────────────────────────────────────────────────────

/**
 * Central registry — look up a strategy by name, or pick one at random.
 * To add a new strategy, simply add it here.
 */
const STRATEGY_REGISTRY: ReadonlyMap<RacerStrategy, StrategyBehavior> = new Map(
  [
    ["aggressive", aggressiveStrategy],
    ["pacer", pacerStrategy],
    ["conservative", conservativeStrategy],
    ["closer", closerStrategy],
  ],
);

/** All available strategy names. */
export const STRATEGY_NAMES: readonly RacerStrategy[] = [
  ...STRATEGY_REGISTRY.keys(),
];

/** Get the behavior object for a given strategy name. */
export function getStrategy(name: RacerStrategy): StrategyBehavior {
  const s = STRATEGY_REGISTRY.get(name);
  if (!s) throw new Error(`Unknown strategy: ${name}`);
  return s;
}

/** Pick a random strategy. */
export function randomStrategy(): StrategyBehavior {
  const idx = Math.floor(Math.random() * STRATEGY_NAMES.length);
  return STRATEGY_REGISTRY.get(STRATEGY_NAMES[idx])!;
}
