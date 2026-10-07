import { BaseResultScene } from "./BaseResultScene";
import { UI } from "../../config";
import type { ResultContext } from "../../core";
import { getGridRect, getStandardGridConfig } from "../../core";

export class MobileVerticalResultScene extends BaseResultScene {
  constructor(ctx: ResultContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);
    const rankingRect = getGridRect(1, 10, grid); // 10 columns

    this.bg.clear().rect(0, 0, width, height).fill({ color: UI.BG });

    // ─── Winner Title ───
    const titleBottom = this.layoutWinnerTitle(
      centerX,
      Math.min(24, height * 0.03),
      Math.min(42, width * 0.1, height * 0.055),
    );

    // ─── Restart Button ───
    const btnH = 50;
    const bottomMargin = 15;
    const btnY = height - bottomMargin - btnH / 2;
    this.restartBtn.x = centerX;
    this.restartBtn.y = btnY;
    this.restartBtn.scale.set(0.8);

    // ─── Ranking panel between the title and the button ───
    const panelTop = titleBottom + 8;
    const panelH = btnY - btnH / 2 - 10 - panelTop;
    this.layoutStackedRanking(rankingRect.x, rankingRect.width, panelTop, panelH);
  }
}
