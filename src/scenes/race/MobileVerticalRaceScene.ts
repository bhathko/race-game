import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS, PALETTE, VISUALS } from "../../config";
import { Graphics, Text } from "pixi.js";
import type { RaceContext } from "../../core";

export class MobileVerticalRaceScene extends BaseRaceScene {
  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = true;
    const lbH = 120;
    this.gameViewH = height - lbH;
    this.gameViewW = width;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    const sidebarBg = this.uiManager.getSidebarBg();
    sidebarBg
      .clear()
      .rect(0, this.gameViewH, width, lbH)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = 10;
    lbContainer.y = this.gameViewH + 10;

    const title = lbContainer.getChildByLabel("leaderboard-title");
    if (title) {
      title.visible = false;
    }

    this.finishLineX = 50 + (this.distance / 50) * this.gameViewW;
    this.trackWidth = this.finishLineX + 100;

    this.setupTracks();
    this.trackManager.repositionRacers(this.racers, this.gameViewH);
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = width / 2;
      countdown.y = this.gameViewH / 2;
    }

    const distance = this.uiManager.getRemainingDistanceText();
    if (distance) {
      distance.x = width / 2;
      distance.y = 10;
    }
  }

  protected updateLeaderboard(delta: number) {
    const um = this.uiManager;
    um.leaderboardUpdateTimer += delta;
    if (um.leaderboardUpdateTimer >= um.LEADERBOARD_THROTTLE || um.sortedRacersCache.length === 0) {
      um.leaderboardUpdateTimer = 0;
      um.sortedRacersCache = [...this.racers].sort((a, b) => {
        if (a.isFinished() && b.isFinished()) return a.finishTime - b.finishTime;
        if (a.isFinished()) return -1;
        if (b.isFinished()) return 1;
        return b.x - a.x;
      });
    }

    const items = um.getLeaderboardItems();
    um.sortedRacersCache.forEach((racer, index) => {
      const container = items.get(racer);
      if (!container) return;

      const itemW = 70;
      const smoothing = 1 - Math.pow(1 - VISUALS.LEADERBOARD_ANIMATION_SPEED, delta);
      container.x += (index * itemW - container.x) * smoothing;
      container.y += (0 - container.y) * smoothing;

      const bg = container.getChildByLabel("item-bg") as Graphics;
      const text = container.getChildByLabel("item-text") as Text;
      const icon = container.getChildByLabel("item-icon");

      if (bg) {
        let color: number = COLORS.RANK_DEFAULT;
        if (index === 0) color = COLORS.RANK_GOLD;
        else if (index === 1) color = COLORS.RANK_SILVER;
        else if (index === 2) color = COLORS.RANK_BRONZE;
        bg.clear()
          .roundRect(0, 0, itemW - 10, 100, 8)
          .fill({ color: PALETTE.BLACK, alpha: 0.5 })
          .stroke({ color, width: index < 3 ? 3 : 1 });
      }

      if (text) {
        text.text = (index + 1).toString();
        text.x = (itemW - 10) / 2;
        text.y = 85;
        text.anchor.set(0.5);
        text.style.fontSize = 12;
      }
      if (icon) {
        icon.x = (itemW - 10) / 2;
        icon.y = 40;
        icon.scale.set(0.8);
      }
    });
  }
}
