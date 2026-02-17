import { BaseRaceScene } from "./BaseRaceScene";
import { CANVAS, COLORS, PALETTE, VISUALS } from "../../config";
import { Graphics, Text } from "pixi.js";

export class DesktopRaceScene extends BaseRaceScene {
  public resize(width: number, height: number) {
    this.isPortrait = false;
    this.gameViewH = height;
    this.gameViewW = width - CANVAS.UI_WIDTH;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    this.sidebarBg.clear();
    this.sidebarBg
      .rect(this.gameViewW, 0, CANVAS.UI_WIDTH, height)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    // Wooden Texture Lines
    for (let x = this.gameViewW + 5; x < width; x += 15) {
      this.sidebarBg
        .rect(x, 0, 2, height)
        .fill({ color: COLORS.SIDEBAR_WOOD, alpha: 0.3 });
    }

    this.leaderboardContainer.x = this.gameViewW + 15;
    this.leaderboardContainer.y = 20;

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

    this.sortedRacersCache.forEach((racer, index) => {
      const container = this.leaderboardItems.get(racer);
      if (!container) return;

      const targetX = 0;
      const targetY = 40 + index * 42;

      const smoothing = 1 - Math.pow(1 - VISUALS.LEADERBOARD_ANIMATION_SPEED, delta);
      container.x += (targetX - container.x) * smoothing;
      container.y += (targetY - container.y) * smoothing;

      const bg = container.getChildByLabel("item-bg") as Graphics;
      const text = container.getChildByLabel("item-text") as Text;
      const icon = container.getChildByLabel("item-icon");

      if (bg) {
        const w = CANVAS.UI_WIDTH - 30;
        const h = 36;
        let borderColor: number = COLORS.RANK_DEFAULT;
        if (index === 0) borderColor = COLORS.RANK_GOLD;
        else if (index === 1) borderColor = COLORS.RANK_SILVER;
        else if (index === 2) borderColor = COLORS.RANK_BRONZE;

        bg.clear()
          .roundRect(0, 0, w, h, 4)
          .fill({ color: PALETTE.BLACK, alpha: 0.5 })
          .stroke({ color: borderColor, width: index < 3 ? 3 : 1 });
      }

      if (text) {
        text.visible = true;
        const rank = index + 1;
        const suffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
        text.text = `${rank}${suffix}: ${racer.racerName.split(" ").pop()}`;
        text.x = 50;
        text.y = 18;
        text.anchor.set(0, 0.5);
        text.style.fontSize = 14;
      }

      if (icon) {
        icon.x = 25;
        icon.y = 18;
        icon.scale.set(1);
      }
    });
  }
}
