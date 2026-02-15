import { Graphics } from "pixi.js";

/**
 * Draw the shared grassy hill background used by menu & result screens.
 *
 * Clears and repaints `bg` and `hills` to fill the given viewport.
 */
export function drawHillBackground(
  bg: Graphics,
  hills: Graphics,
  width: number,
  height: number,
): void {
  bg.clear().rect(0, 0, width, height).fill(0x81c784);

  hills.clear();
  drawPixelHill(hills, width * 0.2, height, 200, 0x66bb6a);
  drawPixelHill(hills, width * 0.5, height, 300, 0x4caf50);
  drawPixelHill(hills, width * 0.8, height, 150, 0x81c784);
}

function drawPixelHill(
  g: Graphics,
  x: number,
  groundY: number,
  size: number,
  color: number,
): void {
  g.beginPath();
  g.moveTo(x - size, groundY);
  g.lineTo(x, groundY - size);
  g.lineTo(x + size, groundY);
  g.fill(color);
  g.stroke({ color: 0x1b5e20, width: 4 });
}
