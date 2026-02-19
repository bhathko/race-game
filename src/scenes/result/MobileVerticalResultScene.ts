import { BaseResultScene } from "./BaseResultScene";
import { PALETTE } from "../../config";
import type { ResultContext } from "../../core";

export class MobileVerticalResultScene extends BaseResultScene {
  constructor(ctx: ResultContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.1;
    this.winnerText.style.fontSize = 36;

    const sidebarW = Math.min(width * 0.85, 280);
    const btnH = 50;
    const btnPad = 10;
    const bottomMargin = 10;
    const topSpace = height * 0.2;
    const maxSidebarH = height - topSpace - btnH - btnPad - bottomMargin;
    const sidebarH = Math.max(150, Math.min(maxSidebarH, 600));

    this.leaderboardSidebar.setShowList(true);
    this.leaderboardSidebar.resize(sidebarW, sidebarH);
    this.leaderboardSidebar.x = centerX - sidebarW / 2;
    this.leaderboardSidebar.y = topSpace;

    this.restartBtn.x = centerX;
    this.restartBtn.y = topSpace + sidebarH + btnPad + btnH / 2;
    this.restartBtn.scale.set(0.75);
  }
}
