import { BaseMenuScene } from "./BaseMenuScene";
import { UI } from "../../config";
import type { MenuContext } from "../../core";
import { getStandardGridConfig } from "../../core";

const CARD_GAP = 14;

export class MobileVerticalMenuScene extends BaseMenuScene {
  constructor(ctx: MenuContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);

    this.bg.clear().rect(0, 0, width, height).fill({ color: UI.BG });

    this.placeTitle(
      centerX,
      Math.max(height * 0.12, 50),
      Math.min(44, width * 0.11),
      width - grid.margin * 2,
    );

    // Three settings cards stacked
    const cardW = Math.min(440, width - grid.margin * 2);
    const cardH = Math.min(140, height * 0.15);
    const top = height * 0.21;
    this.layoutCards(
      [0, 1, 2].map((i) => ({
        cx: centerX,
        cy: top + cardH / 2 + i * (cardH + CARD_GAP),
        w: cardW,
        h: cardH,
      })),
    );

    const listBottom = top + cardH * 3 + CARD_GAP * 2;
    this.startBtn.x = centerX;
    this.startBtn.y = Math.min(height * 0.86, listBottom + (height - listBottom) / 2);
    this.startBtn.scale.set(Math.min(1, (width - grid.margin * 2) / 300));

    this.versionText.x = width - grid.margin;
    this.versionText.y = height - grid.margin / 2;
  }
}
