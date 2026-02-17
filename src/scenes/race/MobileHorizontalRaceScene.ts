import { BaseRaceScene } from "./BaseRaceScene";
import { CANVAS, COLORS, PALETTE, VISUALS } from "../../config";
import { Graphics, Text } from "pixi.js";

export class MobileHorizontalRaceScene extends BaseRaceScene {
  public resize(width: number, height: number) {
    this.isPortrait = false;
    // On horizontal mobile, leaderboard can be a small sidebar or top bar.
    // Let's stick to sidebar but make it narrower.
    const uiWidth = 120;
    this.gameViewH = height;
    this.gameViewW = width - uiWidth;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    this.sidebarBg.clear();
    this.sidebarBg
      .rect(this.gameViewW, 0, uiWidth, height)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    // Wooden Texture Lines
    for (let x = this.gameViewW + 5; x < width; x += 15) {
      this.sidebarBg
        .rect(x, 0, 2, height)
        .fill({ color: COLORS.SIDEBAR_WOOD, alpha: 0.3 });
    }

    this.leaderboardContainer.x = this.gameViewW + 10;
    this.leaderboardContainer.y = 15;

    const title = this.leaderboardContainer.getChildByLabel("leaderboard-title") as Text;
    if (title) {
      title.x = 0;
      title.y = 0;
      title.style.fontSize = 18;
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
      this.countdownText.scale.set(0.7);
    }

    if (this.remainingDistanceText) {
      this.remainingDistanceText.x = this.gameViewW / 2;
      this.remainingDistanceText.y = 15;
      this.remainingDistanceText.scale.set(0.6);
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
      const targetY = 30 + index * 32;

      const smoothing = 1 - Math.pow(1 - VISUALS.LEADERBOARD_ANIMATION_SPEED, delta);
      container.x += (targetX - container.x) * smoothing;
      container.y += (targetY - container.y) * smoothing;

      const bg = container.getChildByLabel("item-bg") as Graphics;
      const text = container.getChildByLabel("item-text") as Text;
      const icon = container.getChildByLabel("item-icon");

      const uiWidth = 120;
      if (bg) {
        const w = uiWidth - 20;
        const h = 28;
        let borderColor: number = COLORS.RANK_DEFAULT;
        if (index === 0) borderColor = COLORS.RANK_GOLD;
        else if (index === 1) borderColor = COLORS.RANK_SILVER;
        else if (index === 2) borderColor = COLORS.RANK_BRONZE;

        bg.clear()
          .roundRect(0, 0, w, h, 4)
          .fill({ color: PALETTE.BLACK, alpha: 0.5 })
          .stroke({ color: borderColor, width: index < 3 ? 2 : 1 });
      }

      if (text) {
        text.visible = true;
        const rank = index + 1;
        text.text = `${rank}: ${racer.racerName.split(" ").pop()}`;
        text.x = 35;
        text.y = 14;
        text.anchor.set(0, 0.5);
        text.style.fontSize = 11;
      }

      if (icon) {
        icon.x = 18;
        icon.y = 14;
        icon.scale.set(0.4);
      }
    });
  }
}
