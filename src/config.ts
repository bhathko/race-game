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
    },
    ground: {
      path: "src/assets/item/ground.png",
      unit: 16
    },
    grass: {
      path: "src/assets/item/grass.png",
      unit: 16
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
    SIDEBAR_BG: 0x2c2c2c,
    SIDEBAR_WOOD: 0x1e1e1e,
    SIDEBAR_STROKE: 0x444444,
    RANK_GOLD: 0xffd700,
    RANK_SILVER: 0xc0c0c0,
    RANK_BRONZE: 0xcd7f32,
    RANK_DEFAULT: 0x444444,
    
    TRACK_LINES: 0x444444,
    START_LINE: 0x5555ff,
    FINISH_LINE: 0xffffff,
    MASK_FILL: 0xffffff,

    STAMINA_BG: 0x333333,
    STAMINA_GOOD: 0x4caf50,
    STAMINA_TIRED: 0xf44336,

    TEXT_TITLE: "#ffffff",
    TEXT_NORMAL: "#ffffff",
    TEXT_MUTED: "#cccccc",
    TEXT_SUBTLE: "#aaaaaa",
    TEXT_HIGHLIGHT: "#4caf50",
    TEXT_MARKER: "#795548",

    BUTTON_PRIMARY: 0x4e342e,
    BUTTON_DANGER: 0xc62828,
    BUTTON_SUCCESS: 0x2e7d32,
    BUTTON_TEXT: "#ffffff",

    RACERS: [
      0xff7043, // Deep Orange
      0x66bb6a, // Green
      0x42a5f5, // Blue
      0xab47bc, // Purple
      0xffee58, // Yellow
      0x26c6da, // Cyan
      0xffa726, // Orange
      0xec407a, // Pink
    ],
  },
};
