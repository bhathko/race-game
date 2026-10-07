import { BaseResultScene } from "./BaseResultScene";
import { PALETTE } from "../../config";
import type { ResultContext } from "../../core";
import { getGridRect, getStandardGridConfig } from "../../core";

export class DesktopResultScene extends BaseResultScene {
  constructor(ctx: ResultContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);
    const rankingRect = getGridRect(3, 6, grid); // Middle 6 columns

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    // ─── Winner Title (sized by height too, so short windows never clip it) ───
    const titleBottom = this.layoutWinnerTitle(
      centerX,
      10,
      Math.min(64, width * 0.08, height * 0.07),
      Math.min(8, width * 0.01),
    );

    // ─── Restart Button ───
    const btnH = 60;
    const bottomMargin = 20;
    const btnY = height - bottomMargin - btnH / 2;
    this.restartBtn.x = centerX;
    this.restartBtn.y = btnY;
    this.restartBtn.scale.set(1.0);

    // ─── Ranking panel between the title and the button ───
    const panelTop = titleBottom + 8;
    const panelH = btnY - btnH / 2 - 15 - panelTop;
    this.layoutStackedRanking(rankingRect.x, rankingRect.width, panelTop, panelH);
  }
}
