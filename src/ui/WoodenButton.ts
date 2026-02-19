import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { PALETTE } from "../config";

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
export class WoodenButton extends Container {
  public bg: Graphics;
  public content: Text;
  private _onClick: () => void;

  constructor(opts: WoodenButtonOptions) {
    super();
    const { label, color, onClick, width = 60, height: h = 60, fontSize = 28 } = opts;

    this._onClick = onClick;

    // ── background ──────────────────────────────────────────────────────────
    this.bg = new Graphics();
    this.addChild(this.bg);
    this.drawBg(width, h, color);

    // ── label ───────────────────────────────────────────────────────────────
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize,
      fontWeight: "900",
      stroke: { color: PALETTE.STR_BLACK, width: 4 },
    });
    this.content = new Text({ text: label, style });
    this.content.anchor.set(0.5);
    this.addChild(this.content);

    // ── interaction ─────────────────────────────────────────────────────────
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", () => {
      this.scale.set(0.95);
      this._onClick();
    });
    this.on("pointerup", () => this.scale.set(1.0));
    this.on("pointerupoutside", () => this.scale.set(1.0));
  }

  public drawBg(width: number, h: number, color: number) {
    this.bg.clear();
    // Drop shadow
    this.bg.roundRect(-width / 2, -h / 2 + 6, width, h, 8).fill({
      color: PALETTE.BLACK,
      alpha: 0.4,
    });
    // Main body
    this.bg
      .roundRect(-width / 2, -h / 2, width, h, 8)
      .fill({ color })
      .stroke({ color: PALETTE.WOOD_DARK, width: 4 });
    // Wood grain lines
    for (let i = -h / 2 + 10; i < h / 2; i += 15) {
      this.bg.rect(-width / 2 + 10, i, width - 20, 2).fill({
        color: PALETTE.BLACK,
        alpha: 0.1,
      });
    }
  }
}

/**
 * A reusable wooden-textured button.
 */
export function createWoodenButton(opts: WoodenButtonOptions): WoodenButton {
  return new WoodenButton(opts);
}
