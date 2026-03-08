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
 * Redesigned for a more natural, hand-crafted look.
 */
export class WoodenButton extends Container {
  public bg: Graphics;
  public content: Text;
  private _onClick: () => void;

  constructor(opts: WoodenButtonOptions) {
    super();
    const { label, color, onClick, width = 200, height: h = 60, fontSize = 24 } = opts;

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
      dropShadow: {
        alpha: 0.3,
        angle: Math.PI / 2,
        blur: 2,
        color: PALETTE.STR_BLACK,
        distance: 2,
      },
    });
    this.content = new Text({ text: label, style });
    this.content.anchor.set(0.5);
    this.content.y = -2; // Elevation offset
    this.addChild(this.content);

    // ── interaction ─────────────────────────────────────────────────────────
    this.eventMode = "static";
    this.cursor = "pointer";

    let baseScaleX = 1;
    let baseScaleY = 1;

    this.on("pointerdown", () => {
      baseScaleX = this.scale.x;
      baseScaleY = this.scale.y;
      this.scale.set(baseScaleX * 0.98, baseScaleY * 0.98);
      this.bg.y = 2;
      this.content.y = 0; // Move text down with the face
      this._onClick();
    });
    this.on("pointerup", () => {
      this.scale.set(baseScaleX, baseScaleY);
      this.bg.y = 0;
      this.content.y = -2;
    });
    this.on("pointerupoutside", () => {
      this.scale.set(baseScaleX, baseScaleY);
      this.bg.y = 0;
      this.content.y = -2;
    });
  }

  /**
   * Draws a multi-layered wooden plank.
   */
  public drawBg(width: number, h: number, color: number) {
    this.bg.clear();

    const corner = 6;
    const depth = 6;

    // 1. Drop Shadow
    this.bg
      .roundRect(-width / 2, -h / 2 + depth + 2, width, h, corner)
      .fill({ color: 0x000000, alpha: 0.2 });

    // 2. Bottom Depth (The thickness of the wood)
    this.bg
      .roundRect(-width / 2, -h / 2 + depth, width, h, corner)
      .fill({ color: PALETTE.WOOD_DARK });

    // 3. Main Face (The surface of the plank)
    this.bg
      .roundRect(-width / 2, -h / 2, width, h, corner)
      .fill({ color: color })
      .stroke({ color: 0x000000, width: 2, alpha: 0.2 });

    // 4. Wood Grain (Organic lines)
    const grainColor = 0x000000;
    const grainAlpha = 0.08;

    this.bg
      .rect(-width / 2 + 10, -h / 2 + h * 0.25, width - 25, 1)
      .fill({ color: grainColor, alpha: grainAlpha });

    this.bg
      .rect(-width / 2 + 15, -h / 2 + h * 0.5, width * 0.4, 1)
      .fill({ color: grainColor, alpha: grainAlpha });
    this.bg
      .rect(width * 0.1, -h / 2 + h * 0.5, width * 0.35, 1)
      .fill({ color: grainColor, alpha: grainAlpha });

    this.bg
      .rect(-width / 2 + 8, -h / 2 + h * 0.75, width - 20, 1)
      .fill({ color: grainColor, alpha: grainAlpha });

    // 5. Bevel/Highlight
    this.bg
      .roundRect(-width / 2 + 2, -h / 2 + 2, width - 4, h * 0.2, 2)
      .fill({ color: 0xffffff, alpha: 0.1 });

    // 6. Subtle border stain
    this.bg
      .roundRect(-width / 2, -h / 2, width, h, corner)
      .stroke({ color: 0x000000, width: 4, alpha: 0.1, alignment: 1 });
  }
}

/**
 * Utility factory for creating wooden buttons.
 */
export function createWoodenButton(opts: WoodenButtonOptions): WoodenButton {
  return new WoodenButton(opts);
}
