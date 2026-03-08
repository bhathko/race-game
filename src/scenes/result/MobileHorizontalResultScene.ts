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

    const topSpace = 20;
    const bottomSpace = 20;
    const sidebarH = height - topSpace - bottomSpace;

    // Check if list fits
    const listStartY = 70;
    const listEntriesCount = Math.max(0, this.ctx.finishedRacers.length - 3);
    const requiredListH = listEntriesCount * 42;
    const availableListH = sidebarH - listStartY - 15;
    const canFitList = availableListH >= requiredListH && listEntriesCount > 0;

    this.leaderboardSidebar.visible = canFitList;

    if (canFitList) {
      // ─── Split Layout (Sidebar shown on right) ───
      const leftX = leftRect.x + leftRect.width / 2;

      this.winnerText.anchor.set(1, 0.5);
      this.winnerText.x = rightRect.x - grid.gutter;
      this.winnerText.y = height * 0.15;
      this.winnerText.style.align = "right";
      this.winnerText.style.fontSize = Math.min(32, height * 0.14);
      this.winnerText.style.stroke = { color: 0x5d4037, width: Math.min(5, height * 0.018) };

      const podiumW = Math.min(leftRect.width * 0.9, 280);
      this.podium.resize(podiumW);
      this.podium.scale.set(0.75);
      this.podium.x = leftX - (podiumW * 0.75) / 2;
      this.podium.y = height * 0.78;

      this.leaderboardSidebar.resize(rightRect.width, sidebarH);
      this.leaderboardSidebar.x = rightRect.x;
      this.leaderboardSidebar.y = topSpace;
      this.leaderboardSidebar.setShowList(true);
      this.leaderboardSidebar.setListOffsetY(listStartY);

      this.restartBtn.x = leftX;
    } else {
      // ─── Centered Layout (Sidebar hidden, Podium only) ───
      const centerX = width / 2;

      this.winnerText.anchor.set(0.5);
      this.winnerText.x = centerX;
      this.winnerText.y = height * 0.15;
      this.winnerText.style.align = "center";
      this.winnerText.style.fontSize = Math.min(36, height * 0.16);
      this.winnerText.style.stroke = { color: 0x5d4037, width: Math.min(5, height * 0.018) };

      const podiumW = Math.min(width * 0.7, 400);
      this.podium.resize(podiumW);
      this.podium.scale.set(0.85);
      this.podium.x = centerX - (podiumW * 0.85) / 2;
      this.podium.y = height * 0.78;

      this.restartBtn.x = centerX;
    }

    this.restartBtn.y = height * 0.9;
    this.restartBtn.scale.set(0.6);
  }
}
