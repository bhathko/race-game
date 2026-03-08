import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { PALETTE } from "../config";

export interface CuteButtonOptions {
  label: string;
  color: number;
  onClick: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
  animalStyle?: "cat" | "bear" | "rabbit" | "none";
}

/**
 * A cute, modern, bouncy pill-shaped button with optional animal ears.
 */
export class CuteButton extends Container {
  public bg: Graphics;
  public content: Text;
  private _onClick: () => void;
  private animalStyle: "cat" | "bear" | "rabbit" | "none";

  constructor(opts: CuteButtonOptions) {
    super();
    const {
      label,
      color,
      onClick,
      width = 200,
      height: h = 60,
      fontSize = 28,
      animalStyle = "cat",
    } = opts;

    this._onClick = onClick;
    this.animalStyle = animalStyle;

    // ── background ──────────────────────────────────────────────────────────
    this.bg = new Graphics();
    this.addChild(this.bg);
    this.drawBg(width, h, color);

    // ── label ───────────────────────────────────────────────────────────────
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize,
      fontWeight: "900",
      stroke: { color: PALETTE.STR_BLACK, width: 6, join: "round" },
      dropShadow: {
        alpha: 1,
        angle: Math.PI / 2,
        blur: 0,
        color: PALETTE.STR_BLACK,
        distance: 4,
      },
      letterSpacing: 2,
    });
    this.content = new Text({ text: label, style });
    this.content.anchor.set(0.5);
    this.content.y = -4; // Elevation offset
    this.addChild(this.content);

    // ── interaction ─────────────────────────────────────────────────────────
    this.eventMode = "static";
    this.cursor = "pointer";

    let baseScaleX = 1;
    let baseScaleY = 1;

    this.on("pointerdown", () => {
      baseScaleX = this.scale.x;
      baseScaleY = this.scale.y;
      this.scale.set(baseScaleX * 0.92, baseScaleY * 0.92); // Bouncy shrink
      this.bg.y = 4; // Press down into shadow
      this.content.y = 0; // Text moves down with face
      this._onClick();
    });
    this.on("pointerup", () => {
      this.scale.set(baseScaleX, baseScaleY);
      this.bg.y = 0;
      this.content.y = -4;
    });
    this.on("pointerupoutside", () => {
      this.scale.set(baseScaleX, baseScaleY);
      this.bg.y = 0;
      this.content.y = -4;
    });
  }

  /**
   * Updates the button color (e.g. for toggle buttons).
   */
  public updateColor(color: number, width: number, h: number) {
    this.drawBg(width, h, color);
  }

  /**
   * Draws the cute pill, shadow, highlight, and ears.
   */
  private drawBg(width: number, h: number, color: number) {
    this.bg.clear();

    const corner = h / 2; // Pill shape (fully rounded ends)
    const shadowDepth = 8;
    const shadowColor = PALETTE.CHUNKY_SHADOW;
    const strokeWidth = 4;

    // --- Animal Ears ---
    if (this.animalStyle !== "none") {
      this.drawEars(width, h, color, strokeWidth);
    }

    // --- Chunky Shadow (Bottom Edge) ---
    this.bg
      .roundRect(-width / 2, -h / 2 + shadowDepth, width, h, corner)
      .fill({ color: shadowColor })
      .stroke({ color: PALETTE.BLACK, width: strokeWidth, alignment: 1 });

    // --- Main Pill Body ---
    this.bg
      .roundRect(-width / 2, -h / 2, width, h, corner)
      .fill({ color })
      .stroke({ color: PALETTE.BLACK, width: strokeWidth, alignment: 1 });

    // --- Glossy Highlight ---
    // A bright semi-transparent white arc hugging the top edge
    this.bg
      .roundRect(-width / 2 + 8, -h / 2 + 6, width - 16, h * 0.35, corner - 6)
      .fill({ color: 0xffffff, alpha: 0.4 });
  }

  /**
   * Draws animal ears sticking out of the top.
   */
  private drawEars(width: number, h: number, color: number, strokeWidth: number) {
    const earY = -h / 2 + 4; // Slightly overlapping the body
    const spread = width / 2 - h / 2 - 10; // Distance from center

    // Draw left and right ears
    for (const side of [-1, 1]) {
      const ex = spread * side;

      if (this.animalStyle === "cat") {
        // Pointy cat ears
        this.bg.moveTo(ex - 15, earY + 10);
        this.bg.lineTo(ex, earY - 20);
        this.bg.lineTo(ex + 15, earY + 10);
        this.bg.fill({ color });
        this.bg.stroke({ color: PALETTE.BLACK, width: strokeWidth, join: "round" });
        // Inner ear pink
        this.bg.moveTo(ex - 8, earY + 5);
        this.bg.lineTo(ex, earY - 10);
        this.bg.lineTo(ex + 8, earY + 5);
        this.bg.fill({ color: PALETTE.CUTE_PINK, alpha: 0.8 });
      } else if (this.animalStyle === "bear") {
        // Round bear ears
        this.bg.circle(ex, earY - 10, 16);
        this.bg.fill({ color });
        this.bg.stroke({ color: PALETTE.BLACK, width: strokeWidth });
        // Inner ear
        this.bg.circle(ex, earY - 8, 8);
        this.bg.fill({ color: PALETTE.CUTE_ORANGE, alpha: 0.6 });
      } else if (this.animalStyle === "rabbit") {
        // Tall rabbit ears
        this.bg.ellipse(ex, earY - 25, 12, 35);
        this.bg.fill({ color });
        this.bg.stroke({ color: PALETTE.BLACK, width: strokeWidth });
        // Inner ear
        this.bg.ellipse(ex, earY - 25, 5, 25);
        this.bg.fill({ color: PALETTE.CUTE_PINK, alpha: 0.8 });
      }
    }
  }
}

/**
 * Utility factory for creating cute buttons.
 */
export function createCuteButton(opts: CuteButtonOptions): CuteButton {
  return new CuteButton(opts);
}
