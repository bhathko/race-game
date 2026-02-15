// ─── Canvas / Layout ─────────────────────────────────────────────────────────

export const CANVAS = {
  WIDTH: 1000,
  HEIGHT: 600,
  GAME_VIEW_WIDTH: 800,
  UI_WIDTH: 200,
  MIN_UNIT_WIDTH: 800,
} as const;

// ─── Racer ──────────────────────────────────────────────────────────────────

export const RACER = {
  WIDTH: 80,
  HEIGHT: 80,
  /** Padding ignored on front/back of character for finish-line collision. */
  COLLISION_OFFSET: 80,
} as const;

// ─── Track ──────────────────────────────────────────────────────────────────

export const TRACK = {
  FINISH_LINE_X: 750,
  START_LINE_X: 50,
} as const;

// ─── Character Assets ───────────────────────────────────────────────────────

export const CHARACTERS = {
  bear: {
    name: "Bear",
    idle: { path: "src/assets/characters/bear/bear-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/bear/bear-walk.png", frames: 8 },
  },
  cat: {
    name: "Cat",
    idle: { path: "src/assets/characters/cat/cat-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/cat/cat-walk.png", frames: 8 },
  },
  fox: {
    name: "Fox",
    idle: { path: "src/assets/characters/fox/fox-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/fox/fox-walk.png", frames: 8 },
  },
  mouse: {
    name: "Mouse",
    idle: { path: "src/assets/characters/mouse/mouse-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/mouse/mouse-walk.png", frames: 8 },
  },
  panda: {
    name: "Panda",
    idle: { path: "src/assets/characters/panda/panda-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/panda/panda-walk.png", frames: 8 },
  },
  rabbit: {
    name: "Rabbit",
    idle: { path: "src/assets/characters/rabbit/rabbit-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/rabbit/rabbit-walk.png", frames: 8 },
  },
  sheep: {
    name: "Sheep",
    idle: { path: "src/assets/characters/sheep/sheep-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/sheep/sheep-walk.png", frames: 8 },
  },
  turtle: {
    name: "Turtle",
    idle: { path: "src/assets/characters/turtle/turtle-idle.png", frames: 6 },
    walk: { path: "src/assets/characters/turtle/turtle-walk.png", frames: 8 },
  },
} as const;

// ─── Item Assets ────────────────────────────────────────────────────────────

export const ITEMS = {
  tree: {
    path: "src/assets/item/tree-idle.png",
    cols: 12,
    rows: 4,
    width: 48,
    height: 48,
  },
  ground: {
    path: "src/assets/item/ground.png",
    unit: 16,
  },
  grass: {
    path: "src/assets/item/grass.png",
    unit: 16,
  },
} as const;

// ─── Gameplay ───────────────────────────────────────────────────────────────

