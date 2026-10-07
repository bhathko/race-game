import { BaseMenuScene } from "./BaseMenuScene";
import { UI } from "../../config";
import type { MenuContext } from "../../core";
import { getStandardGridConfig } from "../../core";

const CARD_GAP = 14;

export class MobileHorizontalMenuScene extends BaseMenuScene {
  constructor(ctx: MenuContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);

    this.bg.clear().rect(0, 0, width, height).fill({ color: UI.BG });

    this.placeTitle(centerX, height * 0.11, Math.min(34, height * 0.09), width - grid.margin * 2);

    // Three settings cards in a row
    const cardW = Math.min(240, (width - grid.margin * 2 - CARD_GAP * 2) / 3);
    const cardH = Math.min(150, height * 0.42);
    const cardY = height * 0.46;
    this.layoutCards(
      [-1, 0, 1].map((k) => ({
        cx: centerX + k * (cardW + CARD_GAP),
        cy: cardY,
        w: cardW,
        h: cardH,
      })),
    );

    this.startBtn.x = centerX;
    this.startBtn.y = height - Math.max(34, height * 0.11);
    this.startBtn.scale.set(Math.min(0.8, height / 470));

    this.versionText.x = width - grid.margin;
    this.versionText.y = height - grid.margin / 2;
  }
}
