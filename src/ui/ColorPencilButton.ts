import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { PALETTE } from "../config";

export interface ColorPencilButtonOptions {
  label: string;
  color: number;
  onClick: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
}

/**
 * A color-pencil / crayon-sketch styled button.
 * Features hand-drawn wobbly borders, hatching texture, and a sketchy shadow.
 */
export class ColorPencilButton extends Container {
  public bg: Graphics;
  public content: Text;
  private _onClick: () => void;

  constructor(opts: ColorPencilButtonOptions) {
    super();
    const { label, color, onClick, width = 240, height: h = 68, fontSize = 28 } = opts;

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
      stroke: { color: PALETTE.STR_BLACK, width: 5, join: "round" },
      dropShadow: {
        alpha: 1,
        angle: Math.PI / 2,
        blur: 0,
        color: PALETTE.STR_BLACK,
        distance: 3,
      },
      letterSpacing: 2,
    });
    this.content = new Text({ text: label, style });
    this.content.anchor.set(0.5);
    this.content.y = -3;
    this.addChild(this.content);

    // ── interaction ─────────────────────────────────────────────────────────
    this.eventMode = "static";
    this.cursor = "pointer";

    let baseScaleX = 1;
    let baseScaleY = 1;

    this.on("pointerdown", () => {
      baseScaleX = this.scale.x;
      baseScaleY = this.scale.y;
      this.scale.set(baseScaleX * 0.93, baseScaleY * 0.93);
      this.bg.y = 4;
      this.content.y = 1;
      this._onClick();
    });
    this.on("pointerup", () => {
      this.scale.set(baseScaleX, baseScaleY);
      this.bg.y = 0;
      this.content.y = -3;
    });
    this.on("pointerupoutside", () => {
      this.scale.set(baseScaleX, baseScaleY);
      this.bg.y = 0;
      this.content.y = -3;
    });
  }

  /**
   * Updates the button color (e.g. for toggle buttons).
   */
  public updateColor(color: number, width: number, h: number) {
    this.drawBg(width, h, color);
  }

  /**
   * Generates a wobbly rounded-rect path that simulates a hand-drawn pencil line.
   * Returns an array of {x, y} points forming a closed loop.
   */
  private getWobblyPath(
    cx: number,
    cy: number,
    w: number,
    h: number,
    corner: number,
    seed: number,
    wobbleAmt: number = 2.5,
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const steps = 48;

    // Seeded pseudo-random for deterministic wobble
    const rand = (i: number) => {
      const v = Math.sin(seed * 9301 + i * 49297) * 43758.5453;
      return (v - Math.floor(v)) * 2 - 1; // -1 to 1
    };

    const halfW = w / 2;
    const halfH = h / 2;

    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Trace a rounded rectangle using angle-based parameterization
      const ex = cosA * halfW;
      const ey = sinA * halfH;

      let px: number, py: number;

      // Check if we're in a corner region
      const clampedX = Math.max(-halfW, Math.min(halfW, ex));
      const clampedY = Math.max(-halfH, Math.min(halfH, ey));
      const inCornerX = Math.abs(clampedX) > halfW - corner;
      const inCornerY = Math.abs(clampedY) > halfH - corner;

      if (inCornerX && inCornerY) {
        // Corner: trace a circular arc from the corner center
        const ccx = (clampedX > 0 ? 1 : -1) * (halfW - corner);
        const ccy = (clampedY > 0 ? 1 : -1) * (halfH - corner);
        const ca = Math.atan2(ey - ccy, ex - ccx);
        px = ccx + Math.cos(ca) * corner;
        py = ccy + Math.sin(ca) * corner;
      } else {
        px = clampedX;
        py = clampedY;
      }

      // Add pencil wobble
      px += rand(i * 2) * wobbleAmt;
      py += rand(i * 2 + 1) * wobbleAmt;

      points.push({ x: cx + px, y: cy + py });
    }

    return points;
  }

  /**
   * Draws the color-pencil styled button: sketchy shadow, wobbly body, hatching lines.
   */
  private drawBg(width: number, h: number, color: number) {
    this.bg.clear();

    const corner = Math.min(h / 2, 20); // Rounded but not fully pill
    const shadowDepth = 6;

    // ── Sketchy Shadow ──────────────────────────────────────────────────────
    const shadowPath = this.getWobblyPath(0, shadowDepth, width, h, corner, 42, 2);
    this.bg.moveTo(shadowPath[0].x, shadowPath[0].y);
    for (let i = 1; i < shadowPath.length; i++) {
      this.bg.lineTo(shadowPath[i].x, shadowPath[i].y);
    }
    this.bg.closePath();
    this.bg.fill({ color: PALETTE.CHUNKY_SHADOW });
    this.bg.stroke({ color: PALETTE.BLACK, width: 3, alpha: 0.5 });

    // ── Main Body ───────────────────────────────────────────────────────────
    const bodyPath = this.getWobblyPath(0, 0, width, h, corner, 7, 2.5);
    this.bg.moveTo(bodyPath[0].x, bodyPath[0].y);
    for (let i = 1; i < bodyPath.length; i++) {
      this.bg.lineTo(bodyPath[i].x, bodyPath[i].y);
    }
    this.bg.closePath();
    this.bg.fill({ color });

    // ── Pencil Hatching Lines (texture) ─────────────────────────────────────
    // Diagonal lines across the button for a hand-colored pencil feel
    const halfW = width / 2;
    const halfH = h / 2;
    const hatchSpacing = 8;
    const hatchAlpha = 0.12;

    for (let offset = -halfW - halfH; offset < halfW + halfH; offset += hatchSpacing) {
      // Diagonal line from top-left to bottom-right direction
      const x1 = offset;
      const y1 = -halfH + 4;
      const x2 = offset + h;
      const y2 = halfH - 4;

      // Clip to button bounds (rough rectangular clip)
      const cx1 = Math.max(-halfW + 6, Math.min(halfW - 6, x1));
      const cy1 = y1 + (cx1 - x1);
      const cx2 = Math.max(-halfW + 6, Math.min(halfW - 6, x2));
      const cy2 = y2 + (cx2 - x2);

      if (cy1 < halfH && cy2 > -halfH) {
        this.bg.moveTo(cx1, Math.max(-halfH + 4, Math.min(halfH - 4, cy1)));
        this.bg.lineTo(cx2, Math.max(-halfH + 4, Math.min(halfH - 4, cy2)));
        this.bg.stroke({ color: 0xffffff, width: 1.5, alpha: hatchAlpha });
      }
    }

    // ── Wobbly Outline (drawn last, on top) ──────────────────────────────────
    // Draw two passes for a sketchy double-line pencil effect
    for (const pass of [0, 1]) {
      const path = this.getWobblyPath(0, 0, width, h, corner, 7 + pass * 13, 2 + pass * 1.5);
      this.bg.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        this.bg.lineTo(path[i].x, path[i].y);
      }
      this.bg.closePath();
      this.bg.stroke({
        color: PALETTE.BLACK,
        width: pass === 0 ? 3.5 : 2,
        alpha: pass === 0 ? 0.9 : 0.4,
      });
    }

    // ── Top highlight (soft pencil shine) ───────────────────────────────────
    this.bg
      .roundRect(-width / 2 + 10, -h / 2 + 5, width - 20, h * 0.28, corner - 4)
      .fill({ color: 0xffffff, alpha: 0.25 });
  }
}

/**
 * Utility factory for creating cute buttons.
 */
export function createColorPencilButton(opts: ColorPencilButtonOptions): ColorPencilButton {
  return new ColorPencilButton(opts);
}
