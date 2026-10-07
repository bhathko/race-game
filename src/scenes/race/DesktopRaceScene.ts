import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS } from "../../config";
import type { RaceContext } from "../../core";
import { getGridRect, getStandardGridConfig, createTrackLayout } from "../../core";

const TITLE_GAP = 10;

export class DesktopRaceScene extends BaseRaceScene {
  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = false;
    this.screenW = width;
    this.screenH = height;
    const grid = getStandardGridConfig(width);
    const trackRect = getGridRect(0, 10, grid);
    const sidebarRect = getGridRect(10, 2, grid);

    this.gameViewH = height;
    this.gameViewW = trackRect.width + grid.margin; // Include margin for the track

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    const sidebarBg = this.uiManager.getSidebarBg();
    sidebarBg
      .clear()
      .rect(this.gameViewW, 0, width - this.gameViewW, height)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    for (let x = this.gameViewW + 5; x < width; x += 15) {
      sidebarBg.rect(x, 0, 2, height).fill({ color: COLORS.SIDEBAR_WOOD, alpha: 0.3 });
    }

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = sidebarRect.x;
    lbContainer.y = 20;

    const title = lbContainer.getChildByLabel("leaderboard-title");
    if (title) {
      title.visible = true;
      title.x = 0;
      title.y = 0;
    }

    const layout = createTrackLayout(
      this.gameViewW,
      this.gameViewH,
      this.racers.length,
      this.distance,
    );
    this.setupTracks(layout);
    this.fitRacersToLanes(layout, true, 0.5);
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = this.gameViewW / 2;
      countdown.y = this.gameViewH / 2;
    }

    // Keep the counter inside the top grass strip so it never covers a racer
    this.placeDistanceText(this.gameViewW / 2, 2, Math.min(48, layout.grassStripHeight * 0.72));
  }

  protected updateLeaderboard(delta: number) {
    const grid = getStandardGridConfig(this.screenW);
    const sidebarWidth = getGridRect(10, 2, grid).width;
    const title = this.uiManager.getLeaderboardContainer().getChildByLabel("leaderboard-title");
    const startY = title ? title.height + TITLE_GAP : 0;

    this.uiManager.updateLeaderboard(
      this.getLeaderboardOrder(),
      {
        direction: "vertical",
        itemWidth: sidebarWidth,
        itemHeight: 48,
        gap: 6,
        startY,
        availableSpace: this.screenH - 40 - startY,
        iconScale: 1,
        textX: 50,
        textAnchorX: 0,
        fontSize: 14,
        textFormat: (racer, index) => {
          const rank = index + 1;
          const suffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
          return `${rank}${suffix}: ${racer.racerName.split(" ").pop()}`;
        },
      },
      delta,
    );
  }
}
