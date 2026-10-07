import type { Racer } from "../../entities";

/**
 * Advances every active racer by one frame and records finishers in crossing order.
 * Shared by the race scene and the headless balance simulator so both run identical rules.
 */
export function stepRace(
  racers: Racer[],
  finishedRacers: Racer[],
  elapsedTime: number,
  delta: number,
  finishLineX: number,
  totalPx: number,
): void {
  const ranked = racers.filter((r) => !r.isFinished()).sort((a, b) => b.x - a.x);
  if (ranked.length === 0) return;
  const leaderX = ranked[0].x;

  ranked.forEach((r, i) => {
    r.update({
      delta,
      leaderX,
      finishX: finishLineX,
      totalDist: totalPx,
      rank: i + 1,
      totalRacers: ranked.length,
      gapAhead: i > 0 ? ranked[i - 1].x - r.x : null,
    });
  });

  // Racers crossing on the same frame: whoever is furthest past the line got there first
  const crossed = ranked.filter((r) => r.x >= finishLineX).sort((a, b) => b.x - a.x);
  for (const r of crossed) {
    r.x = finishLineX;
    r.setFinished(elapsedTime);
    finishedRacers.push(r);
  }
}
