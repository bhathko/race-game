import { BaseRaceScene } from "./BaseRaceScene";
import { CANVAS, COLORS, PALETTE, VISUALS } from "../../config";
import { Graphics } from "pixi.js";

export class MobileVerticalRaceScene extends BaseRaceScene {
  public resize(width: number, height: number) {
    this.isPortrait = true;
    const availableH = height * 0.7;
    this.gameViewH = availableH;
    this.gameViewW = width;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    this.sidebarBg.clear();
    this.sidebarBg
      .rect(0, availableH, width, height - availableH)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    // Wooden Texture Lines
    for (let y = availableH + 5; y < height; y += 10) {
      this.sidebarBg
        .rect(0, y, width, 2)
        .fill({ color: COLORS.SIDEBAR_WOOD, alpha: 0.3 });
    }

    this.leaderboardContainer.x = 20;
    this.leaderboardContainer.y = availableH + 15;

    const title = this.leaderboardContainer.getChildByLabel("leaderboard-title");
    if (title) {
      title.x = 0;
      title.y = 0;
    }

    const unitWidth = Math.max(this.gameViewW, CANVAS.MIN_UNIT_WIDTH);
    this.finishLineX = 50 + (this.distance / 50) * unitWidth;
    this.trackWidth = this.finishLineX + 200;

    this.setupTracks();
    this.repositionRacers();
    this.updateLeaderboard(60);

    this.racers.forEach((r) => r.setMobileMode(true));

    if (this.countdownText) {
      this.countdownText.x = this.gameViewW / 2;
      this.countdownText.y = this.gameViewH / 2;
    }

    if (this.remainingDistanceText) {
      this.remainingDistanceText.x = this.gameViewW / 2;
      this.remainingDistanceText.y = 20;
    }
  }

  protected updateLeaderboard(delta: number) {
    this.leaderboardUpdateTimer += delta;
    if (this.leaderboardUpdateTimer >= this.LEADERBOARD_THROTTLE || this.sortedRacersCache.length === 0) {
      this.leaderboardUpdateTimer = 0;
      this.sortedRacersCache = [...this.racers].sort((a, b) => {
        if (a.isFinished() && b.isFinished()) return a.finishTime - b.finishTime;
        if (a.isFinished()) return -1;
        if (b.isFinished()) return 1;
        return b.x - a.x;
      });
    }

    const count = this.racers.length;
    const totalW = this.gameViewW - 40;
    const blockW = totalW / count;

    this.sortedRacersCache.forEach((racer, index) => {
      const container = this.leaderboardItems.get(racer);
      if (!container) return;

      const targetX = index * blockW;
      const targetY = 40;

      const smoothing = 1 - Math.pow(1 - VISUALS.LEADERBOARD_ANIMATION_SPEED, delta);
      container.x += (targetX - container.x) * smoothing;
      container.y += (targetY - container.y) * smoothing;

      const bg = container.getChildByLabel("item-bg") as Graphics;
      const text = container.getChildByLabel("item-text");
      const icon = container.getChildByLabel("item-icon");

      if (bg) {
        const w = blockW - 2;
        const h = 40;
        let borderColor: number = COLORS.RANK_DEFAULT;
        if (index === 0) borderColor = COLORS.RANK_GOLD;
        else if (index === 1) borderColor = COLORS.RANK_SILVER;
        else if (index === 2) borderColor = COLORS.RANK_BRONZE;

        bg.clear()
          .roundRect(0, 0, w, h, 4)
          .fill({ color: PALETTE.BLACK, alpha: 0.5 })
          .stroke({ color: borderColor, width: index < 3 ? 3 : 1 });
      }

      if (text) text.visible = false;
      if (icon) {
        icon.x = (blockW - 2) / 2;
        icon.y = 20;
        icon.scale.set(0.5);
      }
    });
  }
}
