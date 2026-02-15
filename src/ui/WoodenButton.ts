import { Container, Graphics, Text, TextStyle } from "pixi.js";

export interface WoodenButtonOptions {
  label: string;
  color: number;
  onClick: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
}

/**
 * A reusable wooden-textured button.
 *
 * Drawn entirely with PixiJS Graphics — no bitmaps needed.
 * Used in MenuScene, ResultScene, and anywhere else a CTA is required.
 */
export function createWoodenButton(opts: WoodenButtonOptions): Container {
  const {
    label,
    color,
    onClick,
    width = 60,
    height: h = 60,
    fontSize = 28,
  } = opts;

  const btn = new Container();

  // ── background ──────────────────────────────────────────────────────────
  const bg = new Graphics();
  // Drop shadow
  bg.roundRect(-width / 2, -h / 2 + 6, width, h, 8).fill(0x000000, 0.4);
  // Main body
  bg.roundRect(-width / 2, -h / 2, width, h, 8)
    .fill(color)
    .stroke({ color: 0x2e1a1a, width: 4 });
  // Wood grain lines
  for (let i = -h / 2 + 10; i < h / 2; i += 15) {
    bg.rect(-width / 2 + 10, i, width - 20, 2).fill(0x000000, 0.1);
  }
  btn.addChild(bg);

  // ── label ───────────────────────────────────────────────────────────────
  const style = new TextStyle({
    fill: "#ffffff",
    fontSize,
    fontWeight: "900",
    stroke: { color: "#000000", width: 4 },
  });
  const text = new Text({ text: label, style });
  text.anchor.set(0.5);
  btn.addChild(text);

  // ── interaction ─────────────────────────────────────────────────────────
  btn.eventMode = "static";
  btn.cursor = "pointer";
  btn.on("pointerdown", () => {
    btn.scale.set(0.95);
    onClick();
  });
  btn.on("pointerup", () => btn.scale.set(1.0));
  btn.on("pointerupoutside", () => btn.scale.set(1.0));

  return btn;
}
