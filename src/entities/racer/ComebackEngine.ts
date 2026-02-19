import { GAMEPLAY } from "../../config";

export interface ComebackMultipliers {
  effectiveAccel: number;
  effectiveTopSpeed: number;
  recoveryMult: number;
}

export function calculateComebackMultipliers(
  stats: { acceleration: number; topSpeed: number; endurance: number },
  context: {
    rank: number;
    totalRacers: number;
    distFromLeader: number;
    totalDistance: number;
    inClimaxPhase: boolean;
    elapsedFrames: number;
    paceFrequency: number;
    pacePhase: number;
  },
): ComebackMultipliers {
  const { BALANCE, DRAMA } = GAMEPLAY;
  const t = (context.rank - 1) / Math.max(1, context.totalRacers - 1);
  const isLeader = context.rank === 1;

  // Slingshot
  const effectiveAccel = stats.acceleration * (1 + t * BALANCE.ACCEL_RANK_FACTOR);

  // Slipstream & Deep-trailing
  let slipstreamMult = 1 + t * (BALANCE.SLIPSTREAM_MAX_MULT - 1);
  if (t > 0.5) {
    const deepTrail = (t - 0.5) * 2;
    slipstreamMult += deepTrail * deepTrail * BALANCE.DEEP_TRAILING_BOOST;
  }
  let effectiveTopSpeed = stats.topSpeed * slipstreamMult;

  // Accel-responsiveness
  const accelNorm = Math.min(
    1,
    Math.max(0, (stats.acceleration - GAMEPLAY.STATS.ACCEL_BASE) / GAMEPLAY.STATS.ACCEL_VARIANCE),
  );
  effectiveTopSpeed *= 1 + accelNorm * BALANCE.ACCEL_SPEED_BONUS;

  // Rubber-band
  if (!isLeader && context.distFromLeader > 0 && context.totalDistance > 0) {
    effectiveTopSpeed *=
      1 + (context.distFromLeader / context.totalDistance) * BALANCE.RUBBER_BAND_FACTOR;
  }

  // Pace wave
  const waveValue = Math.sin(context.elapsedFrames * context.paceFrequency + context.pacePhase);
  effectiveTopSpeed *= 1 + DRAMA.PACE_WAVE_AMPLITUDE * waveValue;

  // Climax Phase Overdrive
  if (context.inClimaxPhase && !isLeader) {
    const eligibleRanks = Math.ceil(context.totalRacers * BALANCE.CLIMAX_OVERDRIVE_RANK_FRAC);
    if (context.rank <= eligibleRanks) {
      const overdriveRangePx = (BALANCE.CLIMAX_OVERDRIVE_RANGE / 50) * context.totalDistance;
      if (context.distFromLeader > 0 && context.distFromLeader <= overdriveRangePx) {
        effectiveTopSpeed *= BALANCE.CLIMAX_OVERDRIVE_SPEED_MULT;
      }
    }
  }

  // Respite (Recovery)
  let recoveryMult = 1 + t * (BALANCE.RECOVERY_MULT_MAX - 1);
  if (context.inClimaxPhase) recoveryMult *= BALANCE.CLIMAX_RECOVERY_MULT;

  return { effectiveAccel, effectiveTopSpeed, recoveryMult };
}
