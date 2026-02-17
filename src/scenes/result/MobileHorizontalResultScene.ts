import { BaseResultScene } from "./BaseResultScene";
import { PALETTE } from "../../config";
import type { ResultContext } from "../../core";

export class MobileHorizontalResultScene extends BaseResultScene {
  constructor(ctx: ResultContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    // Split layout: Winner on left, Leaderboard on right
    const leftX = width * 0.28;
    const rightX = width * 0.65;

    this.winnerText.x = leftX;
    this.winnerText.y = height * 0.35;
    this.winnerText.style.fontSize = 32;

    const sidebarW = Math.min(width * 0.45, 320);
    const topSpace = 20;
    const bottomSpace = 20;
    const sidebarH = height - topSpace - bottomSpace;
    
    this.leaderboardSidebar.setShowList(false);
    this.leaderboardSidebar.resize(sidebarW, sidebarH);
    this.leaderboardSidebar.x = rightX - sidebarW / 2;
    this.leaderboardSidebar.y = topSpace;

    this.restartBtn.x = leftX;
    this.restartBtn.y = height * 0.75;
    this.restartBtn.scale.set(0.6);
  }
}
