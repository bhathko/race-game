import { Container } from "pixi.js";

/**
 * Common interface all game scenes must implement.
 * Removes the need for `(scene as any).resize()` casts in Game.ts.
 */
export interface Scene extends Container {
  /** Called every frame with the current delta time. */
  update(delta: number): void;

  /** Called when the viewport dimensions change. */
  resize(width: number, height: number): void;
}
