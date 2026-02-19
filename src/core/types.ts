import { Texture } from "pixi.js";
import type { Racer } from "../entities";

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

/** Dependency context for Race layouts. */
export interface RaceContext {
  playerNames: string[];
  distance: number;
  characterAnimations: Map<string, RacerAnimations>;
  treeAnimation: Texture[];
  groundTextures: GroundTextures;
  grassTextures: GrassTextures;
  onFinished: (results: Racer[]) => void;
  selectedKeys?: string[];
  isFunnyMode?: boolean;
}

/** Dependency context for Character Selection layouts. */
export interface SelectionContext {
  playerCount: number;
  distance: number;
  characterAnimations: Map<string, RacerAnimations>;
  onStartRace: (characterKeys: string[], distance: number) => void;
  onBack: () => void;
  isFunnyMode?: boolean;
}

/** Dependency context for Menu layouts. */
export interface MenuContext {
  onStartRace: (playerCount: number, distance: number, isFunnyMode?: boolean) => void;
  initialSettings?: { count: number; distance: number };
}

/** Dependency context for Result layouts. */
export interface ResultContext {
  finishedRacers: Racer[];
  onRestart: () => void;
  characterAnimations: Map<string, RacerAnimations>;
}
