import { BaseMenuScene } from "./BaseMenuScene";
import { UI } from "../../config";
import type { MenuContext } from "../../core";
import { getStandardGridConfig } from "../../core";

const CARD_GAP = 24;

export class DesktopMenuScene extends BaseMenuScene {
  constructor(ctx: MenuContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);

    this.bg.clear().rect(0, 0, width, height).fill({ color: UI.BG });

    this.placeTitle(centerX, height * 0.18, Math.min(64, height * 0.09), width - grid.margin * 2);

    // Three settings cards in a row
    const cardW = Math.min(300, (width - grid.margin * 2 - CARD_GAP * 2) / 3);
    const cardH = Math.min(220, height * 0.32);
    const cardY = height * 0.47;
    this.layoutCards(
      [-1, 0, 1].map((k) => ({
        cx: centerX + k * (cardW + CARD_GAP),
        cy: cardY,
        w: cardW,
        h: cardH,
      })),
    );

    this.startBtn.x = centerX;
    this.startBtn.y = Math.min(height * 0.8, cardY + cardH / 2 + 100);
    this.startBtn.scale.set(1.0);

    this.versionText.x = width - grid.margin;
    this.versionText.y = height - grid.margin / 2;
  }
}
