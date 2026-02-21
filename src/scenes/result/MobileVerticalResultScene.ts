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
    const fullRect = getGridRect(1, 10, grid); // Span middle 10 columns

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.12;
    this.winnerText.style.fontSize = 42;

    // Position podium in the center
    this.podium.resize(fullRect.width);
    this.podium.x = fullRect.x;
    this.podium.y = height * 0.38;

    const btnH = 50;
    const btnPad = 15;
    const bottomMargin = 15;
    const topSpace = height * 0.48;
    const maxSidebarH = height - topSpace - btnH - btnPad - bottomMargin;
    const sidebarH = Math.max(120, Math.min(maxSidebarH, 350));

    this.leaderboardSidebar.setShowList(true);
    this.leaderboardSidebar.resize(fullRect.width, sidebarH);
    this.leaderboardSidebar.x = fullRect.x;
    this.leaderboardSidebar.y = topSpace;

    this.restartBtn.x = centerX;
    this.restartBtn.y = height - bottomMargin - btnH / 2;
    this.restartBtn.scale.set(0.8);
  }
}
