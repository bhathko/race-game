import { BaseResultScene } from "./BaseResultScene";
import { PALETTE } from "../../config";
import type { ResultContext } from "../../core";
import { getGridRect, getStandardGridConfig } from "../../core";

export class MobileHorizontalResultScene extends BaseResultScene {
  constructor(ctx: ResultContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const grid = getStandardGridConfig(width);
    const leftRect = getGridRect(0, 6, grid);
    const rightRect = getGridRect(6, 6, grid);

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    // Split layout: Winner & Podium on left, Ranking List on right
    const leftX = leftRect.x + leftRect.width / 2;

    this.winnerText.x = leftX;
    this.winnerText.y = height * 0.15;
    this.winnerText.style.fontSize = 32;

    // Podium below winner on the left
    this.podium.resize(leftRect.width);
    this.podium.x = leftRect.x;
    this.podium.y = height * 0.55;

    // Sidebar (List) on the right
    const topSpace = 20;
    const bottomSpace = 20;
    const sidebarH = height - topSpace - bottomSpace;

    this.leaderboardSidebar.setShowList(true);
    this.leaderboardSidebar.resize(rightRect.width, sidebarH);
    this.leaderboardSidebar.x = rightRect.x;
    this.leaderboardSidebar.y = topSpace;

    this.restartBtn.x = leftX;
    this.restartBtn.y = height * 0.85;
    this.restartBtn.scale.set(0.65);
  }
}
