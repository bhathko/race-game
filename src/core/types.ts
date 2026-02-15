import { Texture } from "pixi.js";

/** Sprite-sheet animation frames for a racer character. */
export interface RacerAnimations {
  idle: Texture[];
  walk: Texture[];
}

/** Three-slice vertical texture set (top edge, tiled middle, bottom edge). */
export interface TileTextures {
  top: Texture;
  middle: Texture;
  bottom: Texture;
}

/** Convenience aliases kept for backward compatibility. */
export type GroundTextures = TileTextures;
export type GrassTextures = TileTextures;
