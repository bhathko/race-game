import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { CANVAS, COLORS, PALETTE, VISUALS } from "../../config";
import { Graphics, Text } from "pixi.js";
import type { RaceContext } from "../../core";

export class DesktopRaceScene extends BaseRaceScene {
  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = false;
    this.gameViewH = height;
    this.gameViewW = width - CANVAS.UI_WIDTH;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    const sidebarBg = this.uiManager.getSidebarBg();
    sidebarBg
      .clear()
      .rect(this.gameViewW, 0, CANVAS.UI_WIDTH, height)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    for (let x = this.gameViewW + 5; x < width; x += 15) {
      sidebarBg.rect(x, 0, 2, height).fill({ color: COLORS.SIDEBAR_WOOD, alpha: 0.3 });
    }

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = this.gameViewW + 15;
    lbContainer.y = 20;

    const title = lbContainer.getChildByLabel("leaderboard-title");
    if (title) {
      title.x = 0;
      title.y = 0;
    }

    const unitWidth = Math.max(this.gameViewW, CANVAS.MIN_UNIT_WIDTH);
    this.finishLineX = 50 + (this.distance / 50) * unitWidth;
    this.trackWidth = this.finishLineX + 200;

    this.setupTracks();
    this.trackManager.repositionRacers(this.racers, this.gameViewH);
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = this.gameViewW / 2;
      countdown.y = this.gameViewH / 2;
    }

    const distance = this.uiManager.getRemainingDistanceText();
    if (distance) {
      distance.x = this.gameViewW / 2;
      distance.y = 20;
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

      const smoothing = 1 - Math.pow(1 - VISUALS.LEADERBOARD_ANIMATION_SPEED, delta);
      container.x += (0 - container.x) * smoothing;
      container.y += (40 + index * 42 - container.y) * smoothing;

      const bg = container.getChildByLabel("item-bg") as Graphics;
      const text = container.getChildByLabel("item-text") as Text;
      const icon = container.getChildByLabel("item-icon");

      if (bg) {
        let color: number = COLORS.RANK_DEFAULT;
        if (index === 0) color = COLORS.RANK_GOLD;
        else if (index === 1) color = COLORS.RANK_SILVER;
        else if (index === 2) color = COLORS.RANK_BRONZE;
        bg.clear()
          .roundRect(0, 0, CANVAS.UI_WIDTH - 30, 36, 4)
          .fill({ color: PALETTE.BLACK, alpha: 0.5 })
          .stroke({ color, width: index < 3 ? 3 : 1 });
      }

      if (text) {
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
