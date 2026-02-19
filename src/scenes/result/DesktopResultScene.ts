import { BaseResultScene } from "./BaseResultScene";
import { PALETTE } from "../../config";
import type { ResultContext } from "../../core";

export class DesktopResultScene extends BaseResultScene {
  constructor(ctx: ResultContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const centerX = width / 2;

    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.12;
    this.winnerText.style.fontSize = 56;

    const sidebarW = 300;
    const btnH = 60;
    const btnPad = 14;
    const bottomMargin = 12;
    const topSpace = height * 0.22;
    const maxSidebarH = height - topSpace - btnH - btnPad - bottomMargin;
    const sidebarH = Math.max(200, Math.min(maxSidebarH, 700));

    this.leaderboardSidebar.setShowList(true);
    this.leaderboardSidebar.resize(sidebarW, sidebarH);
    this.leaderboardSidebar.x = centerX - sidebarW / 2;
    this.leaderboardSidebar.y = topSpace;

    this.restartBtn.x = centerX;
    this.restartBtn.y = topSpace + sidebarH + btnPad + btnH / 2;
    this.restartBtn.scale.set(1.0);
  }
}
