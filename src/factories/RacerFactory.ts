import { GAMEPLAY, CHARACTERS, COLORS } from "../config";
import { Racer } from "../entities/Racer";
import type { RacerAnimations } from "../core/types";
import { randomStrategy } from "../strategies/StrategyBehavior";
import type { StrategyBehavior } from "../strategies/StrategyBehavior";

// ── Public types ────────────────────────────────────────────────────────────

export interface CreatedRacer {
  racer: Racer;
  characterKey: string;
}

// ── Random stat generation ──────────────────────────────────────────────────

function generateStats(strategy: StrategyBehavior) {
  const { STATS } = GAMEPLAY;
  const m = strategy.statMultipliers;
  return {
    accel: (STATS.ACCEL_BASE + Math.random() * STATS.ACCEL_VARIANCE) * m.accel,
    topSpeed:
      (STATS.BASE_SPEED + Math.random() * STATS.SPEED_VARIANCE) * m.speed,
    endurance:
      (STATS.ENDURANCE_BASE + Math.random() * STATS.ENDURANCE_VARIANCE) *
      m.endurance,
  };
}

// ── Character key shuffling ─────────────────────────────────────────────────

function shuffledCharacterKeys(): string[] {
  const keys = Object.keys(CHARACTERS);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys;
}

// ── Factory ─────────────────────────────────────────────────────────────────

/**
 * Factory Pattern — centralises the creation of Racer entities.
 *
 * Encapsulates stat generation, strategy assignment, character
 * selection and colour assignment so that callers (RaceScene, etc.)
 * don't need to know the details.
 */
export function createRacers(
  names: string[],
  characterAnimations: Map<string, RacerAnimations>,
  selectedKeys?: string[],
): CreatedRacer[] {
  const charKeys = selectedKeys || shuffledCharacterKeys();

  return names.map((name, i) => {
    const color = COLORS.RACERS[i % COLORS.RACERS.length];
    const characterKey = charKeys[i % charKeys.length];
    const anims = characterAnimations.get(characterKey)!;
    const strategy = randomStrategy();
    const stats = generateStats(strategy);

    const racer = new Racer(
      name,
      color,
      0, // y position set later by the scene
      stats,
      anims,
      characterKey,
      strategy,
    );

    return { racer, characterKey };
  });
}
