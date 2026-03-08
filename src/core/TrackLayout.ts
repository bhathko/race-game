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

export function createTrackLayout(
  viewWidth: number,
  viewHeight: number,
  racerCount: number,
  distance: number,
): TrackLayoutData {
  const unit = ITEMS.ground.unit;
  const grassStripHeight = unit * TRACK.GRASS_STRIP_UNITS;
  const dirtHeight = viewHeight - grassStripHeight * 2;
  const laneHeight = dirtHeight / racerCount;

  // Assuming a fixed 50px-to-1-meter scale
  // Finish line X = start X + (distance / 50) * viewWidth.
  // Wait, looking at MobileVerticalRaceScene: finishLineX = 50 + (distance / 50) * viewW
  const finishLineX = TRACK.START_LINE_X + (distance / 50) * viewWidth;
  const trackWidth = finishLineX + TRACK.TRACK_BUFFER;

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
