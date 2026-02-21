import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS, PALETTE, VISUALS } from "../../config";
import { Graphics, Text } from "pixi.js";
import type { RaceContext } from "../../core";
import { getGridRect, getStandardGridConfig } from "../../core";

export class MobileHorizontalRaceScene extends BaseRaceScene {
  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = false;
    const grid = getStandardGridConfig(width);
    const trackRect = getGridRect(0, 9, grid);
    const sidebarRect = getGridRect(9, 3, grid);

    this.gameViewH = height;
    this.gameViewW = trackRect.width + grid.margin;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    const sidebarBg = this.uiManager.getSidebarBg();
    sidebarBg
      .clear()
      .rect(this.gameViewW, 0, width - this.gameViewW, height)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = sidebarRect.x;
    lbContainer.y = 10;

    const title = lbContainer.getChildByLabel("leaderboard-title");
    if (title) {
      title.visible = false;
    }

    this.finishLineX = 50 + (this.distance / 50) * this.gameViewW;
    this.trackWidth = this.finishLineX + 100;

    this.setupTracks();
    this.racers.forEach((r) => r.setMobileMode(true));
    this.trackManager.repositionRacers(this.racers, this.gameViewH);
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = this.gameViewW / 2;
      countdown.y = height / 2;
    }

    const distance = this.uiManager.getRemainingDistanceText();
    if (distance) {
      distance.x = this.gameViewW / 2;
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
    const grid = getStandardGridConfig(this.width);
    const sidebarWidth = getGridRect(9, 3, grid).width;
    const itemH = 45;

    um.sortedRacersCache.forEach((racer, index) => {
      const container = items.get(racer);
      if (!container) return;

      const smoothing = 1 - Math.pow(1 - VISUALS.LEADERBOARD_ANIMATION_SPEED, delta);
      container.x += (0 - container.x) * smoothing;
      container.y += (index * itemH - container.y) * smoothing;

      const bg = container.getChildByLabel("item-bg") as Graphics;
      const text = container.getChildByLabel("item-text") as Text;
      const icon = container.getChildByLabel("item-icon");

      if (bg) {
        let color: number = COLORS.RANK_DEFAULT;
        if (index === 0) color = COLORS.RANK_GOLD;
        else if (index === 1) color = COLORS.RANK_SILVER;
        else if (index === 2) color = COLORS.RANK_BRONZE;
        bg.clear()
          .roundRect(0, 0, sidebarWidth, itemH - 5, 4)
          .fill({ color: PALETTE.BLACK, alpha: 0.5 })
          .stroke({ color, width: index < 3 ? 3 : 1 });
      }

      if (text) {
        text.text = `${index + 1}: ${racer.racerName.split(" ").pop()}`;
        text.x = 40;
        text.y = (itemH - 5) / 2;
        text.anchor.set(0, 0.5);
        text.style.fontSize = 11;
      }
      if (icon) {
        icon.x = 20;
        icon.y = (itemH - 5) / 2;
        icon.scale.set(0.6);
      }
    });
  }
}
