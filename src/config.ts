export const CONFIG = {
  // Dimensions
  CANVAS_WIDTH: 1000,
  GAME_VIEW_WIDTH: 800,
  UI_WIDTH: 200,
  MIN_UNIT_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // Racer Dimensions
  RACER_WIDTH: 80,
  RACER_HEIGHT: 80,
  RACER_COLLISION_OFFSET: 80, // Padding to ignore on front/back of character for finish line

  // Track
  FINISH_LINE_X: 750,
  START_LINE_X: 50,

  // Character Assets
  CHARACTERS: {
    bear: {
      name: "Bear",
      idle: { path: "src/assets/characters/bear/bear-idle.png", frames: 6 },
      walk: { path: "src/assets/characters/bear/bear-walk.png", frames: 8 },
    },
  },
  
  // Item Assets
  ITEMS: {
    tree: {
      path: "src/assets/item/tree-idle.png",
      cols: 12,
      rows: 4,
      width: 48,
      height: 48
    }
  },

  // Gameplay Settings
  MAX_RACERS: 8,

  // Base Stats
  BASE_SPEED: 2,
  SPEED_VARIANCE: 2,
  ACCEL_BASE: 0.05,
  ACCEL_VARIANCE: 0.1,
  ENDURANCE_BASE: 0.8,
  ENDURANCE_VARIANCE: 0.4,

  // Physics & AI
  CATCH_UP_STRENGTH: 0.15,
  SLIPSTREAM_RANGE: 150,
  SLIPSTREAM_BOOST: 0.25,
  SPRINT_DISTANCE: 250,

  CRUISING_SPEED_FACTOR: 0.85,
  SPRINT_SPEED_FACTOR: 1.1,
  TIRED_SPEED_FACTOR: 0.4,

  STAMINA_RECOVERY_RATE: 0.25,
  STAMINA_DEPLETION_RATE: 0.7,
  STAMINA_CRUISING_RECOVERY: 0.1,
  STAMINA_TIRED_THRESHOLD: 35,

  ACCEL_SMOOTHING_FACTOR: 1.5,
  SPEED_NOISE: 0.3,

  // Visuals
  CAMERA_SMOOTHING: 0.1,
    LEADERBOARD_ANIMATION_SPEED: 0.15,
    RESULT_DELAY: 1500,
    COUNTDOWN_DURATION: 3, // Seconds before race starts
    
    // Colors & Theme
  
  COLORS: {
    BACKGROUND: 0x1a1a1a,
    SIDEBAR_BG: 0x2a2a2a,
    SIDEBAR_STROKE: 0x444444,
    TRACK_LINES: 0x444444,
    START_LINE: 0x5555ff,
    FINISH_LINE: 0xffffff,
    MASK_FILL: 0xffffff,

    STAMINA_BG: 0x333333,
    STAMINA_GOOD: 0x00ff00,
    STAMINA_TIRED: 0xff0000,

    TEXT_TITLE: "#ffffff",
    TEXT_NORMAL: "#ffffff",
    TEXT_MUTED: "#cccccc",
    TEXT_SUBTLE: "#aaaaaa",
    TEXT_HIGHLIGHT: "#00ff00",
    TEXT_MARKER: "#666666",

    BUTTON_PRIMARY: 0x3357ff,
    BUTTON_DANGER: 0xcc3333,
    BUTTON_SUCCESS: 0x33cc33,
    BUTTON_TEXT: "#ffffff",

    RACERS: [
      0xff5733, // Red-Orange
      0x33ff57, // Green
      0x3357ff, // Blue
      0xf333ff, // Magenta
      0xfff333, // Yellow
      0x33fff3, // Cyan
      0xffa500, // Orange
      0x800080, // Purple
    ],
  },
};
