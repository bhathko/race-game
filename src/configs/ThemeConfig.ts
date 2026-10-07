export const PALETTE = {
  WOOD_DARK: 0x4e342e,
  WOOD_MID: 0x5d4037,
  WOOD_LIGHT: 0x6d4c41,
  WOOD_PALE: 0x795548,
  WOOD_EXTRA_PALE: 0x8d6e63,
  GRASS_LIGHT: 0x81c784,
  GRASS_MID: 0x66bb6a,
  GRASS_DARK: 0x388e3c,
  FOREST_GREEN: 0x388e3c,
  TERRACOTTA: 0x8d3b3b,
  MUSTARD: 0x9a8c00,
  STONE_GREY: 0x607d8b,
  SUCCESS: 0x2e7d32,
  DANGER: 0xc62828,
  WARNING: 0xffeb3b,
  INFO: 0x2196f3,
  GOLD: 0xffd700,
  SILVER: 0xc0c0c0,
  BRONZE: 0xcd7f32,
  BLACK: 0x000000,
  WHITE: 0xffffff,
  GREY_DARK: 0x1a1a1a,
  GREY_MID: 0x333333,
  GREY_LIGHT: 0x444444,
  // New Cute Pastel Palette
  CUTE_PINK: 0xff80ab,
  CUTE_BLUE: 0x80d8ff,
  CUTE_YELLOW: 0xffe57f,
  CUTE_MINT: 0xb9f6ca,
  CUTE_PURPLE: 0xea80fc,
  CUTE_ORANGE: 0xffbd66,
  CHUNKY_SHADOW: 0x1c2833, // High contrast soft black for bouncy shapes

  STR_WHITE: "#ffffff",
  STR_BLACK: "#000000",
  STR_GREY_MUTED: "#cccccc",
  STR_GREY_SUBTLE: "#aaaaaa",
  STR_WOOD_DARK: "#4e342e",
  STR_WOOD_MID: "#5d4037",
  STR_WOOD_EXTRA_PALE: "#8d6e63",
  STR_SUCCESS: "#4caf50",
} as const;

/**
 * Controller palette: a black body with the four face-button colors as accents.
 * Each accent has one job — blue confirms, red goes back, green frames the selection,
 * pink marks a toggle that is on.
 */
export const UI = {
  BG: 0x17181c,
  SURFACE: 0x26282f,
  SURFACE_ALT: 0x30333b,
  LINE: 0x3b3f4a,
  TEXT: 0xf3f4f6,
  TEXT_MUTED: 0x9ba0ac,
  /** Dark text for light grounds (the dirt track, podium blocks). */
  INK: 0x17181c,
  SHADOW: 0x000000,
  WHITE: 0xffffff,
  BLUE: 0x3d84e6,
  RED: 0xe8434c,
  GREEN: 0x3ccfae,
  PINK: 0xdb5aa2,
  /** Selection frame (green) and the tint behind a selected card. */
  FRAME: 0x3ccfae,
  FRAME_TINT: 0x1f3b37,
  GOLD: 0xffc93c,
  SILVER: 0xc7ced9,
  BRONZE: 0xe6955a,
} as const;

/** Bundled UI font: M PLUS Rounded 1c (SIL Open Font License), Latin subset, two weights. */
export const FONT = {
  FAMILY: "M PLUS Rounded 1c",
  STACK: '"M PLUS Rounded 1c", "Arial Rounded MT Bold", "Helvetica Neue", sans-serif',
  FILES: [
    { path: "assets/fonts/MPLUSRounded1c-Bold.ttf", weight: "700" },
    { path: "assets/fonts/MPLUSRounded1c-ExtraBold.ttf", weight: "800" },
  ],
} as const;

export const TRACK_COLORS = {
  CREAM: 0xfff9c4,
  DARK_BROWN: PALETTE.WOOD_PALE,
  WARM_RED: 0xff8a65,
} as const;

export const COLORS = {
  BACKGROUND: PALETTE.GREY_DARK,
  SIDEBAR_BG: UI.BG,
  SIDEBAR_WOOD: UI.LINE,
  SIDEBAR_STROKE: PALETTE.WOOD_PALE,
  RANK_GOLD: UI.GOLD,
  RANK_SILVER: UI.SILVER,
  RANK_BRONZE: UI.BRONZE,
  RANK_DEFAULT: UI.LINE,
  TRACK_LINES: PALETTE.GREY_LIGHT,
  START_LINE: 0x5555ff,
  FINISH_LINE: PALETTE.WHITE,
  MASK_FILL: PALETTE.WHITE,
  STAMINA_BG: PALETTE.GREY_MID,
  STAMINA_GOOD: PALETTE.STR_SUCCESS,
  STAMINA_TIRED: 0xf44336,
  TEXT_TITLE: PALETTE.STR_WHITE,
  TEXT_NORMAL: PALETTE.STR_WHITE,
  TEXT_MUTED: PALETTE.STR_GREY_MUTED,
  TEXT_SUBTLE: PALETTE.STR_GREY_SUBTLE,
  TEXT_HIGHLIGHT: PALETTE.STR_SUCCESS,
  TEXT_MARKER: PALETTE.STR_WOOD_EXTRA_PALE,
  // Controller buttons: blue confirms, red goes back, pink = toggle on, dark grey for the rest
  BUTTON_PRIMARY: UI.BLUE,
  BUTTON_NEUTRAL: UI.SURFACE,
  BUTTON_WARN: UI.PINK,
  BUTTON_DANGER: UI.RED,
  BUTTON_SUCCESS: UI.BLUE,
  BUTTON_TEXT: PALETTE.STR_WHITE,
  RACERS: [0xff7043, 0x66bb6a, 0x42a5f5, 0xab47bc, 0xffee58, 0x26c6da, 0xffa726, 0xec407a],
} as const;
