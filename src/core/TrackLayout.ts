import { ITEMS } from "../config";
import { TRACK } from "../configs/RacerConfig";

export interface TrackLayoutData {
  viewWidth: number;
  viewHeight: number;
  grassStripHeight: number;
  dirtHeight: number;
  laneHeight: number;
  racerCount: number;
  distance: number;
  finishLineX: number;
  trackWidth: number;
}

/** World X of a distance (in meters) from the start line. Independent of screen size. */
export function metersToWorldX(meters: number): number {
  return TRACK.START_LINE_X + meters * TRACK.PX_PER_METER;
}

export function createTrackLayout(
  viewWidth: number,
  viewHeight: number,
  racerCount: number,
  distance: number,
  grassStripUnits: number = TRACK.GRASS_STRIP_UNITS,
): TrackLayoutData {
  const unit = ITEMS.ground.unit;
  const grassStripHeight = unit * grassStripUnits;
  const dirtHeight = viewHeight - grassStripHeight * 2;
  const laneHeight = dirtHeight / racerCount;

  // The finish line lives in world space, so rotating or resizing mid-race never moves it
  // relative to the racers. Short tracks still fill the whole view.
  const finishLineX = metersToWorldX(distance);
  const trackWidth = Math.max(finishLineX + TRACK.TRACK_BUFFER, viewWidth);

  return {
    viewWidth,
    viewHeight,
    grassStripHeight,
    dirtHeight,
    laneHeight,
    racerCount,
    distance,
    finishLineX,
    trackWidth,
  };
}
