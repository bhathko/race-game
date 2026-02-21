import { BaseResultScene } from "./BaseResultScene";
import { PALETTE } from "../../config";
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

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.1;
    this.winnerText.style.fontSize = 42;

    const btnH = 50;
    const btnPad = 15;
    const bottomMargin = 15;
    const topSpace = height * 0.18;
    const maxSidebarH = height - topSpace - btnH - btnPad - bottomMargin;
    const sidebarH = Math.max(250, Math.min(maxSidebarH, 550));

    // Sidebar Wood Panel
    this.leaderboardSidebar.resize(rankingRect.width, sidebarH);
    this.leaderboardSidebar.x = rankingRect.x;
    this.leaderboardSidebar.y = topSpace;

    // Podium Unified
    this.podium.resize(rankingRect.width);
    this.podium.x = rankingRect.x;
    this.podium.y = topSpace + 175;

    // Ranking List
    this.leaderboardSidebar.setListOffsetY(250);

    this.restartBtn.x = centerX;
    this.restartBtn.y = height - bottomMargin - btnH / 2;
    this.restartBtn.scale.set(0.8);
  }
}
