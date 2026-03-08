export const RACER = {
  WIDTH: 80,
  HEIGHT: 80,
  COLLISION_OFFSET: 80,
  Y_OFFSET: 40, // Pushes the bottom-anchored racer down for better lane centering
} as const;

export const TRACK = {
  FINISH_LINE_X: 750,
  START_LINE_X: 50,
  GRASS_STRIP_UNITS: 4,
  TRACK_BUFFER: 200,
} as const;
