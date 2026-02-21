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

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.12;
    this.winnerText.style.fontSize = 64;

    const btnH = 60;
    const btnPad = 20;
    const bottomMargin = 20;
    const topSpace = height * 0.22;
    const maxSidebarH = height - topSpace - btnH - btnPad - bottomMargin;
    const sidebarH = Math.max(350, Math.min(maxSidebarH, 650));

    // Sidebar Wood Panel
    this.leaderboardSidebar.resize(rankingRect.width, sidebarH);
    this.leaderboardSidebar.x = rankingRect.x;
    this.leaderboardSidebar.y = topSpace;

    // Podium Unified (placed inside sidebar area)
    this.podium.resize(rankingRect.width);
    this.podium.x = rankingRect.x;
    this.podium.y = topSpace + 175; // Positioned under the "Ranking" title

    // Ranking List (pushed down to make room for podium)
    this.leaderboardSidebar.setListOffsetY(250);

    this.restartBtn.x = centerX;
    this.restartBtn.y = height - bottomMargin - btnH / 2;
    this.restartBtn.scale.set(1.0);
  }
}
