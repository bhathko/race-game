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

    // ─── Winner Title ───
    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.12;
    this.winnerText.style.fontSize = Math.min(64, width * 0.08);
    this.winnerText.style.stroke = { color: 0x5d4037, width: Math.min(8, width * 0.01) };

    // ─── Layout Constants ───
    const btnH = 60;
    const bottomMargin = 20;
    const btnY = height - bottomMargin - btnH / 2;

    const sidebarTop = height * 0.22;
    const sidebarH = btnY - btnH / 2 - 15 - sidebarTop;

    // ─── Sidebar Wood Panel ───
    this.leaderboardSidebar.resize(rankingRect.width, sidebarH);
    this.leaderboardSidebar.x = rankingRect.x;
    this.leaderboardSidebar.y = sidebarTop;

    // ─── Podium & List Layout ───
    const titleAreaH = 50;
    const podiumExtent = 180;
    const podiumGap = 15;

    const listEntriesCount = Math.max(0, this.ctx.finishedRacers.length - 3);
    const requiredListH = listEntriesCount * 42;

    const idealListStartY = titleAreaH + podiumExtent + podiumGap;
    const availableListH = sidebarH - idealListStartY - 15;
    const canFitList = availableListH >= requiredListH && listEntriesCount > 0;

    this.leaderboardSidebar.setShowList(canFitList);

    let podiumRelY: number;
    if (canFitList) {
      podiumRelY = titleAreaH + podiumExtent;
      this.leaderboardSidebar.setListOffsetY(podiumRelY + podiumGap);
    } else {
      const availablePodiumArea = sidebarH - titleAreaH - 10;
      const verticalCenterOffset = (availablePodiumArea - podiumExtent) / 2;
      podiumRelY = titleAreaH + Math.max(0, verticalCenterOffset) + podiumExtent;
    }

    this.podium.resize(rankingRect.width);
    this.podium.x = rankingRect.x;
    this.podium.y = sidebarTop + podiumRelY;

    // ─── Restart Button ───
    this.restartBtn.x = centerX;
    this.restartBtn.y = btnY;
    this.restartBtn.scale.set(1.0);
  }
}
