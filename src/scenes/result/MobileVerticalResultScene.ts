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

    // ─── Winner Title ───
    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.1;
    this.winnerText.style.fontSize = Math.min(42, width * 0.1);
    this.winnerText.style.stroke = { color: 0x5d4037, width: Math.min(6, width * 0.014) };

    // ─── Layout Constants ───
    const btnH = 50;
    const bottomMargin = 15;
    const btnY = height - bottomMargin - btnH / 2;

    // Sidebar occupies space between title and button
    const sidebarTop = height * 0.18;
    const sidebarH = btnY - btnH / 2 - 10 - sidebarTop;

    // ─── Sidebar Wood Panel ───
    this.leaderboardSidebar.resize(rankingRect.width, sidebarH);
    this.leaderboardSidebar.x = rankingRect.x;
    this.leaderboardSidebar.y = sidebarTop;

    // ─── Podium & List Layout ───
    const titleAreaH = 50; // "Ranking" title + padding
    const podiumExtent = 180; // podium draws 180px above its y
    const podiumGap = 15; // gap between podium bottom and list

    // Dynamic list overflow calculation
    const listEntriesCount = Math.max(0, this.ctx.finishedRacers.length - 3);
    const requiredListH = listEntriesCount * 42; // 36px card + 6px gap

    // Check if list fits in the remaining sidebar space
    const idealListStartY = titleAreaH + podiumExtent + podiumGap;
    const availableListH = sidebarH - idealListStartY - 15; // 15px bottom padding
    const canFitList = availableListH >= requiredListH && listEntriesCount > 0;

    this.leaderboardSidebar.setShowList(canFitList);

    let podiumRelY: number;
    if (canFitList) {
      podiumRelY = titleAreaH + podiumExtent;
      this.leaderboardSidebar.setListOffsetY(podiumRelY + podiumGap);
    } else {
      // If list hidden, vertically center the podium in the available space below the title
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
    this.restartBtn.scale.set(0.8);
  }
}