export const GAMEPLAY = {
  MAX_RACERS: 8,

  /**
   * Base stats & variance ranges for random racer generation.
   * Compressed so max/min ratio ≈ 1.29 (was 2.0) — balance
   * corrections can now actually close the gap.
   */
  STATS: {
    BASE_SPEED: 2.8,
    SPEED_VARIANCE: 0.5, // range [2.8, 3.3] — 18 % spread (was 28 %)
    ACCEL_BASE: 0.04,
    ACCEL_VARIANCE: 0.07, // range [0.04, 0.11] — wider + slower base so accel matters
    ENDURANCE_BASE: 0.75,
    ENDURANCE_VARIANCE: 0.6, // range [0.75, 1.35] — wider so endurance matters more
  },

  /**
   * Dynamic Balance — "Comeback Engine".
   *
   * ALL multipliers scale continuously as
   *   t = (rank - 1) / max(1, totalRacers - 1)
   * so they work identically for 2-player and 8-player races.
   */
  BALANCE: {
    /** §3-A  Slingshot — extra accel per normalised rank step. */
    ACCEL_RANK_FACTOR: 0.56, // last-place gets +56 % accel

    /** Accel-responsiveness — direct speed bonus from acceleration stat. */
    ACCEL_SPEED_BONUS: 0.06, // top-accel racer gets +6 % speed vs bottom

    /** §3-B  Slipstream — max-speed ceiling for last place. */
    SLIPSTREAM_MAX_MULT: 1.25, // leader = 1.0, last = 1.25

    /** Deep-trailing boost — quadratic extra speed for bottom-half racers. */
    DEEP_TRAILING_BOOST: 0.25, // last place gets +25 % on top of slipstream

    /** §3-C  Respite — recovery multiplier for last place. */
    RECOVERY_MULT_MAX: 2.5, // leader = 1.0, last = 2.5 — trailing racers recover faster

    /** Rubber-band — distance-proportional speed boost. */
    RUBBER_BAND_FACTOR: 0.4, // was 0.35

    /** §4  Climax Phase — final 20 % of track distance. */
    CLIMAX_THRESHOLD: 0.2,
    CLIMAX_RECOVERY_MULT: 1.5,
    /** Overdrive range in spec-metres (converted to px at runtime). */
    CLIMAX_OVERDRIVE_RANGE: 8,
    CLIMAX_OVERDRIVE_SPEED_MULT: 1.04, // was 1.12 — less finish-line compression
    /** Fraction of total racers (rounded up) eligible for overdrive. */
    CLIMAX_OVERDRIVE_RANK_FRAC: 0.25, // was 0.4 — fewer racers get overdrive
  },

  /**
   * Drama mechanics — inject unpredictability so any racer can
   * win regardless of raw stats.
   */
  DRAMA: {
    /** Pace-wave: sinusoidal speed oscillation per racer. */
    PACE_WAVE_AMPLITUDE: 0.18, // ±18 % speed swing — visually obvious surges
    PACE_WAVE_FREQ_MIN: 0.003, // radians per frame (slightly faster cycles)
    PACE_WAVE_FREQ_MAX: 0.008, // radians per frame (fast)

    /** Stumble: random momentary slowdown. */
    STUMBLE_CHANCE: 0.0015, // per frame — reduced for ~1.5-2 stumbles/racer
    STUMBLE_LEADER_MULT: 1.4, // leaders stumble slightly more (was 2.0)
    STUMBLE_DURATION_MIN: 15, // frames — shorter = dramatic but recoverable
    STUMBLE_DURATION_MAX: 35, // frames
    STUMBLE_SPEED_FACTOR: 0.45, // speed during stumble — visible but not devastating
  },

  /** Core stamina / speed tuning knobs. */
  PHYSICS: {
    /** Speed when S = 0 ("Recovery State"), as fraction of V_max. */
    TIRED_SPEED_FACTOR: 0.5,
    /** Stamina depletion rate per delta while sprinting. */
    STAMINA_DEPLETION_RATE: 1.1,
    /** Passive stamina drain per frame (scaled by 1/endurance). */
    PASSIVE_STAMINA_DRAIN: 0.12,
    /** Base stamina recovery rate per delta while cruising. */
    STAMINA_RECOVERY_RATE: 0.25,
    /** Cruising speed as fraction of V_max. */
    CRUISING_SPEED_FACTOR: 0.78,
    /** Sprint speed as fraction of V_max (before multipliers). */
    SPRINT_SPEED_FACTOR: 1.2,
    /** Distance from finish where ALL strategies go all-in. */
    SPRINT_DISTANCE: 250,
    /** Smoothing when decelerating faster than accelerating. */
    ACCEL_SMOOTHING_FACTOR: 1.5,
    /** Random per-frame noise to avoid robotic movement. */
    SPEED_NOISE: 0.15,
  },

  /**
   * Stamina Strategies — each racer randomly gets one.
   * This creates visible behavioral variety (some racers zoom ahead
   * early then fade, others cruise then surge at the end).
   *
   * Each strategy also biases the racer's stats via multipliers:
   *   final_stat = base_random_stat × strategy_multiplier
   * So an aggressive racer is inherently faster but less durable.
   */
  STRATEGIES: {
    /**
     * "Aggressive" — sprint hard, crash fast, recover quickly, repeat.
     * High speed, decent accel, LOW endurance — burns bright.
     */
    AGGRESSIVE_SPRINT_THRESHOLD: 20,
    AGGRESSIVE_TIRED_EXIT: 0.4,
    AGGRESSIVE_TIRED_SPEED: 0.65,
    AGGRESSIVE_SPEED_MULT: 1.1, // +10 % top speed
    AGGRESSIVE_ACCEL_MULT: 1.05, // +5 % accel
    AGGRESSIVE_ENDURANCE_MULT: 0.75, // −25 % endurance — fragile

    /**
     * "Pacer" — rhythmic push-rest cycles.
     * Balanced stats, slightly above average endurance.
     */
    PACER_SPRINT_THRESHOLD: 50,
    PACER_SPEED_MULT: 1.0,
    PACER_ACCEL_MULT: 1.0,
    PACER_ENDURANCE_MULT: 1.1, // +10 % endurance

    /**
     * "Conservative" — cruise most of the race, save for last 35 %.
     * Slow but tough — high endurance, low speed.
     */
    CONSERVATIVE_PUSH_FRACTION: 0.35,
    CONSERVATIVE_SPEED_MULT: 0.92, // −8 % top speed
    CONSERVATIVE_ACCEL_MULT: 0.95, // −5 % accel
    CONSERVATIVE_ENDURANCE_MULT: 1.25, // +25 % endurance — tank

    /**
     * "Closer" — cruise until climax phase, then go all-out.
     * Fast accel for the surge, decent endurance for the push.
     */
    CLOSER_PUSH_FRACTION: 0.25,
    CLOSER_SPEED_MULT: 0.98, // −2 % speed
    CLOSER_ACCEL_MULT: 1.15, // +15 % accel — explosive burst
    CLOSER_ENDURANCE_MULT: 1.05, // +5 % endurance
  },

  /** Second Wind — burst for deeply trailing racers. */
  SECOND_WIND: {
    TRAILING_THRESHOLD: 0.75, // must be in bottom 25 %
    FRAMES_REQUIRED: 360, // consecutive trailing frames (~6 s) — long enough to fall genuinely behind
    SPEED_MULT: 1.45, // +45 % speed during burst — strong enough to close real gaps
    DURATION: 150, // frames (~2.5 seconds)
    COOLDOWN: 300, // frames (~5 seconds) before next burst
  },
} as const;

// ─── Visuals / Timing ───────────────────────────────────────────────────────

export const VISUALS = {
  CAMERA_SMOOTHING: 0.1,
  LEADERBOARD_ANIMATION_SPEED: 0.15,
  RESULT_DELAY: 1500,
  /** Seconds before race starts. */
  COUNTDOWN_DURATION: 3,
} as const;

// ─── Colour Palette ─────────────────────────────────────────────────────────

export const COLORS = {
  BACKGROUND: 0x1a1a1a,

  SIDEBAR_BG: 0x3e2723,
  SIDEBAR_WOOD: 0x2e1b11,
  SIDEBAR_STROKE: 0x5d4037,

  RANK_GOLD: 0xffd700,
  RANK_SILVER: 0xc0c0c0,
  RANK_BRONZE: 0xcd7f32,
  RANK_DEFAULT: 0x5d4037,

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
} as const;
