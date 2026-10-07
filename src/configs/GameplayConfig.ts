export const GAMEPLAY = {
  MAX_RACERS: 8,
  STATS: {
    BASE_SPEED: 2.8,
    SPEED_VARIANCE: 0.5,
    ACCEL_BASE: 0.04,
    ACCEL_VARIANCE: 0.07,
    ENDURANCE_BASE: 0.75,
    ENDURANCE_VARIANCE: 0.6,
  },
  /** Fraction of top speed used in each effort state. Kept close together so speed changes look natural. */
  EFFORT: {
    CRUISE: 0.86,
    SPRINT: 1.1,
    TIRED: 0.72,
  },
  PHYSICS: {
    SPRINT_DRAIN: 1.0,
    PASSIVE_STAMINA_DRAIN: 0.1,
    STAMINA_RECOVERY_RATE: 0.25,
    TIRED_RECOVERY_MULT: 1.6,
    /** Top speed lost as stamina drops below half — makes endurance matter all race long. */
    FATIGUE_FADE: 0.08,
    /**
     * Final kick: a racer goes all-in once the finish is within reach of the stamina it has left
     * (scaled by this margin), or within MIN_KICK_PX regardless.
     */
    KICK_REACH_MARGIN: 0.9,
    MIN_KICK_PX: 60,
    /** Distance from the start considered the "early" phase (Aggressive's fast start). */
    EARLY_PHASE_PX: 360,
    /** Top-speed bonus for the quickest accelerators (keeps the accel stat relevant at speed). */
    ACCEL_SPEED_BONUS: 0.04,
    ACCEL_SMOOTHING_FACTOR: 1.5,
    SPEED_NOISE: 0.15,
    MIN_SPRINT_USAGE: 10,
    MIN_SPRINT_START_THRESHOLD: 10,
  },
  /** Slipstream: tucking in close behind the racer ahead gives a small, visible speed bonus. */
  DRAFT: {
    MIN_GAP_PX: 15,
    RANGE_PX: 130,
    SPEED_BONUS: 0.05,
    DRAIN_MULT: 0.8,
  },
  /**
   * Distance- and rank-based catch-up. Every bonus is multiplied by a field-size factor
   * so 2–4 racer races don't flip-flop on every frame.
   */
  CATCH_UP: {
    /** Gap to the leader (as a fraction of the track) at which the rubber band is at full strength. */
    FULL_GAP_FRACTION: 0.12,
    MAX_SPEED_BONUS: 0.09,
    ACCEL_RANK_BONUS: 0.3,
    RECOVERY_RANK_BONUS: 0.6,
    /** Field-size scale: (racers - 1) / FIELD_SIZE_FULL, clamped to [FIELD_SIZE_MIN, 1]. */
    FIELD_SIZE_FULL: 7,
    FIELD_SIZE_MIN: 0.35,
  },
  DRAMA: {
    PACE_WAVE_AMPLITUDE: 0.03,
    PACE_WAVE_FREQ_MIN: 0.004,
    PACE_WAVE_FREQ_MAX: 0.008,
    STUMBLE_CHANCE: 0.0012,
    STUMBLE_LEADER_MULT: 1.4,
    STUMBLE_DURATION_MIN: 18,
    STUMBLE_DURATION_MAX: 30,
    STUMBLE_SPEED_FACTOR: 0.55,
    HOLE_STUN_DURATION: 72,
  },
  HOLE_ANIMATION: {
    SINK_DURATION: 18,
    HIDDEN_DURATION: 14,
    FLASH_DURATION: 40,
    FLASH_INTERVAL: 4,
    FADE_START_THRESHOLD: 0.1,
    SINK_OFFSET_PX: 20,
  },
  STRATEGIES: {
    AGGRESSIVE_SPRINT_THRESHOLD: 30,
    AGGRESSIVE_TIRED_EXIT: 0.35,
    AGGRESSIVE_SPEED_MULT: 1.12,
    AGGRESSIVE_ACCEL_MULT: 1.1,
    AGGRESSIVE_ENDURANCE_MULT: 0.85,
    AGGRESSIVE_EARLY_SPEED: 0.08,
    PACER_SPRINT_THRESHOLD: 55,
    PACER_TIRED_EXIT: 0.4,
    PACER_SPEED_MULT: 1.05,
    PACER_ACCEL_MULT: 1.0,
    PACER_ENDURANCE_MULT: 1.1,
    PACER_DRAIN_MULT: 0.86,
    CONSERVATIVE_SPRINT_THRESHOLD: 65,
    CONSERVATIVE_TIRED_EXIT: 0.3,
    CONSERVATIVE_SPEED_MULT: 1.03,
    CONSERVATIVE_ACCEL_MULT: 0.95,
    CONSERVATIVE_ENDURANCE_MULT: 1.25,
    CONSERVATIVE_DRAFT_MULT: 2.1,
    CLOSER_SPRINT_THRESHOLD: 92,
    CLOSER_TIRED_EXIT: 0.3,
    CLOSER_SPEED_MULT: 1.01,
    CLOSER_ACCEL_MULT: 1.15,
    CLOSER_ENDURANCE_MULT: 1.15,
    CLOSER_KICK_SPEED: 0.045,
  },
  SECOND_WIND: {
    TRAILING_THRESHOLD: 0.75,
    FRAMES_REQUIRED: 360,
    SPEED_MULT: 1.1,
    DURATION: 150,
    COOLDOWN: 420,
  },
} as const;

export const VISUALS = {
  CAMERA_SMOOTHING: 0.1,
  /** Pack camera: space kept between the leader and the right edge of the view. */
  CAMERA_LEAD_PAD_FRACTION: 0.15,
  CAMERA_LEAD_PAD_MIN: 70,
  LEADERBOARD_ANIMATION_SPEED: 0.15,
  RESULT_DELAY: 1500,
  COUNTDOWN_DURATION: 3,
} as const;
