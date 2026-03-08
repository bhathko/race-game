import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS } from "../../config";
import type { RaceContext } from "../../core";
import { getGridRect, getStandardGridConfig, createTrackLayout } from "../../core";

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

    const layout = createTrackLayout(
      this.gameViewW,
      this.gameViewH,
      this.racers.length,
      this.distance,
    );
    this.setupTracks(layout);
    this.racers.forEach((r) => r.setMobileMode(true));
    this.trackManager.repositionRacers(this.racers);
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
    const grid = getStandardGridConfig(this.width);
    const sidebarWidth = getGridRect(9, 3, grid).width;
    const itemH = 45;

    this.uiManager.updateLeaderboard(
      this.racers,
      {
        direction: "vertical",
        itemWidth: sidebarWidth,
        itemHeight: itemH,
        iconScale: 0.6,
        textX: 40,
        textAnchorX: 0,
        fontSize: 11,
        textFormat: (racer, index) => `${index + 1}: ${racer.racerName.split(" ").pop()}`,
      },
      delta,
    );
  }
}
