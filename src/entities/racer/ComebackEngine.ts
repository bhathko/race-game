import { GAMEPLAY } from "../../config";
import type { StrategyBehavior } from "../../strategies";

export interface PaceModifiers {
  effectiveAccel: number;
  /** Multiplier applied to the racer's top speed this frame. */
  topSpeedMult: number;
  recoveryMult: number;
  drainMult: number;
  /** Tucked in behind the racer ahead (slipstream). */
  isDrafting: boolean;
  /** Closer-style final-stretch kick is active. */
  isKicking: boolean;
}

export interface PaceContext {
  rank: number;
  totalRacers: number;
  distFromLeader: number;
  /** Pixels to the nearest racer ahead, or null when leading. */
  gapAhead: number | null;
  totalDistance: number;
  /** Pixels covered since the start line. */
  distCovered: number;
  inFinalStretch: boolean;
  isSprinting: boolean;
  elapsedFrames: number;
  paceFrequency: number;
  pacePhase: number;
}

/**
 * Scales catch-up strength by field size: in a 2-racer race the trailer is always
 * "last", so full rank-based bonuses would make the lead flip every few frames.
 */
export function fieldSizeScale(totalRacers: number): number {
  const { FIELD_SIZE_FULL, FIELD_SIZE_MIN } = GAMEPLAY.CATCH_UP;
  return Math.min(1, Math.max(FIELD_SIZE_MIN, (totalRacers - 1) / FIELD_SIZE_FULL));
}

export function calculatePaceModifiers(
  stats: { acceleration: number },
  strategy: StrategyBehavior,
  ctx: PaceContext,
): PaceModifiers {
  const { CATCH_UP, DRAFT, DRAMA, PHYSICS, STATS } = GAMEPLAY;
  const traits = strategy.traits;
  const t = (ctx.rank - 1) / Math.max(1, ctx.totalRacers - 1);
  const fs = fieldSizeScale(ctx.totalRacers);

  // Slingshot: trailing racers get back up to speed a little faster
  const effectiveAccel = stats.acceleration * (1 + t * CATCH_UP.ACCEL_RANK_BONUS * fs);

  let topSpeedMult = 1;

  // Accel-responsiveness: quick racers carry a little more top speed
  const accelNorm = Math.min(
    1,
    Math.max(0, (stats.acceleration - STATS.ACCEL_BASE) / STATS.ACCEL_VARIANCE),
  );
  topSpeedMult += accelNorm * PHYSICS.ACCEL_SPEED_BONUS;

  // Rubber band: only kicks in when a racer has fallen clearly behind the leader
  if (ctx.rank > 1 && ctx.distFromLeader > 0 && ctx.totalDistance > 0) {
    const gap = Math.min(1, ctx.distFromLeader / (ctx.totalDistance * CATCH_UP.FULL_GAP_FRACTION));
    const eased = gap * gap * (3 - 2 * gap); // smoothstep
    topSpeedMult += eased * CATCH_UP.MAX_SPEED_BONUS * fs;
  }

  // Slipstream: close behind the racer ahead
  const isDrafting =
    ctx.gapAhead !== null && ctx.gapAhead >= DRAFT.MIN_GAP_PX && ctx.gapAhead <= DRAFT.RANGE_PX;
  if (isDrafting) topSpeedMult += DRAFT.SPEED_BONUS * traits.draftMult * fs;

  // Strategy signature strengths
  if (ctx.distCovered < PHYSICS.EARLY_PHASE_PX) topSpeedMult += traits.earlySpeed;
  const isKicking = traits.kickSpeed > 0 && ctx.inFinalStretch && ctx.isSprinting;
  if (isKicking) topSpeedMult += traits.kickSpeed;

  // Gentle pace wave so racers "breathe" instead of moving like robots
  topSpeedMult *=
    1 + DRAMA.PACE_WAVE_AMPLITUDE * Math.sin(ctx.elapsedFrames * ctx.paceFrequency + ctx.pacePhase);

  // Respite: trailing racers catch their breath faster
  const recoveryMult = 1 + t * CATCH_UP.RECOVERY_RANK_BONUS * fs;
  const drainMult = traits.drainMult * (isDrafting ? DRAFT.DRAIN_MULT : 1);

  return { effectiveAccel, topSpeedMult, recoveryMult, drainMult, isDrafting, isKicking };
}
