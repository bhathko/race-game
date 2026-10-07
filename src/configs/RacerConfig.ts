export const RACER = {
  WIDTH: 80,
  HEIGHT: 80,
  /**
   * Visible character art inside the 80px frame, relative to the bottom-center anchor.
   * The 48px source frames have the art on rows 11–32, with empty space below the feet.
   */
  ART_TOP: -62,
  ART_FEET: -27,
  /** Name label (center) and stamina bar (top), placed just above the head / below the feet. */
  LABEL_Y: -71,
  STAMINA_BAR_Y: -24,
  STAMINA_BAR_WIDTH: 50,
} as const;

export const TRACK = {
  START_LINE_X: 50,
  /** Fixed world scale: race length (and duration) is the same on every screen size. */
  PX_PER_METER: 23,
  GRASS_STRIP_UNITS: 4,
  TRACK_BUFFER: 200,
} as const;
