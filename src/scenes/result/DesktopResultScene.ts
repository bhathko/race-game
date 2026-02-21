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
    const podiumRect = getGridRect(3, 6, grid); // Middle 6 columns
    const listRect = getGridRect(4, 4, grid); // Middle 4 columns for the list

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.15;
    this.winnerText.style.fontSize = 64;

    // Position podium in the center
    this.podium.resize(podiumRect.width);
    this.podium.x = podiumRect.x;
    this.podium.y = height * 0.45;

    const btnH = 60;
    const btnPad = 20;
    const bottomMargin = 20;
    const topSpace = height * 0.55;
    const maxSidebarH = height - topSpace - btnH - btnPad - bottomMargin;
    const sidebarH = Math.max(150, Math.min(maxSidebarH, 300));

    this.leaderboardSidebar.setShowList(true);
    this.leaderboardSidebar.resize(listRect.width, sidebarH);
    this.leaderboardSidebar.x = listRect.x;
    this.leaderboardSidebar.y = topSpace;

    this.restartBtn.x = centerX;
    this.restartBtn.y = height - bottomMargin - btnH / 2;
    this.restartBtn.scale.set(1.0);
  }
}
