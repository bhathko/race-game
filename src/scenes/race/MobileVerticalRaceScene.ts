import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS } from "../../config";
import type { RaceContext } from "../../core";
import { getStandardGridConfig, createTrackLayout } from "../../core";

export class MobileVerticalRaceScene extends BaseRaceScene {
  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = true;
    const grid = getStandardGridConfig(width);

    // Dynamic leaderboard height: use 2-row grid when many racers
    const availableW = width - 2 * grid.margin;
    const desiredCardW = 70;
    const fitsInOneRow = this.racers.length * (desiredCardW + 6) - 6 <= availableW;
    const lbH = fitsInOneRow ? 120 : 160;

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
    lbContainer.x = grid.margin;
    lbContainer.y = this.gameViewH + 8;

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
    const grid = getStandardGridConfig(this.width);
    const availableW = this.width - 2 * grid.margin;

    this.uiManager.updateLeaderboard(
      this.racers,
      {
        direction: "horizontal",
        itemWidth: 70,
        itemHeight: 140,
        gap: 6,
        availableSpace: availableW,
        usePositionOrder: this.raceStarted,
        iconScale: 0.8,
        textX: 35,
        textAnchorX: 0.5,
        fontSize: 12,
        textFormat: (_, index) => (index + 1).toString(),
      },
      delta,
    );
  }
}
