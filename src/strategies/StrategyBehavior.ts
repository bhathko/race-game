import { GAMEPLAY } from "../config";

// ── Strategy Behavior Interface ─────────────────────────────────────────────

/**
 * Strategy Pattern — each racer is assigned a StrategyBehavior that
 * determines how it manages stamina, when it sprints, and which part
 * of the race it is strongest in.
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

  /**
   * Signature strengths. Each strategy is best in a different phase of the race,
   * so lead changes happen for visible reasons instead of hidden rubber-banding.
   */
  readonly traits: Readonly<{
    /** Extra top speed during the early phase of the race. */
    earlySpeed: number;
    /** Extra top speed while sprinting in the final stretch. */
    kickSpeed: number;
    /** Multiplier on the slipstream bonus. */
    draftMult: number;
    /** Multiplier on stamina drained while sprinting. */
    drainMult: number;
  }>;

  /** Decide whether the racer wants to sprint this frame. */
  shouldSprint(ctx: SprintContext): boolean;

  /** Fraction of max stamina a tired racer must recover before running normally again. */
  readonly tiredExitFraction: number;
}

/** Context provided to the strategy's sprint decision each frame. */
export interface SprintContext {
  staminaPct: number; // 0-100
  raceProgress: number; // 0-1 (fraction of total distance covered)
  /** The finish is within reach of this racer's remaining stamina: time for the final kick. */
  inFinalStretch: boolean;
}

// ── Strategy types ──────────────────────────────────────────────────────────

export type RacerStrategy = "aggressive" | "pacer" | "conservative" | "closer";

// ── Concrete Strategies ─────────────────────────────────────────────────────

const S = GAMEPLAY.STRATEGIES;

const NO_TRAITS = { earlySpeed: 0, kickSpeed: 0, draftMult: 1, drainMult: 1 } as const;

/**
 * "Aggressive" — front-runner. Explosive start, then hangs on.
 * Fast and quick off the line, but low endurance makes it fade late.
 */
const aggressiveStrategy: StrategyBehavior = {
  name: "aggressive",
  statMultipliers: {
    speed: S.AGGRESSIVE_SPEED_MULT,
    accel: S.AGGRESSIVE_ACCEL_MULT,
    endurance: S.AGGRESSIVE_ENDURANCE_MULT,
  },
  traits: { ...NO_TRAITS, earlySpeed: S.AGGRESSIVE_EARLY_SPEED },
  shouldSprint(ctx) {
    return ctx.inFinalStretch || ctx.staminaPct > S.AGGRESSIVE_SPRINT_THRESHOLD;
  },
  tiredExitFraction: S.AGGRESSIVE_TIRED_EXIT,
};

/**
 * "Pacer" — rhythmic push-rest cycles.
 * Balanced stats; the most stamina-efficient sprinter.
 */
const pacerStrategy: StrategyBehavior = {
  name: "pacer",
  statMultipliers: {
    speed: S.PACER_SPEED_MULT,
    accel: S.PACER_ACCEL_MULT,
    endurance: S.PACER_ENDURANCE_MULT,
  },
  traits: { ...NO_TRAITS, drainMult: S.PACER_DRAIN_MULT },
  shouldSprint(ctx) {
    return ctx.inFinalStretch || ctx.staminaPct > S.PACER_SPRINT_THRESHOLD;
  },
  tiredExitFraction: S.PACER_TIRED_EXIT,
};

/**
 * "Conservative" — stalker. Rides the slipstream of the pack and only bursts
 * while it has a big reserve, so it arrives at the final kick with plenty left.
 */
const conservativeStrategy: StrategyBehavior = {
  name: "conservative",
  statMultipliers: {
    speed: S.CONSERVATIVE_SPEED_MULT,
    accel: S.CONSERVATIVE_ACCEL_MULT,
    endurance: S.CONSERVATIVE_ENDURANCE_MULT,
  },
  traits: { ...NO_TRAITS, draftMult: S.CONSERVATIVE_DRAFT_MULT },
  shouldSprint(ctx) {
    return ctx.inFinalStretch || ctx.staminaPct > S.CONSERVATIVE_SPRINT_THRESHOLD;
  },
  tiredExitFraction: S.CONSERVATIVE_TIRED_EXIT,
};

/**
 * "Closer" — runs a steady, even pace keeping its tank almost full (only tiny
 * top-up bursts), then unleashes the longest kick in the field with a top-speed bonus.
 */
const closerStrategy: StrategyBehavior = {
  name: "closer",
  statMultipliers: {
    speed: S.CLOSER_SPEED_MULT,
    accel: S.CLOSER_ACCEL_MULT,
    endurance: S.CLOSER_ENDURANCE_MULT,
  },
  traits: { ...NO_TRAITS, kickSpeed: S.CLOSER_KICK_SPEED },
  shouldSprint(ctx) {
    return ctx.inFinalStretch || ctx.staminaPct > S.CLOSER_SPRINT_THRESHOLD;
  },
  tiredExitFraction: S.CLOSER_TIRED_EXIT,
};

// ── Strategy Registry ───────────────────────────────────────────────────────

/**
 * Central registry — look up a strategy by name, or pick one at random.
 * To add a new strategy, simply add it here.
 */
const STRATEGY_REGISTRY: ReadonlyMap<RacerStrategy, StrategyBehavior> = new Map([
  ["aggressive", aggressiveStrategy],
  ["pacer", pacerStrategy],
  ["conservative", conservativeStrategy],
  ["closer", closerStrategy],
]);

/** All available strategy names. */
export const STRATEGY_NAMES: readonly RacerStrategy[] = [...STRATEGY_REGISTRY.keys()];

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
